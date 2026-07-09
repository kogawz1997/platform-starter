'use client';

import { useEffect, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminEmpty, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminRow, AdminStack, AdminToolbar } from '../_components/admin-ui';

type Provider = { id: string; name: string; code: string; status: string };
type RiskPanel = { provider?: Provider; status: string; flags: Record<string, boolean>; checks: Array<{ key: string; ok: boolean }>; failedTransferCount: number; duplicateWebhookCount: number; latestSnapshot?: { status: string; difference: string; checkedAt: string } | null };

export default function ProviderRiskPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [providerId, setProviderId] = useState('');
  const [panel, setPanel] = useState<RiskPanel | null>(null);
  const [message, setMessage] = useState('กำลังโหลด provider...');
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadProviders(); }, []);

  async function loadProviders() {
    setLoading(true); setMessage('กำลังโหลด provider...');
    const res = await adminApiFetch('/admin/game-providers');
    const data = await res.json().catch(() => null);
    setLoading(false);
    if (!res.ok) { setMessage(data?.message ?? 'โหลด provider ไม่สำเร็จ'); return; }
    const items = data.items ?? [];
    setProviders(items);
    const first = items[0]?.id ?? '';
    setProviderId(first);
    setMessage('');
    if (first) await loadRisk(first);
  }

  async function loadRisk(id = providerId) {
    if (!id) return;
    setLoading(true); setMessage('กำลังโหลด risk panel...');
    const res = await adminApiFetch(`/admin/game-providers/${id}/risk-panel`);
    const data = await res.json().catch(() => null);
    setLoading(false);
    if (!res.ok) { setMessage(data?.message ?? 'โหลด risk panel ไม่สำเร็จ'); return; }
    setPanel(data); setMessage('');
  }

  const passed = panel?.checks.filter((item) => item.ok).length ?? 0;
  const total = panel?.checks.length ?? 0;

  return <AdminPage eyebrow="Game Platform" title="Provider Risk Panel" description="สรุป readiness, feature gates, mismatch และ risk ก่อนเปิดเงินจริง" actions={<AdminButton onClick={() => loadRisk()} disabled={loading || !providerId}>Refresh</AdminButton>}>
    {message && <AdminNotice>{message}</AdminNotice>}
    <AdminCard title="Select provider" description="เลือก provider ที่ต้องการตรวจความพร้อม"><div style={rowStyle}><select value={providerId} onChange={(event) => { setProviderId(event.target.value); loadRisk(event.target.value); }} style={inputStyle}>{providers.map((provider) => <option key={provider.id} value={provider.id}>{provider.name} ({provider.code})</option>)}</select></div></AdminCard>
    {panel && <><AdminMetricGrid><AdminMetric title="Status" value={panel.status} helper="risk status" /><AdminMetric title="Checks" value={`${passed}/${total}`} helper="readiness passed" /><AdminMetric title="Failed Transfers" value={String(panel.failedTransferCount)} helper="needs review" /><AdminMetric title="Duplicate Webhooks" value={String(panel.duplicateWebhookCount)} helper="idempotency" /></AdminMetricGrid><AdminCard title={panel.provider?.name ?? 'Provider'} description="Feature gates"><AdminStack>{Object.entries(panel.flags).map(([key, value]) => <AdminRow key={key}><strong>{key}</strong><AdminBadge tone={value ? 'warning' : 'success'}>{String(value)}</AdminBadge></AdminRow>)}</AdminStack>{panel.latestSnapshot && <AdminNotice>Latest reconciliation: {panel.latestSnapshot.status} · diff {panel.latestSnapshot.difference}</AdminNotice>}</AdminCard><AdminToolbar><strong>Readiness checks</strong><span style={mutedStyle}>{passed}/{total} passed</span></AdminToolbar><AdminStack>{panel.checks.map((item) => <AdminCard key={item.key}><AdminRow><strong>{item.key}</strong><AdminBadge tone={item.ok ? 'success' : 'danger'}>{item.ok ? 'PASS' : 'BLOCKED'}</AdminBadge></AdminRow></AdminCard>)}</AdminStack></>}
    {!loading && !panel && <AdminEmpty>ยังไม่มี risk panel</AdminEmpty>}
  </AdminPage>;
}

const rowStyle = { display: 'grid', gap: 10 } as const;
const inputStyle = { width: '100%', minHeight: 44, borderRadius: 12, border: '1px solid rgba(148,163,184,.22)', background: '#0b1220', color: '#f8fafc', padding: '0 12px', boxSizing: 'border-box' as const, fontSize: 15 };
const mutedStyle = { margin: 0, color: '#94a3b8', lineHeight: 1.55 } as const;
