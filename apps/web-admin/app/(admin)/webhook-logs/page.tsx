'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminEmpty, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminRow, AdminStack, AdminToolbar } from '../_components/admin-ui';

type WebhookLog = { id: string; eventType: string; status: string; signatureValid: boolean; idempotencyKey?: string | null; providerTransactionId?: string | null; responseStatus?: number | null; errorCode?: string | null; errorMessage?: string | null; rawPayload?: unknown; normalizedPayload?: unknown; createdAt: string; provider?: { name: string; code: string } };
type Payload = { items?: WebhookLog[]; summary?: { total: number; processed: number; failed: number; duplicate: number } };

export default function WebhookLogsPage() {
  const [payload, setPayload] = useState<Payload>({});
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [expanded, setExpanded] = useState('');
  const [message, setMessage] = useState('กำลังโหลด webhook logs...');
  const [loading, setLoading] = useState(false);
  useEffect(() => { loadLogs(); }, []);
  const items = payload.items ?? [];
  const filtered = useMemo(() => items.filter((item) => (status === 'all' || item.status === status) && [item.eventType, item.idempotencyKey, item.providerTransactionId, item.provider?.name, item.provider?.code].join(' ').toLowerCase().includes(query.toLowerCase())), [items, query, status]);
  const metrics = useMemo(() => payload.summary ?? { total: items.length, processed: items.filter((item) => item.status === 'PROCESSED').length, failed: items.filter((item) => item.status === 'FAILED').length, duplicate: items.filter((item) => item.status === 'DUPLICATE').length }, [payload.summary, items]);
  async function loadLogs() { setLoading(true); setMessage('กำลังโหลด webhook logs...'); const res = await adminApiFetch('/admin/webhook-logs'); const data = await res.json().catch(() => null); setLoading(false); if (!res.ok) { setMessage(data?.message ?? 'โหลด webhook logs ไม่สำเร็จ'); return; } setPayload(data ?? {}); setMessage(''); }
  return <AdminPage eyebrow="Game Platform" title="Webhook Logs" description="ดู provider webhook receive-only log ยังไม่ปรับยอดเงินจริง" actions={<AdminButton onClick={loadLogs} disabled={loading}>Refresh</AdminButton>}>
    <AdminMetricGrid><AdminMetric title="Logs" value={String(metrics.total)} helper="latest 100" /><AdminMetric title="Processed" value={String(metrics.processed)} helper="accepted" /><AdminMetric title="Duplicate" value={String(metrics.duplicate)} helper="idempotency" /><AdminMetric title="Failed" value={String(metrics.failed)} helper="invalid/error" /></AdminMetricGrid>
    {message && <AdminNotice>{message}</AdminNotice>}
    <AdminToolbar><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="search idempotency / tx / provider" style={inputStyle} /><select value={status} onChange={(event) => setStatus(event.target.value)} style={inputStyle}><option value="all">All status</option><option value="PROCESSED">PROCESSED</option><option value="FAILED">FAILED</option><option value="DUPLICATE">DUPLICATE</option></select><span style={mutedStyle}>{loading ? 'Loading...' : `${filtered.length}/${items.length} logs`}</span></AdminToolbar>
    <AdminStack>{filtered.map((item) => <AdminCard key={item.id}><AdminRow><div><h2 style={titleStyle}>{item.eventType}</h2><p style={mutedStyle}>{item.provider?.name ?? '-'} · response {item.responseStatus ?? '-'}</p><p style={smallMutedStyle}>idempotency: {item.idempotencyKey ?? '-'}</p><p style={smallMutedStyle}>providerTx: {item.providerTransactionId ?? '-'}</p></div><div style={badgeStackStyle}><AdminBadge tone={statusTone(item.status)}>{item.status}</AdminBadge><AdminBadge tone={item.signatureValid ? 'success' : 'warning'}>{item.signatureValid ? 'VALID' : 'INVALID'}</AdminBadge><AdminButton tone="secondary" onClick={() => setExpanded(expanded === item.id ? '' : item.id)}>{expanded === item.id ? 'Hide payload' : 'Payload'}</AdminButton></div></AdminRow>{item.errorMessage && <AdminNotice>{item.errorCode ?? 'ERROR'}: {item.errorMessage}</AdminNotice>}{expanded === item.id && <pre style={preStyle}>{JSON.stringify({ rawPayload: item.rawPayload, normalizedPayload: item.normalizedPayload }, null, 2)}</pre>}<p style={smallMutedStyle}>created {new Date(item.createdAt).toLocaleString('th-TH')}</p></AdminCard>)}{!loading && filtered.length === 0 && <AdminEmpty>ยังไม่มี webhook log</AdminEmpty>}</AdminStack>
  </AdminPage>;
}
function statusTone(status: string) { if (status === 'PROCESSED') return 'success'; if (status === 'FAILED') return 'danger'; if (status === 'DUPLICATE') return 'warning'; return 'neutral'; }
const inputStyle = { width: '100%', minHeight: 44, borderRadius: 12, border: '1px solid rgba(148,163,184,.22)', background: '#0b1220', color: '#f8fafc', padding: '0 12px', boxSizing: 'border-box' as const, fontSize: 15 };
const mutedStyle = { margin: 0, color: '#94a3b8', lineHeight: 1.55 } as const;
const smallMutedStyle = { margin: 0, color: '#64748b', fontSize: 12 } as const;
const titleStyle = { margin: 0, fontSize: 22, lineHeight: 1.12 } as const;
const badgeStackStyle = { display: 'flex', gap: 8, flexWrap: 'wrap' as const, justifyContent: 'flex-end' as const };
const preStyle = { margin: 0, padding: 12, borderRadius: 14, background: '#020617', border: '1px solid rgba(148,163,184,.18)', color: '#cbd5e1', overflowX: 'auto' as const, fontSize: 12, lineHeight: 1.5 };
