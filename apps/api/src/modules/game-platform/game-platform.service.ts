import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { createCipheriv, createHash, randomBytes } from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { GameProviderEndpointType, GameProviderWalletMode } from './game-platform.types';
import { NormalizedGameProviderInput } from './dto/game-provider.dto';
import { NormalizedGameProviderEndpointInput } from './dto/game-provider-endpoint.dto';
import { NormalizedGameProviderCredentialInput, NormalizedGameProviderCredentialUpdate } from './dto/game-provider-credential.dto';

const DATA_MODELS = [
  'GameProvider',
  'GameProviderEndpoint',
  'GameProviderCredential',
  'Game',
  'GameMedia',
  'GameSession',
  'GameTransfer',
  'ProviderWalletSnapshot',
  'WebhookLog',
] as const;

const ADAPTER_METHODS = [
  'healthCheck',
  'launchGame',
  'getBalance',
  'transferIn',
  'transferOut',
  'syncGames',
  'getBetHistory',
  'validateWebhook',
  'parseWebhook',
] as const;

type AdminActor = { id: string };
type RequestMeta = { ipAddress?: string; userAgent?: string };

@Injectable()
export class GamePlatformService {
  constructor(private readonly prisma: PrismaService, private readonly configService: ConfigService) {}

  overview() {
    return {
      status: 'scaffold',
      models: DATA_MODELS,
      adapterMethods: ADAPTER_METHODS,
      walletModes: ['SEAMLESS', 'TRANSFER', 'HYBRID'] satisfies GameProviderWalletMode[],
      endpointTypes: ['LAUNCH', 'BALANCE', 'TRANSFER_IN', 'TRANSFER_OUT', 'GAME_LIST', 'BET_HISTORY', 'WEBHOOK', 'HEALTH_CHECK'] satisfies GameProviderEndpointType[],
      note: 'Scaffold only. Real provider API calls and wallet transfer logic are not enabled yet.',
    };
  }

  dataModelPlan() {
    return {
      provider: ['profile', 'status', 'walletMode', 'currency', 'timezone', 'sortOrder', 'metadata'],
      endpoint: ['providerId', 'type', 'url', 'method', 'timeoutMs', 'retryCount', 'isEnabled'],
      credential: ['providerId', 'type', 'encryptedValue', 'maskedValue', 'rotatedAt', 'isEnabled'],
      game: ['providerId', 'providerGameCode', 'name', 'category', 'status', 'flags', 'sortOrder', 'metadata'],
      media: ['gameId', 'providerId', 'type', 'sourceUrl', 'cachedUrl', 'status', 'isOverride'],
      session: ['userId', 'providerId', 'gameId', 'status', 'launchUrl', 'providerSessionId', 'ipAddress', 'userAgent'],
      transfer: ['userId', 'providerId', 'sessionId', 'type', 'status', 'amount', 'idempotencyKey', 'providerTransactionId'],
      walletSnapshot: ['userId', 'providerId', 'systemBalance', 'providerBalance', 'difference', 'status', 'checkedAt'],
      webhook: ['providerId', 'eventType', 'status', 'signatureValid', 'idempotencyKey', 'providerTransactionId', 'error'],
    };
  }

  async listProviders() {
    const items = await this.prisma.gameProvider.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        _count: {
          select: { endpoints: true, credentials: true, games: true, sessions: true, transfers: true, webhookLogs: true },
        },
      },
    });
    return { items };
  }

  async getProvider(id: string) {
    const item = await this.prisma.gameProvider.findUnique({
      where: { id },
      include: {
        endpoints: { orderBy: { type: 'asc' } },
        credentials: { orderBy: { type: 'asc' }, select: this.credentialSelect() },
        media: { orderBy: { createdAt: 'desc' }, take: 20 },
        _count: { select: { games: true, sessions: true, transfers: true, walletSnapshots: true, webhookLogs: true } },
      },
    });
    if (!item) throw new NotFoundException('Game provider not found');
    return item;
  }

  async createProvider(input: NormalizedGameProviderInput, actor: AdminActor, meta: RequestMeta) {
    try {
      const item = await this.prisma.gameProvider.create({ data: input as Prisma.GameProviderCreateInput });
      await this.audit(actor, 'game_provider.create', item.id, null, this.safeJson(item), meta);
      return item;
    } catch (error) {
      this.handleProviderWriteError(error, 'Game provider code already exists');
    }
  }

  async updateProvider(id: string, input: Partial<NormalizedGameProviderInput>, actor: AdminActor, meta: RequestMeta) {
    const current = await this.prisma.gameProvider.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('Game provider not found');
    try {
      const item = await this.prisma.gameProvider.update({ where: { id }, data: input as Prisma.GameProviderUpdateInput });
      await this.audit(actor, 'game_provider.update', item.id, this.safeJson(current), this.safeJson(item), meta);
      return item;
    } catch (error) {
      this.handleProviderWriteError(error, 'Game provider code already exists');
    }
  }

  async listProviderEndpoints(providerId: string) {
    await this.assertProvider(providerId);
    const items = await this.prisma.gameProviderEndpoint.findMany({ where: { providerId }, orderBy: { type: 'asc' } });
    return { items };
  }

  async createProviderEndpoint(providerId: string, input: NormalizedGameProviderEndpointInput, actor: AdminActor, meta: RequestMeta) {
    await this.assertProvider(providerId);
    try {
      const item = await this.prisma.gameProviderEndpoint.create({ data: { providerId, ...input } as Prisma.GameProviderEndpointUncheckedCreateInput });
      await this.audit(actor, 'game_provider_endpoint.create', item.id, null, this.safeJson(item), meta);
      return item;
    } catch (error) {
      this.handleProviderWriteError(error, 'Endpoint type already exists for this provider');
    }
  }

  async updateProviderEndpoint(providerId: string, endpointId: string, input: Partial<NormalizedGameProviderEndpointInput>, actor: AdminActor, meta: RequestMeta) {
    await this.assertProvider(providerId);
    const current = await this.prisma.gameProviderEndpoint.findFirst({ where: { id: endpointId, providerId } });
    if (!current) throw new NotFoundException('Game provider endpoint not found');
    try {
      const item = await this.prisma.gameProviderEndpoint.update({ where: { id: endpointId }, data: input as Prisma.GameProviderEndpointUpdateInput });
      await this.audit(actor, 'game_provider_endpoint.update', item.id, this.safeJson(current), this.safeJson(item), meta);
      return item;
    } catch (error) {
      this.handleProviderWriteError(error, 'Endpoint type already exists for this provider');
    }
  }

  async listProviderCredentials(providerId: string) {
    await this.assertProvider(providerId);
    const items = await this.prisma.gameProviderCredential.findMany({ where: { providerId }, orderBy: { type: 'asc' }, select: this.credentialSelect() });
    return { items };
  }

  async createProviderCredential(providerId: string, input: NormalizedGameProviderCredentialInput, actor: AdminActor, meta: RequestMeta) {
    await this.assertProvider(providerId);
    try {
      const item = await this.prisma.gameProviderCredential.create({
        data: {
          providerId,
          type: input.type,
          encryptedValue: this.encryptSecret(input.value),
          maskedValue: this.maskSecret(input.value),
          isEnabled: input.isEnabled,
          rotatedAt: new Date(),
        } as Prisma.GameProviderCredentialUncheckedCreateInput,
        select: this.credentialSelect(),
      });
      await this.audit(actor, 'game_provider_credential.create', item.id, null, this.safeJson(item), meta);
      return item;
    } catch (error) {
      this.handleProviderWriteError(error, 'Credential type already exists for this provider');
    }
  }

  async updateProviderCredential(providerId: string, credentialId: string, input: NormalizedGameProviderCredentialUpdate, actor: AdminActor, meta: RequestMeta) {
    await this.assertProvider(providerId);
    const current = await this.prisma.gameProviderCredential.findFirst({ where: { id: credentialId, providerId }, select: this.credentialSelect() });
    if (!current) throw new NotFoundException('Game provider credential not found');
    const data: Prisma.GameProviderCredentialUpdateInput = {};
    if (input.type !== undefined) data.type = input.type as any;
    if (input.isEnabled !== undefined) data.isEnabled = input.isEnabled;
    if (input.value !== undefined) {
      data.encryptedValue = this.encryptSecret(input.value);
      data.maskedValue = this.maskSecret(input.value);
      data.rotatedAt = new Date();
    }
    try {
      const item = await this.prisma.gameProviderCredential.update({ where: { id: credentialId }, data, select: this.credentialSelect() });
      await this.audit(actor, 'game_provider_credential.update', item.id, this.safeJson(current), this.safeJson(item), meta);
      return item;
    } catch (error) {
      this.handleProviderWriteError(error, 'Credential type already exists for this provider');
    }
  }

  private async assertProvider(providerId: string) {
    const provider = await this.prisma.gameProvider.findUnique({ where: { id: providerId }, select: { id: true } });
    if (!provider) throw new NotFoundException('Game provider not found');
    return provider;
  }

  private credentialSelect() {
    return { id: true, providerId: true, type: true, maskedValue: true, isEnabled: true, rotatedAt: true, createdAt: true, updatedAt: true } as const;
  }

  private encryptSecret(value: string) {
    const keySource = this.configService.get<string>('GAME_CREDENTIAL_SECRET') ?? this.configService.get<string>('JWT_ACCESS_KEY') ?? 'local_game_credential_key';
    const key = createHash('sha256').update(keySource).digest();
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `aes-256-gcm:${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`;
  }

  private maskSecret(value: string) {
    if (value.length <= 8) return `${value.slice(0, 1)}••••${value.slice(-1)}`;
    return `${value.slice(0, 4)}••••${value.slice(-4)}`;
  }

  private async audit(actor: AdminActor, action: string, targetId: string, oldData: Prisma.InputJsonValue | null, newData: Prisma.InputJsonValue | null, meta: RequestMeta) {
    await this.prisma.adminAuditLog.create({
      data: {
        adminUserId: actor.id,
        action,
        module: 'game-platform',
        targetId,
        oldData: oldData ?? Prisma.JsonNull,
        newData: newData ?? Prisma.JsonNull,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      },
    });
  }

  private safeJson(value: unknown) {
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
  }

  private handleProviderWriteError(error: unknown, message: string): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictException(message);
    }
    throw error;
  }
}
