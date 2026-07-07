'use client';

import { useEffect, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

type DailyReport = { range: { from: string; to: string }; topUps: Group[]; withdrawals: Group[]; adjustments: { direction: string; count: number; amount: string }[]; wallets: { count: number; totalBalance: string; totalLockedBalance: string }; ledgers: { count: number; amount: string }; pendingQueues?: { topUps: { count: number; amount: string }; withdrawals: { count: number; amount: string } }; generatedAt: string };
type Group = { status: string; count: number; amount: string };
type Reconciliation = { checkedCount?: number; mismatchCount: number; items: { walletId: string; shortUserId: string; username?: string | null; actualBalance: string; latestLedgerBalance: string; lockedBalance: string; availableBalance?: string; status: string }[]; generatedAt: string };

export default function ReportsPage() {
  const [daily, setDaily] = useState<DailyReport | null>(null);
  const [recon, setRecon] = useState<Reconciliation | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => { loadReports(); }, []);

  async function loadReports() {
    const token = window.localStorage.getItem('admin_access_token');
    if (!token) { setMessage('กรุณา login admin ก่อน'); return; }
    setMessage('กำลังโหลดรายงาน...');
    const [dailyRes, reconRes] = await Promise.all([
      fetch(`${API_URL}/admin/reports/daily`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${API_URL}/admin/reports/reconciliation?limit=100`, { headers: { Authorization: `Bearer ${token}` } }),
    ]);
    const dailyData = await dailyRes.json().catch(() => null);
    const reconData = await reconRes.json().catch(() => null);
    if (!dailyRes.ok || !reconRes.ok) { setMessage(dailyData?.message ?? reconData?.message ?? 'โหลดรายงานไม่สำเร็จ'); return; }
    setDaily(dailyData); setRecon(reconData); setMessage('');
  }

  return (
    <main style={pageStyle}>
      <a href="/settings" style={backStyle}>← Settings</a>
      <p style={eyebrowStyle}>Finance Reports</p>
      <div style={headerRowStyle}><div><h1 style={titleStyle}>Reports</h1><p style={mutedStyle}>รายงานรายวันและตรวจยอด wallet เทียบ ledger</p></div><div style={actionRowStyle}><button type="button" onClick={loadReports} style={buttonStyle}>Refresh</button><a href="/exports" style={linkButtonStyle}>Exports</a></div></div>
      {message && <div style={noticeStyle}>{message}</div>}
      {daily && <section style={gridStyle}><Metric title="Wallets" value={daily.wallets.count.toLocaleString('th-TH')} /><Metric title="Total Balance" value={money(daily.wallets.totalBalance)} /><Metric title="Locked" value={money(daily.wallets.totalLockedBalance)} /><Metric title="Ledger Items" value={daily.ledgers.count.toLocaleString('th-TH')} />{daily.pendingQueues && <Metric title="Pending Top-ups" value={`${daily.pendingQueues.topUps.count} / ${money(daily.pendingQueues.topUps.amount)}`} />}{daily.pendingQueues && <Metric title="Pending Withdrawals" value={`${daily.pendingQueues.withdrawals.count} / ${money(daily.pendingQueues.withdrawals.amount)}`} />}{recon && <Metric title="Recon Checked" value={(recon.checkedCount ?? recon.items.length).toLocaleString('th-TH')} />}{recon && <Metric title="Mismatch" value={recon.mismatchCount.toLocaleString('th-TH')} />}</section>}
      {daily && <section style={twoColStyle}><GroupCard title="Top-ups" items={daily.topUps} /><GroupCard title="Withdrawals" items={daily.withdrawals} /><GroupCard title="Adjustments" items={daily.adjustments.map((item) => ({ status: item.direction, count: item.count, amount: item.amount }))} /></section>}
      {recon && <section style={cardStyle}><h2 style={sectionTitleStyle}>Reconciliation</h2><p style={mutedStyle}>Mismatch: {recon.mismatchCount}</p><div style={{ display: 'grid', gap: 10, marginTop: 12 }}>{recon.items.slice(0, 20).map((item) => <div key={item.walletId} style={rowStyle}><div><strong>{item.username ?? item.shortUserId}</strong><p style={mutedStyle}>Wallet: {item.shortUserId}</p></div><div style={{ textAlign: 'right' }}><strong>{item.status}</strong><p style={mutedStyle}>Actual {money(item.actualBalance)} / Ledger {money(item.latestLedgerBalance)}</p>{item.availableBalance && <p style={mutedStyle}>Available {money(item.availableBalance)}</p>}</div></div>)}</div></section>}
    </main>
  );
}

function Metric({ title, value }: { title: string; value: string }) { return <section style={metricStyle}><p style={mutedStyle}>{title}</p><h2 style={{ margin: 0 }}>{value}</h2></section>; }
function GroupCard({ title, items }: { title: string; items: Group[] }) { return <section style={cardStyle}><h2 style={sectionTitleStyle}>{title}</h2><div style={{ display: 'grid', gap: 10 }}>{items.map((item) => <div key={item.status} style={rowStyle}><strong>{item.status}</strong><span>{item.count} / {money(item.amount)}</span></div>)}{items.length === 0 && <p style={mutedStyle}>ไม่มีข้อมูล</p>}</div></section>; }
function money(value: string) { return `THB ${Number(value).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`; }

const pageStyle = { maxWidth: 1180, margin: '0 auto', padding: '22px 16px 44px', color: '#fff' } as const;
const backStyle = { color: '#f5c542', textDecoration: 'none', fontWeight: 900 } as const;
const eyebrowStyle = { margin: '18px 0 0', opacity: 0.66, fontSize: 14 } as const;
const titleStyle = { margin: '6px 0 8px', fontSize: 'clamp(36px, 10vw, 68px)', lineHeight: 0.96, letterSpacing: -1.4 } as const;
const mutedStyle = { margin: 0, opacity: 0.76, lineHeight: 1.55 } as const;
const headerRowStyle = { display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'flex-end', flexWrap: 'wrap' } as const;
const actionRowStyle = { display: 'flex', gap: 10, flexWrap: 'wrap' } as const;
const buttonStyle = { padding: '13px 14px', borderRadius: 14, cursor: 'pointer', background: '#f5c542', color: '#111', border: 0, fontWeight: 900 } as const;
const linkButtonStyle = { padding: '13px 14px', borderRadius: 14, cursor: 'pointer', background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.14)', fontWeight: 900, textDecoration: 'none' } as const;
const noticeStyle = { border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16, padding: 12, background: 'rgba(255,255,255,0.07)', marginBottom: 12 } as const;
const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12, margin: '18px 0' } as const;
const twoColStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 } as const;
const metricStyle = { border: '1px solid rgba(255,255,255,0.12)', borderRadius: 22, padding: 16, background: '#181818' } as const;
const cardStyle = { border: '1px solid rgba(255,255,255,0.12)', borderRadius: 24, padding: 16, background: '#181818', marginBottom: 14 } as const;
const sectionTitleStyle = { margin: '0 0 12px', fontSize: 24 } as const;
const rowStyle = { display: 'flex', justifyContent: 'space-between', gap: 12, border: '1px solid rgba(255,255,255,0.10)', borderRadius: 18, padding: 12, flexWrap: 'wrap', background: 'rgba(255,255,255,0.04)' } as const;
