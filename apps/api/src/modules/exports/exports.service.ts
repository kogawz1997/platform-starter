import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ExportsService {
  constructor(private readonly prisma: PrismaService) {}

  async exportTopUps(query: ExportQuery = {}) {
    const items = await this.prisma.topUpRequest.findMany({
      where: this.statusDateWhere(query),
      include: { user: { select: { username: true, email: true, phone: true } } },
      orderBy: { createdAt: 'desc' },
      take: this.limit(query),
    });
    return this.csv(['id', 'username', 'amount', 'currency', 'status', 'method', 'createdAt', 'reviewedAt'], items.map((item) => [item.id, item.user?.username ?? '', item.amount.toString(), item.currency, item.status, item.method ?? '', item.createdAt.toISOString(), item.reviewedAt?.toISOString() ?? '']));
  }

  async exportWithdrawals(query: ExportQuery = {}) {
    const items = await this.prisma.withdrawalRequest.findMany({
      where: this.statusDateWhere(query),
      include: { user: { select: { username: true, email: true, phone: true } } },
      orderBy: { createdAt: 'desc' },
      take: this.limit(query),
    });
    return this.csv(['id', 'username', 'amount', 'currency', 'status', 'method', 'bankName', 'accountNumber', 'createdAt', 'reviewedAt'], items.map((item) => [item.id, item.user?.username ?? '', item.amount.toString(), item.currency, item.status, item.method ?? '', item.bankName ?? '', item.accountNumber ?? '', item.createdAt.toISOString(), item.reviewedAt?.toISOString() ?? '']));
  }

  async exportLedgers(query: ExportQuery = {}) {
    const where: any = {};
    if (query.from || query.to) where.createdAt = this.dateWhere(query);
    if (query.status) where.type = query.status;
    const items = await this.prisma.walletLedger.findMany({
      where,
      include: { user: { select: { username: true, email: true, phone: true } }, createdByAdmin: { select: { username: true } } },
      orderBy: { createdAt: 'desc' },
      take: this.limit(query),
    });
    return this.csv(['id', 'username', 'type', 'direction', 'amount', 'balanceBefore', 'balanceAfter', 'referenceType', 'referenceId', 'admin', 'createdAt'], items.map((item) => [item.id, item.user?.username ?? '', item.type, item.direction, item.amount.toString(), item.balanceBefore.toString(), item.balanceAfter.toString(), item.referenceType ?? '', item.referenceId ?? '', item.createdByAdmin?.username ?? '', item.createdAt.toISOString()]));
  }

  private statusDateWhere(query: ExportQuery) {
    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.from || query.to) where.createdAt = this.dateWhere(query);
    return where;
  }

  private dateWhere(query: ExportQuery) {
    const value: any = {};
    if (query.from) value.gte = new Date(query.from);
    if (query.to) value.lte = new Date(query.to);
    return value;
  }

  private limit(query: ExportQuery) {
    return Math.min(Math.max(Number(query.limit) || 1000, 1), 5000);
  }

  private csv(headers: string[], rows: any[][]) {
    return [headers, ...rows].map((row) => row.map((cell) => this.escape(cell)).join(',')).join('\n');
  }

  private escape(value: any) {
    const text = String(value ?? '');
    if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
    return text;
  }
}

type ExportQuery = { status?: string; from?: string; to?: string; limit?: string };
