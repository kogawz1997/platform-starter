'use client';

import { useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminGrid, AdminNotice, AdminPage, AdminRow, AdminStack } from '../_components/admin-ui';

const presets = [
  { name: 'Demo Provider', code: 'demo-provider', mode: 'TRANSFER', risk: 'Safe', endpoints: ['LAUNCH', 'BALANCE', 'TRANSFER_IN', 'TRANSFER_OUT', 'WEBHOOK', 'HEALTH_CHECK'], credentials: ['API_KEY', 'WEBHOOK_SECRET'], gates: ['launchEnabled', 'transferEnabled', 'walletSyncEnabled'] },
  { name: 'Simulator Provider', code: 'simulator-provider', mode: 'TRANSFER', risk: 'Safe', endpoints: ['LAUNCH', 'BALANCE', 'TRANSFER_IN', 'TRANSFER_OUT', 'WEBHOOK', 'HEALTH_CHECK'], credentials: ['API_KEY', 'WEBHOOK_SECRET'], gates: ['launchEnabled', 'transferEnabled', 'walletSyncEnabled'] },
  { name: 'Generic Transfer Wallet', code: 'generic-transfer', mode: 'TRANSFER', risk: 'Market', endpoints: ['LAUNCH', 'BALANCE', 'TRANSFER_IN', 'TRANSFER_OUT', 'GAME_LIST', 'WEBHOOK', 'HEALTH_CHECK'], credentials: ['API_KEY', 'SECRET_KEY', 'MERCHANT_ID', 'WEBHOOK_SECRET'], gates: ['launchEnabled', 'walletSyncEnabled'] },
  { name: 'Generic Seamless Wallet', code: 'generic-seamless', mode: 'SEAMLESS', risk: 'Advanced', endpoints: ['LAUNCH', 'BALANCE', 'BET_HISTORY', 'WEBHOOK', 'HEALTH_CHECK'], credentials: ['API_KEY', 'SECRET_KEY', 'AGENT_ID', 'WEBHOOK_SECRET'], gates: ['launchEnabled', 'webhookSettlementEnabled'] },
  { name: 'Real Provider Hardening', code: 'real-provider', mode: 'HYBRID', risk: 'Danger', endpoints: ['LAUNCH', 'BALANCE', 'TRANSFER_IN', 'TRANSFER_OUT', 'GAME_LIST', 'BET_HISTORY', 'WEBHOOK', 'HEALTH_CHECK'], credentials: ['API_KEY', 'SECRET_KEY', 'MERCHANT_ID', 'AGENT_ID', 'WEBHOOK_SECRET'], gates: ['launchEnabled'] },
];

type Preset = typeof presets[number];

export default function ProviderPresetsPage() {
  const [message, setMessage] = useState('');
  const [working, setWorking] = useState(false);
  const [selected, setSelected] = useState<Preset>(presets[2]);
  const [form, setForm] = useState({ name: 'Generic Transfer UAT', code: 'generic-transfer-uat', baseUrl: 'https://provider.example.test/api', apiKey: '', secretKey: '', merchantId: '', agentId: '', webhookSecret: '', enabledEndpoints: presets[2].endpoints });
  const endpointPreview = useMemo(() => form.enabledEndpoints.map((type) => ({ type, url: `${form.baseUrl.replace(/\/+$/, '')}/${type.toLowerCase().replaceAll('_', '-')}` })), [form.baseUrl, form.enabledEndpoints]);
  const filledCredentials = useMemo(() => selected.credentials.filter((credential) => Boolean(credentialValue(credential, form))), [selected, form]);
  const missingCredentials = selected.credentials.filter((credential) => !filledCredentials.includes(credential));

  function choosePreset(preset: Preset) {
    setSelected(preset);
    setForm((current) => ({ ...current, name: `${preset.name} UAT`, code: `${preset.code}-uat`, enabledEndpoints: preset.endpoints }));
    setMessage('');
  }
  function update(key: keyof typeof form, value: string | string[]) { setForm((current) => ({ ...current, [key]: value })); }
  function toggleEndpoint(endpoint: string) { setForm((current) => ({ ...current, enabledEndpoints: current.enabledEndpoints.includes(endpoint) ? current.enabledEndpoints.filter((item) => item !== endpoint) : [...current.enabledEndpoints, endpoint] })); }
  async function applyPreset() {
    if (!form.name.trim() || !form.code.trim() || !form.baseUrl.trim()) { setMessage('กรอก name / code / base URL ให้ครบก่อน'); return; }
    if (form.enabledEndpoints.length === 0) { setMessage('ต้องเลือก endpoint อย่างน้อย 1 รายการ'); return; }
    if (missingCredentials.length > 0 && !window.confirm(`ยังไม่ได้กรอก credential: ${missingCredentials.join(', ')} ระบบจะสร้างด้วย placeholder/disabled ถ้า backend รองรับ ยืนยันไหม?`)) return;
    setWorking(true); setMessage('กำลังสร้าง provider จาก preset...');
    const res = await adminApiFetch('/admin/provider-presets/apply', { method: 'POST', body: JSON.stringify({ presetCode: selected.code, name: form.name, code: form.code, baseUrl: form.baseUrl, enabledEndpoints: form.enabledEndpoints, endpointOverrides: endpointPreview, apiKey: form.apiKey, secretKey: form.secretKey, merchantId: form.merchantId, agentId: form.agentId, webhookSecret: form.webhookSecret, status: 'INACTIVE' }) });
    const data = await res.json().catch(() => null); setWorking(false);
    if (!res.ok || !data?.ok) { setMessage(data?.message ?? 'ใช้ preset ไม่สำเร็จ'); return; }
    setMessage(`สร้าง provider แล้ว: ${data.provider?.name ?? form.name}`);
    window.location.href = '/provider-risk';
  }

  return <AdminPage eyebrow="Game Platform" title="Provider Presets" description="Preview/Edit preset ก่อนสร้าง provider, endpoint, credential และ gates ในครั้งเดียว">
    <AdminNotice>ระบบจะสร้าง provider เป็น INACTIVE ก่อนเสมอ แล้วค่อยไปเปิด gate ใน Provider Risk อย่าเปิดเงินจริงด้วยอารมณ์เหมือนกดสุ่มกาชา</AdminNotice>
    {message && <AdminNotice>{message}</AdminNotice>}
    <AdminGrid>{presets.map((preset) => <AdminCard key={preset.code} title={preset.name} description={`${preset.mode} · ${preset.code}`} action={<AdminButton tone={selected.code === preset.code ? 'primary' : 'secondary'} onClick={() => choosePreset(preset)}>{selected.code === preset.code ? 'เลือกแล้ว' : 'Preview'}</AdminButton>}>
      <AdminRow><strong>ระดับความเสี่ยง</strong><AdminBadge tone={riskTone(preset.risk)}>{preset.risk}</AdminBadge></AdminRow>
      <section style={blockStyle}><strong>Endpoints</strong><div style={tagRowStyle}>{preset.endpoints.map((item) => <AdminBadge key={item} tone="neutral">{item}</AdminBadge>)}</div></section>
      <section style={blockStyle}><strong>Credentials</strong><div style={tagRowStyle}>{preset.credentials.map((item) => <AdminBadge key={item} tone="warning">{item}</AdminBadge>)}</div></section>
    </AdminCard>)}</AdminGrid>

    <h2 style={sectionTitleStyle}>Preview/Edit: {selected.name}</h2>
    <AdminGrid>
      <AdminCard title="Provider profile" description="แก้ข้อมูลก่อนสร้างจริง"><div style={formStyle}><label style={labelStyle}>Name<input value={form.name} onChange={(event) => update('name', event.target.value)} style={inputStyle} /></label><label style={labelStyle}>Code<input value={form.code} onChange={(event) => update('code', event.target.value)} style={inputStyle} /></label><label style={labelStyle}>Base URL<input value={form.baseUrl} onChange={(event) => update('baseUrl', event.target.value)} style={inputStyle} /></label></div></AdminCard>
      <AdminCard title="Credentials" description="ระบบจะส่งเฉพาะค่าที่กรอกจริง ไม่โชว์ secret กลับมาหน้าเว็บ"><div style={formStyle}>{selected.credentials.includes('API_KEY') && <label style={labelStyle}>API Key<input value={form.apiKey} onChange={(event) => update('apiKey', event.target.value)} style={inputStyle} /></label>}{selected.credentials.includes('SECRET_KEY') && <label style={labelStyle}>Secret Key<input value={form.secretKey} onChange={(event) => update('secretKey', event.target.value)} style={inputStyle} /></label>}{selected.credentials.includes('MERCHANT_ID') && <label style={labelStyle}>Merchant ID<input value={form.merchantId} onChange={(event) => update('merchantId', event.target.value)} style={inputStyle} /></label>}{selected.credentials.includes('AGENT_ID') && <label style={labelStyle}>Agent ID<input value={form.agentId} onChange={(event) => update('agentId', event.target.value)} style={inputStyle} /></label>}{selected.credentials.includes('WEBHOOK_SECRET') && <label style={labelStyle}>Webhook Secret<input value={form.webhookSecret} onChange={(event) => update('webhookSecret', event.target.value)} style={inputStyle} /></label>}</div><AdminNotice>{filledCredentials.length}/{selected.credentials.length} credentials filled · missing: {missingCredentials.join(', ') || '-'}</AdminNotice></AdminCard>
      <AdminCard title="Endpoint preview" description="เลือก endpoint ที่ต้องการสร้างจาก preset"><AdminStack>{selected.endpoints.map((endpoint) => <AdminRow key={endpoint}><label style={checkStyle}><input type="checkbox" checked={form.enabledEndpoints.includes(endpoint)} onChange={() => toggleEndpoint(endpoint)} /> {endpoint}</label><span style={monoStyle}>{`${form.baseUrl.replace(/\/+$/, '')}/${endpoint.toLowerCase().replaceAll('_', '-')}`}</span></AdminRow>)}</AdminStack></AdminCard>
      <AdminCard title="Gates เริ่มต้น" description="สร้างแบบปลอดภัยก่อน แล้วเปิดเพิ่มใน Provider Risk"><div style={tagRowStyle}>{selected.gates.map((item) => <AdminBadge key={item} tone="success">{item}</AdminBadge>)}<AdminBadge tone="danger">realMoneyEnabled=false</AdminBadge><AdminBadge tone="warning">status=INACTIVE</AdminBadge></div></AdminCard>
    </AdminGrid>

    <AdminCard title="Apply preset" description="ตรวจ preview ก่อนกดสร้าง เพราะปุ่มนี้จะเขียน provider/endpoints/credentials ลง DB จริง"><AdminRow><div><strong>{form.name}</strong><p style={mutedStyle}>{form.code} · {endpointPreview.length} endpoints · {filledCredentials.length}/{selected.credentials.length} credentials filled</p></div><AdminButton onClick={applyPreset} disabled={working}>{working ? 'กำลังสร้าง...' : 'Create Provider'}</AdminButton></AdminRow></AdminCard>
  </AdminPage>;
}

function credentialValue(credential: string, form: { apiKey: string; secretKey: string; merchantId: string; agentId: string; webhookSecret: string }) { if (credential === 'API_KEY') return form.apiKey; if (credential === 'SECRET_KEY') return form.secretKey; if (credential === 'MERCHANT_ID') return form.merchantId; if (credential === 'AGENT_ID') return form.agentId; if (credential === 'WEBHOOK_SECRET') return form.webhookSecret; return ''; }
function riskTone(risk: string) { if (risk === 'Safe') return 'success'; if (risk === 'Market') return 'warning'; if (risk === 'Advanced') return 'warning'; return 'danger'; }
const sectionTitleStyle = { margin: '24px 0 12px', fontSize: 'clamp(24px, 7vw, 34px)', lineHeight: 1 } as const;
const blockStyle = { display: 'grid', gap: 8 } as const;
const tagRowStyle = { display: 'flex', gap: 8, flexWrap: 'wrap' as const };
const formStyle = { display: 'grid', gap: 12 } as const;
const labelStyle = { display: 'grid', gap: 6, color: '#94a3b8', fontSize: 12, fontWeight: 900 } as const;
const checkStyle = { display: 'flex', gap: 8, alignItems: 'center', color: '#cbd5e1', fontWeight: 900 } as const;
const inputStyle = { width: '100%', minHeight: 44, borderRadius: 12, border: '1px solid rgba(148,163,184,.22)', background: '#0b1220', color: '#f8fafc', padding: '0 12px', boxSizing: 'border-box' as const, fontSize: 15 };
const monoStyle = { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace', overflowWrap: 'anywhere' as const, color: '#cbd5e1', fontSize: 12 } as const;
const mutedStyle = { margin: 0, color: '#94a3b8', lineHeight: 1.55 } as const;
