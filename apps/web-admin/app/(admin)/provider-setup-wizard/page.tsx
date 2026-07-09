'use client';

import { useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminGrid, AdminLinkButton, AdminNotice, AdminPage, AdminRow, AdminStack } from '../_components/admin-ui';

const presets = ['demo-provider', 'simulator-provider', 'generic-transfer', 'generic-seamless', 'real-provider'];
const steps = ['Preset', 'Profile', 'Endpoint', 'Credentials', 'Preview', 'Create'];
const rollout = [
  ['Stage 1', 'Catalog / Launch', 'ให้สมาชิกเห็นเกมและเปิดเกมได้ แต่ยังไม่โยกเงินจริง'],
  ['Stage 2', 'Transfer Wallet Sync', 'โยกเข้า/ออกเกม sync กับ WalletLedger แล้วตรวจ game transfers'],
  ['Stage 3', 'Reconciliation', 'เทียบยอด systemBalance/providerBalance และสร้าง alert เมื่อ mismatch'],
  ['Stage 4', 'Webhook Settlement', 'เปิดเฉพาะหลัง signature/dedup/reconcile ผ่านจริง'],
  ['Stage 5', 'Real Money', 'เปิดเงินจริงหลัง preflight ไม่มี blocker เท่านั้น'],
];
const endpointTypes = ['LAUNCH', 'BALANCE', 'TRANSFER_IN', 'TRANSFER_OUT', 'GAME_LIST', 'WEBHOOK', 'HEALTH_CHECK'];

export default function ProviderSetupWizardPage() {
  const [active, setActive] = useState(0);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({ presetCode: 'generic-transfer', name: '', code: '', baseUrl: '', apiKey: '', secretKey: '', merchantId: '', agentId: '', webhookSecret: '' });
  const progress = useMemo(() => `${active + 1}/${steps.length}`, [active]);
  const endpointPreview = useMemo(() => endpointTypes.map((type) => ({ type, url: `${form.baseUrl.replace(/\/+$/, '')}/${type.toLowerCase().replaceAll('_', '-')}` })), [form.baseUrl]);
  const validation = useMemo(() => validate(form), [form]);
  function update(key: keyof typeof form, value: string) { setForm((current) => ({ ...current, [key]: value })); }
  function next() { if (active === 1 && (!form.name.trim() || !form.code.trim())) { setMessage('กรอก Provider name/code ก่อน'); return; } if (active === 2 && !isUrlLike(form.baseUrl)) { setMessage('Base URL ต้องขึ้นต้นด้วย http:// หรือ https://'); return; } setMessage(''); setActive((value) => Math.min(value + 1, steps.length - 1)); }
  function back() { setMessage(''); setActive((value) => Math.max(value - 1, 0)); }
  async function submit() {
    if (validation.blockers.length > 0) { setMessage(`ยังสร้างไม่ได้: ${validation.blockers.join(', ')}`); return; }
    setSaving(true); setMessage('กำลังสร้าง provider...');
    const res = await adminApiFetch('/admin/provider-presets/apply', { method: 'POST', body: JSON.stringify({ ...form, status: 'INACTIVE', endpointOverrides: endpointPreview }) });
    const data = await res.json().catch(() => null); setSaving(false);
    if (!res.ok || !data?.ok) { setMessage(data?.message ?? 'สร้าง provider จาก wizard ไม่สำเร็จ'); return; }
    setMessage(`สร้าง provider แล้ว: ${data.provider?.name ?? form.name}`);
    window.location.href = '/provider-risk';
  }
  return <AdminPage eyebrow="Game Platform" title="Provider Setup Wizard v2" description="ตั้งค่าค่ายเกมแบบ step flow: เลือก preset, profile, endpoint, credential, preview แล้วค่อยสร้างจริง">
    <AdminNotice>สร้างเป็น INACTIVE ก่อน แล้วค่อยตรวจ Provider Risk/Preflight เพื่อเปิดใช้งานทีละ gate อย่าให้ปุ่มเงินจริงเป็นปุ่มทดลองใจมนุษย์</AdminNotice>
    {message && <AdminNotice>{message}</AdminNotice>}
    <AdminGrid>
      <AdminCard title={`Step ${progress}: ${steps[active]}`} description="ทำทีละขั้น ลดโอกาสกรอกผิดแล้วต้องตามลบทีหลัง"><div style={stepNavStyle}>{steps.map((item, index) => <button key={item} onClick={() => setActive(index)} style={index === active ? activeStepStyle : stepStyle}>{index + 1}</button>)}</div>{active === 0 && <section style={panelStyle}><strong>เลือก preset</strong><select value={form.presetCode} onChange={(event) => update('presetCode', event.target.value)} style={inputStyle}>{presets.map((item) => <option key={item} value={item}>{item}</option>)}</select><p style={mutedStyle}>เริ่มจาก generic-transfer ถ้าจะต่อ transfer wallet เพราะคุมเงินง่ายกว่า seamless</p></section>}{active === 1 && <section style={panelStyle}><label style={labelStyle}>Provider name<input value={form.name} onChange={(event) => update('name', event.target.value)} style={inputStyle} placeholder="เช่น PG Soft UAT" /></label><label style={labelStyle}>Provider code<input value={form.code} onChange={(event) => update('code', event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))} style={inputStyle} placeholder="เช่น pgsoft-uat" /></label><AdminNotice>Code จะใช้จับกับ adapter registry ถ้าตั้งมั่ว ระบบก็จะตอบมั่วกลับมาแบบมีเหตุผล</AdminNotice></section>}{active === 2 && <section style={panelStyle}><label style={labelStyle}>Sandbox/UAT Base URL<input value={form.baseUrl} onChange={(event) => update('baseUrl', event.target.value)} style={inputStyle} placeholder="https://provider.example.test/api" /></label><AdminStack>{endpointPreview.map((item) => <AdminRow key={item.type}><strong>{item.type}</strong><span style={monoStyle}>{item.url}</span></AdminRow>)}</AdminStack></section>}{active === 3 && <section style={panelStyle}><label style={labelStyle}>API Key<input value={form.apiKey} onChange={(event) => update('apiKey', event.target.value)} style={inputStyle} /></label><label style={labelStyle}>Secret Key<input value={form.secretKey} onChange={(event) => update('secretKey', event.target.value)} style={inputStyle} /></label><label style={labelStyle}>Merchant ID<input value={form.merchantId} onChange={(event) => update('merchantId', event.target.value)} style={inputStyle} /></label><label style={labelStyle}>Agent ID<input value={form.agentId} onChange={(event) => update('agentId', event.target.value)} style={inputStyle} /></label><label style={labelStyle}>Webhook Secret<input value={form.webhookSecret} onChange={(event) => update('webhookSecret', event.target.value)} style={inputStyle} /></label></section>}{active === 4 && <section style={panelStyle}><strong>Preview ก่อนสร้าง</strong><AdminRow><span>Preset</span><AdminBadge tone="success">{form.presetCode}</AdminBadge></AdminRow><AdminRow><span>Provider</span><span>{form.name || '-'} / {form.code || '-'}</span></AdminRow><AdminRow><span>Base URL</span><span style={monoStyle}>{form.baseUrl || '-'}</span></AdminRow><AdminRow><span>Credentials</span><span>{validation.filledCredentials}/5 filled</span></AdminRow><AdminRow><span>Blockers</span><AdminBadge tone={validation.blockers.length ? 'danger' : 'success'}>{validation.blockers.length ? validation.blockers.length : 'none'}</AdminBadge></AdminRow>{validation.blockers.length > 0 && <AdminNotice>{validation.blockers.join(', ')}</AdminNotice>}</section>}{active === 5 && <section style={panelStyle}><strong>พร้อมสร้าง provider</strong><p style={mutedStyle}>ระบบจะสร้าง provider เป็น INACTIVE พร้อม endpoint/credential/gates จาก preset แล้วพาไป Provider Risk</p><AdminButton onClick={submit} disabled={saving || validation.blockers.length > 0}>{saving ? 'กำลังสร้าง...' : 'Create provider'}</AdminButton></section>}<div style={actionRowStyle}><AdminButton tone="secondary" onClick={back} disabled={active === 0}>Back</AdminButton>{active < steps.length - 1 && <AdminButton onClick={next}>Next</AdminButton>}<AdminLinkButton href="/provider-presets">เปิด Presets</AdminLinkButton></div></AdminCard>
      <AdminCard title="สถานะที่ควรเปิดตามลำดับ" description="ใช้ลำดับนี้ลดโอกาสเงินเพี้ยนและ debug นรกแตก"><AdminStack>{rollout.map(([stage, title, description]) => <AdminRow key={stage}><div><strong>{stage} · {title}</strong><p style={mutedStyle}>{description}</p></div><AdminBadge tone={stage === 'Stage 5' ? 'danger' : stage === 'Stage 4' ? 'warning' : 'success'}>{stage}</AdminBadge></AdminRow>)}</AdminStack></AdminCard>
    </AdminGrid>
    <h2 style={sectionTitleStyle}>Checklist ก่อนบอกว่าพร้อม</h2>
    <AdminGrid>{['Provider ACTIVE', 'Adapter registered', 'Endpoint ครบ', 'Credential ครบ', 'Wallet Sync enabled', 'Preflight ผ่าน', 'Reconcile ไม่มี mismatch', 'Webhook dedup/signature ผ่าน'].map((item, index) => <AdminCard key={item}><AdminRow><strong>{item}</strong><AdminBadge tone={index < 5 ? 'warning' : 'danger'}>{index < 5 ? 'Required' : 'Safety'}</AdminBadge></AdminRow></AdminCard>)}</AdminGrid>
  </AdminPage>;
}
function isUrlLike(value: string) { return /^https?:\/\//.test(value.trim()); }
function validate(form: { name: string; code: string; baseUrl: string; apiKey: string; secretKey: string; merchantId: string; agentId: string; webhookSecret: string }) { const blockers: string[] = []; if (!form.name.trim()) blockers.push('missing provider name'); if (!form.code.trim()) blockers.push('missing provider code'); if (!isUrlLike(form.baseUrl)) blockers.push('invalid base URL'); const filledCredentials = ['apiKey', 'secretKey', 'merchantId', 'agentId', 'webhookSecret'].filter((key) => Boolean((form as any)[key])).length; return { blockers, filledCredentials }; }
const mutedStyle = { margin: 0, color: '#94a3b8', lineHeight: 1.55 } as const;
const sectionTitleStyle = { margin: '24px 0 12px', fontSize: 'clamp(24px, 7vw, 34px)', lineHeight: 1 } as const;
const panelStyle = { display: 'grid', gap: 12, marginTop: 14 } as const;
const labelStyle = { display: 'grid', gap: 6, color: '#94a3b8', fontSize: 12, fontWeight: 900 } as const;
const inputStyle = { width: '100%', minHeight: 44, borderRadius: 12, border: '1px solid rgba(148,163,184,.22)', background: '#0b1220', color: '#f8fafc', padding: '0 12px', boxSizing: 'border-box' as const, fontSize: 15 };
const actionRowStyle = { display: 'flex', gap: 10, flexWrap: 'wrap' as const, marginTop: 12 };
const stepNavStyle = { display: 'flex', gap: 8, flexWrap: 'wrap' as const, marginTop: 12 };
const stepStyle = { width: 38, height: 38, borderRadius: 12, border: '1px solid rgba(148,163,184,.22)', background: '#0b1220', color: '#cbd5e1', fontWeight: 950 } as const;
const activeStepStyle = { ...stepStyle, background: '#f5c542', color: '#111827', borderColor: '#f5c542' } as const;
const monoStyle = { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace', overflowWrap: 'anywhere' as const, color: '#cbd5e1', fontSize: 12 } as const;
