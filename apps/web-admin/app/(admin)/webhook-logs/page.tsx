'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminEmpty, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminRow, AdminStack, AdminToolbar } from '../_components/admin-ui';

type WebhookLog = { id: string; eventType: string; status: string; signatureValid: boolean; idempotencyKey?: string | null; providerTransactionId?: string | null; responseStatus?: number | null; errorCode?: string | null; errorMessage?: string | null; createdAt: string; provider?: { name: string; code: string } };
type Payload = { items?: WebhookLog[]; summary?: { total: number; processed: number; failed: number; duplicate: number } };

export default function WebhookLogsPage() {
  const [payload, setPayload] = useState<Payload>({});
  const [message, setMessage] = useState('กำลังโหลด webhook logs...');
  const [loading, setLoading] = useState(false);
  useEffect(() => { loadLogs(); }, []);
  const items = payload.items ?? [];
  const metrics = useMemo(() => payload.summary ?? { total: items.length, processed: items.filter((item) => item.status === 'PROCESSED').length, failed: items.filter((item) => item.status === 'FAILED').length, duplicate: items.filter((item) => item.status === 'DUPLICATE').length }, [payload.summary, items]);
  async function loadLogs() { setLoading(true); setMessage('กำลังโหลด webhook logs...'); const res = await adminApiFetch('/admin/webhook-logs'); const data = await res.json().catch(() => null); setLoading(false); if (!res.ok) { setMessage(data?.message ?? 'โหลด webhook logs ไม่สำเร็จ'); return; } setPayload(data ?? {}); setMessage(''); }
  return <AdminPage eyebrow="Game Platform" title="Webhook Logs" description="ดู provider webhook receive-only log ยังไม่ปรับยอดเงินจริง" actions={<AdminButton onClick={loadLogs} disabled={loading}>Refresh</AdminButton>}>
    <AdminMetricGrid><AdminMetric title="Logs" value={String(metrics.total)} helper="latest 100" /><AdminMetric title="Processed" value={String(metrics.processed)} helper="accepted" /><AdminMetric title="Duplicate" value={String(metrics.duplicate)} helper="idempotency" /><AdminMetric title="Failed" value={String(metrics.failed)} helper="invalid/error" /></AdminMetricGrid>
    {message && <AdminNotice>{message}</AdminNotice>}
    <AdminToolbar><strong>Webhook log</strong><span style={mutedStyle}>{loading ? 'Loading...' : `${items.length} logs loaded`}</span></AdminToolbar>
    <AdminStack>{items.map((item) => <AdminCard key={item.id}><AdminRow><div><h2 style={titleStyle}>{item.eventType}</h2><p style={mutedStyle}>{item.provider?.name ?? '-'} · response {item.responseStatus ?? '-'}</p><p style={smallMutedStyle}>idempotency: {item.idempotencyKey ?? '-'}</p><p style={smallMutedStyle}>providerTx: {item.providerTransactionId ?? '-'}</p></div><div style={badgeStackStyle}><AdminBadge tone={statusTone(item.status)}>{item.status}</AdminBadge><AdminBadge tone={item.signatureValid ? 'success' : 'warning'}>{item.signatureValid ? 'VALID' : 'INVALID'}</AdminBadge></div></AdminRow>{item.errorMessage && <AdminNotice>{item.errorCode ?? 'ERROR'}: {item.errorMessage}</AdminNotice>}<p style={smallMutedStyle}>created {new Date(item.createdAt).toLocaleString('th-TH')}</p></AdminCard>)}{!loading && items.length === 0 && <AdminEmpty>ยังไม่มี webhook log</AdminEmpty>}</AdminStack>
  </AdminPage>;
}
function statusTone(status: string) { if (status === 'PROCESSED') return 'success'; if (status === 'FAILED') return 'danger'; if (status === 'DUPLICATE') return 'warning'; return 'neutral'; }
const mutedStyle = { margin: 0, color: '#94a3b8', lineHeight: 1.55 } as const;
const smallMutedStyle = { margin: 0, color: '#64748b', fontSize: 12 } as const;
const titleStyle = { margin: 0, fontSize: 22, lineHeight: 1.12 } as const;
const badgeStackStyle = { display: 'flex', gap: 8, flexWrap: 'wrap' as const, justifyContent: 'flex-end' as const };
