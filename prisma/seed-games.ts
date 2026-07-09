import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const provider = await prisma.gameProvider.upsert({
    where: { code: 'demo-provider' },
    update: {
      name: 'Demo Provider',
      status: 'ACTIVE',
      walletMode: 'TRANSFER',
      currency: 'THB',
      timezone: 'Asia/Bangkok',
      metadata: { note: 'Demo provider for dry-run game platform testing.', launchEnabled: true, transferEnabled: true, realMoneyEnabled: false, webhookSettlementEnabled: false },
    },
    create: {
      name: 'Demo Provider',
      code: 'demo-provider',
      status: 'ACTIVE',
      walletMode: 'TRANSFER',
      currency: 'THB',
      timezone: 'Asia/Bangkok',
      sortOrder: 900,
      metadata: { note: 'Demo provider for dry-run game platform testing.', launchEnabled: true, transferEnabled: true, realMoneyEnabled: false, webhookSettlementEnabled: false },
    },
  });

  const endpoints = [
    { type: 'LAUNCH' as const, url: 'https://demo-provider.local/launch', method: 'POST' },
    { type: 'BALANCE' as const, url: 'https://demo-provider.local/balance', method: 'POST' },
    { type: 'TRANSFER_IN' as const, url: 'https://demo-provider.local/transfer-in', method: 'POST' },
    { type: 'TRANSFER_OUT' as const, url: 'https://demo-provider.local/transfer-out', method: 'POST' },
    { type: 'WEBHOOK' as const, url: 'https://demo-provider.local/webhook', method: 'POST' },
    { type: 'HEALTH_CHECK' as const, url: 'https://demo-provider.local/health', method: 'GET' },
  ];

  for (const endpoint of endpoints) {
    await prisma.gameProviderEndpoint.upsert({
      where: { providerId_type: { providerId: provider.id, type: endpoint.type } },
      update: { url: endpoint.url, method: endpoint.method, timeoutMs: 10000, retryCount: 1, isEnabled: true },
      create: { providerId: provider.id, type: endpoint.type, url: endpoint.url, method: endpoint.method, timeoutMs: 10000, retryCount: 1, isEnabled: true },
    });
  }

  const credentials = [
    { type: 'API_KEY' as const, encryptedValue: 'demo-api-key', maskedValue: 'demo-api-key' },
    { type: 'WEBHOOK_SECRET' as const, encryptedValue: 'demo-webhook-secret', maskedValue: 'demo-webhook-secret' },
  ];

  for (const credential of credentials) {
    await prisma.gameProviderCredential.upsert({
      where: { providerId_type: { providerId: provider.id, type: credential.type } },
      update: { encryptedValue: credential.encryptedValue, maskedValue: credential.maskedValue, isEnabled: true, rotatedAt: new Date() },
      create: { providerId: provider.id, type: credential.type, encryptedValue: credential.encryptedValue, maskedValue: credential.maskedValue, isEnabled: true, rotatedAt: new Date() },
    });
  }

  const games = [
    { providerGameCode: 'demo-slot-001', name: 'Demo Fortune Slot', category: 'slot', isFeatured: true, isNew: true, isPopular: true, sortOrder: 10, imageUrl: 'https://placehold.co/600x400?text=Demo+Slot' },
    { providerGameCode: 'demo-casino-001', name: 'Demo Live Table', category: 'casino', isFeatured: false, isNew: true, isPopular: true, sortOrder: 20, imageUrl: 'https://placehold.co/600x400?text=Demo+Casino' },
  ];

  for (const game of games) {
    await prisma.game.upsert({
      where: { providerId_providerGameCode: { providerId: provider.id, providerGameCode: game.providerGameCode } },
      update: { name: game.name, category: game.category, status: 'ACTIVE', isFeatured: game.isFeatured, isNew: game.isNew, isPopular: game.isPopular, sortOrder: game.sortOrder, metadata: { imageUrl: game.imageUrl } },
      create: { providerId: provider.id, providerGameCode: game.providerGameCode, name: game.name, category: game.category, status: 'ACTIVE', isFeatured: game.isFeatured, isNew: game.isNew, isPopular: game.isPopular, sortOrder: game.sortOrder, metadata: { imageUrl: game.imageUrl } },
    });
  }

  console.log('Demo game seed completed');
}

main().catch((error) => { console.error(error); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
