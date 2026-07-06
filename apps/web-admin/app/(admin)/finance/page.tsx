'use client';

import { useEffect, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

type Summary = {
  totals: {
    walletCount: number;
    totalBalance: string;
    totalLockedBalance: string;
    totalAvailableBalance: string;
    pendingTopUps: number;
    pendingWithdrawals: number;
  };
  queues: {
    topUps: QueueItem[];
    withdrawals: QueueItem[];
  };
  recentLedgers: LedgerItem[];
  generatedAt: string;
};

type QueueItem = {
  id: string;
  amount: string;
  currency: string;
  status: string;
  method?: string | null;
  createdAt: string;
  user?: { username: string; shortId?: string | null } | null;
};

type LedgerItem = {
  id: string;
  type: string;
  direction: string;
  amount: string;
  balanceBefore: string;
  balanceAfter: string;
  createdAt: string;
  user?: { username: string; shortId?: string | null } | null;
  createdByAdmin?: { username: string } | null;
};

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
    setSummary(data);
    setMessage('');
  }

  return (
    <main style={{ maxWidth: 1180, margin: '32px auto', padding: 24 }}>
      <a href="/settings">← Settings</a>
      <h1>Finance Summary</h1>
      <p>ภาพรวมระบบเงิน คิวที่ต้องทำ และรายการล่าสุด</p>

      <button type="button" onClick={loadSummary} style={buttonStyle}>Refresh</button>
      {message && <p>{message}</p>}

      {summary && (
        <>
          <section style={gridStyle}>
            <Metric title="Wallets" value={summary.totals.walletCount.toLocaleString('th-TH')} />
            <Metric title="Total Balance" value={money(summary.totals.totalBalance)} />
            <Metric title="Locked" value={money(summary.totals.totalLockedBalance)} />
            <Metric title="Available" value={money(summary.totals.totalAvailableBalance)} />
            <Metric title="Top-up Pending" value={summary.totals.pendingTopUps.toLocaleString('th-TH')} href="/topups" />
            <Metric title="Withdrawal Pending" value={summary.totals.pendingWithdrawals.toLocaleString('th-TH')} href="/withdrawals" />
          </section>

          <section style={twoColStyle}>
            <QueueCard title="Top-up Queue" href="/topups" items={summary.queues.topUps} />
            <QueueCard title="Withdrawal Queue" href="/withdrawals" items={summary.queues.withdrawals} />
          </section>

          <section style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <h2>Recent Ledgers</h2>
              <a href="/ledgers">ดูทั้งหมด</a>
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              {summary.recentLedgers.map((item) => (
                <div key={item.id} style={rowStyle}>
                  <div>
                    <strong>{item.type} / {item.direction}</strong>
                    <p>{item.user?.username ?? '-'} / {item.user?.shortId ?? '-'}</p>
                    <p>{new Date(item.createdAt).toLocaleString('th-TH')}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <strong>{item.direction === 'CREDIT' ? '+' : '-'} {money(item.amount)}</strong>
                    <p>{money(item.balanceBefore)} → {money(item.balanceAfter)}</p>
                    <p>Admin: {item.createdByAdmin?.username ?? '-'}</p>
                  </div>
                </div>
              ))}
              {summary.recentLedgers.length === 0 && <p>ยังไม่มีรายการ</p>}
            </div>
          </section>

          <p>Generated: {new Date(summary.generatedAt).toLocaleString('th-TH')}</p>
        </>
      )}
    </main>
  );
}

function Metric({ title, value, href }: { title: string; value: string; href?: string }) {
  const content = <><p>{title}</p><h2>{value}</h2></>;
  if (href) return <a href={href} style={metricStyle}>{content}</a>;
  return <section style={metricStyle}>{content}</section>;
}

function QueueCard({ title, href, items }: { title: string; href: string; items: QueueItem[] }) {
  return (
    <section style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <h2>{title}</h2>
        <a href={href}>เปิดคิว</a>
      </div>
      <div style={{ display: 'grid', gap: 10 }}>
        {items.map((item) => (
          <div key={item.id} style={rowStyle}>
            <div>
              <strong>{item.user?.username ?? '-'}</strong>
              <p>{item.user?.shortId ?? '-'}</p>
              <p>{new Date(item.createdAt).toLocaleString('th-TH')}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <strong>{item.currency} {Number(item.amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</strong>
              <p>{item.status}</p>
            </div>
          </div>
        ))}
        {items.length === 0 && <p>ไม่มีคิว pending</p>}
      </div>
    </section>
  );
}

function money(value: string) {
  return `THB ${Number(value).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`;
}

const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 14, margin: '18px 0' } as const;
const twoColStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, margin: '18px 0' } as const;
const metricStyle = { border: '1px solid #ddd', borderRadius: 16, padding: 16, background: '#fff', textDecoration: 'none', color: 'inherit' } as const;
const cardStyle = { border: '1px solid #ddd', borderRadius: 18, padding: 18, background: '#fff', marginBottom: 16 } as const;
const rowStyle = { display: 'flex', justifyContent: 'space-between', gap: 12, border: '1px solid #eee', borderRadius: 12, padding: 12, flexWrap: 'wrap' } as const;
const buttonStyle = { padding: '10px 14px', borderRadius: 10, cursor: 'pointer' } as const;
