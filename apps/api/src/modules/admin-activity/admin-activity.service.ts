import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

type TimelineQuery = { page?: string | number; take?: string | number; type?: string };

type ActivityItem = {
  id: string;
  type: 'AUDIT' | 'LEDGER' | 'TOPUP' | 'WITHDRAWAL';
  title: string;
  description?: string | null;
  actor?: string | null;
  memberId?: string | null;
  refType?: string | null;
  refId?: string | null;
  amount?: string | null;
  status?: string | null;
  createdAt: Date;
};

@Injectable()
export class AdminActivityService {
  constructor(private readonly prisma: PrismaService) {}

  async timeline(query: TimelineQuery = {}) {
    const page = Math.max(Number(query.page ?? 1) || 1, 1);
    const take = Math.min(Math.max(Number(query.take ?? 30) || 30, 1), 100);
    const type = String(query.type ?? 'ALL').toUpperCase();
    const wanted = type === 'ALL' ? new Set(['AUDIT', 'LEDGER', 'TOPUP', 'WITHDRAWAL']) : new Set([type]);
    const fetchSize = Math.min(Math.max(page * take, take), 300);

    const [audits, ledgers, topUps, withdrawals] = await Promise.all([
      wanted.has('AUDIT') ? this.prisma.adminAuditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: fetchSize,
        include: { adminUser: { select: { id: true, username: true, email: true } } },
      }) : [],
      wanted.has('LEDGER') ? this.prisma.walletLedger.findMany({
        orderBy: { createdAt: 'desc' },
        take: fetchSize,
        include: { user: { select: { id: true, username: true, email: true, phone: true } }, createdByAdmin: { select: { id: true, username: true, email: true } } },
      }) : [],
      wanted.has('TOPUP') ? this.prisma.topUpRequest.findMany({
        orderBy: { updatedAt: 'desc' },
        take: fetchSize,
        include: { user: { select: { id: true, username: true, email: true, phone: true } }, reviewer: { select: { id: true, username: true, email: true } } },
      }) : [],
      wanted.has('WITHDRAWAL') ? this.prisma.withdrawalRequest.findMany({
        orderBy: { updatedAt: 'desc' },
        take: fetchSize,
        include: { user: { select: { id: true, username: true, email: true, phone: true } }, reviewer: { select: { id: true, username: true, email: true } } },
      }) : [],
    ]);

    const items: ActivityItem[] = [
      ...audits.map((item) => ({
        id: item.id,
        type: 'AUDIT' as const,
        title: item.action,
        description: `${item.module}${item.targetId ? ` · ${item.targetId}` : ''}`,
        actor: item.adminUser?.username ?? item.adminUser?.email ?? null,
        refType: item.module,
        refId: item.targetId,
        status: null,
        createdAt: item.createdAt,
      })),
      ...ledgers.map((item) => ({
        id: item.id,
        type: 'LEDGER' as const,
        title: `${item.type} / ${item.direction}`,
        description: item.user?.username ?? item.user?.email ?? item.userId.slice(0, 8),
        actor: item.createdByAdmin?.username ?? item.createdByAdmin?.email ?? null,
        memberId: item.userId,
        refType: item.referenceType,
        refId: item.referenceId,
        amount: item.amount.toString(),
        status: item.direction,
        createdAt: item.createdAt,
      })),
      ...topUps.map((item) => ({
        id: item.id,
        type: 'TOPUP' as const,
        title: `Top-up ${item.status}`,
        description: item.user?.username ?? item.user?.email ?? item.userId.slice(0, 8),
        actor: item.reviewer?.username ?? item.reviewer?.email ?? null,
        memberId: item.userId,
        refType: 'topup',
        refId: item.id,
        amount: item.amount.toString(),
        status: item.status,
        createdAt: item.updatedAt,
      })),
      ...withdrawals.map((item) => ({
        id: item.id,
        type: 'WITHDRAWAL' as const,
        title: `Withdrawal ${item.status}`,
        description: item.user?.username ?? item.user?.email ?? item.userId.slice(0, 8),
        actor: item.reviewer?.username ?? item.reviewer?.email ?? null,
        memberId: item.userId,
        refType: 'withdrawal',
        refId: item.id,
        amount: item.amount.toString(),
        status: item.status,
        createdAt: item.updatedAt,
      })),
    ];

    const sorted = items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const total = sorted.length;
    const paged = sorted.slice((page - 1) * take, page * take);

    return {
      items: paged.map((item) => ({ ...item, createdAt: item.createdAt.toISOString() })),
      page,
      take,
      total,
      pageCount: Math.max(Math.ceil(total / take), 1),
      summary: {
        audit: audits.length,
        ledger: ledgers.length,
        topup: topUps.length,
        withdrawal: withdrawals.length,
      },
      generatedAt: new Date().toISOString(),
    };
  }
}
