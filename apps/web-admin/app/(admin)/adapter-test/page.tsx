'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminEmpty, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminRow, AdminStack, AdminToolbar } from '../_components/admin-ui';

type Provider = { id: string; name: string; code: string; status: string };
const methods = ['healthCheck', 'launchGame', 'getBalance', 'transferIn', 'transferOut', 'syncGames', 'getBetHistory', 'validateWebhook', 'parseWebhook'];
const defaults: Record<string, Record<string, unknown>> = {
  healthCheck: {}, launchGame: { userId: 'adapter-test-user', gameCode: 'demo-slot-001' }, getBalance: { userId: 'adapter-test-user' }, transferIn: { userId: 'adapter-test-user', amount: '1.00' }, transferOut: { userId: 'adapter-test-user', amount: '1.00' }, syncGames: {}, getBetHistory: {}, validateWebhook: { body: { eventType: 'adapter.test', idempotencyKey: 'adapter-test-key' } }, parseWebhook: { body: { eventType: 'adapter.test', idempotencyKey: 'adapter-test-key', providerTransactionId: 'tx_adapter_test' } },
};

export default function AdapterTestPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [providerId, setProviderId] = useState('');
  const [method, setMethod] = useState('healthCheck');
  const [payload, setPayload] = useState('{}');
  const [result, setResult] = useState<any>(null);
  const [message, setMessage] = useState('กำลังโหลด provider...');
  const [loading, setLoading] = useState(false);
  useEffect(() => { loadProviders(); }, []);
  useEffect(() => { setPayload(JSON.stringify(defaults[method] ?? {}, null, 2)); }, [method]);
  const selectedProvider = useMemo(() => providers.find((item) => item.id === providerId), [providers, providerId]);
  async function loadProviders() { setLoading(true); const res = await adminApiFetch('/admin/game-providers'); const data = await res.json().catch(() => null); setLoading(false); if (!res.ok) { setMessage(data?.message ?? 'โหลด provider ไม่สำเร็จ'); return; } const items = data.items ?? []; setProviders(items); setProviderId(items[0]?.id ?? ''); setMessage(''); }
  async function run() { if (!providerId) { setMessage('เลือก provider ก่อน'); return; } let parsed = {}; try { parsed = payload.trim() ? JSON.parse(payload) : {}; } catch { setMessage('payload ต้องเป็น JSON'); return; } setLoading(true); setMessage(`กำลังทดสอบ ${method}...`); const res = await adminApiFetch(`/admin/game-providers/${providerId}/adapter-test/${method}`, { method: 'POST', body: JSON.stringify(parsed) }); const data = await res.json().catch(() => null); setLoading(false); setResult(data); setMessage(res.ok ? `${method} completed` : data?.message ?? `${method} failed`); }
  return <AdminPage eyebrow="Game Platform" title="Adapter Test Harness" description="ทดสอบ adapter ทีละ method แบบเห็น latency, request/response sanitized และ error code ก่อนต่อค่ายจริง" actions={<AdminButton onClick={run} disabled={loading || !providerId}>{loading ? 'กำลังทดสอบ...' : 'Run Test'}</AdminButton>}>
    {message && <AdminNotice>{message}</AdminNotice>}
    <AdminMetricGrid><AdminMetric title="Provider" value={selectedProvider?.code ?? '-'} helper={selectedProvider?.name ?? 'เลือก provider'} /><AdminMetric title="Method" value={method} helper="adapter method" /><AdminMetric title="Latency" value={result?.latencyMs ? `${result.latencyMs}ms` : '-'} helper="last run" /><AdminMetric title="Result" value={result?.result?.ok === false ? 'FAILED' : result ? 'DONE' : '-'} helper="sanitized" /></AdminMetricGrid>
    <AdminCard title="Run adapter method" description="payload เป็น JSON เท่านั้น และระบบจะ redact secret/signature ให้ก่อนแสดงผล"><div style={formStyle}><label style={labelStyle}>Provider<select value={providerId} onChange={(event) => setProviderId(event.target.value)} style={inputStyle}>{providers.map((provider) => <option key={provider.id} value={provider.id}>{provider.name} ({provider.code})</option>)}</select></label><label style={labelStyle}>Method<select value={method} onChange={(event) => setMethod(event.target.value)} style={inputStyle}>{methods.map((item) => <option key={item} value={item}>{item}</option>)}</select></label><label style={labelWideStyle}>Payload JSON<textarea value={payload} onChange={(event) => setPayload(event.target.value)} style={textareaStyle} /></label></div></AdminCard>
    <AdminToolbar><strong>Result</strong><span style={mutedStyle}>ถ้าค่ายตอบแปลก ๆ ให้ดู rawResponse ที่ sanitize แล้วตรงนี้ ไม่ต้องอ่านใบชาใน console log</span></AdminToolbar>
    {result ? <AdminStack><AdminCard><AdminRow><strong>{result.method}</strong><AdminBadge tone={result?.result?.ok === false ? 'danger' : 'success'}>{result?.result?.ok === false ? 'FAILED' : 'OK'}</AdminBadge></AdminRow><pre style={preStyle}>{JSON.stringify(result, null, 2)}</pre></AdminCard></AdminStack> : <AdminEmpty>ยังไม่มีผลทดสอบ</AdminEmpty>}
  </AdminPage>;
}
const formStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(260px,100%),1fr))', gap: 12 } as const;
const labelStyle = { display: 'grid', gap: 6, color: '#94a3b8', fontSize: 12, fontWeight: 900 } as const;
const labelWideStyle = { ...labelStyle, gridColumn: '1 / -1' } as const;
const inputStyle = { width: '100%', minHeight: 44, borderRadius: 12, border: '1px solid rgba(148,163,184,.22)', background: '#0b1220', color: '#f8fafc', padding: '0 12px', boxSizing: 'border-box' as const, fontSize: 15 };
const textareaStyle = { ...inputStyle, minHeight: 190, padding: 12, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' };
const mutedStyle = { margin: 0, color: '#94a3b8', lineHeight: 1.55 } as const;
const preStyle = { overflowX: 'auto' as const, whiteSpace: 'pre-wrap' as const, background: '#020617', borderRadius: 12, padding: 12, color: '#cbd5e1', maxHeight: 620 } as const;
