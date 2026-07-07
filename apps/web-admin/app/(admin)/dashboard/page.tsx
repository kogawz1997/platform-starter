'use client';

import { useEffect, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminButton, AdminCard, AdminEmpty, AdminGrid, AdminLinkButton, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminRow, AdminStack, formatMoney } from '../_components/admin-ui';

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
    setMessage('กำลังโหลด Operation Center...');
    const [financeRes, riskRes] = await Promise.all([
      adminApiFetch('/admin/finance/summary'),
      adminApiFetch('/admin/risk/summary'),
    ]);
    const financeData = await financeRes.json().catch(() => null);
    const riskData = await riskRes.json().catch(() => null);
    if (!financeRes.ok) { setMessage(financeData?.message ?? 'โหลด dashboard ไม่สำเร็จ'); return; }
    setSummary(financeData);
    if (riskRes.ok) setRisk(riskData);
    setMessage('');
  }

  return (
    <AdminPage eyebrow="Operation Center" title="Dashboard" description="ศูนย์รวมคิวการเงิน ยอด wallet ความเสี่ยง และรายการล่าสุด" actions={<AdminButton onClick={loadSummary}>Refresh</AdminButton>}>
      {message && <AdminNotice>{message}</AdminNotice>}
      {summary && <AdminMetricGrid><AdminMetric title="Wallets" value={summary.totals.walletCount.toLocaleString('th-TH')} /><AdminMetric title="Available" value={formatMoney(summary.totals.totalAvailableBalance)} /><AdminMetric title="Locked" value={formatMoney(summary.totals.totalLockedBalance)} /><AdminMetric title="Pending" value={`${summary.totals.pendingTopUps + summary.totals.pendingWithdrawals}`} />{risk && <AdminMetric title="Risk Alerts" value={`${risk.counts.total}`} helper={`High ${risk.counts.high} · Medium ${risk.counts.medium} · Low ${risk.counts.low}`} />}</AdminMetricGrid>}
      {risk && <AdminCard title="Risk Alerts" description={`High ${risk.counts.high} · Medium ${risk.counts.medium} · Low ${risk.counts.low}`} action={<AdminLinkButton href="/reports">Reports</AdminLinkButton>}><AdminStack>{risk.alerts.slice(0, 8).map((item, index) => <AdminRow key={`${item.type}-${item.userId ?? item.targetId ?? index}`}><div><strong>{item.severity} · {item.type}</strong><p>{item.message}</p><p>{item.username ?? item.userId ?? item.targetId ?? '-'}</p></div>{item.userId && <AdminLinkButton href={`/member-detail?id=${item.userId}`}>Member</AdminLinkButton>}</AdminRow>)}{risk.alerts.length === 0 && <AdminEmpty>ยังไม่พบ alert สำคัญ</AdminEmpty>}</AdminStack></AdminCard>}
      {summary && <AdminGrid><QueueCard title="Top-up Queue" href="/topups" count={summary.totals.pendingTopUps} items={summary.queues.topUps} /><QueueCard title="Withdrawal Queue" href="/withdrawals" count={summary.totals.pendingWithdrawals} items={summary.queues.withdrawals} /></AdminGrid>}
      {summary && <AdminCard title="Recent Ledger" action={<AdminLinkButton href="/ledgers">ดูทั้งหมด</AdminLinkButton>}><AdminStack>{summary.recentLedgers.map((item) => <AdminRow key={item.id}><div><strong>{item.type} / {item.direction}</strong><p>{item.user?.username ?? item.user?.shortId ?? '-'}</p></div><div style={{ textAlign: 'right' }}><strong>{formatMoney(item.amount)}</strong><p>{new Date(item.createdAt).toLocaleString('th-TH')}</p></div></AdminRow>)}</AdminStack></AdminCard>}
    </AdminPage>
  );
}

function QueueCard({ title, href, count, items }: { title: string; href: string; count: number; items: QueueItem[] }) {
  return <AdminCard title={title} description={`${count} pending`} action={<AdminLinkButton href={href}>เปิดคิว</AdminLinkButton>}><AdminStack>{items.slice(0, 5).map((item) => <AdminRow key={item.id}><div><strong>{item.user?.username ?? item.shortUserId}</strong><p>{item.method ?? '-'} · {new Date(item.createdAt).toLocaleString('th-TH')}</p></div><strong>{formatMoney(item.amount)}</strong></AdminRow>)}{items.length === 0 && <AdminEmpty>ไม่มีรายการรอตรวจ</AdminEmpty>}</AdminStack></AdminCard>;
}
