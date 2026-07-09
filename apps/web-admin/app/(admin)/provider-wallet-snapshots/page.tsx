'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminEmpty, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminRow, AdminStack, AdminToolbar } from '../_components/admin-ui';

type Snapshot = { id: string; systemBalance: string; providerBalance: string; difference: string; status: string; checkedAt: string; user?: { username?: string | null; phone?: string | null }; provider?: { name: string; code: string } };
type Payload = { items?: Snapshot[]; summary?: { total: number; matched: number; mismatch: number; unknown: number } };

export default function ProviderWalletSnapshotsPage() {
  const [payload, setPayload] = useState<Payload>({});
  const [message, setMessage] = useState('กำลังโหลด reconciliation...');
  const [loading, setLoading] = useState(false);
  useEffect(() => { loadSnapshots(); }, []);
  const items = payload.items ?? [];
  const metrics = useMemo(() => payload.summary ?? { total: items.length, matched: items.filter((item) => item.status === 'MATCHED').length, mismatch: items.filter((item) => item.status === 'MISMATCH').length, unknown: items.filter((item) => item.status === 'UNKNOWN').length }, [payload.summary, items]);
  async function loadSnapshots() { setLoading(true); setMessage('กำลังโหลด reconciliation...'); const res = await adminApiFetch('/admin/provider-wallet-snapshots'); const data = await res.json().catch(() => null); setLoading(false); if (!res.ok) { setMessage(data?.message ?? 'โหลด reconciliation ไม่สำเร็จ'); return; } setPayload(data ?? {}); setMessage(''); }
  return <AdminPage eyebrow="Game Platform" title="Reconciliation" description="ดู snapshot เทียบยอดระบบกับยอด provider ก่อนเปิดเงินจริง" actions={<AdminButton onClick={loadSnapshots} disabled={loading}>Refresh</AdminButton>}>
    <AdminMetricGrid><AdminMetric title="Snapshots" value={String(metrics.total)} helper="latest 100" /><AdminMetric title="Matched" value={String(metrics.matched)} helper="ยอดตรง" /><AdminMetric title="Mismatch" value={String(metrics.mismatch)} helper="ต้องตรวจ" /><AdminMetric title="Unknown" value={String(metrics.unknown)} helper="adapter/error" /></AdminMetricGrid>
    {message && <AdminNotice>{message}</AdminNotice>}
    <AdminToolbar><strong>Provider wallet snapshots</strong><span style={mutedStyle}>{loading ? 'Loading...' : `${items.length} snapshots loaded`}</span></AdminToolbar>
    <AdminStack>{items.map((item) => <AdminCard key={item.id}><AdminRow><div><h2 style={titleStyle}>{item.provider?.name ?? '-'} · {item.user?.username ?? item.user?.phone ?? '-'}</h2><p style={mutedStyle}>system {item.systemBalance} · provider {item.providerBalance} · diff {item.difference}</p><p style={smallMutedStyle}>checked {new Date(item.checkedAt).toLocaleString('th-TH')}</p></div><AdminBadge tone={statusTone(item.status)}>{item.status}</AdminBadge></AdminRow>{item.status === 'MISMATCH' && <AdminNotice>ยอดไม่ตรง ต้อง manual review ก่อนเปิดเงินจริง</AdminNotice>}</AdminCard>)}{!loading && items.length === 0 && <AdminEmpty>ยังไม่มี reconciliation snapshot</AdminEmpty>}</AdminStack>
  </AdminPage>;
}
function statusTone(status: string) { if (status === 'MATCHED') return 'success'; if (status === 'MISMATCH') return 'danger'; if (status === 'UNKNOWN') return 'warning'; return 'neutral'; }
const mutedStyle = { margin: 0, color: '#94a3b8', lineHeight: 1.55 } as const;
const smallMutedStyle = { margin: 0, color: '#64748b', fontSize: 12 } as const;
const titleStyle = { margin: 0, fontSize: 22, lineHeight: 1.12 } as const;
