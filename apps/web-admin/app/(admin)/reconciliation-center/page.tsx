'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminEmpty, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminRow, AdminStack, AdminToolbar } from '../_components/admin-ui';

type Snapshot = { id: string; status: string; systemBalance: string; providerBalance: string; difference: string; checkedAt: string; user?: { username?: string | null; phone?: string | null } | null; provider?: { name?: string | null; code?: string | null } | null; rawPayload?: any };

type Payload = { items?: Snapshot[]; summary?: { total: number; matched: number; mismatch: number; unknown: number } };

export default function ReconciliationCenterPage() {
  const [payload, setPayload] = useState<Payload>({});
  const [sessionId, setSessionId] = useState('');
  const [message, setMessage] = useState('กำลังโหลด reconciliation...');
  const [loading, setLoading] = useState(false);
  const items = payload.items ?? [];
  const summary = useMemo(() => payload.summary ?? { total: items.length, matched: items.filter((i) => i.status === 'MATCHED').length, mismatch: items.filter((i) => i.status === 'MISMATCH').length, unknown: items.filter((i) => i.status === 'UNKNOWN').length }, [payload.summary, items]);
  useEffect(() => { load(); }, []);
  async function load() { setLoading(true); const res = await adminApiFetch('/admin/provider-wallet-snapshots'); const data = await res.json().catch(() => null); setLoading(false); if (!res.ok) { setMessage(data?.message ?? 'โหลด reconciliation ไม่สำเร็จ'); return; } setPayload(data ?? {}); setMessage(''); }
  async function runReconcile() { if (!sessionId.trim()) { setMessage('กรอก session id ก่อน'); return; } setLoading(true); const res = await adminApiFetch(`/admin/game-sessions/${sessionId.trim()}/reconcile`, { method: 'POST' }); const data = await res.json().catch(() => null); setLoading(false); if (!res.ok) { setMessage(data?.message ?? 'run reconcile ไม่สำเร็จ'); return; } setMessage(data.ok ? 'Reconcile MATCHED' : `Reconcile ${data.snapshot?.status ?? 'UNKNOWN'} · diff ${data.snapshot?.difference ?? '-'}`); setSessionId(''); await load(); }
  async function reviewSnapshot(item: Snapshot, status: 'REVIEWING' | 'RESOLVED') { const note = window.prompt(status === 'RESOLVED' ? 'Resolve note' : 'Review note'); if (!note) return; setLoading(true); const res = await adminApiFetch(`/admin/provider-wallet-snapshots/${item.id}/review`, { method: 'PATCH', body: JSON.stringify({ note, status }) }); const data = await res.json().catch(() => null); setLoading(false); if (!res.ok) { setMessage(data?.message ?? 'บันทึก review ไม่สำเร็จ'); return; } setMessage(status === 'RESOLVED' ? 'resolve mismatch แล้ว' : 'บันทึก review แล้ว'); await load(); }
  return <AdminPage eyebrow="Money" title="Reconciliation Center" description="เทียบยอด systemBalance/providerBalance, ตรวจ mismatch และ resolve snapshot" actions={<AdminButton onClick={load} disabled={loading}>Refresh</AdminButton>}>
    {message && <AdminNotice>{message}</AdminNotice>}
    <AdminMetricGrid><AdminMetric title="Snapshots" value={String(summary.total)} helper="latest" /><AdminMetric title="Matched" value={String(summary.matched)} helper="ยอดตรง" /><AdminMetric title="Mismatch" value={String(summary.mismatch)} helper="ต้องตรวจ" /><AdminMetric title="Unknown" value={String(summary.unknown)} helper="provider ตอบไม่ชัด" /></AdminMetricGrid>
    <AdminCard title="Run Reconcile" description="กรอก Game Session ID เพื่อเทียบยอด session นั้นกับ provider"><div style={formStyle}><input value={sessionId} onChange={(event) => setSessionId(event.target.value)} placeholder="game session id" style={inputStyle} /><AdminButton onClick={runReconcile} disabled={loading}>Run</AdminButton></div></AdminCard>
    <AdminToolbar><strong>Snapshots</strong><span style={mutedStyle}>ถ้า difference ไม่ใช่ 0 ต้อง review ก่อน ไม่ใช่กดผ่านด้วยศรัทธา</span></AdminToolbar>
    <AdminStack>{items.map((item) => <AdminCard key={item.id}><AdminRow><div><strong>{item.provider?.name ?? item.provider?.code ?? '-'}</strong><p style={mutedStyle}>{item.user?.username ?? item.user?.phone ?? '-'} · {new Date(item.checkedAt).toLocaleString('th-TH')}</p><p style={smallStyle}>system {formatMoney(item.systemBalance)} · provider {formatMoney(item.providerBalance)} · diff {formatMoney(item.difference)}</p></div><div style={actionsStyle}><AdminBadge tone={statusTone(item.status)}>{item.status}</AdminBadge>{item.status !== 'MATCHED' && <AdminButton tone="secondary" onClick={() => reviewSnapshot(item, 'REVIEWING')}>Review</AdminButton>}{item.status !== 'MATCHED' && <AdminButton tone="success" onClick={() => reviewSnapshot(item, 'RESOLVED')}>Resolve</AdminButton>}</div></AdminRow><details style={detailsStyle}><summary>raw payload</summary><pre style={preStyle}>{JSON.stringify(item.rawPayload ?? {}, null, 2)}</pre></details></AdminCard>)}{!loading && items.length === 0 && <AdminEmpty>ยังไม่มี snapshot</AdminEmpty>}</AdminStack>
  </AdminPage>;
}
function statusTone(status: string) { if (status === 'MATCHED') return 'success'; if (status === 'MISMATCH') return 'danger'; if (status === 'UNKNOWN') return 'warning'; return 'neutral'; }
function formatMoney(value: string | number) { return `THB ${Number(value).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`; }
const mutedStyle = { margin: 0, color: '#94a3b8', lineHeight: 1.55 } as const;
const smallStyle = { margin: 0, color: '#64748b', fontSize: 12 } as const;
const formStyle = { display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 10 } as const;
const inputStyle = { width: '100%', minHeight: 44, borderRadius: 12, border: '1px solid rgba(148,163,184,.22)', background: '#0b1220', color: '#f8fafc', padding: '0 12px', boxSizing: 'border-box' as const, fontSize: 15 };
const actionsStyle = { display: 'flex', gap: 8, flexWrap: 'wrap' as const, justifyContent: 'flex-end' as const };
const detailsStyle = { color: '#cbd5e1' } as const;
const preStyle = { overflowX: 'auto' as const, whiteSpace: 'pre-wrap' as const, background: '#020617', borderRadius: 12, padding: 12 } as const;
