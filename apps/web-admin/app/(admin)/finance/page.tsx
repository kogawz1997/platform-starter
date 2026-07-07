'use client';

import { useEffect, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

type Summary = {
  totals: { walletCount: number; totalBalance: string; totalLockedBalance: string; totalAvailableBalance: string; pendingTopUps: number; pendingWithdrawals: number };
  queues: { topUps: QueueItem[]; withdrawals: QueueItem[] };
  recentLedgers: LedgerItem[];
  generatedAt: string;
};

type QueueItem = { id: string; amount: string; currency: string; status: string; method?: string | null; createdAt: string; user?: { username: string; shortId?: string | null } | null };
type LedgerItem = { id: string; type: string; direction: string; amount: string; balanceBefore: string; balanceAfter: string; createdAt: string; user?: { username: string; shortId?: string | null } | null; createdByAdmin?: { username: string } | null };

export default function FinanceDashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => { loadSummary(); }, []);

  async function loadSummary() {
    const token = window.localStorage.getItem('admin_access_token');
    if (!token) { setMessage('กรุณา login admin ก่อน'); return; }
    setMessage('กำลังโหลด finance summary...');
    const res = await fetch(`${API_URL}/admin/finance/summary`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json().catch(() => null);
    if (!res.ok) { setMessage(data?.message ?? 'โหลด finance summary ไม่สำเร็จ'); return; }
    setSummary(data); setMessage('');
  }

  return (
    <main style={pageStyle}>
      <div style={headerRowStyle}>
        <div>
          <a href="/settings" style={backStyle}>← Settings</a>
          <p style={eyebrowStyle}>Operation Center</p>
          <h1 style={titleStyle}>Finance Summary</h1>
          <p style={mutedStyle}>ภาพรวมระบบเงิน คิวที่ต้องทำ และรายการล่าสุด</p>
        </div>
        <button type="button" onClick={loadSummary} style={refreshStyle}>Refresh</button>
      </div>

      {message && <div style={noticeStyle}>{message}</div>}

      {summary && (
        <>
          <section style={gridStyle}>
            <Metric title="Wallets" value={summary.totals.walletCount.toLocaleString('th-TH')} />
            <Metric title="Total Balance" value={money(summary.totals.totalBalance)} />
            <Metric title="Locked" value={money(summary.totals.totalLockedBalance)} />
            <Metric title="Available" value={money(summary.totals.totalAvailableBalance)} />
            <Metric title="Top-up Pending" value={summary.totals.pendingTopUps.toLocaleString('th-TH')} href="/topups" highlight />
            <Metric title="Withdrawal Pending" value={summary.totals.pendingWithdrawals.toLocaleString('th-TH')} href="/withdrawals" />
          </section>

          <section style={twoColStyle}>
            <QueueCard title="Top-up Queue" href="/topups" items={summary.queues.topUps} />
            <QueueCard title="Withdrawal Queue" href="/withdrawals" items={summary.queues.withdrawals} />
          </section>

          <section style={cardStyle}>
            <div style={sectionHeaderStyle}><h2 style={sectionTitleStyle}>Recent Ledgers</h2><a href="/ledgers" style={linkPillStyle}>ดูทั้งหมด</a></div>
            <div style={{ display: 'grid', gap: 10 }}>
              {summary.recentLedgers.map((item) => <LedgerRow key={item.id} item={item} />)}
              {summary.recentLedgers.length === 0 && <p style={mutedStyle}>ยังไม่มีรายการ</p>}
            </div>
          </section>
          <p style={mutedStyle}>Generated: {new Date(summary.generatedAt).toLocaleString('th-TH')}</p>
        </>
      )}
    </main>
  );
}

function Metric({ title, value, href, highlight }: { title: string; value: string; href?: string; highlight?: boolean }) {
  const content = <><p style={metricLabelStyle}>{title}</p><h2 style={metricValueStyle}>{value}</h2></>;
  if (href) return <a href={href} style={{ ...metricStyle, borderColor: highlight ? '#f5c542' : 'rgba(255,255,255,0.12)' }}>{content}</a>;
  return <section style={metricStyle}>{content}</section>;
}

function QueueCard({ title, href, items }: { title: string; href: string; items: QueueItem[] }) {
  return <section style={cardStyle}><div style={sectionHeaderStyle}><h2 style={sectionTitleStyle}>{title}</h2><a href={href} style={linkPillStyle}>เปิดคิว</a></div><div style={{ display: 'grid', gap: 10 }}>{items.map((item) => <div key={item.id} style={rowStyle}><div><strong>{item.user?.username ?? '-'}</strong><p style={mutedStyle}>{item.user?.shortId ?? '-'}</p><p style={mutedStyle}>{new Date(item.createdAt).toLocaleString('th-TH')}</p></div><div style={{ textAlign: 'right' }}><strong>{item.currency} {Number(item.amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</strong><p style={badgeStyle}>{item.status}</p></div></div>)}{items.length === 0 && <p style={mutedStyle}>ไม่มีคิว pending</p>}</div></section>;
}

function LedgerRow({ item }: { item: LedgerItem }) {
  return <div style={rowStyle}><div><strong>{item.type} / {item.direction}</strong><p style={mutedStyle}>{item.user?.username ?? '-'} / {item.user?.shortId ?? '-'}</p><p style={mutedStyle}>{new Date(item.createdAt).toLocaleString('th-TH')}</p></div><div style={{ textAlign: 'right' }}><strong style={{ color: item.direction === 'CREDIT' ? '#7CFFB2' : '#FF9C9C' }}>{item.direction === 'CREDIT' ? '+' : '-'} {money(item.amount)}</strong><p style={mutedStyle}>{money(item.balanceBefore)} → {money(item.balanceAfter)}</p><p style={mutedStyle}>Admin: {item.createdByAdmin?.username ?? '-'}</p></div></div>;
}

function money(value: string) { return `THB ${Number(value).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`; }

const pageStyle = { maxWidth: 1180, margin: '0 auto', padding: '22px 16px 44px', color: '#fff' } as const;
const headerRowStyle = { display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' } as const;
const backStyle = { color: '#f5c542', textDecoration: 'none', fontWeight: 900 } as const;
const eyebrowStyle = { margin: '18px 0 0', opacity: 0.66, fontSize: 14 } as const;
const titleStyle = { margin: '6px 0 8px', fontSize: 'clamp(36px, 10vw, 68px)', lineHeight: 0.96, letterSpacing: -1.4 } as const;
const mutedStyle = { margin: 0, opacity: 0.76, lineHeight: 1.55 } as const;
const refreshStyle = { border: '1px solid rgba(255,255,255,0.14)', borderRadius: 14, padding: '12px 16px', cursor: 'pointer', background: '#f5c542', color: '#111', fontWeight: 900 } as const;
const noticeStyle = { border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16, padding: 12, background: 'rgba(255,255,255,0.07)', marginTop: 14 } as const;
const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12, margin: '18px 0' } as const;
const twoColStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: 14, margin: '18px 0' } as const;
const metricStyle = { border: '1px solid rgba(255,255,255,0.12)', borderRadius: 22, padding: 16, background: '#181818', textDecoration: 'none', color: 'inherit', minHeight: 120, display: 'grid', alignContent: 'space-between' } as const;
const metricLabelStyle = { margin: 0, opacity: 0.7, fontWeight: 800 } as const;
const metricValueStyle = { margin: 0, fontSize: 'clamp(24px, 7vw, 34px)', lineHeight: 1 } as const;
const cardStyle = { border: '1px solid rgba(255,255,255,0.12)', borderRadius: 24, padding: 16, background: '#181818', marginBottom: 14 } as const;
const sectionHeaderStyle = { display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 } as const;
const sectionTitleStyle = { margin: 0, fontSize: 24 } as const;
const linkPillStyle = { color: '#f5c542', textDecoration: 'none', border: '1px solid rgba(245,197,66,0.35)', borderRadius: 999, padding: '8px 12px', fontWeight: 900 } as const;
const rowStyle = { display: 'flex', justifyContent: 'space-between', gap: 12, border: '1px solid rgba(255,255,255,0.10)', borderRadius: 18, padding: 12, flexWrap: 'wrap', background: 'rgba(255,255,255,0.04)' } as const;
const badgeStyle = { display: 'inline-block', margin: '8px 0 0', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 999, padding: '5px 9px', fontSize: 12, fontWeight: 900 } as const;
