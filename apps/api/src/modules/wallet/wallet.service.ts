import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class WalletService {
  constructor(private readonly prisma: PrismaService) {}

  async getMemberWallet(userId: string) {
    const wallet = await this.ensureWallet(userId);

    return {
      id: wallet.id,
      currency: wallet.currency,
      balance: wallet.balance.toString(),
      lockedBalance: wallet.lockedBalance.toString(),
      availableBalance: wallet.balance.minus(wallet.lockedBalance).toString(),
      status: wallet.status,
      updatedAt: wallet.updatedAt,
    };
  }

  async getMemberLedger(userId: string, limit = 50) {
    const wallet = await this.ensureWallet(userId);
    const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);

    const ledgers = await this.prisma.walletLedger.findMany({
      where: { walletId: wallet.id, userId },
      orderBy: { createdAt: 'desc' },
      take: safeLimit,
    });

    return {
      walletId: wallet.id,
      items: ledgers.map((ledger) => ({
        id: ledger.id,
        type: ledger.type,
        direction: ledger.direction,
        amount: ledger.amount.toString(),
        balanceBefore: ledger.balanceBefore.toString(),
        balanceAfter: ledger.balanceAfter.toString(),
        referenceType: ledger.referenceType,
        referenceId: ledger.referenceId,
        metadata: ledger.metadata,
        createdAt: ledger.createdAt,
      })),
    };
  }

  async ensureWallet(userId: string) {
    const existing = await this.prisma.wallet.findUnique({ where: { userId } });
    if (existing) return existing;

    return this.prisma.wallet.create({
      data: {
        userId,
        currency: 'THB',
      },
    });
  }
}
