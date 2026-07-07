'use client';

import { useEffect, useState } from 'react';
import { AdminBadge, AdminButton, AdminCard, AdminEmpty, AdminGrid, AdminLinkButton, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminRow, AdminStack, formatMoney } from '../_components/admin-ui';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

type Summary = { totals: { walletCount: number; totalBalance: string; totalLockedBalance: string; totalAvailableBalance: string; pendingTopUps: number; pendingWithdrawals: number }; queues: { topUps: QueueItem[]; withdrawals: QueueItem[] }; recentLedgers: LedgerItem[]; generatedAt: string };
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
    <AdminPage eyebrow="Operation Center" title="Finance Summary" description="ภาพรวมระบบเงิน คิวที่ต้องทำ และรายการล่าสุด" actions={<AdminButton onClick={loadSummary}>Refresh</AdminButton>}>
      {message && <AdminNotice>{message}</AdminNotice>}
      {summary && <><AdminMetricGrid><AdminMetric title="Wallets" value={summary.totals.walletCount.toLocaleString('th-TH')} /><AdminMetric title="Total Balance" value={formatMoney(summary.totals.totalBalance)} /><AdminMetric title="Locked" value={formatMoney(summary.totals.totalLockedBalance)} /><AdminMetric title="Available" value={formatMoney(summary.totals.totalAvailableBalance)} /><AdminMetric title="Top-up Pending" value={summary.totals.pendingTopUps.toLocaleString('th-TH')} /><AdminMetric title="Withdrawal Pending" value={summary.totals.pendingWithdrawals.toLocaleString('th-TH')} /></AdminMetricGrid><AdminGrid><QueueCard title="Top-up Queue" href="/topups" items={summary.queues.topUps} /><QueueCard title="Withdrawal Queue" href="/withdrawals" items={summary.queues.withdrawals} /></AdminGrid><AdminCard title="Recent Ledgers" action={<AdminLinkButton href="/ledgers">ดูทั้งหมด</AdminLinkButton>}><AdminStack>{summary.recentLedgers.map((item) => <LedgerRow key={item.id} item={item} />)}{summary.recentLedgers.length === 0 && <AdminEmpty>ยังไม่มีรายการ</AdminEmpty>}</AdminStack></AdminCard><p>Generated: {new Date(summary.generatedAt).toLocaleString('th-TH')}</p></>}
    </AdminPage>
  );
}

function QueueCard({ title, href, items }: { title: string; href: string; items: QueueItem[] }) {
  return <AdminCard title={title} action={<AdminLinkButton href={href}>เปิดคิว</AdminLinkButton>}><AdminStack>{items.map((item) => <AdminRow key={item.id}><div><strong>{item.user?.username ?? '-'}</strong><p>{item.user?.shortId ?? '-'}</p><p>{new Date(item.createdAt).toLocaleString('th-TH')}</p></div><div style={{ textAlign: 'right' }}><strong>{formatMoney(item.amount)}</strong><AdminBadge tone="warning">{item.status}</AdminBadge></div></AdminRow>)}{items.length === 0 && <AdminEmpty>ไม่มีคิว pending</AdminEmpty>}</AdminStack></AdminCard>;
}

function LedgerRow({ item }: { item: LedgerItem }) {
  return <AdminRow><div><strong>{item.type} / {item.direction}</strong><p>{item.user?.username ?? '-'} / {item.user?.shortId ?? '-'}</p><p>{new Date(item.createdAt).toLocaleString('th-TH')}</p></div><div style={{ textAlign: 'right' }}><strong style={{ color: item.direction === 'CREDIT' ? '#bbf7d0' : '#fecaca' }}>{item.direction === 'CREDIT' ? '+' : '-'} {formatMoney(item.amount)}</strong><p>{formatMoney(item.balanceBefore)} → {formatMoney(item.balanceAfter)}</p><p>Admin: {item.createdByAdmin?.username ?? '-'}</p></div></AdminRow>;
}
