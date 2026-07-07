'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

type MemberDetail = {
  user: { id: string; shortId: string; username: string; phone?: string | null; email?: string | null; status: string; createdAt: string; lastLoginAt?: string | null };
  wallet: { currency: string; balance: string; lockedBalance: string; availableBalance: string; status: string; updatedAt: string } | null;
  topUps: MoneyItem[];
  withdrawals: MoneyItem[];
  ledgers: { id: string; type: string; direction: string; amount: string; balanceBefore: string; balanceAfter: string; referenceType?: string | null; referenceId?: string | null; createdAt: string }[];
  activity: { id: string; action: string; module: string; targetId?: string | null; createdAt: string; adminUser?: { username: string; email: string } | null }[];
};
type MoneyItem = { id: string; amount: string; currency: string; status: string; method?: string | null; createdAt: string; adminNote?: string | null };

export default function MemberDetailPage() {
  const initialId = useMemo(() => (typeof window === 'undefined' ? '' : new URLSearchParams(window.location.search).get('id') ?? ''), []);
  const [memberId, setMemberId] = useState(initialId);
  const [detail, setDetail] = useState<MemberDetail | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => { if (initialId) loadDetail(initialId); }, [initialId]);

  async function loadDetail(nextId = memberId) {
    const id = nextId.trim();
    if (!id) { setMessage('ใส่ member ID ก่อน'); return; }
    const token = window.localStorage.getItem('admin_access_token');
    if (!token) { setMessage('กรุณา login admin ก่อน'); return; }
    setMessage('กำลังโหลด member detail...');
    const res = await fetch(`${API_URL}/admin/members/${id}`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json().catch(() => null);
    if (!res.ok) { setMessage(data?.message ?? 'โหลด member ไม่สำเร็จ'); return; }
    setDetail(data); setMessage('');
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) { event.preventDefault(); loadDetail(); }

  return (
    <main style={pageStyle}>
      <a href="/wallets" style={backStyle}>← Wallets</a>
      <p style={eyebrowStyle}>Member Detail</p>
      <div style={headerRowStyle}><div><h1 style={titleStyle}>{detail?.user.username ?? 'Member'}</h1><p style={mutedStyle}>{detail?.user.id ?? 'ค้นหา member ด้วย full ID'}</p></div><button type="button" onClick={() => loadDetail()} style={buttonStyle}>Refresh</button></div>
      <form onSubmit={submitSearch} style={toolbarStyle}><input value={memberId} onChange={(event) => setMemberId(event.target.value)} placeholder="full member ID" style={inputStyle} /><button type="submit" style={buttonStyle}>Load Member</button></form>
      {message && <div style={noticeStyle}>{message}</div>}
      {detail && <section style={metricGridStyle}><Metric title="Status" value={detail.user.status} /><Metric title="Available" value={detail.wallet ? money(detail.wallet.availableBalance) : '-'} /><Metric title="Balance" value={detail.wallet ? money(detail.wallet.balance) : '-'} /><Metric title="Locked" value={detail.wallet ? money(detail.wallet.lockedBalance) : '-'} /></section>}
      {detail && <section style={cardStyle}><h2 style={sectionTitleStyle}>Profile</h2><div style={rowStyle}><div><strong>{detail.user.username}</strong><p style={mutedStyle}>Short ID: {detail.user.shortId}</p><p style={mutedStyle}>Phone: {detail.user.phone ?? '-'}</p><p style={mutedStyle}>Email: {detail.user.email ?? '-'}</p></div><div style={{ textAlign: 'right' }}><p style={mutedStyle}>Created: {new Date(detail.user.createdAt).toLocaleString('th-TH')}</p><p style={mutedStyle}>Last login: {detail.user.lastLoginAt ? new Date(detail.user.lastLoginAt).toLocaleString('th-TH') : '-'}</p></div></div></section>}
      {detail && <section style={twoColStyle}><MoneyCard title="Top-ups" items={detail.topUps} /><MoneyCard title="Withdrawals" items={detail.withdrawals} /></section>}
      {detail && <section style={cardStyle}><div style={sectionHeadStyle}><h2 style={sectionTitleStyle}>Ledgers</h2><a href={`/ledgers?identifier=${detail.user.id}`} style={linkStyle}>เปิด Ledger</a></div><div style={{ display: 'grid', gap: 10 }}>{detail.ledgers.slice(0, 20).map((item) => <div key={item.id} style={rowStyle}><div><strong>{item.type} / {item.direction}</strong><p style={mutedStyle}>{item.referenceType ?? '-'} · {item.referenceId ?? '-'}</p></div><div style={{ textAlign: 'right' }}><strong>{money(item.amount)}</strong><p style={mutedStyle}>{money(item.balanceBefore)} → {money(item.balanceAfter)}</p></div></div>)}</div></section>}
      {detail && <section style={cardStyle}><h2 style={sectionTitleStyle}>Admin Activity</h2><div style={{ display: 'grid', gap: 10 }}>{detail.activity.map((item) => <div key={item.id} style={rowStyle}><div><strong>{item.module} / {item.action}</strong><p style={mutedStyle}>By: {item.adminUser?.username ?? item.adminUser?.email ?? '-'}</p></div><p style={mutedStyle}>{new Date(item.createdAt).toLocaleString('th-TH')}</p></div>)}{detail.activity.length === 0 && <p style={mutedStyle}>ยังไม่มี activity ที่ผูกกับ member นี้</p>}</div></section>}
    </main>
  );
}

function Metric({ title, value }: { title: string; value: string }) { return <section style={metricStyle}><p style={mutedStyle}>{title}</p><h2 style={{ margin: 0 }}>{value}</h2></section>; }
function MoneyCard({ title, items }: { title: string; items: MoneyItem[] }) { return <section style={cardStyle}><h2 style={sectionTitleStyle}>{title}</h2><div style={{ display: 'grid', gap: 10 }}>{items.map((item) => <div key={item.id} style={rowStyle}><div><strong>{item.status}</strong><p style={mutedStyle}>{item.method ?? '-'} · {new Date(item.createdAt).toLocaleString('th-TH')}</p>{item.adminNote && <p style={mutedStyle}>Admin note: {item.adminNote}</p>}</div><strong>{money(item.amount)}</strong></div>)}{items.length === 0 && <p style={mutedStyle}>ยังไม่มีรายการ</p>}</div></section>; }
function money(value: string) { return `THB ${Number(value).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`; }

const pageStyle = { maxWidth: 1180, margin: '0 auto', padding: '22px 16px 44px', color: '#fff' } as const;
const backStyle = { color: '#f5c542', textDecoration: 'none', fontWeight: 900 } as const;
const eyebrowStyle = { margin: '18px 0 0', opacity: 0.66, fontSize: 14 } as const;
const titleStyle = { margin: '6px 0 8px', fontSize: 'clamp(40px, 10vw, 72px)', lineHeight: 0.94, letterSpacing: -1.5 } as const;
const mutedStyle = { margin: 0, opacity: 0.76, lineHeight: 1.55 } as const;
const headerRowStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 14, flexWrap: 'wrap' } as const;
const toolbarStyle = { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 10, border: '1px solid rgba(255,255,255,0.14)', borderRadius: 24, padding: 16, margin: '18px 0', background: '#181818' } as const;
const inputStyle = { display: 'block', width: '100%', minWidth: 0, padding: '13px 14px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.16)', background: '#242424', color: '#fff', boxSizing: 'border-box' } as const;
const buttonStyle = { padding: '13px 14px', borderRadius: 14, cursor: 'pointer', background: '#f5c542', color: '#111', border: 0, fontWeight: 900 } as const;
const noticeStyle = { border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16, padding: 12, background: 'rgba(255,255,255,0.07)', margin: '16px 0' } as const;
const metricGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12, margin: '18px 0' } as const;
const twoColStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 12 } as const;
const metricStyle = { border: '1px solid rgba(255,255,255,0.12)', borderRadius: 22, padding: 16, background: '#181818' } as const;
const cardStyle = { border: '1px solid rgba(255,255,255,0.12)', borderRadius: 24, padding: 16, background: '#181818', marginBottom: 14 } as const;
const sectionHeadStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 12 } as const;
const sectionTitleStyle = { margin: '0 0 12px', fontSize: 24 } as const;
const rowStyle = { display: 'flex', justifyContent: 'space-between', gap: 12, border: '1px solid rgba(255,255,255,0.10)', borderRadius: 18, padding: 12, flexWrap: 'wrap', background: 'rgba(255,255,255,0.04)' } as const;
const linkStyle = { color: '#f5c542', textDecoration: 'none', fontWeight: 900 } as const;
