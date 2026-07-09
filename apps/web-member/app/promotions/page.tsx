'use client';

import { useEffect, useState } from 'react';
import MemberBottomNav from '../member-bottom-nav';
import { loadPublicSiteSettings, promotionCampaignsSetting, PromotionCampaign, defaultSettings } from '../site-settings';

export default function MemberPromotionsPage() {
  const [campaigns, setCampaigns] = useState<PromotionCampaign[]>([]);
  const [message, setMessage] = useState('กำลังโหลดโปรโมชัน...');
  useEffect(() => { loadPublicSiteSettings().then((settings) => { setCampaigns(promotionCampaignsSetting(settings).filter((item) => item.enabled && isInWindow(item))); setMessage(''); }).catch(() => { setCampaigns(promotionCampaignsSetting(defaultSettings).filter((item) => item.enabled)); setMessage('โหลดโปรโมชันไม่สำเร็จ'); }); }, []);
  return <main style={pageStyle}><section style={heroStyle}><span style={eyebrowStyle}>Promotion</span><h1 style={titleStyle}>โปรโมชัน</h1><p style={mutedStyle}>ดูเงื่อนไขโบนัสที่เปิดอยู่ ก่อนกดรับจริงจะต้องผ่านการตรวจสอบของแอดมิน</p></section>{message && <div style={noticeStyle}>{message}</div>}<section style={listStyle}>{campaigns.map((item) => <article key={item.id} style={cardStyle}><div style={rowStyle}><span style={badgeStyle}>{item.bonusType === 'percent' ? `${item.bonusValue}%` : money(item.bonusValue)}</span><span style={mutedStyle}>{item.claimMode === 'manual_review' ? 'แอดมินตรวจ' : 'รอตรวจอัตโนมัติ'}</span></div><h2>{item.title}</h2><p style={mutedStyle}>{item.description}</p><div style={conditionGridStyle}><Condition label="ฝากขั้นต่ำ" value={money(item.minDeposit)} /><Condition label="โบนัสสูงสุด" value={money(item.maxBonus)} /><Condition label="เทิร์น" value={`x${item.turnoverMultiplier}`} /></div><a href="/deposit" style={buttonStyle}>ฝากเพื่อรับโปร</a><small style={mutedStyle}>ตอนนี้ยังไม่เพิ่มโบนัสอัตโนมัติ รายการจะต้องผ่านขั้นตอนตรวจสอบตามที่ระบบกำหนด</small></article>)}{campaigns.length === 0 && <div style={emptyStyle}>ยังไม่มีโปรโมชันที่เปิดใช้งาน</div>}</section><MemberBottomNav /></main>;
}
function Condition({ label, value }: { label: string; value: string }) { return <div style={conditionStyle}><span>{label}</span><strong>{value}</strong></div>; }
function isInWindow(item: PromotionCampaign) { const now = Date.now(); const start = item.startsAt ? Date.parse(item.startsAt) : NaN; const end = item.endsAt ? Date.parse(item.endsAt) : NaN; if (Number.isFinite(start) && now < start) return false; if (Number.isFinite(end) && now > end) return false; return true; }
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
const buttonStyle = { minHeight: 44, borderRadius: 14, padding: '0 14px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#f5c542', color: '#111827', fontWeight: 950, textDecoration: 'none' } as const;
const emptyStyle = { padding: 18, borderRadius: 18, background: 'rgba(15,23,42,.72)', color: '#94a3b8', textAlign: 'center' as const };
