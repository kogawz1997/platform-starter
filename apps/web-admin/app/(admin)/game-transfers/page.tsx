'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminEmpty, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminRow, AdminStack, AdminToolbar } from '../_components/admin-ui';

type Transfer = { id: string; type: string; status: string; amount: string; currency: string; idempotencyKey: string; providerTransactionId?: string | null; errorCode?: string | null; errorMessage?: string | null; requestPayload?: unknown; responsePayload?: unknown; createdAt: string; user?: { username?: string | null; phone?: string | null }; provider?: { name: string; code: string }; session?: { id: string; providerSessionId?: string | null; game?: { name: string; providerGameCode: string } } };
type Payload = { items?: Transfer[]; summary?: { total: number; success: number; failed: number; pending: number } };

export default function GameTransfersPage() {
  const [payload, setPayload] = useState<Payload>({});
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [expanded, setExpanded] = useState('');
  const [message, setMessage] = useState('กำลังโหลด transfer...');
  const [loading, setLoading] = useState(false);
  const [working, setWorking] = useState('');
  useEffect(() => { loadTransfers(); }, []);
  const items = payload.items ?? [];
  const filtered = useMemo(() => items.filter((item) => (status === 'all' || item.status === status) && [item.idempotencyKey, item.providerTransactionId, item.provider?.name, item.provider?.code, item.session?.game?.name, item.user?.username, item.user?.phone].join(' ').toLowerCase().includes(query.toLowerCase())), [items, query, status]);
  const metrics = useMemo(() => payload.summary ?? { total: items.length, success: items.filter((item) => item.status === 'SUCCESS').length, failed: items.filter((item) => item.status === 'FAILED').length, pending: items.filter((item) => item.status === 'PENDING').length }, [payload.summary, items]);
  async function loadTransfers() { setLoading(true); setMessage('กำลังโหลด transfer...'); const res = await adminApiFetch('/admin/game-transfers'); const data = await res.json().catch(() => null); setLoading(false); if (!res.ok) { setMessage(data?.message ?? 'โหลด transfer ไม่สำเร็จ'); return; } setPayload(data ?? {}); setMessage(''); }
  async function reviewTransfer(item: Transfer) { const note = window.prompt('Review note'); if (!note) return; setWorking(item.id); const res = await adminApiFetch(`/admin/game-transfers/${item.id}/review`, { method: 'PATCH', body: JSON.stringify({ note }) }); const data = await res.json().catch(() => null); setWorking(''); if (!res.ok) { setMessage(data?.message ?? 'review transfer ไม่สำเร็จ'); return; } setMessage('บันทึก review แล้ว'); await loadTransfers(); }
  async function retryTransfer(item: Transfer) { const note = window.prompt('Retry note'); if (!note) return; setWorking(item.id); const res = await adminApiFetch(`/admin/game-transfers/${item.id}/retry-dry-run`, { method: 'POST', body: JSON.stringify({ note }) }); const data = await res.json().catch(() => null); setWorking(''); if (!res.ok || !data?.ok) { setMessage(data?.message ?? data?.errorMessage ?? 'retry dry-run ไม่สำเร็จ'); return; } setMessage(`retry สำเร็จ: ${data.transfer?.id ?? '-'}`); await loadTransfers(); }
  return <AdminPage eyebrow="Game Platform" title="Game Transfers" description="ดู dry-run transfer log ก่อนเปิดเงินจริง" actions={<AdminButton onClick={loadTransfers} disabled={loading}>Refresh</AdminButton>}>
    <AdminMetricGrid><AdminMetric title="Transfers" value={String(metrics.total)} helper="latest 100" /><AdminMetric title="Success" value={String(metrics.success)} helper="dry-run success" /><AdminMetric title="Pending" value={String(metrics.pending)} helper="waiting" /><AdminMetric title="Failed" value={String(metrics.failed)} helper="failed" /></AdminMetricGrid>
    {message && <AdminNotice>{message}</AdminNotice>}
    <AdminToolbar><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="search idempotency / tx / user / provider" style={inputStyle} /><select value={status} onChange={(event) => setStatus(event.target.value)} style={inputStyle}><option value="all">All status</option><option value="SUCCESS">SUCCESS</option><option value="FAILED">FAILED</option><option value="PENDING">PENDING</option></select><span style={mutedStyle}>{loading ? 'Loading...' : `${filtered.length}/${items.length} transfers`}</span></AdminToolbar>
    <AdminStack>{filtered.map((item) => <AdminCard key={item.id}><AdminRow><div><h2 style={titleStyle}>{item.type} · {item.amount} {item.currency}</h2><p style={mutedStyle}>{item.provider?.name ?? '-'} · {item.session?.game?.name ?? '-'} · user {item.user?.username ?? item.user?.phone ?? '-'}</p><p style={smallMutedStyle}>idempotency: {item.idempotencyKey}</p><p style={smallMutedStyle}>providerTx: {item.providerTransactionId ?? '-'}</p></div><div style={badgeStackStyle}><AdminBadge tone={statusTone(item.status)}>{item.status}</AdminBadge><AdminButton tone="secondary" onClick={() => setExpanded(expanded === item.id ? '' : item.id)}>{expanded === item.id ? 'Hide payload' : 'Payload'}</AdminButton><AdminButton tone="secondary" onClick={() => reviewTransfer(item)} disabled={working === item.id}>{working === item.id ? 'Working...' : 'Review'}</AdminButton>{item.status === 'FAILED' && <AdminButton tone="secondary" onClick={() => retryTransfer(item)} disabled={working === item.id}>Retry dry-run</AdminButton>}</div></AdminRow>{item.errorMessage && <AdminNotice>{item.errorCode ?? 'ERROR'}: {item.errorMessage}</AdminNotice>}{expanded === item.id && <pre style={preStyle}>{JSON.stringify({ requestPayload: item.requestPayload, responsePayload: item.responsePayload }, null, 2)}</pre>}<p style={smallMutedStyle}>created {new Date(item.createdAt).toLocaleString('th-TH')}</p></AdminCard>)}{!loading && filtered.length === 0 && <AdminEmpty>ยังไม่มี game transfer</AdminEmpty>}</AdminStack>
  </AdminPage>;
}
function statusTone(status: string) { if (status === 'SUCCESS') return 'success'; if (status === 'FAILED') return 'danger'; if (status === 'PENDING') return 'warning'; return 'neutral'; }
const inputStyle = { width: '100%', minHeight: 44, borderRadius: 12, border: '1px solid rgba(148,163,184,.22)', background: '#0b1220', color: '#f8fafc', padding: '0 12px', boxSizing: 'border-box' as const, fontSize: 15 };
const mutedStyle = { margin: 0, color: '#94a3b8', lineHeight: 1.55 } as const;
const smallMutedStyle = { margin: 0, color: '#64748b', fontSize: 12 } as const;
const titleStyle = { margin: 0, fontSize: 22, lineHeight: 1.12 } as const;
const badgeStackStyle = { display: 'flex', gap: 8, flexWrap: 'wrap' as const, justifyContent: 'flex-end' as const };
const preStyle = { margin: 0, padding: 12, borderRadius: 14, background: '#020617', border: '1px solid rgba(148,163,184,.18)', color: '#cbd5e1', overflowX: 'auto' as const, fontSize: 12, lineHeight: 1.5 };
