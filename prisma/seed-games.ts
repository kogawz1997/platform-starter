import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const provider = await prisma.gameProvider.upsert({
    where: { code: 'demo-provider' },
    update: { name: 'Demo Provider', status: 'INACTIVE', walletMode: 'TRANSFER', currency: 'THB', timezone: 'Asia/Bangkok' },
    create: { name: 'Demo Provider', code: 'demo-provider', status: 'INACTIVE', walletMode: 'TRANSFER', currency: 'THB', timezone: 'Asia/Bangkok', sortOrder: 900, metadata: { note: 'Demo provider for local game catalog testing.' } },
  });

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
