import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, RiskAlertStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

type Actor = { id: string };
type CreateProfileInput = { displayName?: string; referralCode?: string };
type LinkReferralInput = { referralCode?: string };

const AFFILIATE_PROFILE_REF_TYPE = 'AFFILIATE_PROFILE';
const AFFILIATE_LINK_REF_TYPE = 'AFFILIATE_LINK';
const AFFILIATE_STATUSES = ['OPEN', 'REVIEWING', 'RESOLVED', 'DISMISSED'] as const;

@Injectable()
export class AffiliatesService {
  constructor(private readonly prisma: PrismaService) {}

  async getMemberProfile(user: Actor) {
    const profile = await this.findProfileByMember(user.id);
    const links = profile ? await this.downlinesForProfile(profile.referralCode) : [];
    return { profile, downlines: links };
  }

  async createOrUpdateMemberProfile(user: Actor, input: CreateProfileInput) {
    const existing = await this.prisma.riskAlert.findFirst({ where: { refType: AFFILIATE_PROFILE_REF_TYPE, memberId: user.id } });
    const referralCode = this.normalizeCode(input.referralCode || existing?.refId || this.codeFromUserId(user.id));
    const used = await this.prisma.riskAlert.findFirst({ where: { refType: AFFILIATE_PROFILE_REF_TYPE, refId: referralCode, memberId: { not: user.id } } });
    if (used) throw new BadRequestException('Referral code นี้ถูกใช้แล้ว');
    const metadata = { referralCode, displayName: this.cleanText(input.displayName) || `Agent ${referralCode}`, commissionRate: 0, payoutEnabled: false, payoutStatus: 'COMMISSION_LEDGER_NOT_ENABLED', events: [{ by: 'member', action: existing ? 'AFFILIATE_PROFILE_UPDATED' : 'AFFILIATE_PROFILE_CREATED', createdAt: new Date().toISOString() }] };
    const item = existing ? await this.prisma.riskAlert.update({ where: { id: existing.id }, data: { refId: referralCode, title: `Affiliate: ${metadata.displayName}`, metadata: this.safeJson(metadata) } }) : await this.prisma.riskAlert.create({ data: { type: 'WALLET_LEDGER_MISMATCH', severity: 'LOW', status: 'OPEN', memberId: user.id, refType: AFFILIATE_PROFILE_REF_TYPE, refId: referralCode, title: `Affiliate: ${metadata.displayName}`, description: 'Affiliate profile pending admin review', metadata: this.safeJson(metadata) } });
    return { ok: true, profile: await this.formatProfile(item) };
  }

  async linkMemberReferral(user: Actor, input: LinkReferralInput) {
    const referralCode = this.normalizeCode(input.referralCode);
    if (!referralCode) throw new BadRequestException('referralCode is required');
    const agent = await this.prisma.riskAlert.findFirst({ where: { refType: AFFILIATE_PROFILE_REF_TYPE, refId: referralCode } });
    if (!agent) throw new NotFoundException('Referral code not found');
    if (agent.memberId === user.id) throw new BadRequestException('ไม่สามารถใช้ referral code ของตัวเองได้');
    const existing = await this.prisma.riskAlert.findFirst({ where: { refType: AFFILIATE_LINK_REF_TYPE, memberId: user.id } });
    if (existing) throw new BadRequestException('บัญชีนี้ผูก referral แล้ว');
    const metadata = { referralCode, agentMemberId: agent.memberId, linkedAt: new Date().toISOString(), commissionEnabled: false, commissionStatus: 'COMMISSION_LEDGER_NOT_ENABLED', events: [{ by: 'member', action: 'REFERRAL_LINKED', referralCode, createdAt: new Date().toISOString() }] };
    const item = await this.prisma.riskAlert.create({ data: { type: 'WALLET_LEDGER_MISMATCH', severity: 'LOW', status: 'RESOLVED', memberId: user.id, refType: AFFILIATE_LINK_REF_TYPE, refId: referralCode, title: `Referral linked: ${referralCode}`, description: 'Member linked to affiliate agent', metadata: this.safeJson(metadata), resolvedAt: new Date() } });
    return { ok: true, link: await this.formatLink(item) };
  }

  async listAdminProfiles(query: { status?: string }) {
    const where: Prisma.RiskAlertWhereInput = { refType: AFFILIATE_PROFILE_REF_TYPE };
    if (query.status && query.status !== 'ALL' && AFFILIATE_STATUSES.includes(query.status as any)) where.status = query.status as RiskAlertStatus;
    const items = await this.prisma.riskAlert.findMany({ where, orderBy: { createdAt: 'desc' }, take: 100 });
    const profiles = await Promise.all(items.map((item) => this.formatProfile(item)));
    return { items: profiles, total: profiles.length };
  }

  async reviewProfile(admin: Actor, id: string, input: { status?: 'APPROVED' | 'REJECTED'; adminNote?: string }) {
    const item = await this.prisma.riskAlert.findFirst({ where: { id, refType: AFFILIATE_PROFILE_REF_TYPE } });
    if (!item) throw new NotFoundException('Affiliate profile not found');
    if (input.status === 'REJECTED' && !input.adminNote?.trim()) throw new BadRequestException('adminNote is required when rejecting affiliate profile');
    const metadata = this.profileMetadata(item.metadata);
    const nextStatus = input.status === 'APPROVED' ? 'RESOLVED' : input.status === 'REJECTED' ? 'DISMISSED' : 'REVIEWING';
    const events = [...metadata.events, { by: 'admin', adminUserId: admin.id, action: input.status ?? 'REVIEWING', message: input.adminNote ?? '', createdAt: new Date().toISOString() }];
    const updated = await this.prisma.riskAlert.update({ where: { id }, data: { status: nextStatus, resolvedAt: nextStatus === 'RESOLVED' || nextStatus === 'DISMISSED' ? new Date() : undefined, metadata: this.safeJson({ ...metadata, adminNote: input.adminNote ?? metadata.adminNote ?? '', events }) } });
    await this.audit(admin.id, 'affiliate.profile.review', id, item, updated);
    return { ok: true, profile: await this.formatProfile(updated) };
  }

  private async findProfileByMember(memberId: string) { const item = await this.prisma.riskAlert.findFirst({ where: { refType: AFFILIATE_PROFILE_REF_TYPE, memberId } }); return item ? this.formatProfile(item) : null; }
  private async downlinesForProfile(referralCode: string) { const links = await this.prisma.riskAlert.findMany({ where: { refType: AFFILIATE_LINK_REF_TYPE, refId: referralCode }, orderBy: { createdAt: 'desc' }, take: 100 }); return Promise.all(links.map((item) => this.formatLink(item))); }
  private async formatProfile(item: any) { const metadata = this.profileMetadata(item.metadata); const member = item.memberId ? await this.member(item.memberId) : null; const downlines = await this.downlinesForProfile(metadata.referralCode || item.refId); return { id: item.id, referralCode: metadata.referralCode || item.refId, displayName: metadata.displayName, commissionRate: metadata.commissionRate, payoutEnabled: metadata.payoutEnabled, payoutStatus: metadata.payoutStatus, status: affiliateStatusLabel(item.status), rawStatus: item.status, adminNote: metadata.adminNote, events: metadata.events, member, downlineCount: downlines.length, createdAt: item.createdAt, updatedAt: item.updatedAt, resolvedAt: item.resolvedAt }; }
  private async formatLink(item: any) { const metadata = this.linkMetadata(item.metadata); const member = item.memberId ? await this.member(item.memberId) : null; return { id: item.id, referralCode: metadata.referralCode || item.refId, agentMemberId: metadata.agentMemberId, member, commissionEnabled: metadata.commissionEnabled, commissionStatus: metadata.commissionStatus, events: metadata.events, createdAt: item.createdAt, resolvedAt: item.resolvedAt }; }
  private async member(id: string) { return this.prisma.user.findUnique({ where: { id }, select: { id: true, username: true, phone: true, email: true, status: true } }); }
  private profileMetadata(value: unknown) { const data = value && typeof value === 'object' && !Array.isArray(value) ? value as any : {}; return { referralCode: String(data.referralCode ?? ''), displayName: String(data.displayName ?? ''), commissionRate: Number(data.commissionRate ?? 0), payoutEnabled: data.payoutEnabled === true, payoutStatus: String(data.payoutStatus ?? 'COMMISSION_LEDGER_NOT_ENABLED'), adminNote: String(data.adminNote ?? ''), events: Array.isArray(data.events) ? data.events : [] }; }
  private linkMetadata(value: unknown) { const data = value && typeof value === 'object' && !Array.isArray(value) ? value as any : {}; return { referralCode: String(data.referralCode ?? ''), agentMemberId: String(data.agentMemberId ?? ''), commissionEnabled: data.commissionEnabled === true, commissionStatus: String(data.commissionStatus ?? 'COMMISSION_LEDGER_NOT_ENABLED'), events: Array.isArray(data.events) ? data.events : [] }; }
  private codeFromUserId(userId: string) { return `A${userId.replace(/-/g, '').slice(0, 8)}`; }
  private normalizeCode(value: unknown) { return String(value ?? '').trim().toUpperCase().replace(/[^A-Z0-9_-]+/g, '').slice(0, 24); }
  private cleanText(value: unknown) { return typeof value === 'string' ? value.trim() : ''; }
  private safeJson(value: unknown) { return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue; }
  private audit(adminUserId: string, action: string, targetId: string, oldData: unknown, newData: unknown) { return this.prisma.adminAuditLog.create({ data: { adminUserId, module: 'affiliates', action, targetId, oldData: this.safeJson(oldData ?? null), newData: this.safeJson(newData ?? null) } }).catch(() => null); }
}

function affiliateStatusLabel(status: string) { const map: Record<string, string> = { OPEN: 'PENDING', REVIEWING: 'REVIEWING', RESOLVED: 'APPROVED', DISMISSED: 'REJECTED' }; return map[status] ?? status; }
