'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminEmpty, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminRow, AdminStack, AdminToolbar } from '../_components/admin-ui';

type Transfer = { id: string; type: string; status: string; amount: string; currency: string; idempotencyKey: string; providerTransactionId?: string | null; errorCode?: string | null; errorMessage?: string | null; createdAt: string; user?: { username?: string | null; phone?: string | null }; provider?: { name: string; code: string }; session?: { id: string; providerSessionId?: string | null; game?: { name: string; providerGameCode: string } } };
type Payload = { items?: Transfer[]; summary?: { total: number; success: number; failed: number; pending: number } };

export default function GameTransfersPage() {
  const [payload, setPayload] = useState<Payload>({});
  const [message, setMessage] = useState('กำลังโหลด transfer...');
  const [loading, setLoading] = useState(false);
  const [working, setWorking] = useState('');
  useEffect(() => { loadTransfers(); }, []);
  const items = payload.items ?? [];
  const metrics = useMemo(() => payload.summary ?? { total: items.length, success: items.filter((item) => item.status === 'SUCCESS').length, failed: items.filter((item) => item.status === 'FAILED').length, pending: items.filter((item) => item.status === 'PENDING').length }, [payload.summary, items]);
  async function loadTransfers() { setLoading(true); setMessage('กำลังโหลด transfer...'); const res = await adminApiFetch('/admin/game-transfers'); const data = await res.json().catch(() => null); setLoading(false); if (!res.ok) { setMessage(data?.message ?? 'โหลด transfer ไม่สำเร็จ'); return; } setPayload(data ?? {}); setMessage(''); }
  async function reviewTransfer(item: Transfer) { const note = window.prompt('Review note'); if (!note) return; setWorking(item.id); const res = await adminApiFetch(`/admin/game-transfers/${item.id}/review`, { method: 'PATCH', body: JSON.stringify({ note }) }); const data = await res.json().catch(() => null); setWorking(''); if (!res.ok) { setMessage(data?.message ?? 'review transfer ไม่สำเร็จ'); return; } setMessage('บันทึก review แล้ว'); await loadTransfers(); }
  async function retryTransfer(item: Transfer) { const note = window.prompt('Retry note'); if (!note) return; setWorking(item.id); const res = await adminApiFetch(`/admin/game-transfers/${item.id}/retry-dry-run`, { method: 'POST', body: JSON.stringify({ note }) }); const data = await res.json().catch(() => null); setWorking(''); if (!res.ok || !data?.ok) { setMessage(data?.message ?? data?.errorMessage ?? 'retry dry-run ไม่สำเร็จ'); return; } setMessage(`retry สำเร็จ: ${data.transfer?.id ?? '-'}`); await loadTransfers(); }
  return <AdminPage eyebrow="Game Platform" title="Game Transfers" description="ดู dry-run transfer log ก่อนเปิดเงินจริง" actions={<AdminButton onClick={loadTransfers} disabled={loading}>Refresh</AdminButton>}>
    <AdminMetricGrid><AdminMetric title="Transfers" value={String(metrics.total)} helper="latest 100" /><AdminMetric title="Success" value={String(metrics.success)} helper="dry-run success" /><AdminMetric title="Pending" value={String(metrics.pending)} helper="waiting" /><AdminMetric title="Failed" value={String(metrics.failed)} helper="failed" /></AdminMetricGrid>
    {message && <AdminNotice>{message}</AdminNotice>}
    <AdminToolbar><strong>Transfer log</strong><span style={mutedStyle}>{loading ? 'Loading...' : `${items.length} transfers loaded`}</span></AdminToolbar>
    <AdminStack>{items.map((item) => <AdminCard key={item.id}><AdminRow><div><h2 style={titleStyle}>{item.type} · {item.amount} {item.currency}</h2><p style={mutedStyle}>{item.provider?.name ?? '-'} · {item.session?.game?.name ?? '-'} · user {item.user?.username ?? item.user?.phone ?? '-'}</p><p style={smallMutedStyle}>idempotency: {item.idempotencyKey}</p><p style={smallMutedStyle}>providerTx: {item.providerTransactionId ?? '-'}</p></div><div style={badgeStackStyle}><AdminBadge tone={statusTone(item.status)}>{item.status}</AdminBadge><AdminButton tone="secondary" onClick={() => reviewTransfer(item)} disabled={working === item.id}>{working === item.id ? 'Working...' : 'Review'}</AdminButton>{item.status === 'FAILED' && <AdminButton tone="warning" onClick={() => retryTransfer(item)} disabled={working === item.id}>Retry dry-run</AdminButton>}</div></AdminRow>{item.errorMessage && <AdminNotice>{item.errorCode ?? 'ERROR'}: {item.errorMessage}</AdminNotice>}<p style={smallMutedStyle}>created {new Date(item.createdAt).toLocaleString('th-TH')}</p></AdminCard>)}{!loading && items.length === 0 && <AdminEmpty>ยังไม่มี game transfer</AdminEmpty>}</AdminStack>
  </AdminPage>;
}
function statusTone(status: string) { if (status === 'SUCCESS') return 'success'; if (status === 'FAILED') return 'danger'; if (status === 'PENDING') return 'warning'; return 'neutral'; }
const mutedStyle = { margin: 0, color: '#94a3b8', lineHeight: 1.55 } as const;
const smallMutedStyle = { margin: 0, color: '#64748b', fontSize: 12 } as const;
const titleStyle = { margin: 0, fontSize: 22, lineHeight: 1.12 } as const;
const badgeStackStyle = { display: 'flex', gap: 8, flexWrap: 'wrap' as const, justifyContent: 'flex-end' as const };
