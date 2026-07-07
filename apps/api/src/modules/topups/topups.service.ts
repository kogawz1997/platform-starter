import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { mkdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '../../database/prisma.service';
import { CreateTopUpRequestDto } from './dto/create-top-up-request.dto';
import { ReviewTopUpRequestDto } from './dto/review-top-up-request.dto';

const CLAIM_TIMEOUT_MS = 15 * 60 * 1000;

@Injectable()
export class TopUpsService {
  constructor(private readonly prisma: PrismaService) {}

  async createMemberRequest(userId: string, dto: CreateTopUpRequestDto) {
    const amount = new Decimal(dto.amount ?? 0);
    if (amount.lte(0)) throw new BadRequestException('Amount must be greater than zero');
    await this.validateReceivingAccount(dto.note, dto.method, amount);

    const request = await this.prisma.topUpRequest.create({ data: { userId, amount, currency: 'THB', method: dto.method, referenceCode: dto.referenceCode, note: dto.note } });
    return this.formatRequest(request);
  }

  async saveMemberSlip(userId: string, dto: { slipImageData?: string; slipImageName?: string }) {
    const dataUrl = dto.slipImageData?.trim();
    if (!dataUrl) throw new BadRequestException('Slip image is required');
    const match = dataUrl.match(/^data:(image\/(jpeg|jpg|png|webp));base64,(.+)$/);
    if (!match) throw new BadRequestException('Slip image must be jpg, png, or webp');
    const buffer = Buffer.from(match[3], 'base64');
    if (!buffer.length) throw new BadRequestException('Slip image is empty');
    if (buffer.length > 1_500_000) throw new BadRequestException('Slip image is too large');
    const ext = match[2] === 'jpeg' ? 'jpg' : match[2];
    const id = `${new Date().toISOString().slice(0, 10)}-${randomUUID()}`;
    const dir = this.privateSlipDir();
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, `${id}.${ext}`), buffer);
    return { slipFileId: id, slipImageName: dto.slipImageName ?? 'slip', contentType: match[1] };
  }

  async getAdminSlip(id: string) {
    const request = await this.prisma.topUpRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundException('Top up request not found');
    const proof = this.parseProof(request.note);
    if (!proof.slipFileId) throw new NotFoundException('Slip file not found');
    const dir = this.privateSlipDir();
    for (const ext of ['jpg', 'png', 'webp', 'jpeg']) {
      try {
        const buffer = await readFile(join(dir, `${proof.slipFileId}.${ext}`));
        const contentType = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : `image/${ext}`;
        return { dataUrl: `data:${contentType};base64,${buffer.toString('base64')}`, slipImageName: proof.slipImageName ?? 'slip' };
      } catch {}
    }
    throw new NotFoundException('Slip file not found');
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
    await this.releaseExpiredClaims();
    const items = await this.prisma.topUpRequest.findMany({ where: status ? { status: status as any } : {}, include: { user: { select: { id: true, username: true, phone: true, email: true } } }, orderBy: { createdAt: 'desc' }, take: 100 });
    return { items: items.map((item) => ({ ...this.formatRequest(item), user: item.user })) };
  }

  async getAdminRequest(id: string) {
    const request = await this.prisma.topUpRequest.findUnique({ where: { id }, include: { user: { select: { id: true, username: true, phone: true, email: true } } } });
    if (!request) throw new NotFoundException('Top up request not found');
    return { ...this.formatRequest(request), user: request.user };
  }

  async claimRequest(id: string, adminUser: any, meta: RequestMeta = {}) {
    const request = await this.prisma.topUpRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundException('Top up request not found');
    if (request.status !== 'PENDING') throw new ConflictException('Top up request is not pending');
    if (request.claimedBy && request.claimedBy !== adminUser.id && request.claimedAt && Date.now() - request.claimedAt.getTime() < CLAIM_TIMEOUT_MS) throw new ConflictException('รายการนี้มีแอดมินคนอื่นกำลังตรวจอยู่');
    const updated = await this.prisma.topUpRequest.update({ where: { id }, data: { claimedBy: adminUser.id, claimedAt: new Date() } });
    await this.audit(adminUser.id, 'CLAIM_TOP_UP', id, { claimedBy: request.claimedBy }, { claimedBy: adminUser.id }, meta);
    return this.formatRequest(updated);
  }

  async releaseRequest(id: string, adminUser: any, meta: RequestMeta = {}) {
    const request = await this.prisma.topUpRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundException('Top up request not found');
    if (request.claimedBy && request.claimedBy !== adminUser.id) throw new ConflictException('ปล่อยงานได้เฉพาะคนที่ claim หรือ super admin เท่านั้น');
    const updated = await this.prisma.topUpRequest.update({ where: { id }, data: { claimedBy: null, claimedAt: null } });
    await this.audit(adminUser.id, 'RELEASE_TOP_UP', id, { claimedBy: request.claimedBy }, { claimedBy: null }, meta);
    return this.formatRequest(updated);
  }

  async approveRequest(id: string, adminUser: any, dto: ReviewTopUpRequestDto, meta: RequestMeta = {}) {
    const idempotencyKey = `topup:${id}:approve`;
    return this.prisma.$transaction(async (tx) => {
      const request = await tx.topUpRequest.findUnique({ where: { id } });
      if (!request) throw new NotFoundException('Top up request not found');
      if (request.claimedBy && request.claimedBy !== adminUser.id) throw new ConflictException('ต้อง claim รายการก่อนอนุมัติ');
      if (request.status !== 'PENDING') throw new ConflictException(`Top up request already reviewed: ${request.status}`);
      const existingLedger = await tx.walletLedger.findUnique({ where: { idempotencyKey } });
      if (existingLedger) throw new ConflictException('Top up approval ledger already exists');
      const claim = await tx.topUpRequest.updateMany({ where: { id, status: 'PENDING' }, data: { status: 'APPROVED', adminNote: dto.adminNote, reviewedBy: adminUser.id, reviewedAt: new Date(), claimedBy: null, claimedAt: null } });
      if (claim.count !== 1) throw new ConflictException('Top up request already reviewed');
      let wallet = await tx.wallet.findUnique({ where: { userId: request.userId } });
      if (!wallet) wallet = await tx.wallet.create({ data: { userId: request.userId, currency: request.currency } });
      if (wallet.status !== 'ACTIVE') throw new BadRequestException('Wallet is not active');
      const balanceBefore = wallet.balance;
      const balanceAfter = balanceBefore.plus(request.amount);
      await tx.wallet.update({ where: { id: wallet.id }, data: { balance: balanceAfter } });
      await tx.walletLedger.create({ data: { walletId: wallet.id, userId: request.userId, type: 'DEPOSIT', direction: 'CREDIT', amount: request.amount, balanceBefore, balanceAfter, referenceType: 'top_up_request', referenceId: request.id, idempotencyKey, metadata: { method: request.method, referenceCode: request.referenceCode, proof: this.parseProof(request.note) }, createdByAdminId: adminUser.id } });
      await tx.adminAuditLog.create({ data: { adminUserId: adminUser.id, action: 'APPROVE_TOP_UP', module: 'topups', targetId: request.id, oldData: { status: request.status, amount: request.amount.toString() } as any, newData: { status: 'APPROVED', balanceBefore: balanceBefore.toString(), balanceAfter: balanceAfter.toString(), idempotencyKey } as any, ipAddress: meta.ipAddress, userAgent: meta.userAgent } });
      const updated = await tx.topUpRequest.findUniqueOrThrow({ where: { id } });
      return this.formatRequest(updated);
    });
  }

  async rejectRequest(id: string, adminUser: any, dto: ReviewTopUpRequestDto, meta: RequestMeta = {}) {
    return this.prisma.$transaction(async (tx) => {
      const request = await tx.topUpRequest.findUnique({ where: { id } });
      if (!request) throw new NotFoundException('Top up request not found');
      if (request.claimedBy && request.claimedBy !== adminUser.id) throw new ConflictException('ต้อง claim รายการก่อนปฏิเสธ');
      if (request.status !== 'PENDING') throw new ConflictException(`Top up request already reviewed: ${request.status}`);
      const claim = await tx.topUpRequest.updateMany({ where: { id, status: 'PENDING' }, data: { status: 'REJECTED', adminNote: dto.adminNote, reviewedBy: adminUser.id, reviewedAt: new Date(), claimedBy: null, claimedAt: null } });
      if (claim.count !== 1) throw new ConflictException('Top up request already reviewed');
      await tx.adminAuditLog.create({ data: { adminUserId: adminUser.id, action: 'REJECT_TOP_UP', module: 'topups', targetId: request.id, oldData: { status: request.status, amount: request.amount.toString() } as any, newData: { status: 'REJECTED', adminNote: dto.adminNote } as any, ipAddress: meta.ipAddress, userAgent: meta.userAgent } });
      const updated = await tx.topUpRequest.findUniqueOrThrow({ where: { id } });
      return this.formatRequest(updated);
    });
  }

  private async validateReceivingAccount(note: string | undefined | null, method: string | undefined | null, amount: Decimal) {
    const proof = this.parseProof(note);
    if (!proof.receivingBankAccountId) return;
    const account = await this.prisma.receivingBankAccount.findUnique({ where: { id: proof.receivingBankAccountId } });
    if (!account || account.status !== 'ACTIVE') throw new BadRequestException('Receiving account is not active');
    const type = this.accountType(account.bankName);
    if (method && type !== method) throw new BadRequestException('Receiving account method mismatch');
    if (account.minAmount && amount.lt(account.minAmount)) throw new BadRequestException('Amount is lower than receiving account minimum');
    if (account.maxAmount && amount.gt(account.maxAmount)) throw new BadRequestException('Amount is higher than receiving account maximum');
  }

  private async releaseExpiredClaims() {
    const staleSince = new Date(Date.now() - CLAIM_TIMEOUT_MS);
    await this.prisma.topUpRequest.updateMany({ where: { status: 'PENDING', claimedBy: { not: null }, claimedAt: { lt: staleSince } }, data: { claimedBy: null, claimedAt: null } });
  }

  private accountType(bankName: string) { if (bankName === 'พร้อมเพย์') return 'promptpay'; if (bankName === 'วอเลต') return 'wallet'; if (bankName === 'อื่น ๆ') return 'other'; return 'bank_transfer'; }
  private audit(adminUserId: string, action: string, targetId: string, oldData: any, newData: any, meta: RequestMeta) { return this.prisma.adminAuditLog.create({ data: { adminUserId, action, module: 'topups', targetId, oldData, newData, ipAddress: meta.ipAddress, userAgent: meta.userAgent } }).catch(() => null); }
  private privateSlipDir() { return process.env.PRIVATE_MEDIA_DIR || '/tmp/platform-private-media/topup-slips'; }
  private parseProof(value?: string | null) { if (!value) return {} as any; try { return JSON.parse(value); } catch { return {} as any; } }
  private formatRequest(item: any) { return { id: item.id, userId: item.userId, amount: item.amount.toString(), currency: item.currency, status: item.status, method: item.method, referenceCode: item.referenceCode, note: item.note, adminNote: item.adminNote, reviewedBy: item.reviewedBy, reviewedAt: item.reviewedAt, claimedBy: item.claimedBy, claimedAt: item.claimedAt, createdAt: item.createdAt, updatedAt: item.updatedAt }; }
}

export type RequestMeta = { ipAddress?: string; userAgent?: string };
