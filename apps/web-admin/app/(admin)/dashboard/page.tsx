'use client';

import { useEffect, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

type FinanceSummary = {
  totals: { walletCount: number; totalBalance: string; totalLockedBalance: string; totalAvailableBalance: string; pendingTopUps: number; pendingWithdrawals: number };
  queues: { topUps: QueueItem[]; withdrawals: QueueItem[] };
  recentLedgers: { id: string; type: string; direction: string; amount: string; createdAt: string; user?: { username?: string | null; shortId?: string | null } | null }[];
  generatedAt: string;
};
type QueueItem = { id: string; shortUserId: string; amount: string; currency: string; status: string; method?: string | null; createdAt: string; user?: { username?: string | null; shortId?: string | null } | null };
type RiskSummary = { counts: { high: number; medium: number; low: number; total: number }; alerts: RiskAlert[]; checkedWallets: number; generatedAt: string };
type RiskAlert = { type: string; severity: string; message: string; userId?: string; username?: string | null; targetId?: string; amount?: string; walletId?: string; createdAt?: string };

export default function OperationDashboardPage() {
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [risk, setRisk] = useState<RiskSummary | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => { loadSummary(); }, []);

  async function loadSummary() {
    const token = window.localStorage.getItem('admin_access_token');
    if (!token) { setMessage('กรุณา login admin ก่อน'); return; }
    setMessage('กำลังโหลด Operation Center...');
    const [financeRes, riskRes] = await Promise.all([
      fetch(`${API_URL}/admin/finance/summary`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${API_URL}/admin/risk/summary`, { headers: { Authorization: `Bearer ${token}` } }),
    ]);
    const financeData = await financeRes.json().catch(() => null);
    const riskData = await riskRes.json().catch(() => null);
    if (!financeRes.ok) { setMessage(financeData?.message ?? 'โหลด dashboard ไม่สำเร็จ'); return; }
    setSummary(financeData);
    if (riskRes.ok) setRisk(riskData);
    setMessage('');
  }

  return (
    <main style={pageStyle}>
      <p style={eyebrowStyle}>Operation Center</p>
      <div style={headerRowStyle}><div><h1 style={titleStyle}>Dashboard</h1><p style={mutedStyle}>ศูนย์รวมคิวการเงิน ยอด wallet ความเสี่ยง และรายการล่าสุด</p></div><button type="button" onClick={loadSummary} style={buttonStyle}>Refresh</button></div>
      {message && <div style={noticeStyle}>{message}</div>}
      {summary && <section style={metricGridStyle}><Metric title="Wallets" value={summary.totals.walletCount.toLocaleString('th-TH')} /><Metric title="Available" value={money(summary.totals.totalAvailableBalance)} /><Metric title="Locked" value={money(summary.totals.totalLockedBalance)} /><Metric title="Pending" value={`${summary.totals.pendingTopUps + summary.totals.pendingWithdrawals}`} />{risk && <Metric title="Risk Alerts" value={`${risk.counts.total}`} />}</section>}
      {risk && <section style={cardStyle}><div style={sectionHeadStyle}><div><h2 style={sectionTitleStyle}>Risk Alerts</h2><p style={mutedStyle}>High {risk.counts.high} · Medium {risk.counts.medium} · Low {risk.counts.low}</p></div><a href="/reports" style={linkStyle}>ดู Reports</a></div><div style={{ display: 'grid', gap: 10 }}>{risk.alerts.slice(0, 8).map((item, index) => <div key={`${item.type}-${item.userId ?? item.targetId ?? index}`} style={rowStyle}><div><strong>{item.severity} · {item.type}</strong><p style={mutedStyle}>{item.message}</p><p style={mutedStyle}>{item.username ?? item.userId ?? item.targetId ?? '-'}</p></div>{item.userId && <a href={`/members/${item.userId}`} style={linkStyle}>Member</a>}</div>)}{risk.alerts.length === 0 && <p style={mutedStyle}>ยังไม่พบ alert สำคัญ</p>}</div></section>}
      {summary && <section style={queueGridStyle}><QueueCard title="Top-up Queue" href="/topups" count={summary.totals.pendingTopUps} items={summary.queues.topUps} /><QueueCard title="Withdrawal Queue" href="/withdrawals" count={summary.totals.pendingWithdrawals} items={summary.queues.withdrawals} /></section>}
      {summary && <section style={cardStyle}><div style={sectionHeadStyle}><h2 style={sectionTitleStyle}>Recent Ledger</h2><a href="/ledgers" style={linkStyle}>ดูทั้งหมด</a></div><div style={{ display: 'grid', gap: 10 }}>{summary.recentLedgers.map((item) => <div key={item.id} style={rowStyle}><div><strong>{item.type} / {item.direction}</strong><p style={mutedStyle}>{item.user?.username ?? item.user?.shortId ?? '-'}</p></div><div style={{ textAlign: 'right' }}><strong>{money(item.amount)}</strong><p style={mutedStyle}>{new Date(item.createdAt).toLocaleString('th-TH')}</p></div></div>)}</div></section>}
    </main>
  );
}

function Metric({ title, value }: { title: string; value: string }) { return <section style={metricStyle}><p style={mutedStyle}>{title}</p><h2 style={{ margin: 0 }}>{value}</h2></section>; }
function QueueCard({ title, href, count, items }: { title: string; href: string; count: number; items: QueueItem[] }) { return <section style={cardStyle}><div style={sectionHeadStyle}><div><h2 style={sectionTitleStyle}>{title}</h2><p style={mutedStyle}>{count} pending</p></div><a href={href} style={linkStyle}>เปิดคิว</a></div><div style={{ display: 'grid', gap: 10 }}>{items.slice(0, 5).map((item) => <div key={item.id} style={rowStyle}><div><strong>{item.user?.username ?? item.shortUserId}</strong><p style={mutedStyle}>{item.method ?? '-'} · {new Date(item.createdAt).toLocaleString('th-TH')}</p></div><strong>{money(item.amount)}</strong></div>)}{items.length === 0 && <p style={mutedStyle}>ไม่มีรายการรอตรวจ</p>}</div></section>; }
function money(value: string) { return `THB ${Number(value).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`; }

const pageStyle = { maxWidth: 1180, margin: '0 auto', padding: '22px 16px 44px', color: '#fff' } as const;
const eyebrowStyle = { margin: '18px 0 0', opacity: 0.66, fontSize: 14 } as const;
const titleStyle = { margin: '6px 0 8px', fontSize: 'clamp(40px, 10vw, 72px)', lineHeight: 0.94, letterSpacing: -1.5 } as const;
const mutedStyle = { margin: 0, opacity: 0.76, lineHeight: 1.55 } as const;
const headerRowStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 14, flexWrap: 'wrap' } as const;
const buttonStyle = { padding: '13px 14px', borderRadius: 14, cursor: 'pointer', background: '#f5c542', color: '#111', border: 0, fontWeight: 900 } as const;
const noticeStyle = { border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16, padding: 12, background: 'rgba(255,255,255,0.07)', margin: '16px 0' } as const;
const metricGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12, margin: '18px 0' } as const;
const queueGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 12 } as const;
const metricStyle = { border: '1px solid rgba(255,255,255,0.12)', borderRadius: 22, padding: 16, background: '#181818' } as const;
const cardStyle = { border: '1px solid rgba(255,255,255,0.12)', borderRadius: 24, padding: 16, background: '#181818', marginBottom: 14 } as const;
const sectionHeadStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 12 } as const;
const sectionTitleStyle = { margin: 0, fontSize: 24 } as const;
const rowStyle = { display: 'flex', justifyContent: 'space-between', gap: 12, border: '1px solid rgba(255,255,255,0.10)', borderRadius: 18, padding: 12, flexWrap: 'wrap', background: 'rgba(255,255,255,0.04)' } as const;
const linkStyle = { color: '#f5c542', textDecoration: 'none', fontWeight: 900 } as const;
