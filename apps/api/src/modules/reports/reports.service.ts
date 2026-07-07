import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDailySummary(query: ReportQuery = {}) {
    const { from, to } = this.dateRange(query);
    const [topUps, withdrawals, adjustments, walletAgg, ledgerAgg] = await Promise.all([
      this.prisma.topUpRequest.groupBy({
        by: ['status'],
        where: { createdAt: { gte: from, lte: to } },
        _count: { _all: true },
        _sum: { amount: true },
      }),
      this.prisma.withdrawalRequest.groupBy({
        by: ['status'],
        where: { createdAt: { gte: from, lte: to } },
        _count: { _all: true },
        _sum: { amount: true },
      }),
      this.prisma.walletLedger.groupBy({
        by: ['direction'],
        where: { type: 'ADJUSTMENT', createdAt: { gte: from, lte: to } },
        _count: { _all: true },
        _sum: { amount: true },
      }),
      this.prisma.wallet.aggregate({ _count: { _all: true }, _sum: { balance: true, lockedBalance: true } }),
      this.prisma.walletLedger.aggregate({ where: { createdAt: { gte: from, lte: to } }, _count: { _all: true }, _sum: { amount: true } }),
    ]);

    return {
      range: { from: from.toISOString(), to: to.toISOString() },
      topUps: topUps.map(this.formatGroup),
      withdrawals: withdrawals.map(this.formatGroup),
      adjustments: adjustments.map((item) => ({ direction: item.direction, count: item._count._all, amount: item._sum.amount?.toString() ?? '0' })),
      wallets: {
        count: walletAgg._count._all,
        totalBalance: walletAgg._sum.balance?.toString() ?? '0',
        totalLockedBalance: walletAgg._sum.lockedBalance?.toString() ?? '0',
      },
      ledgers: { count: ledgerAgg._count._all, amount: ledgerAgg._sum.amount?.toString() ?? '0' },
      generatedAt: new Date().toISOString(),
    };
  }

  async getReconciliation(query: ReportQuery = {}) {
    const safeLimit = Math.min(Math.max(Number(query.limit) || 100, 1), 500);
    const wallets = await this.prisma.wallet.findMany({ orderBy: { updatedAt: 'desc' }, take: safeLimit, include: { user: { select: { id: true, username: true, email: true, phone: true } } } });
    const results = await Promise.all(wallets.map(async (wallet) => {
      const latestLedger = await this.prisma.walletLedger.findFirst({ where: { walletId: wallet.id }, orderBy: { createdAt: 'desc' } });
      const expected = latestLedger?.balanceAfter?.toString() ?? '0';
      const actual = wallet.balance.toString();
      return {
        walletId: wallet.id,
        userId: wallet.userId,
        shortUserId: wallet.userId.slice(0, 8),
        username: wallet.user?.username ?? null,
        actualBalance: actual,
        latestLedgerBalance: expected,
        lockedBalance: wallet.lockedBalance.toString(),
        status: actual === expected || !latestLedger ? 'OK' : 'MISMATCH',
        latestLedgerAt: latestLedger?.createdAt ?? null,
      };
    }));

    return {
      items: results,
      mismatchCount: results.filter((item) => item.status === 'MISMATCH').length,
      generatedAt: new Date().toISOString(),
    };
  }

  private dateRange(query: ReportQuery) {
    const now = new Date();
    const from = query.from ? new Date(query.from) : new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const to = query.to ? new Date(query.to) : now;
    return { from, to };
  }

  private formatGroup(item: any) {
    return { status: item.status, count: item._count._all, amount: item._sum.amount?.toString() ?? '0' };
  }
}

type ReportQuery = { from?: string; to?: string; limit?: string };
