import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { GameProviderEndpointType, GameProviderWalletMode } from './game-platform.types';
import { NormalizedGameProviderInput } from './dto/game-provider.dto';

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
  constructor(private readonly prisma: PrismaService) {}

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
        credentials: { orderBy: { type: 'asc' }, select: { id: true, providerId: true, type: true, maskedValue: true, isEnabled: true, rotatedAt: true, createdAt: true, updatedAt: true } },
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
      await this.audit(actor, 'game_provider.create', item.id, null, this.safeProvider(item), meta);
      return item;
    } catch (error) {
      this.handleProviderWriteError(error);
    }
  }

  async updateProvider(id: string, input: Partial<NormalizedGameProviderInput>, actor: AdminActor, meta: RequestMeta) {
    const current = await this.prisma.gameProvider.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('Game provider not found');
    try {
      const item = await this.prisma.gameProvider.update({ where: { id }, data: input as Prisma.GameProviderUpdateInput });
      await this.audit(actor, 'game_provider.update', item.id, this.safeProvider(current), this.safeProvider(item), meta);
      return item;
    } catch (error) {
      this.handleProviderWriteError(error);
    }
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

  private safeProvider(provider: unknown) {
    return JSON.parse(JSON.stringify(provider)) as Prisma.InputJsonValue;
  }

  private handleProviderWriteError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictException('Game provider code already exists');
    }
    throw error;
  }
}
