'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminEmpty, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminRow, AdminStack, AdminToolbar } from '../_components/admin-ui';

type Provider = { id: string; name: string; code: string; status: string; walletMode?: string; currency?: string; adapterRegistered?: boolean };
type MethodName = 'healthCheck' | 'launchGame' | 'getBalance' | 'transferIn' | 'transferOut' | 'syncGames' | 'getBetHistory' | 'validateWebhook' | 'parseWebhook';
type MethodMeta = { value: MethodName; label: string; description: string; risk: 'safe' | 'money' | 'webhook' };
type TestResult = { ok?: boolean; provider?: { id: string; code: string }; method?: string; latencyMs?: number; checkedAt?: string; input?: unknown; result?: any; message?: string };

const methodOptions: MethodMeta[] = [
  { value: 'healthCheck', label: 'Health Check', description: 'เช็ก adapter/provider ว่าพร้อมตอบหรือไม่', risk: 'safe' },
  { value: 'launchGame', label: 'Launch Game', description: 'ทดสอบ launch URL และ provider session', risk: 'safe' },
  { value: 'getBalance', label: 'Get Balance', description: 'ทดสอบยอดจาก provider ถ้าค่ายรองรับ', risk: 'safe' },
  { value: 'transferIn', label: 'Transfer In', description: 'ทดสอบโยกเงินเข้าเกม ใช้ sandbox/simulator เท่านั้น', risk: 'money' },
  { value: 'transferOut', label: 'Transfer Out', description: 'ทดสอบโยกเงินกลับวอเลต ใช้ sandbox/simulator เท่านั้น', risk: 'money' },
  { value: 'syncGames', label: 'Sync Games', description: 'ทดสอบดึงรายการเกมจาก provider', risk: 'safe' },
  { value: 'getBetHistory', label: 'Bet History', description: 'ทดสอบดึงประวัติเดิมพันจาก provider', risk: 'safe' },
  { value: 'validateWebhook', label: 'Validate Webhook', description: 'ทดสอบ signature/header ของ webhook', risk: 'webhook' },
  { value: 'parseWebhook', label: 'Parse Webhook', description: 'ทดสอบแปลง payload webhook เป็น event กลาง', risk: 'webhook' },
];

const defaultPayload: Record<MethodName, string> = {
  healthCheck: '{}',
  launchGame: JSON.stringify({ userId: 'adapter-test-user', gameCode: 'demo-slot-001', returnUrl: 'https://example.com/member/games' }, null, 2),
  getBalance: JSON.stringify({ userId: 'adapter-test-user' }, null, 2),
  transferIn: JSON.stringify({ userId: 'adapter-test-user', amount: '1.00', currency: 'THB', sessionId: 'adapter-test-session' }, null, 2),
  transferOut: JSON.stringify({ userId: 'adapter-test-user', amount: '1.00', currency: 'THB', sessionId: 'adapter-test-session' }, null, 2),
  syncGames: '{}',
  getBetHistory: JSON.stringify({ from: new Date(Date.now() - 86400000).toISOString(), to: new Date().toISOString() }, null, 2),
  validateWebhook: JSON.stringify({ body: { eventType: 'adapter.test', idempotencyKey: 'adapter-test-key', providerTransactionId: 'adapter-test-tx' } }, null, 2),
  parseWebhook: JSON.stringify({ body: { eventType: 'adapter.test', idempotencyKey: 'adapter-test-key', providerTransactionId: 'adapter-test-tx' } }, null, 2),
};

export default function AdapterTestPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [providerId, setProviderId] = useState('');
  const [method, setMethod] = useState<MethodName>('healthCheck');
  const [payloadText, setPayloadText] = useState(defaultPayload.healthCheck);
  const [result, setResult] = useState<TestResult | null>(null);
  const [message, setMessage] = useState('กำลังโหลด provider...');
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);

  useEffect(() => { loadProviders(); }, []);

  const selectedProvider = useMemo(() => providers.find((item) => item.id === providerId), [providers, providerId]);
  const selectedMethod = methodOptions.find((item) => item.value === method) ?? methodOptions[0];

  async function loadProviders() {
    setLoading(true);
    setMessage('กำลังโหลด provider...');
    const res = await adminApiFetch('/admin/game-providers');
    const data = await res.json().catch(() => null);
    setLoading(false);
    if (!res.ok) {
      setMessage(data?.message ?? 'โหลด provider ไม่สำเร็จ');
      return;
    }
    const items = data?.items ?? [];
    setProviders(items);
    setProviderId((current) => current || items[0]?.id || '');
    setMessage(items.length ? '' : 'ยังไม่มี provider สำหรับทดสอบ adapter');
  }

  function changeMethod(next: MethodName) {
    setMethod(next);
    setPayloadText(defaultPayload[next]);
    setResult(null);
  }

  async function run(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    if (!providerId) {
      setMessage('กรุณาเลือก provider');
      return;
    }
    let payload: Record<string, unknown> = {};
    try {
      payload = payloadText.trim() ? JSON.parse(payloadText) : {};
    } catch {
      setMessage('Payload ต้องเป็น JSON ที่ถูกต้อง อย่าทำให้ parser ร้องไห้เลย');
      return;
    }
    setRunning(true);
    setMessage('กำลังทดสอบ adapter...');
    setResult(null);
    const res = await adminApiFetch(`/admin/game-providers/${providerId}/adapter-test/${method}`, { method: 'POST', body: JSON.stringify(payload) });
    const data = await res.json().catch(() => null);
    setRunning(false);
    setResult(data ?? null);
    if (!res.ok) {
      setMessage(data?.message ?? 'ทดสอบ adapter ไม่สำเร็จ');
      return;
    }
    setMessage(data?.result?.ok === false ? 'Adapter ตอบกลับว่าไม่สำเร็จ ดู error ด้านล่าง' : 'ทดสอบ adapter สำเร็จ');
  }

  return <AdminPage eyebrow="Game Platform" title="Adapter Test Harness" description="ทดสอบ adapter ทีละ method ก่อนเอาไปแตะค่ายจริงและเงินจริง เพราะ console.log ไม่ควรเป็นระบบ QA ของมนุษยชาติ" actions={<AdminButton onClick={() => run()} disabled={running || !providerId}>{running ? 'Testing...' : 'Run Test'}</AdminButton>}>
    {message && <AdminNotice>{message}</AdminNotice>}
    <AdminMetricGrid><AdminMetric title="Provider" value={selectedProvider?.code ?? '-'} helper={selectedProvider?.name ?? 'เลือก provider'} /><AdminMetric title="Method" value={selectedMethod.label} helper={selectedMethod.description} /><AdminMetric title="Latency" value={result?.latencyMs ? `${result.latencyMs}ms` : '-'} helper="last run" /><AdminMetric title="Result" value={result?.result?.ok === false ? 'FAILED' : result ? 'DONE' : '-'} helper="sanitized output" /></AdminMetricGrid>

    <AdminToolbar>
      <label style={labelStyle}>Provider<select value={providerId} onChange={(event) => setProviderId(event.target.value)} style={inputStyle}><option value="">เลือก provider</option>{providers.map((provider) => <option key={provider.id} value={provider.id}>{provider.name} ({provider.code})</option>)}</select></label>
      <label style={labelStyle}>Method<select value={method} onChange={(event) => changeMethod(event.target.value as MethodName)} style={inputStyle}>{methodOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
      <div style={summaryBoxStyle}><strong>{selectedProvider?.code ?? '-'}</strong><span>{selectedProvider ? `${selectedProvider.walletMode ?? '-'} · ${selectedProvider.status} · ${selectedProvider.currency ?? 'THB'}` : 'ยังไม่ได้เลือก provider'}</span></div>
    </AdminToolbar>

    <AdminCard title={selectedMethod.label} description={selectedMethod.description} action={<AdminBadge tone={selectedMethod.risk === 'money' ? 'danger' : selectedMethod.risk === 'webhook' ? 'warning' : 'success'}>{selectedMethod.risk}</AdminBadge>}>
      {selectedMethod.risk === 'money' && <AdminNotice>Transfer test ควรใช้ simulator/sandbox เท่านั้น ถ้าเอาเงินจริงมาลองเล่นก็ถือว่าเลือกเส้นทางชีวิตที่ SQL ไม่ให้อภัย</AdminNotice>}
      <form onSubmit={run} style={formStyle}>
        <label style={labelWideStyle}>Test Payload JSON<textarea value={payloadText} onChange={(event) => setPayloadText(event.target.value)} style={textareaStyle} spellCheck={false} /></label>
        <div style={actionRowStyle}><AdminButton type="submit" disabled={running || !providerId}>{running ? 'Testing...' : 'Run test'}</AdminButton><AdminButton type="button" tone="secondary" onClick={() => setPayloadText(defaultPayload[method])}>Reset payload</AdminButton></div>
      </form>
    </AdminCard>

    <AdminToolbar><strong>Result</strong><span style={mutedStyle}>ถ้าค่ายตอบแปลก ๆ ให้ดู rawResponse ที่ sanitize แล้วตรงนี้ ไม่ต้องอ่านใบชาใน console log</span></AdminToolbar>
    {result ? <AdminStack><AdminCard><AdminRow><strong>{result.method ?? method}</strong><AdminBadge tone={result?.result?.ok === false ? 'danger' : 'success'}>{result?.result?.ok === false ? 'FAILED' : 'OK'}</AdminBadge></AdminRow><JsonBlock title="Adapter result" value={result.result ?? result} /><JsonBlock title="Input" value={result.input ?? {}} /></AdminCard></AdminStack> : <AdminEmpty>ยังไม่มีผลทดสอบ</AdminEmpty>}
    {!loading && providers.length === 0 && <AdminEmpty>ยังไม่มี provider ให้ทดสอบ ไปสร้างจาก Provider Presets หรือ Game Providers ก่อน</AdminEmpty>}
  </AdminPage>;
}

function JsonBlock({ title, value }: { title: string; value: unknown }) { return <div><strong>{title}</strong><pre style={preStyle}>{JSON.stringify(value ?? {}, null, 2)}</pre></div>; }

const formStyle = { display: 'grid', gap: 12 } as const;
const labelStyle = { display: 'grid', gap: 6, color: '#94a3b8', fontSize: 12, fontWeight: 900 } as const;
const labelWideStyle = { ...labelStyle, gridColumn: '1 / -1' } as const;
const inputStyle = { width: '100%', minHeight: 44, borderRadius: 12, border: '1px solid rgba(148,163,184,.22)', background: '#0b1220', color: '#f8fafc', padding: '0 12px', boxSizing: 'border-box' as const, fontSize: 15 };
const textareaStyle = { ...inputStyle, minHeight: 240, padding: 12, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace', whiteSpace: 'pre' as const };
const actionRowStyle = { display: 'flex', gap: 10, flexWrap: 'wrap' as const };
const summaryBoxStyle = { border: '1px solid rgba(148,163,184,.18)', borderRadius: 14, padding: 12, background: 'rgba(148,163,184,.05)', display: 'grid', gap: 4, color: '#94a3b8' } as const;
const mutedStyle = { margin: 0, color: '#94a3b8', lineHeight: 1.55 } as const;
const preStyle = { overflowX: 'auto' as const, whiteSpace: 'pre-wrap' as const, background: '#020617', borderRadius: 12, padding: 12, color: '#cbd5e1', maxHeight: 620 } as const;
