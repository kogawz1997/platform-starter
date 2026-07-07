import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '../../database/prisma.service';
import { CreateWithdrawalRequestDto } from './dto/create-withdrawal-request.dto';
import { ReviewWithdrawalRequestDto } from './dto/review-withdrawal-request.dto';

@Injectable()
export class WithdrawalsService {
  constructor(private readonly prisma: PrismaService) {}

  async createMemberRequest(userId: string, dto: CreateWithdrawalRequestDto) {
    const amount = new Decimal(dto.amount ?? 0);
    if (amount.lte(0)) throw new BadRequestException('Amount must be greater than zero');
    if (!dto.accountName || !dto.accountNumber || !dto.bankName) throw new BadRequestException('Withdrawal bank account is required');

    return this.prisma.$transaction(async (tx) => {
      const approvedBank = await tx.memberBankAccount.findFirst({
        where: { userId, status: 'ACTIVE', bankName: dto.bankName, accountName: dto.accountName, accountNumber: dto.accountNumber },
      });
      if (!approvedBank) throw new BadRequestException('กรุณาใช้บัญชีถอนเงินที่แอดมินอนุมัติแล้วเท่านั้น');

      const wallet = await tx.wallet.findUnique({ where: { userId } });
      if (!wallet) throw new BadRequestException('Wallet not found');
      if (wallet.status !== 'ACTIVE') throw new BadRequestException('Wallet is not active');

      const available = wallet.balance.minus(wallet.lockedBalance);
      if (available.lt(amount)) throw new BadRequestException('Insufficient available balance');

      await tx.wallet.update({ where: { id: wallet.id }, data: { lockedBalance: wallet.lockedBalance.plus(amount) } });

      const request = await tx.withdrawalRequest.create({
        data: { userId, amount, currency: wallet.currency, method: dto.method, accountName: dto.accountName, accountNumber: dto.accountNumber, bankName: dto.bankName, note: dto.note },
      });

      return this.formatRequest(request);
    });
  }

  async getMemberRequests(userId: string) {
    const items = await this.prisma.withdrawalRequest.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 50 });
    return { items: items.map((item) => this.formatRequest(item)) };
  }

  async getMemberRequest(userId: string, id: string) {
    const request = await this.prisma.withdrawalRequest.findFirst({ where: { id, userId } });
    if (!request) throw new NotFoundException('Withdrawal request not found');
    return this.formatRequest(request);
  }

  async getAdminRequests(status?: string) {
    const items = await this.prisma.withdrawalRequest.findMany({
      where: status ? { status: status as any } : {},
      include: { user: { select: { id: true, username: true, phone: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return { items: items.map((item) => ({ ...this.formatRequest(item), user: item.user })) };
  }

  async getAdminRequest(id: string) {
    const request = await this.prisma.withdrawalRequest.findUnique({ where: { id }, include: { user: { select: { id: true, username: true, phone: true, email: true } } } });
    if (!request) throw new NotFoundException('Withdrawal request not found');
    return { ...this.formatRequest(request), user: request.user };
  }

  async completeRequest(id: string, adminUser: any, dto: ReviewWithdrawalRequestDto, meta: RequestMeta = {}) {
    return this.prisma.$transaction(async (tx) => {
      const request = await tx.withdrawalRequest.findUnique({ where: { id } });
      if (!request) throw new NotFoundException('Withdrawal request not found');
      if (request.status !== 'PENDING') throw new ConflictException(`Withdrawal request already reviewed: ${request.status}`);
      const ledgerKey = `withdrawal:${request.id}:complete`;
      const existingLedger = await tx.walletLedger.findUnique({ where: { idempotencyKey: ledgerKey } });
      if (existingLedger) throw new ConflictException('Withdrawal ledger already exists');

      const claim = await tx.withdrawalRequest.updateMany({ where: { id, status: 'PENDING' }, data: { status: 'COMPLETED', adminNote: dto.adminNote, reviewedBy: adminUser.id, reviewedAt: new Date() } });
      if (claim.count !== 1) throw new ConflictException('Withdrawal request already reviewed');

      const wallet = await tx.wallet.findUnique({ where: { userId: request.userId } });
      if (!wallet) throw new BadRequestException('Wallet not found');
      if (wallet.lockedBalance.lt(request.amount)) throw new BadRequestException('Locked balance is not enough');
      if (wallet.balance.lt(request.amount)) throw new BadRequestException('Balance is not enough');

      const balanceBefore = wallet.balance;
      const balanceAfter = balanceBefore.minus(request.amount);
      const lockedAfter = wallet.lockedBalance.minus(request.amount);

      await tx.wallet.update({ where: { id: wallet.id }, data: { balance: balanceAfter, lockedBalance: lockedAfter } });
      await tx.walletLedger.create({ data: { walletId: wallet.id, userId: request.userId, type: 'WITHDRAWAL', direction: 'DEBIT', amount: request.amount, balanceBefore, balanceAfter, referenceType: 'withdrawal_request', referenceId: request.id, idempotencyKey: ledgerKey, metadata: { method: request.method, accountName: request.accountName, bankName: request.bankName }, createdByAdminId: adminUser.id } });
      await tx.adminAuditLog.create({ data: { adminUserId: adminUser.id, action: 'COMPLETE_WITHDRAWAL', module: 'withdrawals', targetId: request.id, oldData: { status: request.status, amount: request.amount.toString() } as any, newData: { status: 'COMPLETED', balanceBefore: balanceBefore.toString(), balanceAfter: balanceAfter.toString(), lockedAfter: lockedAfter.toString(), idempotencyKey: ledgerKey } as any, ipAddress: meta.ipAddress, userAgent: meta.userAgent } });
      const updated = await tx.withdrawalRequest.findUniqueOrThrow({ where: { id } });
      return this.formatRequest(updated);
    });
  }

  async rejectRequest(id: string, adminUser: any, dto: ReviewWithdrawalRequestDto, meta: RequestMeta = {}) {
    return this.prisma.$transaction(async (tx) => {
      const request = await tx.withdrawalRequest.findUnique({ where: { id } });
      if (!request) throw new NotFoundException('Withdrawal request not found');
      if (request.status !== 'PENDING') throw new ConflictException(`Withdrawal request already reviewed: ${request.status}`);
      const claim = await tx.withdrawalRequest.updateMany({ where: { id, status: 'PENDING' }, data: { status: 'REJECTED', adminNote: dto.adminNote, reviewedBy: adminUser.id, reviewedAt: new Date() } });
      if (claim.count !== 1) throw new ConflictException('Withdrawal request already reviewed');
      const wallet = await tx.wallet.findUnique({ where: { userId: request.userId } });
      if (!wallet) throw new BadRequestException('Wallet not found');
      if (wallet.lockedBalance.lt(request.amount)) throw new BadRequestException('Locked balance is not enough');
      const lockedAfter = wallet.lockedBalance.minus(request.amount);
      await tx.wallet.update({ where: { id: wallet.id }, data: { lockedBalance: lockedAfter } });
      await tx.adminAuditLog.create({ data: { adminUserId: adminUser.id, action: 'REJECT_WITHDRAWAL', module: 'withdrawals', targetId: request.id, oldData: { status: request.status, amount: request.amount.toString() } as any, newData: { status: 'REJECTED', adminNote: dto.adminNote, lockedAfter: lockedAfter.toString() } as any, ipAddress: meta.ipAddress, userAgent: meta.userAgent } });
      const updated = await tx.withdrawalRequest.findUniqueOrThrow({ where: { id } });
      return this.formatRequest(updated);
    });
  }

  private formatRequest(item: any) {
    return { id: item.id, userId: item.userId, amount: item.amount.toString(), currency: item.currency, status: item.status, method: item.method, accountName: item.accountName, accountNumber: item.accountNumber, bankName: item.bankName, note: item.note, adminNote: item.adminNote, reviewedBy: item.reviewedBy, reviewedAt: item.reviewedAt, createdAt: item.createdAt, updatedAt: item.updatedAt };
  }
}

export type RequestMeta = { ipAddress?: string; userAgent?: string };
