import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class WalletService {
  constructor(private readonly prisma: PrismaService) {}

  async getMemberWallet(userId: string) {
    const wallet = await this.ensureWallet(userId);
    return this.formatWallet(wallet);
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
      items: ledgers.map((ledger) => this.formatLedger(ledger)),
    };
  }

  async getAdminLedgers(query: AdminLedgerQuery) {
    const safeLimit = Math.min(Math.max(Number(query.limit) || 100, 1), 200);
    const where: any = {};

    if (query.userId) where.userId = query.userId;
    if (query.type) where.type = query.type;
    if (query.direction) where.direction = query.direction;

    const items = await this.prisma.walletLedger.findMany({
      where,
      include: {
        user: { select: { id: true, username: true, phone: true, email: true } },
        wallet: { select: { id: true, currency: true, balance: true, lockedBalance: true, status: true } },
        createdByAdmin: { select: { id: true, username: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: safeLimit,
    });

    return {
      items: items.map((item) => ({
        ...this.formatLedger(item),
        user: item.user,
        wallet: item.wallet ? this.formatWallet(item.wallet) : null,
        createdByAdmin: item.createdByAdmin,
      })),
    };
  }

  async getAdminWallets(query: AdminWalletQuery) {
    const safeLimit = Math.min(Math.max(Number(query.limit) || 100, 1), 200);
    const search = query.search?.trim();

    const wallets = await this.prisma.wallet.findMany({
      where: search
        ? {
            user: {
              OR: [
                { username: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
              ],
            },
          }
        : {},
      include: { user: { select: { id: true, username: true, phone: true, email: true, status: true } } },
      orderBy: { updatedAt: 'desc' },
      take: safeLimit,
    });

    return {
      items: wallets.map((wallet) => ({ ...this.formatWallet(wallet), user: wallet.user })),
    };
  }

  async getAdminWalletDetail(userId: string) {
    const wallet = await this.ensureWallet(userId);
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, phone: true, email: true, status: true, createdAt: true },
    });
    const ledgers = await this.prisma.walletLedger.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return {
      wallet: this.formatWallet(wallet),
      user,
      ledgers: ledgers.map((ledger) => this.formatLedger(ledger)),
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

  private formatWallet(wallet: any) {
    return {
      id: wallet.id,
      userId: wallet.userId,
      currency: wallet.currency,
      balance: wallet.balance.toString(),
      lockedBalance: wallet.lockedBalance.toString(),
      availableBalance: wallet.balance.minus(wallet.lockedBalance).toString(),
      status: wallet.status,
      updatedAt: wallet.updatedAt,
    };
  }

  private formatLedger(ledger: any) {
    return {
      id: ledger.id,
      walletId: ledger.walletId,
      userId: ledger.userId,
      type: ledger.type,
      direction: ledger.direction,
      amount: ledger.amount.toString(),
      balanceBefore: ledger.balanceBefore.toString(),
      balanceAfter: ledger.balanceAfter.toString(),
      referenceType: ledger.referenceType,
      referenceId: ledger.referenceId,
      metadata: ledger.metadata,
      createdByAdminId: ledger.createdByAdminId,
      createdAt: ledger.createdAt,
    };
  }
}

type AdminLedgerQuery = {
  userId?: string;
  type?: string;
  direction?: string;
  limit?: string;
};

type AdminWalletQuery = {
  search?: string;
  limit?: string;
};
