'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminEmpty, AdminGrid, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminRow, AdminStack, AdminToolbar } from '../_components/admin-ui';

type Agent = { id: string; referralCode: string; displayName: string; status: string; member?: { username?: string | null; phone?: string | null; email?: string | null } };
type Commission = { id: string; agentProfileId: string; referralCode: string; amount: number; currency: string; basis: string; note?: string; status: string; payoutStatus: string; member?: { username?: string | null; phone?: string | null; email?: string | null }; createdAt: string };

export default function CommissionLedgersPage() {
  const [items, setItems] = useState<Commission[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [status, setStatus] = useState('ALL');
  const [agentProfileId, setAgentProfileId] = useState('');
  const [amount, setAmount] = useState('');
  const [basis, setBasis] = useState('manual_adjustment');
  const [note, setNote] = useState('');
  const [message, setMessage] = useState('กำลังโหลด commission...');
  const [busyId, setBusyId] = useState('');
  useEffect(() => { load(); }, [status]);
  const stats = useMemo(() => ({ pending: items.filter((item) => item.status === 'PENDING').length, approved: items.filter((item) => item.status === 'APPROVED').length, rejected: items.filter((item) => item.status === 'REJECTED').length, total: items.reduce((sum, item) => sum + Number(item.amount || 0), 0) }), [items]);
  async function load() { setMessage('กำลังโหลด commission...'); const params = new URLSearchParams(); if (status !== 'ALL') params.set('status', status); const [commissionRes, agentRes] = await Promise.all([adminApiFetch(`/admin/commission-ledgers?${params.toString()}`), adminApiFetch('/admin/affiliates?status=RESOLVED')]); const commissionData = await commissionRes.json().catch(() => null); const agentData = await agentRes.json().catch(() => null); if (!commissionRes.ok) { setMessage(commissionData?.message ?? 'โหลด commission ไม่สำเร็จ'); return; } setItems(commissionData.items ?? []); if (agentRes.ok) setAgents(agentData.items ?? []); setMessage(''); }
  async function create() { if (!agentProfileId || Number(amount) <= 0) { setMessage('กรุณาเลือกตัวแทนและใส่ยอด commission'); return; } setBusyId('create'); const res = await adminApiFetch('/admin/commission-ledgers', { method: 'POST', body: JSON.stringify({ agentProfileId, amount: Number(amount), basis, note }) }); const data = await res.json().catch(() => null); setBusyId(''); if (!res.ok) { setMessage(data?.message ?? 'สร้าง commission ไม่สำเร็จ'); return; } setItems((current) => [data.item, ...current]); setAmount(''); setNote(''); setMessage('สร้าง commission แล้ว ยังไม่ payout จริง'); }
  async function review(id: string, next: 'APPROVED' | 'REJECTED') { setBusyId(id); const res = await adminApiFetch(`/admin/commission-ledgers/${id}/review`, { method: 'PATCH', body: JSON.stringify({ status: next, adminNote: next === 'REJECTED' ? 'ปฏิเสธจากหน้า Commission' : 'อนุมัติจากหน้า Commission' }) }); const data = await res.json().catch(() => null); setBusyId(''); if (!res.ok) { setMessage(data?.message ?? 'ตรวจ commission ไม่สำเร็จ'); return; } setItems((current) => current.map((item) => item.id === id ? data.item : item)); setMessage(next === 'APPROVED' ? 'อนุมัติ commission แล้ว แต่ payout ยังปิดอยู่' : 'ปฏิเสธ commission แล้ว'); }
  return <AdminPage eyebrow="Affiliate Ops" title="Commission Ledger" description="สร้างและตรวจ commission แบบ ledger review เท่านั้น ยังไม่จ่ายเงินจริงเข้า wallet" actions={<AdminButton onClick={load}>รีเฟรช</AdminButton>}>
    {message && <AdminNotice>{message}</AdminNotice>}
    <AdminMetricGrid><AdminMetric tone="warning" title="รอตรวจ" value={String(stats.pending)} /><AdminMetric tone="success" title="อนุมัติ" value={String(stats.approved)} /><AdminMetric tone="danger" title="ปฏิเสธ" value={String(stats.rejected)} /><AdminMetric tone="warning" title="ยอดรวม" value={money(stats.total)} /></AdminMetricGrid>
    <AdminCard title="สร้าง Commission" tone="warning"><div style={formGridStyle}><select value={agentProfileId} onChange={(event) => setAgentProfileId(event.target.value)} style={inputStyle}><option value="">เลือกตัวแทนที่อนุมัติแล้ว</option>{agents.map((agent) => <option key={agent.id} value={agent.id}>{agent.displayName} · {agent.referralCode}</option>)}</select><input type="number" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="ยอด commission" style={inputStyle} /><input value={basis} onChange={(event) => setBasis(event.target.value)} placeholder="basis" style={inputStyle} /><input value={note} onChange={(event) => setNote(event.target.value)} placeholder="หมายเหตุ" style={inputStyle} /><AdminButton disabled={busyId === 'create'} onClick={create}>สร้าง</AdminButton></div></AdminCard>
    <AdminToolbar><select value={status} onChange={(event) => setStatus(event.target.value)} style={inputStyle}><option value="ALL">ทุกสถานะ</option><option value="OPEN">รอตรวจ</option><option value="REVIEWING">กำลังตรวจ</option><option value="RESOLVED">อนุมัติ</option><option value="DISMISSED">ปฏิเสธ</option></select></AdminToolbar>
    <AdminGrid>{items.map((item) => <AdminCard key={item.id} title={`${item.referralCode} · ${money(item.amount)}`} description={`${memberLabel(item)} · ${new Date(item.createdAt).toLocaleString('th-TH')}`} tone={item.status === 'APPROVED' ? 'success' : item.status === 'REJECTED' ? 'danger' : 'warning'}><AdminStack><AdminRow><strong>สถานะ</strong><AdminBadge tone={statusTone(item.status)}>{statusLabel(item.status)}</AdminBadge></AdminRow><AdminRow><strong>Basis</strong><span>{item.basis}</span></AdminRow><AdminRow><strong>Payout</strong><span>{item.payoutStatus}</span></AdminRow>{item.note && <AdminRow><strong>หมายเหตุ</strong><span>{item.note}</span></AdminRow>}<div style={actionRowStyle}><AdminButton disabled={busyId === item.id} tone="secondary" onClick={() => review(item.id, 'APPROVED')}>อนุมัติ</AdminButton><AdminButton disabled={busyId === item.id} tone="danger" onClick={() => review(item.id, 'REJECTED')}>ปฏิเสธ</AdminButton></div></AdminStack></AdminCard>)}{items.length === 0 && <AdminEmpty>ยังไม่มี commission ledger</AdminEmpty>}</AdminGrid>
  </AdminPage>;
}
function memberLabel(item: Commission) { return item.member?.username ?? item.member?.phone ?? item.member?.email ?? '-'; }
function statusTone(status: string) { if (status === 'APPROVED') return 'success'; if (status === 'REJECTED') return 'danger'; if (status === 'REVIEWING') return 'warning'; return 'neutral'; }
function statusLabel(status: string) { const map: Record<string, string> = { PENDING: 'รอตรวจ', REVIEWING: 'กำลังตรวจ', APPROVED: 'อนุมัติ', REJECTED: 'ปฏิเสธ' }; return map[status] ?? status; }
function money(value: number) { return `THB ${Number(value || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`; }
const inputStyle = { minHeight: 44, borderRadius: 12, border: '1px solid rgba(148,163,184,.22)', background: '#0b1220', color: '#f8fafc', padding: '0 12px', minWidth: 0 } as const;
const formGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(180px, 100%), 1fr))', gap: 10 } as const;
const actionRowStyle = { display: 'flex', gap: 8, flexWrap: 'wrap' as const };
