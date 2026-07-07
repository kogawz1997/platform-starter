import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '../../database/prisma.service';
import { CreateTopUpRequestDto } from './dto/create-top-up-request.dto';
import { ReviewTopUpRequestDto } from './dto/review-top-up-request.dto';

@Injectable()
export class TopUpsService {
  constructor(private readonly prisma: PrismaService) {}

  async createMemberRequest(userId: string, dto: CreateTopUpRequestDto) {
    const amount = new Decimal(dto.amount ?? 0);
    if (amount.lte(0)) throw new BadRequestException('Amount must be greater than zero');

    const request = await this.prisma.topUpRequest.create({
      data: { userId, amount, currency: 'THB', method: dto.method, referenceCode: dto.referenceCode, note: dto.note },
    });

    return this.formatRequest(request);
  }

  async getMemberRequests(userId: string) {
    const items = await this.prisma.topUpRequest.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 50 });
    return { items: items.map((item) => this.formatRequest(item)) };
  }

  async getMemberRequest(userId: string, id: string) {
    const request = await this.prisma.topUpRequest.findFirst({ where: { id, userId } });
    if (!request) throw new NotFoundException('Top up request not found');
    return this.formatRequest(request);
  }

  async getAdminRequests(status?: string) {
    const items = await this.prisma.topUpRequest.findMany({
      where: status ? { status: status as any } : {},
      include: { user: { select: { id: true, username: true, phone: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return { items: items.map((item) => ({ ...this.formatRequest(item), user: item.user })) };
  }

  async getAdminRequest(id: string) {
    const request = await this.prisma.topUpRequest.findUnique({ where: { id }, include: { user: { select: { id: true, username: true, phone: true, email: true } } } });
    if (!request) throw new NotFoundException('Top up request not found');
    return { ...this.formatRequest(request), user: request.user };
  }

  async approveRequest(id: string, adminUser: any, dto: ReviewTopUpRequestDto, meta: RequestMeta = {}) {
    const idempotencyKey = `topup:${id}:approve`;
    return this.prisma.$transaction(async (tx) => {
      const request = await tx.topUpRequest.findUnique({ where: { id } });
      if (!request) throw new NotFoundException('Top up request not found');
      if (request.status !== 'PENDING') throw new ConflictException(`Top up request already reviewed: ${request.status}`);

      const existingLedger = await tx.walletLedger.findUnique({ where: { idempotencyKey } });
      if (existingLedger) throw new ConflictException('Top up approval ledger already exists');

      const claim = await tx.topUpRequest.updateMany({
        where: { id, status: 'PENDING' },
        data: { status: 'APPROVED', adminNote: dto.adminNote, reviewedBy: adminUser.id, reviewedAt: new Date() },
      });
      if (claim.count !== 1) throw new ConflictException('Top up request already reviewed');

      let wallet = await tx.wallet.findUnique({ where: { userId: request.userId } });
      if (!wallet) wallet = await tx.wallet.create({ data: { userId: request.userId, currency: request.currency } });
      if (wallet.status !== 'ACTIVE') throw new BadRequestException('Wallet is not active');

      const balanceBefore = wallet.balance;
      const balanceAfter = balanceBefore.plus(request.amount);
      await tx.wallet.update({ where: { id: wallet.id }, data: { balance: balanceAfter } });

      await tx.walletLedger.create({
        data: {
          walletId: wallet.id,
          userId: request.userId,
          type: 'DEPOSIT',
          direction: 'CREDIT',
          amount: request.amount,
          balanceBefore,
          balanceAfter,
          referenceType: 'top_up_request',
          referenceId: request.id,
          idempotencyKey,
          metadata: { method: request.method, referenceCode: request.referenceCode },
          createdByAdminId: adminUser.id,
        },
      });

      await tx.adminAuditLog.create({
        data: {
          adminUserId: adminUser.id,
          action: 'APPROVE_TOP_UP',
          module: 'topups',
          targetId: request.id,
          oldData: { status: request.status, amount: request.amount.toString() } as any,
          newData: { status: 'APPROVED', balanceBefore: balanceBefore.toString(), balanceAfter: balanceAfter.toString(), idempotencyKey } as any,
          ipAddress: meta.ipAddress,
          userAgent: meta.userAgent,
        },
      });

      const updated = await tx.topUpRequest.findUniqueOrThrow({ where: { id } });
      return this.formatRequest(updated);
    });
  }

  async rejectRequest(id: string, adminUser: any, dto: ReviewTopUpRequestDto, meta: RequestMeta = {}) {
    return this.prisma.$transaction(async (tx) => {
      const request = await tx.topUpRequest.findUnique({ where: { id } });
      if (!request) throw new NotFoundException('Top up request not found');
      if (request.status !== 'PENDING') throw new ConflictException(`Top up request already reviewed: ${request.status}`);

      const claim = await tx.topUpRequest.updateMany({
        where: { id, status: 'PENDING' },
        data: { status: 'REJECTED', adminNote: dto.adminNote, reviewedBy: adminUser.id, reviewedAt: new Date() },
      });
      if (claim.count !== 1) throw new ConflictException('Top up request already reviewed');

      await tx.adminAuditLog.create({
        data: {
          adminUserId: adminUser.id,
          action: 'REJECT_TOP_UP',
          module: 'topups',
          targetId: request.id,
          oldData: { status: request.status, amount: request.amount.toString() } as any,
          newData: { status: 'REJECTED', adminNote: dto.adminNote } as any,
          ipAddress: meta.ipAddress,
          userAgent: meta.userAgent,
        },
      });

      const updated = await tx.topUpRequest.findUniqueOrThrow({ where: { id } });
      return this.formatRequest(updated);
    });
  }

  private formatRequest(item: any) {
    return { id: item.id, userId: item.userId, amount: item.amount.toString(), currency: item.currency, status: item.status, method: item.method, referenceCode: item.referenceCode, note: item.note, adminNote: item.adminNote, reviewedBy: item.reviewedBy, reviewedAt: item.reviewedAt, createdAt: item.createdAt, updatedAt: item.updatedAt };
  }
}

export type RequestMeta = { ipAddress?: string; userAgent?: string };
