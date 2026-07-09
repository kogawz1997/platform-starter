'use client';

import { ReactNode, useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminGrid, AdminLinkButton, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminRow, AdminStack, AdminToolbar } from '../_components/admin-ui';

type ControlCenter = { summary?: Record<string, number>; queues?: Record<string, number>; recent?: { ledgers?: any[]; transfers?: any[]; snapshots?: any[]; alerts?: any[] }; realLedgerMutationEnabled?: boolean };
type QueueSummary = { topUps?: { count?: number }; withdrawals?: { count?: number } };

const quickGroups = [
  { title: 'งานประจำวัน', tone: 'warning' as const, items: [['ตรวจฝาก', '/topups'], ['ตรวจถอน', '/withdrawals'], ['ปัญหาที่ต้องดู', '/risk-alerts'], ['ประวัติเงิน', '/wallet-ledgers']] },
  { title: 'ตั้งค่าค่ายเกม', tone: 'success' as const, items: [['ตั้งค่าง่าย', '/simple-game-settings'], ['เพิ่มค่ายใหม่', '/provider-setup-wizard'], ['ดูการโยกเงิน', '/game-transfers'], ['ตรวจยอดค่าย', '/reconciliation-center']] },
  { title: 'ขั้นสูง / ใช้ตอน debug', tone: 'neutral' as const, items: [['ทดสอบ API ทีละจุด', '/adapter-test'], ['เปลี่ยน API Key', '/provider-credentials'], ['Webhook', '/webhook-logs'], ['Audit Logs', '/audit-logs']] },
];

export default function OperationsPage() {
  const [control, setControl] = useState<ControlCenter>({});
  const [queues, setQueues] = useState<QueueSummary>({});
  const [message, setMessage] = useState('กำลังโหลดงาน...');
  const [loading, setLoading] = useState(false);
  useEffect(() => { load(); }, []);
  const summary = control.summary ?? {};
  const pendingTopUps = Number(queues.topUps?.count ?? 0);
  const pendingWithdrawals = Number(queues.withdrawals?.count ?? 0);
  const urgentCount = useMemo(() => pendingTopUps + pendingWithdrawals + Number(summary.failedTransfers ?? 0) + Number(summary.mismatchSnapshots ?? 0) + Number(summary.openRiskAlerts ?? 0), [pendingTopUps, pendingWithdrawals, summary.failedTransfers, summary.mismatchSnapshots, summary.openRiskAlerts]);
  async function load() { setLoading(true); setMessage('กำลังโหลดงาน...'); const [controlRes, queueRes] = await Promise.all([adminApiFetch('/admin/money-ops/control-center'), adminApiFetch('/admin/queues/summary')]); const controlData = await controlRes.json().catch(() => null); const queueData = await queueRes.json().catch(() => null); setLoading(false); if (controlRes.ok && controlData) setControl(controlData); if (queueRes.ok && queueData) setQueues(queueData); if (!controlRes.ok && !queueRes.ok) { setMessage(controlData?.message ?? queueData?.message ?? 'โหลดงานไม่สำเร็จ'); return; } setMessage(''); }
  return <AdminPage eyebrow="Admin" title="งานแอดมิน" description="รวมเฉพาะงานที่ต้องทำจริง ลดศัพท์เทคนิคและหน้าเยอะ ๆ ให้เหลือทางหลัก" actions={<AdminButton onClick={load} disabled={loading}>{loading ? 'กำลังโหลด...' : 'รีเฟรช'}</AdminButton>}>
    {message && <AdminNotice>{message}</AdminNotice>}
    <AdminMetricGrid><AdminMetric title="งานที่ต้องดู" value={String(urgentCount)} helper="รวมงานค้างและปัญหา" /><AdminMetric title="ฝากรอตรวจ" value={String(pendingTopUps)} helper="สมาชิกแจ้งฝาก" /><AdminMetric title="ถอนรอดำเนินการ" value={String(pendingWithdrawals)} helper="สมาชิกขอถอน" /><AdminMetric title="โยกเงินมีปัญหา" value={String(summary.failedTransfers ?? 0)} helper="เกม/วอเลต" /><AdminMetric title="ปัญหาความเสี่ยง" value={String(summary.openRiskAlerts ?? 0)} helper="ต้องตรวจ" /><AdminMetric title="ยอดไม่ตรง" value={String(summary.mismatchSnapshots ?? 0)} helper="ค่าย/ระบบ" /></AdminMetricGrid>
    {control.realLedgerMutationEnabled && <AdminNotice>โหมดเขียนเงินจริงเปิดอยู่ ตรวจให้แน่ใจก่อนกด action เกี่ยวกับยอดเงินทุกครั้ง</AdminNotice>}
    <AdminGrid><AdminCard title="งานที่ต้องจัดการ" description="เปิดเฉพาะหน้าที่จำเป็นก่อน"><AdminStack><QueueRow title="ตรวจรายการฝาก" count={pendingTopUps} href="/topups" tone="warning" /><QueueRow title="ตรวจรายการถอน" count={pendingWithdrawals} href="/withdrawals" tone="warning" /><QueueRow title="โยกเงินไม่สำเร็จ" count={Number(summary.failedTransfers ?? 0)} href="/game-transfers" tone="danger" /><QueueRow title="ปัญหาที่ต้องตรวจ" count={Number(summary.openRiskAlerts ?? 0)} href="/risk-alerts" tone="danger" /><QueueRow title="ยอดค่ายไม่ตรง" count={Number(summary.mismatchSnapshots ?? 0)} href="/reconciliation-center" tone="danger" /></AdminStack></AdminCard><AdminCard title="ตั้งค่าค่ายเกมแบบง่าย" description="ใช้หน้านี้เป็นหลัก แทนการเปิดหลายหน้า"><AdminStack><ToolRow title="ตั้งค่าง่าย" href="/simple-game-settings" description="ดูว่าค่ายพร้อมไหม ใส่ API Key ทดสอบ และไปขั้นต่อไป" /><ToolRow title="เพิ่มค่ายใหม่" href="/provider-setup-wizard" description="เพิ่มค่ายด้วยขั้นตอนง่าย ๆ" /><ToolRow title="ดูการโยกเงิน" href="/game-transfers" description="ดูว่าเงินเข้าเกม/กลับวอเลตสำเร็จไหม" /></AdminStack></AdminCard></AdminGrid>
    <AdminToolbar><strong>ล่าสุด</strong><span style={mutedStyle}>ดูภาพรวมเร็ว ๆ ไม่ต้องเข้าไปไล่ทุกหน้าเหมือนตามหารีโมตทีวี</span></AdminToolbar>
    <AdminGrid><RecentCard title="โยกเงินล่าสุด" items={control.recent?.transfers ?? []} render={(item) => <AdminRow key={item.id}><div><strong>{transferLabel(item.type)} · {formatMoney(item.amount, item.currency ?? 'THB')}</strong><p style={mutedStyle}>{item.user?.username ?? item.user?.phone ?? '-'} · {item.provider?.name ?? item.provider?.code ?? '-'}</p></div><div style={rightStyle}><AdminBadge tone={statusTone(item.status)}>{humanStatus(item.status)}</AdminBadge><AdminLinkButton href={`/game-transfers/${item.id}`}>ดู</AdminLinkButton></div></AdminRow>} /><RecentCard title="ปัญหาล่าสุด" items={control.recent?.alerts ?? []} render={(item) => <AdminRow key={item.id}><div><strong>{item.title ?? item.type}</strong><p style={mutedStyle}>{item.refType ?? '-'} · {item.refId ?? '-'}</p></div><div style={rightStyle}><AdminBadge tone={severityTone(item.severity)}>{humanSeverity(item.severity)}</AdminBadge><AdminLinkButton href={`/risk-alerts/${item.id}`}>ดู</AdminLinkButton></div></AdminRow>} /><RecentCard title="รายการเงินล่าสุด" items={control.recent?.ledgers ?? []} render={(item) => <AdminRow key={item.id}><div><strong>{item.direction === 'CREDIT' ? 'เงินเข้า' : 'เงินออก'} · {formatMoney(item.amount, 'THB')}</strong><p style={mutedStyle}>{item.user?.username ?? item.user?.phone ?? '-'} · {item.referenceType ?? '-'}</p></div><div style={rightStyle}><AdminBadge tone={item.direction === 'CREDIT' ? 'success' : 'warning'}>{ledgerLabel(item.type)}</AdminBadge><AdminLinkButton href={`/wallet-ledgers/${item.id}`}>ดู</AdminLinkButton></div></AdminRow>} /></AdminGrid>
    <AdminToolbar><strong>เมนูทั้งหมด</strong><span style={mutedStyle}>เมนูขั้นสูงยังอยู่ แต่ไม่เอาไปกองให้คนใช้งานหลักสับสน</span></AdminToolbar>
    <AdminGrid>{quickGroups.map((group) => <AdminCard key={group.title} title={group.title}><AdminStack>{group.items.map(([title, href]) => <AdminRow key={href}><strong>{title}</strong><div style={rightStyle}><AdminBadge tone={group.tone}>{group.title}</AdminBadge><AdminLinkButton href={href}>เปิด</AdminLinkButton></div></AdminRow>)}</AdminStack></AdminCard>)}</AdminGrid>
  </AdminPage>;
}
function QueueRow({ title, count, href, tone }: { title: string; count: number; href: string; tone: 'warning' | 'danger' | 'success' | 'neutral' }) { return <AdminRow><div><strong>{title}</strong><p style={mutedStyle}>{count > 0 ? 'ต้องจัดการ' : 'ยังไม่มีงานค้าง'}</p></div><div style={rightStyle}><AdminBadge tone={count > 0 ? tone : 'success'}>{count}</AdminBadge><AdminLinkButton href={href}>เปิด</AdminLinkButton></div></AdminRow>; }
function ToolRow({ title, description, href }: { title: string; description: string; href: string }) { return <AdminRow><div><strong>{title}</strong><p style={mutedStyle}>{description}</p></div><AdminLinkButton href={href}>เปิด</AdminLinkButton></AdminRow>; }
function RecentCard({ title, items, render }: { title: string; items: any[]; render: (item: any) => ReactNode }) { return <AdminCard title={title}>{items.length ? <AdminStack>{items.map(render)}</AdminStack> : <p style={mutedStyle}>ยังไม่มีข้อมูลล่าสุด</p>}</AdminCard>; }
function formatMoney(value: string | number, currency: string) { return `${currency} ${Number(value ?? 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`; }
function statusTone(status: string) { if (status === 'SUCCESS') return 'success'; if (status === 'FAILED') return 'danger'; if (status === 'PENDING') return 'warning'; return 'neutral'; }
function severityTone(severity: string) { if (severity === 'CRITICAL' || severity === 'HIGH') return 'danger'; if (severity === 'MEDIUM') return 'warning'; return 'neutral'; }
function humanStatus(status: string) { const map: Record<string, string> = { SUCCESS: 'สำเร็จ', FAILED: 'มีปัญหา', PENDING: 'กำลังทำ', REVERSED: 'คืนแล้ว', CANCELLED: 'ยกเลิก' }; return map[status] ?? status ?? '-'; }
function humanSeverity(severity: string) { const map: Record<string, string> = { CRITICAL: 'ด่วนมาก', HIGH: 'สูง', MEDIUM: 'กลาง', LOW: 'ต่ำ' }; return map[severity] ?? severity ?? '-'; }
function transferLabel(type: string) { const map: Record<string, string> = { TRANSFER_IN: 'โยกเข้าเกม', TRANSFER_OUT: 'โยกกลับวอเลต', ROLLBACK: 'คืนเงิน', SYNC: 'ซิงก์ยอด', ADJUSTMENT: 'ปรับยอด' }; return map[type] ?? type ?? 'โยกเงิน'; }
function ledgerLabel(type: string) { const map: Record<string, string> = { DEPOSIT: 'ฝาก', WITHDRAWAL: 'ถอน', TRANSFER: 'โยกเงิน', REVERSAL: 'คืนเงิน', ADJUSTMENT: 'ปรับยอด', BONUS: 'โบนัส' }; return map[type] ?? type ?? '-'; }
const mutedStyle = { margin: 0, color: '#94a3b8', lineHeight: 1.55 } as const;
const rightStyle = { display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap' as const };
