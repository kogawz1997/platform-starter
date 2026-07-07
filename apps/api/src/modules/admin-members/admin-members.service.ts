import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AdminMembersService {
  constructor(private readonly prisma: PrismaService) {}

  async getMemberDetail(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { profile: true, wallet: true },
    });
    if (!user) throw new NotFoundException('Member not found');

    const [topUps, withdrawals, ledgers, activity] = await Promise.all([
      this.prisma.topUpRequest.findMany({ where: { userId: id }, orderBy: { createdAt: 'desc' }, take: 20 }),
      this.prisma.withdrawalRequest.findMany({ where: { userId: id }, orderBy: { createdAt: 'desc' }, take: 20 }),
      this.prisma.walletLedger.findMany({ where: { userId: id }, orderBy: { createdAt: 'desc' }, take: 50, include: { createdByAdmin: { select: { id: true, username: true, email: true } } } }),
      this.prisma.adminAuditLog.findMany({ where: { targetId: id }, orderBy: { createdAt: 'desc' }, take: 20, include: { adminUser: { select: { id: true, username: true, email: true } } } }),
    ]);

    return {
      user: {
        id: user.id,
        shortId: user.id.slice(0, 8),
        username: user.username,
        phone: user.phone,
        email: user.email,
        status: user.status,
        phoneVerifiedAt: user.phoneVerifiedAt,
        emailVerifiedAt: user.emailVerifiedAt,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        profile: user.profile,
      },
      wallet: user.wallet ? {
        id: user.wallet.id,
        currency: user.wallet.currency,
        balance: user.wallet.balance.toString(),
        lockedBalance: user.wallet.lockedBalance.toString(),
        availableBalance: user.wallet.balance.minus(user.wallet.lockedBalance).toString(),
        status: user.wallet.status,
        updatedAt: user.wallet.updatedAt,
      } : null,
      topUps: topUps.map((item) => ({ id: item.id, amount: item.amount.toString(), currency: item.currency, status: item.status, method: item.method, referenceCode: item.referenceCode, adminNote: item.adminNote, reviewedAt: item.reviewedAt, createdAt: item.createdAt })),
      withdrawals: withdrawals.map((item) => ({ id: item.id, amount: item.amount.toString(), currency: item.currency, status: item.status, method: item.method, bankName: item.bankName, accountName: item.accountName, accountNumber: item.accountNumber, adminNote: item.adminNote, reviewedAt: item.reviewedAt, createdAt: item.createdAt })),
      ledgers: ledgers.map((item) => ({ id: item.id, type: item.type, direction: item.direction, amount: item.amount.toString(), balanceBefore: item.balanceBefore.toString(), balanceAfter: item.balanceAfter.toString(), referenceType: item.referenceType, referenceId: item.referenceId, createdAt: item.createdAt, createdByAdmin: item.createdByAdmin })),
      activity: activity.map((item) => ({ id: item.id, action: item.action, module: item.module, targetId: item.targetId, oldData: item.oldData, newData: item.newData, createdAt: item.createdAt, adminUser: item.adminUser })),
      generatedAt: new Date().toISOString(),
    };
  }
}
