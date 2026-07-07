import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

type BankBody = {
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  promptPay?: string;
  qrImageUrl?: string;
  minAmount?: number | string | null;
  maxAmount?: number | string | null;
  status?: 'ACTIVE' | 'DISABLED' | 'PENDING_REVIEW' | 'REJECTED';
  sortOrder?: number;
  adminNote?: string;
};

@Injectable()
export class BankAccountsService {
  constructor(private readonly prisma: PrismaService) {}

  async getActiveReceivingAccounts() {
    const items = await this.prisma.receivingBankAccount.findMany({
      where: { status: 'ACTIVE' },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
    return { items: items.map(this.mapReceiving) };
  }

  async listReceivingAccounts() {
    const items = await this.prisma.receivingBankAccount.findMany({ orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }] });
    return { items: items.map(this.mapReceiving) };
  }

  async createReceivingAccount(body: BankBody, admin: any, meta: any) {
    this.requireBankFields(body);
    const item = await this.prisma.receivingBankAccount.create({
      data: {
        bankName: body.bankName!.trim(),
        accountName: body.accountName!.trim(),
        accountNumber: body.accountNumber!.trim(),
        promptPay: body.promptPay?.trim() || null,
        qrImageUrl: body.qrImageUrl?.trim() || null,
        minAmount: this.decimalOrNull(body.minAmount),
        maxAmount: this.decimalOrNull(body.maxAmount),
        status: body.status ?? 'ACTIVE',
        sortOrder: Number(body.sortOrder ?? 100),
      },
    });
    await this.audit(admin?.id, 'CREATE_RECEIVING_BANK_ACCOUNT', item.id, null, this.mapReceiving(item), meta);
    return { item: this.mapReceiving(item) };
  }

  async updateReceivingAccount(id: string, body: BankBody, admin: any, meta: any) {
    const existing = await this.prisma.receivingBankAccount.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Receiving bank account not found');
    const item = await this.prisma.receivingBankAccount.update({
      where: { id },
      data: {
        bankName: body.bankName?.trim() ?? undefined,
        accountName: body.accountName?.trim() ?? undefined,
        accountNumber: body.accountNumber?.trim() ?? undefined,
        promptPay: body.promptPay === undefined ? undefined : body.promptPay?.trim() || null,
        qrImageUrl: body.qrImageUrl === undefined ? undefined : body.qrImageUrl?.trim() || null,
        minAmount: body.minAmount === undefined ? undefined : this.decimalOrNull(body.minAmount),
        maxAmount: body.maxAmount === undefined ? undefined : this.decimalOrNull(body.maxAmount),
        status: body.status ?? undefined,
        sortOrder: body.sortOrder === undefined ? undefined : Number(body.sortOrder),
      },
    });
    await this.audit(admin?.id, 'UPDATE_RECEIVING_BANK_ACCOUNT', id, this.mapReceiving(existing), this.mapReceiving(item), meta);
    return { item: this.mapReceiving(item) };
  }

  async listMemberBankAccounts(userId: string) {
    const items = await this.prisma.memberBankAccount.findMany({ where: { userId }, orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }] });
    return { items: items.map(this.mapMemberBank) };
  }

  async createMemberBankAccount(userId: string, body: BankBody) {
    this.requireBankFields(body);
    const count = await this.prisma.memberBankAccount.count({ where: { userId } });
    const item = await this.prisma.memberBankAccount.create({
      data: { userId, bankName: body.bankName!.trim(), accountName: body.accountName!.trim(), accountNumber: body.accountNumber!.trim(), isPrimary: count === 0, status: 'PENDING_REVIEW' },
    });
    return { item: this.mapMemberBank(item) };
  }

  async setPrimaryMemberBankAccount(userId: string, id: string) {
    const existing = await this.prisma.memberBankAccount.findFirst({ where: { id, userId } });
    if (!existing) throw new NotFoundException('Member bank account not found');
    await this.prisma.$transaction([
      this.prisma.memberBankAccount.updateMany({ where: { userId }, data: { isPrimary: false } }),
      this.prisma.memberBankAccount.update({ where: { id }, data: { isPrimary: true } }),
    ]);
    const item = await this.prisma.memberBankAccount.findUniqueOrThrow({ where: { id } });
    return { item: this.mapMemberBank(item) };
  }

  async listAllMemberBankAccounts(search?: string) {
    const where = search?.trim() ? { OR: [{ bankName: { contains: search.trim(), mode: 'insensitive' as const } }, { accountName: { contains: search.trim(), mode: 'insensitive' as const } }, { accountNumber: { contains: search.trim(), mode: 'insensitive' as const } }, { user: { username: { contains: search.trim(), mode: 'insensitive' as const } } }] } : {};
    const items = await this.prisma.memberBankAccount.findMany({ where, orderBy: [{ status: 'asc' }, { createdAt: 'desc' }], take: 200, include: { user: { select: { id: true, username: true, phone: true, email: true, status: true } } } });
    return { items: items.map((item) => ({ ...this.mapMemberBank(item), user: item.user })) };
  }

  async reviewMemberBankAccount(id: string, body: BankBody, admin: any, meta: any) {
    const existing = await this.prisma.memberBankAccount.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Member bank account not found');
    const item = await this.prisma.memberBankAccount.update({ where: { id }, data: { status: body.status ?? 'ACTIVE', adminNote: body.adminNote ?? undefined } });
    await this.audit(admin?.id, 'REVIEW_MEMBER_BANK_ACCOUNT', id, this.mapMemberBank(existing), this.mapMemberBank(item), meta);
    return { item: this.mapMemberBank(item) };
  }

  private requireBankFields(body: BankBody) {
    if (!body.bankName?.trim() || !body.accountName?.trim() || !body.accountNumber?.trim()) throw new BadRequestException('bankName, accountName and accountNumber are required');
  }

  private decimalOrNull(value: unknown) {
    if (value === null || value === undefined || value === '') return null;
    const next = Number(value);
    if (!Number.isFinite(next) || next < 0) throw new BadRequestException('Invalid amount limit');
    return next;
  }

  private mapReceiving(item: any) {
    return { id: item.id, bankName: item.bankName, accountName: item.accountName, accountNumber: item.accountNumber, promptPay: item.promptPay, qrImageUrl: item.qrImageUrl, minAmount: item.minAmount?.toString?.() ?? null, maxAmount: item.maxAmount?.toString?.() ?? null, status: item.status, sortOrder: item.sortOrder, createdAt: item.createdAt, updatedAt: item.updatedAt };
  }

  private mapMemberBank(item: any) {
    return { id: item.id, userId: item.userId, bankName: item.bankName, accountName: item.accountName, accountNumber: item.accountNumber, isPrimary: item.isPrimary, status: item.status, adminNote: item.adminNote, createdAt: item.createdAt, updatedAt: item.updatedAt };
  }

  private audit(adminUserId: string | undefined, action: string, targetId: string, oldData: any, newData: any, meta: any) {
    return this.prisma.adminAuditLog.create({ data: { adminUserId, module: 'bank_accounts', action, targetId, oldData, newData, ipAddress: meta?.ipAddress, userAgent: meta?.userAgent } });
  }
}
