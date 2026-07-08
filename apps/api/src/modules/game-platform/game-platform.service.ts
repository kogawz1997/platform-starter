import { Injectable } from '@nestjs/common';
import { GameProviderEndpointType, GameProviderWalletMode } from './game-platform.types';

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

@Injectable()
export class GamePlatformService {
  overview() {
    return {
      status: 'scaffold',
      models: DATA_MODELS,
      adapterMethods: ADAPTER_METHODS,
      walletModes: ['SEAMLESS', 'TRANSFER', 'HYBRID'] satisfies GameProviderWalletMode[],
      endpointTypes: ['LAUNCH', 'BALANCE', 'TRANSFER_IN', 'TRANSFER_OUT', 'GAME_LIST', 'BET_HISTORY', 'WEBHOOK', 'HEALTH_CHECK'] satisfies GameProviderEndpointType[],
      note: 'Scaffold only. Real provider API calls, wallet transfer logic, and Prisma persistence are not enabled yet.',
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
}
