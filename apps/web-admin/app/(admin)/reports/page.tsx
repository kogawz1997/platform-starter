'use client';

import { useEffect, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminEmpty, AdminGrid, AdminLinkButton, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminRow, AdminStack, formatMoney } from '../_components/admin-ui';

type DailyReport = { range: { from: string; to: string }; topUps: Group[]; withdrawals: Group[]; adjustments: { direction: string; count: number; amount: string }[]; wallets: { count: number; totalBalance: string; totalLockedBalance: string }; ledgers: { count: number; amount: string }; pendingQueues?: { topUps: { count: number; amount: string }; withdrawals: { count: number; amount: string } }; generatedAt: string };
type Group = { status: string; count: number; amount: string };
type Reconciliation = { checkedCount?: number; mismatchCount: number; items: { walletId: string; shortUserId: string; username?: string | null; actualBalance: string; latestLedgerBalance: string; lockedBalance: string; availableBalance?: string; status: string }[]; generatedAt: string };
type TrendRow = { date: string; topUpAmount: string; topUpCount: number; withdrawalAmount: string; withdrawalCount: number; netFlow: string };
type Trends = { range: { days: number; from: string; to: string }; totals: { topUpAmount: string; topUpCount: number; withdrawalAmount: string; withdrawalCount: number; netFlow: string }; daily: TrendRow[]; generatedAt: string };

export default function ReportsPage() {
  const [daily, setDaily] = useState<DailyReport | null>(null);
  const [recon, setRecon] = useState<Reconciliation | null>(null);
  const [trends, setTrends] = useState<Trends | null>(null);
  const [trendDays, setTrendDays] = useState(7);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => { loadReports(); }, []);

  async function loadReports(nextTrendDays = trendDays) {
    setLoading(true);
    setMessage('กำลังโหลดรายงาน...');
    const [dailyRes, reconRes, trendsRes] = await Promise.all([
      adminApiFetch('/admin/reports/daily'),
      adminApiFetch('/admin/reports/reconciliation?limit=100'),
      adminApiFetch(`/admin/reports/trends?days=${nextTrendDays}`),
    ]);
    const dailyData = await dailyRes.json().catch(() => null);
    const reconData = await reconRes.json().catch(() => null);
    const trendsData = await trendsRes.json().catch(() => null);
    if (!dailyRes.ok || !reconRes.ok || !trendsRes.ok) { setMessage(dailyData?.message ?? reconData?.message ?? trendsData?.message ?? 'โหลดรายงานไม่สำเร็จ'); setLoading(false); return; }
    setDaily(dailyData);
    setRecon(reconData);
    setTrends(trendsData);
    setMessage('');
    setLoading(false);
  }

  function changeTrendDays(nextDays: number) {
    setTrendDays(nextDays);
    loadReports(nextDays);
  }

  return (
    <AdminPage eyebrow="Finance Reports" title="Reports" description="รายงานรายวัน ตรวจยอด wallet และแนวโน้มเงินเข้าออก" actions={<><AdminButton onClick={() => loadReports()}>Refresh</AdminButton><AdminLinkButton href="/exports">Exports</AdminLinkButton></>}>
      {message && <AdminNotice>{message}</AdminNotice>}
      {loading && !daily && !recon && !trends && <AdminEmpty>กำลังโหลดรายงาน...</AdminEmpty>}
      {daily && <AdminMetricGrid><AdminMetric title="Wallets" value={daily.wallets.count.toLocaleString('th-TH')} /><AdminMetric title="Total Balance" value={formatMoney(daily.wallets.totalBalance)} /><AdminMetric title="Locked" value={formatMoney(daily.wallets.totalLockedBalance)} /><AdminMetric title="Ledger Items" value={daily.ledgers.count.toLocaleString('th-TH')} />{daily.pendingQueues && <AdminMetric title="Pending Top-ups" value={`${daily.pendingQueues.topUps.count}`} helper={formatMoney(daily.pendingQueues.topUps.amount)} />}{daily.pendingQueues && <AdminMetric title="Pending Withdrawals" value={`${daily.pendingQueues.withdrawals.count}`} helper={formatMoney(daily.pendingQueues.withdrawals.amount)} />}{recon && <AdminMetric title="Recon Checked" value={(recon.checkedCount ?? recon.items.length).toLocaleString('th-TH')} />}{recon && <AdminMetric title="Mismatch" value={recon.mismatchCount.toLocaleString('th-TH')} />}</AdminMetricGrid>}

      {trends && <AdminCard title="Finance Trend" description={`${trends.range.days} days · ${new Date(trends.range.from).toLocaleDateString('th-TH')} - ${new Date(trends.range.to).toLocaleDateString('th-TH')}`} action={<div style={toolbarStyle}>{[7, 14, 30].map((item) => <AdminButton key={item} tone={trendDays === item ? 'primary' : 'secondary'} disabled={loading} onClick={() => changeTrendDays(item)}>{item}d</AdminButton>)}</div>}>
        <AdminMetricGrid>
          <AdminMetric title="Top-up volume" value={formatMoney(trends.totals.topUpAmount)} helper={`${trends.totals.topUpCount} approved`} />
          <AdminMetric title="Withdrawal volume" value={formatMoney(trends.totals.withdrawalAmount)} helper={`${trends.totals.withdrawalCount} completed`} />
          <AdminMetric title="Net flow" value={formatMoney(trends.totals.netFlow)} helper="topup - withdrawal" />
        </AdminMetricGrid>
        <AdminStack>{trends.daily.map((item) => <AdminRow key={item.date}><div><strong>{item.date}</strong><p>{item.topUpCount} topups · {item.withdrawalCount} withdrawals</p></div><div style={trendAmountStyle}><TrendAmount label="Top-up" value={item.topUpAmount} tone="success" /><TrendAmount label="Withdraw" value={item.withdrawalAmount} tone="warning" /><TrendAmount label="Net" value={item.netFlow} tone={Number(item.netFlow) >= 0 ? 'success' : 'danger'} /></div></AdminRow>)}</AdminStack>
      </AdminCard>}

      {daily && <AdminCard title="Daily Summary" description={`${new Date(daily.range.from).toLocaleDateString('th-TH')} - ${new Date(daily.range.to).toLocaleDateString('th-TH')}`}><AdminGrid><GroupCard title="Top-ups" items={daily.topUps} /><GroupCard title="Withdrawals" items={daily.withdrawals} /><GroupCard title="Adjustments" items={daily.adjustments.map((item) => ({ status: item.direction, count: item.count, amount: item.amount }))} /></AdminGrid></AdminCard>}
      {recon && <AdminCard title="Reconciliation" description={`Mismatch: ${recon.mismatchCount} · Generated ${new Date(recon.generatedAt).toLocaleString('th-TH')}`}><AdminStack>{recon.items.slice(0, 20).map((item) => <AdminRow key={item.walletId}><div><strong>{item.username ?? item.shortUserId}</strong><p>Wallet: {item.shortUserId}</p></div><div style={{ textAlign: 'right' }}><strong>{item.status}</strong><p>Actual {formatMoney(item.actualBalance)} / Ledger {formatMoney(item.latestLedgerBalance)}</p>{item.availableBalance && <p>Available {formatMoney(item.availableBalance)}</p>}</div></AdminRow>)}{recon.items.length === 0 && <AdminEmpty>ไม่มี mismatch</AdminEmpty>}</AdminStack></AdminCard>}
    </AdminPage>
  );
}

function GroupCard({ title, items }: { title: string; items: Group[] }) {
  return <AdminCard title={title}><AdminStack>{items.map((item) => <AdminRow key={item.status}><strong>{item.status}</strong><span>{item.count} / {formatMoney(item.amount)}</span></AdminRow>)}{items.length === 0 && <AdminEmpty>ไม่มีข้อมูล</AdminEmpty>}</AdminStack></AdminCard>;
}

function TrendAmount({ label, value, tone }: { label: string; value: string; tone: 'success' | 'warning' | 'danger' }) {
  return <div style={trendAmountItemStyle}><AdminBadge tone={tone}>{label}</AdminBadge><strong>{formatMoney(value)}</strong></div>;
}

const toolbarStyle = { display: 'flex', gap: 8, flexWrap: 'wrap' as const };
const trendAmountStyle = { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(100px, 1fr))', gap: 8, textAlign: 'right' as const };
const trendAmountItemStyle = { display: 'grid', gap: 6 };
