'use client';

import { ReactNode, useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminGrid, AdminLinkButton, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminRow, AdminStack, AdminToolbar } from '../_components/admin-ui';

type ControlCenter = {
  summary?: Record<string, number>;
  queues?: Record<string, number>;
  recent?: {
    ledgers?: any[];
    transfers?: any[];
    snapshots?: any[];
    alerts?: any[];
  };
  realLedgerMutationEnabled?: boolean;
};

type QueueSummary = { topUps?: { count?: number }; withdrawals?: { count?: number } };

const quickGroups = [
  { title: 'Money Operation', tone: 'warning' as const, items: [['ฝากรอตรวจ', '/topups'], ['ถอนเงินรอดำเนินการ', '/withdrawals'], ['Wallet Ledgers', '/wallet-ledgers'], ['Money Ops', '/money-ops'], ['Risk Alerts', '/risk-alerts']] },
  { title: 'Game Platform', tone: 'success' as const, items: [['Adapter Test Harness', '/adapter-test'], ['Provider Setup', '/provider-setup-wizard'], ['Provider Presets', '/provider-presets'], ['Provider Risk', '/provider-risk'], ['Game Transfers', '/game-transfers'], ['Reconciliation', '/reconciliation-center'], ['Webhook Settlement', '/webhook-settlement']] },
  { title: 'Admin Control', tone: 'neutral' as const, items: [['Members', '/members'], ['Bank Accounts', '/bank-accounts'], ['Audit Logs', '/audit-logs'], ['Admin Users', '/admin-users']] },
];

export default function OperationsPage() {
  const [control, setControl] = useState<ControlCenter>({});
  const [queues, setQueues] = useState<QueueSummary>({});
  const [message, setMessage] = useState('กำลังโหลด operation dashboard...');
  const [loading, setLoading] = useState(false);

  useEffect(() => { load(); }, []);

  const summary = control.summary ?? {};
  const pendingTopUps = Number(queues.topUps?.count ?? 0);
  const pendingWithdrawals = Number(queues.withdrawals?.count ?? 0);
  const urgentCount = useMemo(() => pendingTopUps + pendingWithdrawals + Number(summary.failedTransfers ?? 0) + Number(summary.mismatchSnapshots ?? 0) + Number(summary.openRiskAlerts ?? 0), [pendingTopUps, pendingWithdrawals, summary.failedTransfers, summary.mismatchSnapshots, summary.openRiskAlerts]);

  async function load() {
    setLoading(true);
    setMessage('กำลังโหลด operation dashboard...');
    const [controlRes, queueRes] = await Promise.all([adminApiFetch('/admin/money-ops/control-center'), adminApiFetch('/admin/queues/summary')]);
    const controlData = await controlRes.json().catch(() => null);
    const queueData = await queueRes.json().catch(() => null);
    setLoading(false);
    if (controlRes.ok && controlData) setControl(controlData);
    if (queueRes.ok && queueData) setQueues(queueData);
    if (!controlRes.ok && !queueRes.ok) {
      setMessage(controlData?.message ?? queueData?.message ?? 'โหลด dashboard ไม่สำเร็จ');
      return;
    }
    setMessage('');
  }

  return <AdminPage eyebrow="Admin" title="Operation Dashboard" description="หน้ารวมงานที่แอดมินต้องจัดการตอนนี้: ฝาก ถอน โยกเงินพัง alert mismatch และ provider risk ไม่ใช่เมนูรวมให้เดินหลงแบบห้างร้าง" actions={<AdminButton onClick={load} disabled={loading}>{loading ? 'Refreshing...' : 'Refresh'}</AdminButton>}>
    {message && <AdminNotice>{message}</AdminNotice>}
    <AdminMetricGrid>
      <AdminMetric title="Urgent work" value={String(urgentCount)} helper="งานที่ควรดูตอนนี้" />
      <AdminMetric title="ฝากรอตรวจ" value={String(pendingTopUps)} helper="pending top-ups" />
      <AdminMetric title="ถอนเงินรอดำเนินการ" value={String(pendingWithdrawals)} helper="pending withdrawals" />
      <AdminMetric title="Transfer failed" value={String(summary.failedTransfers ?? 0)} helper="เกมโยกเงินไม่สำเร็จ" />
      <AdminMetric title="Risk alerts" value={String(summary.openRiskAlerts ?? 0)} helper="OPEN/REVIEWING" />
      <AdminMetric title="Mismatch" value={String(summary.mismatchSnapshots ?? 0)} helper="reconciliation" />
      <AdminMetric title="Webhook failed" value={String(summary.webhookFailed ?? 0)} helper="callback ผิดพลาด" />
      <AdminMetric title="Wallets" value={String(summary.walletCount ?? 0)} helper="จำนวน wallet" />
    </AdminMetricGrid>

    {control.realLedgerMutationEnabled && <AdminNotice>REAL_LEDGER_MUTATION_ENABLED เปิดอยู่ ตรวจ permission/audit ให้ครบก่อนกดอะไรเกี่ยวกับยอดเงินจริง โลกมีปัญหาพอแล้วไม่ต้องเพิ่มเงินงอกเอง</AdminNotice>}

    <AdminGrid>
      <AdminCard title="Action queues" description="ทางลัดไปงานที่ต้องจัดการทันที"><AdminStack><QueueRow title="ฝากรอตรวจ" count={pendingTopUps} href="/topups" tone="warning" /><QueueRow title="ถอนเงินรอดำเนินการ" count={pendingWithdrawals} href="/withdrawals" tone="warning" /><QueueRow title="โยกเงินล้มเหลว" count={Number(summary.failedTransfers ?? 0)} href="/game-transfers" tone="danger" /><QueueRow title="Risk Alert เปิดอยู่" count={Number(summary.openRiskAlerts ?? 0)} href="/risk-alerts" tone="danger" /><QueueRow title="Reconciliation mismatch" count={Number(summary.mismatchSnapshots ?? 0)} href="/reconciliation-center" tone="danger" /><QueueRow title="Webhook failed" count={Number(summary.webhookFailed ?? 0)} href="/webhook-logs" tone="warning" /></AdminStack></AdminCard>
      <AdminCard title="Provider tools" description="เครื่องมือก่อนต่อค่ายจริงและก่อนเปิดเงินจริง"><AdminStack><ToolRow title="Adapter Test Harness" href="/adapter-test" description="ยิง health/launch/balance/transfer/webhook ทีละ method" /><ToolRow title="Provider Setup Wizard" href="/provider-setup-wizard" description="สร้าง provider/endpoints/credentials จาก step flow" /><ToolRow title="Provider Presets" href="/provider-presets" description="เลือก preset สำหรับ demo/simulator/generic-transfer" /><ToolRow title="Provider Risk" href="/provider-risk" description="ตรวจ readiness/gates/preflight" /></AdminStack></AdminCard>
    </AdminGrid>

    <AdminToolbar><strong>Recent money activity</strong><span style={mutedStyle}>ดูรายการล่าสุดเพื่อจับกลิ่นความผิดปกติ ก่อนที่ระบบบัญชีจะกลายเป็นนิยายสืบสวน</span></AdminToolbar>
    <AdminGrid>
      <RecentCard title="Latest transfers" items={control.recent?.transfers ?? []} render={(item) => <AdminRow key={item.id}><div><strong>{item.type ?? 'TRANSFER'} · {formatMoney(item.amount, item.currency ?? 'THB')}</strong><p style={mutedStyle}>{item.user?.username ?? item.user?.phone ?? '-'} · {item.provider?.name ?? item.provider?.code ?? '-'}</p></div><div style={rightStyle}><AdminBadge tone={statusTone(item.status)}>{item.status ?? '-'}</AdminBadge><AdminLinkButton href={`/game-transfers/${item.id}`}>Detail</AdminLinkButton></div></AdminRow>} />
      <RecentCard title="Open alerts" items={control.recent?.alerts ?? []} render={(item) => <AdminRow key={item.id}><div><strong>{item.title ?? item.type}</strong><p style={mutedStyle}>{item.refType ?? '-'} · {item.refId ?? '-'}</p></div><div style={rightStyle}><AdminBadge tone={severityTone(item.severity)}>{item.severity ?? '-'}</AdminBadge><AdminLinkButton href={`/risk-alerts/${item.id}`}>Open</AdminLinkButton></div></AdminRow>} />
      <RecentCard title="Latest ledgers" items={control.recent?.ledgers ?? []} render={(item) => <AdminRow key={item.id}><div><strong>{item.direction ?? '-'} · {formatMoney(item.amount, 'THB')}</strong><p style={mutedStyle}>{item.user?.username ?? item.user?.phone ?? '-'} · {item.referenceType ?? '-'}</p></div><div style={rightStyle}><AdminBadge tone={item.direction === 'CREDIT' ? 'success' : 'warning'}>{item.type ?? '-'}</AdminBadge><AdminLinkButton href={`/wallet-ledgers/${item.id}`}>Detail</AdminLinkButton></div></AdminRow>} />
      <RecentCard title="Reconciliation snapshots" items={control.recent?.snapshots ?? []} render={(item) => <AdminRow key={item.id}><div><strong>{item.provider?.name ?? item.provider?.code ?? '-'}</strong><p style={mutedStyle}>{item.user?.username ?? item.user?.phone ?? '-'} · diff {item.difference ?? '-'}</p></div><div style={rightStyle}><AdminBadge tone={item.status === 'MATCHED' ? 'success' : 'danger'}>{item.status ?? '-'}</AdminBadge><AdminLinkButton href="/reconciliation-center">Open</AdminLinkButton></div></AdminRow>} />
    </AdminGrid>

    <AdminToolbar><strong>Navigation groups</strong><span style={mutedStyle}>เมนูหลักแบบตลาดจริง แยกตามงาน ไม่ใช่ตามชื่อ table ที่ developer ภูมิใจเกินเหตุ</span></AdminToolbar>
    <AdminGrid>{quickGroups.map((group) => <AdminCard key={group.title} title={group.title}><AdminStack>{group.items.map(([title, href]) => <AdminRow key={href}><strong>{title}</strong><div style={rightStyle}><AdminBadge tone={group.tone}>{group.title}</AdminBadge><AdminLinkButton href={href}>เปิด</AdminLinkButton></div></AdminRow>)}</AdminStack></AdminCard>)}</AdminGrid>
  </AdminPage>;
}

function QueueRow({ title, count, href, tone }: { title: string; count: number; href: string; tone: 'warning' | 'danger' | 'success' | 'neutral' }) { return <AdminRow><div><strong>{title}</strong><p style={mutedStyle}>{count > 0 ? 'ต้องตรวจ' : 'ยังไม่มีงานค้าง'}</p></div><div style={rightStyle}><AdminBadge tone={count > 0 ? tone : 'success'}>{count}</AdminBadge><AdminLinkButton href={href}>เปิด</AdminLinkButton></div></AdminRow>; }
function ToolRow({ title, description, href }: { title: string; description: string; href: string }) { return <AdminRow><div><strong>{title}</strong><p style={mutedStyle}>{description}</p></div><AdminLinkButton href={href}>เปิด</AdminLinkButton></AdminRow>; }
function RecentCard({ title, items, render }: { title: string; items: any[]; render: (item: any) => ReactNode }) { return <AdminCard title={title}>{items.length ? <AdminStack>{items.map(render)}</AdminStack> : <p style={mutedStyle}>ยังไม่มีข้อมูลล่าสุด</p>}</AdminCard>; }
function formatMoney(value: string | number, currency: string) { return `${currency} ${Number(value ?? 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`; }
function statusTone(status: string) { if (status === 'SUCCESS') return 'success'; if (status === 'FAILED') return 'danger'; if (status === 'PENDING') return 'warning'; return 'neutral'; }
function severityTone(severity: string) { if (severity === 'CRITICAL' || severity === 'HIGH') return 'danger'; if (severity === 'MEDIUM') return 'warning'; return 'neutral'; }
const mutedStyle = { margin: 0, color: '#94a3b8', lineHeight: 1.55 } as const;
const rightStyle = { display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap' as const };
