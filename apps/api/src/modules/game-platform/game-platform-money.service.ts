import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { GameProviderEndpointType, GameProviderWalletMode } from './game-platform.types';
import { ProviderAdapterContext } from './provider-adapter.interface';
import { ProviderAdapterRegistry } from './adapters/provider-adapter.registry';

type MemberActor = { id: string };
type RequestMeta = { ipAddress?: string; userAgent?: string };
type TransferKind = 'TRANSFER_IN' | 'TRANSFER_OUT';

type ProviderWithAdapterData = { code: string; walletMode: GameProviderWalletMode; currency: string; endpoints: Array<{ type: GameProviderEndpointType; url: string; timeoutMs: number; isEnabled?: boolean }>; credentials: Array<{ type: string; maskedValue: string; isEnabled?: boolean }> };

@Injectable()
export class GamePlatformMoneyService {
  constructor(private readonly prisma: PrismaService, private readonly adapterRegistry: ProviderAdapterRegistry) {}

  async transferDryRun(sessionId: string, actor: MemberActor, type: TransferKind, amount: string, meta: RequestMeta) {
    const session = await this.prisma.gameSession.findFirst({ where: { id: sessionId, userId: actor.id, status: { in: ['LAUNCHED', 'ACTIVE'] } }, include: { provider: { include: { endpoints: { where: { isEnabled: true }, orderBy: { type: 'asc' } }, credentials: { where: { isEnabled: true }, orderBy: { type: 'asc' }, select: this.credentialSelect() } } }, game: { select: { id: true, name: true, providerGameCode: true } } } });
    if (!session) throw new NotFoundException('Game session is not available for transfer');
    this.assertDryRunSafetyGate(session.provider, type);
    const idempotencyKey = `${type.toLowerCase()}_${session.id}_${Date.now()}_${randomBytes(4).toString('hex')}`;
    const requestPayload = { dryRun: true, type, sessionId: session.id, gameId: session.gameId, gameCode: session.game.providerGameCode, ipAddress: meta.ipAddress, userAgent: meta.userAgent };
    const transfer = await this.prisma.gameTransfer.create({ data: { userId: actor.id, providerId: session.providerId, sessionId: session.id, type, status: 'PENDING', amount, currency: session.provider.currency, idempotencyKey, requestPayload } });
    const adapter = this.adapterRegistry.getAdapter(session.provider.code);
    const input = { userId: actor.id, amount, currency: session.provider.currency, idempotencyKey, sessionId: session.id };
    const result = type === 'TRANSFER_IN' ? await adapter.transferIn(this.buildAdapterContext(session.provider), input) : await adapter.transferOut(this.buildAdapterContext(session.provider), input);
    const updated = await this.prisma.gameTransfer.update({ where: { id: transfer.id }, data: result.ok && result.payload ? { status: 'SUCCESS', providerTransactionId: result.payload.providerTransactionId, responsePayload: this.safeJson(result), resolvedAt: new Date() } : { status: 'FAILED', responsePayload: this.safeJson(result), errorCode: result.errorCode ?? 'TRANSFER_FAILED', errorMessage: result.errorMessage ?? 'Provider dry-run transfer failed', resolvedAt: new Date() }, include: { provider: { select: { id: true, name: true, code: true } }, session: { select: { id: true, gameId: true, providerSessionId: true } } } });
    return { ok: updated.status === 'SUCCESS', transfer: updated, dryRun: true, safetyGate: 'dry-run-only' };
  }

  async listMemberSessionTransfers(sessionId: string, actor: MemberActor) {
    const session = await this.prisma.gameSession.findFirst({ where: { id: sessionId, userId: actor.id }, select: { id: true } });
    if (!session) throw new NotFoundException('Game session not found');
    const items = await this.prisma.gameTransfer.findMany({ where: { sessionId, userId: actor.id }, orderBy: { createdAt: 'desc' }, take: 30, select: { id: true, type: true, status: true, amount: true, currency: true, idempotencyKey: true, providerTransactionId: true, errorCode: true, errorMessage: true, createdAt: true, resolvedAt: true } });
    return { items };
  }

  async reconcileSession(sessionId: string) {
    const session = await this.prisma.gameSession.findUnique({ where: { id: sessionId }, include: { user: { select: { id: true } }, provider: { include: { endpoints: { where: { isEnabled: true }, orderBy: { type: 'asc' } }, credentials: { where: { isEnabled: true }, orderBy: { type: 'asc' }, select: this.credentialSelect() } } } } });
    if (!session) throw new NotFoundException('Game session not found');
    this.assertReconciliationSafetyGate(session.provider);
    const systemBalance = '0.00';
    const adapter = this.adapterRegistry.getAdapter(session.provider.code);
    const result = await adapter.getBalance(this.buildAdapterContext(session.provider), { userId: session.userId, providerUserId: session.providerSessionId ?? undefined });
    const providerBalance = result.ok && result.payload?.balance ? result.payload.balance : '0.00';
    const difference = (Number(systemBalance) - Number(providerBalance)).toFixed(2);
    const status = !result.ok ? 'UNKNOWN' : Number(difference) === 0 ? 'MATCHED' : 'MISMATCH';
    const snapshot = await this.prisma.providerWalletSnapshot.create({ data: { userId: session.userId, providerId: session.providerId, systemBalance, providerBalance, difference, status, rawPayload: this.safeJson({ dryRun: true, sessionId, adapterResult: result }) }, include: { user: { select: { id: true, username: true, phone: true } }, provider: { select: { id: true, name: true, code: true } } } });
    return { ok: status === 'MATCHED', snapshot, dryRun: true };
  }

  async listSnapshots() {
    const items = await this.prisma.providerWalletSnapshot.findMany({ orderBy: { checkedAt: 'desc' }, take: 100, include: { user: { select: { id: true, username: true, phone: true } }, provider: { select: { id: true, name: true, code: true } } } });
    return { items, summary: { total: items.length, matched: items.filter((item) => item.status === 'MATCHED').length, mismatch: items.filter((item) => item.status === 'MISMATCH').length, unknown: items.filter((item) => item.status === 'UNKNOWN').length } };
  }

  async getSnapshot(id: string) {
    const item = await this.prisma.providerWalletSnapshot.findUnique({ where: { id }, include: { user: { select: { id: true, username: true, phone: true } }, provider: { select: { id: true, name: true, code: true } } } });
    if (!item) throw new NotFoundException('Provider wallet snapshot not found');
    return item;
  }

  async listTransfers() { const items = await this.prisma.gameTransfer.findMany({ orderBy: { createdAt: 'desc' }, take: 100, include: { user: { select: { id: true, username: true, phone: true } }, provider: { select: { id: true, name: true, code: true } }, session: { select: { id: true, providerSessionId: true, game: { select: { id: true, name: true, providerGameCode: true } } } } } }); return { items, summary: { total: items.length, success: items.filter((item) => item.status === 'SUCCESS').length, failed: items.filter((item) => item.status === 'FAILED').length, pending: items.filter((item) => item.status === 'PENDING').length } }; }
  async getTransfer(id: string) { const item = await this.prisma.gameTransfer.findUnique({ where: { id }, include: { user: { select: { id: true, username: true, phone: true } }, provider: { select: { id: true, name: true, code: true } }, session: { include: { game: { select: { id: true, name: true, providerGameCode: true } } } } } }); if (!item) throw new NotFoundException('Game transfer not found'); return item; }

  async receiveWebhook(providerCode: string, headers: Record<string, string | string[] | undefined>, body: unknown) {
    const provider = await this.prisma.gameProvider.findUnique({ where: { code: providerCode }, include: { endpoints: { where: { isEnabled: true }, orderBy: { type: 'asc' } }, credentials: { where: { isEnabled: true }, orderBy: { type: 'asc' }, select: this.credentialSelect() } } });
    if (!provider) throw new NotFoundException('Game provider not found');
    const adapter = this.adapterRegistry.getAdapter(provider.code);
    const context = this.buildAdapterContext(provider);
    const validation = await adapter.validateWebhook(context, headers, body);
    if (!validation.valid) { const log = await this.prisma.webhookLog.create({ data: { providerId: provider.id, eventType: 'invalid', status: 'FAILED', signatureValid: false, idempotencyKey: validation.idempotencyKey, rawPayload: this.safeJson(body), normalizedPayload: this.safeJson(validation), responseStatus: 400, errorCode: 'INVALID_SIGNATURE', errorMessage: validation.reason } }); return { ok: false, logId: log.id, status: log.status, reason: validation.reason }; }
    const events = await adapter.parseWebhook(context, body);
    const logs = [];
    for (const event of events) { const duplicate = event.idempotencyKey ? await this.prisma.webhookLog.findFirst({ where: { providerId: provider.id, idempotencyKey: event.idempotencyKey }, select: { id: true } }) : null; const log = await this.prisma.webhookLog.create({ data: { providerId: provider.id, eventType: event.eventType, status: duplicate ? 'DUPLICATE' : 'PROCESSED', signatureValid: true, idempotencyKey: event.idempotencyKey, providerTransactionId: event.providerTransactionId, rawPayload: this.safeJson(body), normalizedPayload: this.safeJson(event), responseStatus: duplicate ? 208 : 200, processedAt: new Date() } }); logs.push(log); }
    return { ok: true, providerCode: provider.code, received: logs.length, logs };
  }

  async listWebhookLogs() { const items = await this.prisma.webhookLog.findMany({ orderBy: { createdAt: 'desc' }, take: 100, include: { provider: { select: { id: true, name: true, code: true } } } }); return { items, summary: { total: items.length, processed: items.filter((item) => item.status === 'PROCESSED').length, failed: items.filter((item) => item.status === 'FAILED').length, duplicate: items.filter((item) => item.status === 'DUPLICATE').length } }; }
  async getWebhookLog(id: string) { const item = await this.prisma.webhookLog.findUnique({ where: { id }, include: { provider: { select: { id: true, name: true, code: true } } } }); if (!item) throw new NotFoundException('Webhook log not found'); return item; }

  private assertDryRunSafetyGate(provider: ProviderWithAdapterData, type: TransferKind) {
    if (!this.adapterRegistry.hasAdapter(provider.code)) throw new ForbiddenException('Provider adapter is not registered');
    const endpointSet = new Set(provider.endpoints.map((item) => item.type));
    const credentialSet = new Set(provider.credentials.map((item) => item.type));
    const requiredEndpoint = type === 'TRANSFER_IN' ? 'TRANSFER_IN' : 'TRANSFER_OUT';
    if (!endpointSet.has(requiredEndpoint)) throw new ForbiddenException(`${requiredEndpoint} endpoint is not enabled`);
    if (!credentialSet.has('API_KEY')) throw new ForbiddenException('API_KEY credential is not enabled');
  }

  private assertReconciliationSafetyGate(provider: ProviderWithAdapterData) {
    if (!this.adapterRegistry.hasAdapter(provider.code)) throw new ForbiddenException('Provider adapter is not registered');
    const endpointSet = new Set(provider.endpoints.map((item) => item.type));
    if (!endpointSet.has('BALANCE')) throw new ForbiddenException('BALANCE endpoint is not enabled');
  }

  private buildAdapterContext(provider: ProviderWithAdapterData): ProviderAdapterContext { const endpointMap = provider.endpoints.reduce<Partial<Record<GameProviderEndpointType, string>>>((result, endpoint) => { result[endpoint.type] = endpoint.url; return result; }, {}); const credentialMap = provider.credentials.reduce<Record<string, string>>((result, credential) => { result[credential.type] = credential.maskedValue; return result; }, {}); return { providerCode: provider.code, baseUrl: endpointMap.HEALTH_CHECK ?? endpointMap.LAUNCH ?? '', walletMode: provider.walletMode, currency: provider.currency, timeoutMs: Math.max(...provider.endpoints.map((endpoint) => endpoint.timeoutMs), 10000), endpointMap, credentialMap }; }
  private credentialSelect() { return { id: true, providerId: true, type: true, maskedValue: true, isEnabled: true, rotatedAt: true, createdAt: true, updatedAt: true } as const; }
  private safeJson(value: unknown) { return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue; }
}
