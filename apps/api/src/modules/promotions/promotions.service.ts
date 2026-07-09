import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, RiskAlertStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

type Actor = { id: string };
type ClaimInput = { campaignId?: string; note?: string; topupId?: string };
type ReviewInput = { status?: 'APPROVED' | 'REJECTED'; adminNote?: string };
type PromotionCampaign = { id: string; title: string; description: string; enabled: boolean; bonusType: 'fixed' | 'percent'; bonusValue: number; minDeposit: number; maxBonus: number; turnoverMultiplier: number; claimMode: 'manual_review' | 'auto_pending'; startsAt?: string; endsAt?: string };

const CLAIM_REF_TYPE = 'PROMOTION_CLAIM';
const CLAIM_STATUSES = ['OPEN', 'REVIEWING', 'RESOLVED', 'DISMISSED'] as const;

@Injectable()
export class PromotionsService {
  constructor(private readonly prisma: PrismaService) {}

  async listPublicCampaigns() {
    const campaigns = await this.activeCampaigns();
    return { items: campaigns };
  }

  async createClaim(user: Actor, input: ClaimInput) {
    const campaignId = this.requireText(input.campaignId, 'campaignId');
    const campaign = (await this.activeCampaigns()).find((item) => item.id === campaignId);
    if (!campaign) throw new NotFoundException('Promotion campaign not found or inactive');
    const duplicate = await this.prisma.riskAlert.findFirst({ where: { refType: CLAIM_REF_TYPE, memberId: user.id, refId: campaignId, status: { in: ['OPEN', 'REVIEWING'] } } });
    if (duplicate) throw new BadRequestException('คุณมีคำขอรับโปรนี้ที่กำลังรอตรวจอยู่แล้ว');
    const metadata = { campaign, campaignId, topupId: input.topupId ?? null, memberNote: input.note ?? '', requestedAt: new Date().toISOString(), bonusPreview: this.bonusPreview(campaign, 0), settlement: { enabled: false, reason: 'Bonus ledger is not enabled yet' }, events: [{ by: 'member', action: 'CLAIM_CREATED', message: input.note ?? '', createdAt: new Date().toISOString() }] };
    const item = await this.prisma.riskAlert.create({ data: { type: 'WALLET_LEDGER_MISMATCH', severity: 'LOW', status: 'OPEN', memberId: user.id, refType: CLAIM_REF_TYPE, refId: campaignId, title: `Promotion claim: ${campaign.title}`, description: input.note?.trim() || `ขอรับโปร ${campaign.title}`, metadata: this.safeJson(metadata) } });
    return { ok: true, item: this.formatClaim(item) };
  }

  async listMemberClaims(user: Actor) {
    const items = await this.prisma.riskAlert.findMany({ where: { refType: CLAIM_REF_TYPE, memberId: user.id }, orderBy: { createdAt: 'desc' }, take: 50 });
    return { items: items.map((item) => this.formatClaim(item)) };
  }

  async listAdminClaims(query: { status?: string }) {
    const where: Prisma.RiskAlertWhereInput = { refType: CLAIM_REF_TYPE };
    if (query.status && query.status !== 'ALL' && CLAIM_STATUSES.includes(query.status as any)) where.status = query.status as RiskAlertStatus;
    const items = await this.prisma.riskAlert.findMany({ where, orderBy: { createdAt: 'desc' }, take: 100 });
    const memberMap = await this.memberMap(items.map((item) => item.memberId).filter(Boolean) as string[]);
    return { items: items.map((item) => this.formatClaim({ ...item, member: item.memberId ? memberMap.get(item.memberId) : undefined })), total: items.length };
  }

  async reviewClaim(admin: Actor, id: string, input: ReviewInput) {
    const item = await this.prisma.riskAlert.findFirst({ where: { id, refType: CLAIM_REF_TYPE } });
    if (!item) throw new NotFoundException('Promotion claim not found');
    const metadata = this.claimMetadata(item.metadata);
    const nextStatus = input.status === 'APPROVED' ? 'RESOLVED' : input.status === 'REJECTED' ? 'DISMISSED' : 'REVIEWING';
    if ((input.status === 'REJECTED') && !input.adminNote?.trim()) throw new BadRequestException('adminNote is required when rejecting a promotion claim');
    const events = [...metadata.events, { by: 'admin', adminUserId: admin.id, action: input.status ?? 'REVIEWING', message: input.adminNote ?? '', createdAt: new Date().toISOString() }];
    const updated = await this.prisma.riskAlert.update({ where: { id }, data: { status: nextStatus, severity: nextStatus === 'RESOLVED' ? 'LOW' : item.severity, resolvedAt: nextStatus === 'RESOLVED' || nextStatus === 'DISMISSED' ? new Date() : undefined, metadata: this.safeJson({ ...metadata, adminNote: input.adminNote ?? metadata.adminNote ?? '', reviewResult: input.status ?? 'REVIEWING', settlement: { enabled: false, reason: 'Bonus ledger is not enabled yet' }, events }) } });
    await this.audit(admin.id, 'promotion.claim.review', id, item, updated);
    return { ok: true, item: this.formatClaim(updated) };
  }

  private async activeCampaigns() {
    const settings = await this.prisma.siteSetting.findUnique({ where: { key: 'features.promotion_campaigns' } });
    const campaigns = this.normalizeCampaigns(settings?.valueJson);
    const now = Date.now();
    return campaigns.filter((item) => item.enabled && this.inWindow(item, now));
  }

  private normalizeCampaigns(value: unknown): PromotionCampaign[] {
    if (!Array.isArray(value)) return [];
    return value.map((item: any, index) => ({ id: String(item.id ?? `promotion-${index + 1}`), title: String(item.title ?? 'Promotion'), description: String(item.description ?? ''), enabled: item.enabled === true, bonusType: item.bonusType === 'fixed' ? 'fixed' : 'percent', bonusValue: Number(item.bonusValue ?? 0), minDeposit: Number(item.minDeposit ?? 0), maxBonus: Number(item.maxBonus ?? 0), turnoverMultiplier: Number(item.turnoverMultiplier ?? 0), claimMode: item.claimMode === 'auto_pending' ? 'auto_pending' : 'manual_review', startsAt: typeof item.startsAt === 'string' ? item.startsAt : undefined, endsAt: typeof item.endsAt === 'string' ? item.endsAt : undefined }));
  }

  private inWindow(item: PromotionCampaign, now: number) { const start = item.startsAt ? Date.parse(item.startsAt) : NaN; const end = item.endsAt ? Date.parse(item.endsAt) : NaN; if (Number.isFinite(start) && now < start) return false; if (Number.isFinite(end) && now > end) return false; return true; }
  private bonusPreview(campaign: PromotionCampaign, depositAmount: number) { const base = Number(depositAmount || campaign.minDeposit || 0); const raw = campaign.bonusType === 'fixed' ? campaign.bonusValue : base * (campaign.bonusValue / 100); const capped = campaign.maxBonus > 0 ? Math.min(raw, campaign.maxBonus) : raw; return { estimatedBonus: Math.max(capped, 0), turnoverRequired: Math.max(capped, 0) * Math.max(campaign.turnoverMultiplier, 0) }; }
  private claimMetadata(value: unknown) { const data = value && typeof value === 'object' && !Array.isArray(value) ? value as any : {}; return { campaign: data.campaign ?? null, campaignId: String(data.campaignId ?? ''), topupId: data.topupId ?? null, memberNote: data.memberNote ?? '', adminNote: data.adminNote ?? '', reviewResult: data.reviewResult ?? null, settlement: data.settlement ?? { enabled: false }, events: Array.isArray(data.events) ? data.events : [] }; }
  private formatClaim(item: any) { const metadata = this.claimMetadata(item.metadata); return { id: item.id, campaignId: metadata.campaignId || item.refId, campaign: metadata.campaign, status: claimStatusLabel(item.status), rawStatus: item.status, memberNote: metadata.memberNote, adminNote: metadata.adminNote, settlement: metadata.settlement, events: metadata.events, member: item.member ?? undefined, createdAt: item.createdAt, updatedAt: item.updatedAt, resolvedAt: item.resolvedAt }; }
  private async memberMap(memberIds: string[]) { const uniqueIds = Array.from(new Set(memberIds)); if (!uniqueIds.length) return new Map<string, any>(); const users = await this.prisma.user.findMany({ where: { id: { in: uniqueIds } }, select: { id: true, username: true, phone: true, email: true, status: true } }); return new Map(users.map((user) => [user.id, user])); }
  private cleanText(value: unknown) { return typeof value === 'string' ? value.trim() : ''; }
  private requireText(value: unknown, label: string) { const text = this.cleanText(value); if (!text) throw new BadRequestException(`${label} is required`); return text; }
  private safeJson(value: unknown) { return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue; }
  private audit(adminUserId: string, action: string, targetId: string, oldData: unknown, newData: unknown) { return this.prisma.adminAuditLog.create({ data: { adminUserId, module: 'promotions', action, targetId, oldData: this.safeJson(oldData ?? null), newData: this.safeJson(newData ?? null) } }).catch(() => null); }
}

function claimStatusLabel(status: string) { const map: Record<string, string> = { OPEN: 'PENDING', REVIEWING: 'REVIEWING', RESOLVED: 'APPROVED', DISMISSED: 'REJECTED' }; return map[status] ?? status; }
