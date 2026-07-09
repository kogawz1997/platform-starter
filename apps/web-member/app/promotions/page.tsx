'use client';

import { useEffect, useMemo, useState } from 'react';
import MemberBottomNav from '../member-bottom-nav';
import { loadPublicSiteSettings, promotionCampaignsSetting, PromotionCampaign, defaultSettings } from '../site-settings';
import { memberApiFetch } from '../member-api';

type Claim = { id: string; campaignId: string; topupId?: string | null; linkedTopup?: Topup | null; depositAmount?: number; status: string; rawStatus: string; adminNote?: string; createdAt: string };
type Topup = { id: string; amount: string | number; currency: string; status: string; method?: string | null; referenceCode?: string | null; createdAt: string; reviewedAt?: string | null };

export default function MemberPromotionsPage() {
  const [campaigns, setCampaigns] = useState<PromotionCampaign[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [topups, setTopups] = useState<Topup[]>([]);
  const [selectedTopups, setSelectedTopups] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('กำลังโหลดโปรโมชัน...');
  const [busyId, setBusyId] = useState('');
  useEffect(() => { load(); }, []);
  const claimMap = useMemo(() => new Map(claims.map((item) => [item.campaignId, item])), [claims]);
  const approvedTopups = useMemo(() => topups.filter((item) => item.status === 'APPROVED'), [topups]);
  async function load() { try { const settings = await loadPublicSiteSettings(); setCampaigns(promotionCampaignsSetting(settings).filter((item) => item.enabled && isInWindow(item))); const [claimRes, topupRes] = await Promise.all([memberApiFetch('/member/promotion-claims'), memberApiFetch('/member/topups')]); const claimData = await claimRes.json().catch(() => null); const topupData = await topupRes.json().catch(() => null); if (claimRes.ok) setClaims(claimData.items ?? []); if (topupRes.ok) setTopups(topupData.items ?? []); setMessage(''); } catch { setCampaigns(promotionCampaignsSetting(defaultSettings).filter((item) => item.enabled)); setMessage('โหลดโปรโมชันไม่สำเร็จ'); } }
  async function claimPromotion(item: PromotionCampaign) { const topupId = selectedTopups[item.id] ?? eligibleTopups(item, approvedTopups, claims)[0]?.id; if (!topupId) { setMessage('กรุณาเลือกรายการฝากที่อนุมัติแล้วและมียอดถึงขั้นต่ำก่อนรับโปร'); return; } setBusyId(item.id); const topup = approvedTopups.find((entry) => entry.id === topupId); const res = await memberApiFetch('/member/promotion-claims', { method: 'POST', body: JSON.stringify({ campaignId: item.id, topupId, depositAmount: Number(topup?.amount ?? 0), note: `ขอรับโปร ${item.title}` }) }); const data = await res.json().catch(() => null); setBusyId(''); if (!res.ok) { setMessage(data?.message ?? 'ส่งคำขอรับโปรไม่สำเร็จ'); return; } setClaims((current) => [data.item, ...current.filter((claim) => claim.campaignId !== item.id)]); setMessage('ส่งคำขอรับโปรแล้ว รอแอดมินตรวจสอบ'); }
  return <main style={pageStyle}><section style={heroStyle}><span style={eyebrowStyle}>Promotion</span><h1 style={titleStyle}>โปรโมชัน</h1><p style={mutedStyle}>เลือกฝากที่อนุมัติแล้วเพื่อรับโปร ระบบจะคำนวณโบนัสจากยอดฝากจริง</p></section>{message && <div style={noticeStyle}>{message}</div>}<section style={listStyle}>{campaigns.map((item) => { const claim = claimMap.get(item.id); const options = eligibleTopups(item, approvedTopups, claims); return <article key={item.id} style={cardStyle}><div style={rowStyle}><span style={badgeStyle}>{item.bonusType === 'percent' ? `${item.bonusValue}%` : money(item.bonusValue)}</span><span style={mutedStyle}>{item.claimMode === 'manual_review' ? 'แอดมินตรวจ' : 'รอตรวจอัตโนมัติ'}</span></div><h2>{item.title}</h2><p style={mutedStyle}>{item.description}</p><div style={conditionGridStyle}><Condition label="ฝากขั้นต่ำ" value={money(item.minDeposit)} /><Condition label="โบนัสสูงสุด" value={money(item.maxBonus)} /><Condition label="เทิร์น" value={`x${item.turnoverMultiplier}`} /></div>{claim ? <div style={claimBoxStyle}><strong>สถานะ: {claimStatusLabel(claim.status)}</strong><span>{new Date(claim.createdAt).toLocaleString('th-TH')}</span>{claim.linkedTopup && <span>ฝากที่ใช้: {money(Number(claim.linkedTopup.amount))}</span>}{claim.adminNote && <span>{claim.adminNote}</span>}</div> : <><label style={fieldStyle}><span>เลือกรายการฝาก</span><select value={selectedTopups[item.id] ?? options[0]?.id ?? ''} onChange={(event) => setSelectedTopups((current) => ({ ...current, [item.id]: event.target.value }))} style={selectStyle}><option value="">เลือกรายการฝากที่อนุมัติแล้ว</option>{options.map((topup) => <option key={topup.id} value={topup.id}>{money(Number(topup.amount))} · {new Date(topup.createdAt).toLocaleString('th-TH')}</option>)}</select></label><button type="button" disabled={busyId === item.id || options.length === 0} onClick={() => claimPromotion(item)} style={buttonStyle}>{busyId === item.id ? 'กำลังส่ง...' : 'รับโปรนี้'}</button></>}<a href="/deposit" style={secondaryButtonStyle}>ฝาก</a><small style={mutedStyle}>หนึ่งรายการฝากใช้รับโปรได้ครั้งเดียว และต้องผ่านการตรวจสอบก่อนสร้าง bonus ledger</small></article>; })}{campaigns.length === 0 && <div style={emptyStyle}>ยังไม่มีโปรโมชันที่เปิดใช้งาน</div>}</section><MemberBottomNav /></main>;
}
function Condition({ label, value }: { label: string; value: string }) { return <div style={conditionStyle}><span>{label}</span><strong>{value}</strong></div>; }
function eligibleTopups(campaign: PromotionCampaign, topups: Topup[], claims: Claim[]) { const usedTopupIds = new Set(claims.map((claim) => claim.topupId).filter(Boolean)); return topups.filter((topup) => !usedTopupIds.has(topup.id) && Number(topup.amount) >= campaign.minDeposit); }
function isInWindow(item: PromotionCampaign) { const now = Date.now(); const start = item.startsAt ? Date.parse(item.startsAt) : NaN; const end = item.endsAt ? Date.parse(item.endsAt) : NaN; if (Number.isFinite(start) && now < start) return false; if (Number.isFinite(end) && now > end) return false; return true; }
function claimStatusLabel(status: string) { const map: Record<string, string> = { PENDING: 'รอตรวจ', REVIEWING: 'กำลังตรวจ', APPROVED: 'อนุมัติแล้ว', REJECTED: 'ไม่อนุมัติ' }; return map[status] ?? status; }
function money(value: number) { return `THB ${Number(value || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`; }
const pageStyle = { minHeight: '100dvh', background: 'linear-gradient(180deg,#080808,#111827)', color: '#fff', padding: '88px 16px 104px', display: 'grid', gap: 16 } as const;
const heroStyle = { border: '1px solid rgba(245,197,66,.22)', borderRadius: 26, padding: 18, background: 'radial-gradient(circle at top left, rgba(245,197,66,.22), transparent 34%), rgba(245,197,66,.08)', display: 'grid', gap: 8 } as const;
const eyebrowStyle = { color: '#facc15', fontWeight: 900, letterSpacing: '.08em', textTransform: 'uppercase' as const, fontSize: 12 };
const titleStyle = { margin: 0, fontSize: 34, lineHeight: 1.05 } as const;
const mutedStyle = { margin: 0, color: '#cbd5e1', lineHeight: 1.55 } as const;
const noticeStyle = { padding: 14, borderRadius: 18, background: 'rgba(15,23,42,.78)', border: '1px solid rgba(148,163,184,.18)' } as const;
const listStyle = { display: 'grid', gap: 12 } as const;
const cardStyle = { border: '1px solid rgba(245,197,66,.22)', borderRadius: 22, padding: 16, background: 'rgba(15,23,42,.82)', display: 'grid', gap: 12, minWidth: 0 } as const;
const rowStyle = { display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' as const };
const badgeStyle = { borderRadius: 999, padding: '7px 11px', background: 'rgba(245,197,66,.16)', color: '#fde68a', fontWeight: 950, fontSize: 13 } as const;
const conditionGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 } as const;
const conditionStyle = { border: '1px solid rgba(255,255,255,.10)', borderRadius: 14, padding: 10, background: 'rgba(255,255,255,.04)', display: 'grid', gap: 4, minWidth: 0 } as const;
const fieldStyle = { display: 'grid', gap: 6, fontWeight: 850 } as const;
const selectStyle = { minHeight: 44, borderRadius: 14, border: '1px solid rgba(255,255,255,.14)', background: '#0b1220', color: '#fff', padding: '0 12px', minWidth: 0 } as const;
const buttonStyle = { minHeight: 44, borderRadius: 14, padding: '0 14px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#f5c542', color: '#111827', fontWeight: 950, textDecoration: 'none', border: 0 } as const;
const secondaryButtonStyle = { ...buttonStyle, background: 'rgba(255,255,255,.08)', color: '#fff', border: '1px solid rgba(255,255,255,.14)' } as const;
const claimBoxStyle = { border: '1px solid rgba(245,197,66,.22)', borderRadius: 14, padding: 12, background: 'rgba(245,197,66,.08)', display: 'grid', gap: 4 } as const;
const emptyStyle = { padding: 18, borderRadius: 18, background: 'rgba(15,23,42,.72)', color: '#94a3b8', textAlign: 'center' as const };
