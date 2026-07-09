'use client';

import { FormEvent, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminGrid, AdminLinkButton, AdminNotice, AdminPage, AdminRow, AdminStack } from '../_components/admin-ui';

const presets = ['demo-provider', 'simulator-provider', 'generic-transfer', 'generic-seamless', 'real-provider'];
const rollout = [
  ['Stage 1', 'Catalog / Launch', 'ให้สมาชิกเห็นเกมและเปิดเกมได้ แต่ยังไม่โยกเงินจริง'],
  ['Stage 2', 'Transfer Wallet Sync', 'โยกเข้า/ออกเกม sync กับ WalletLedger แล้วตรวจ game transfers'],
  ['Stage 3', 'Reconciliation', 'เทียบยอด systemBalance/providerBalance และสร้าง alert เมื่อ mismatch'],
  ['Stage 4', 'Webhook Settlement', 'เปิดเฉพาะหลัง signature/dedup/reconcile ผ่านจริง'],
  ['Stage 5', 'Real Money', 'เปิดเงินจริงหลัง preflight ไม่มี blocker เท่านั้น'],
];

export default function ProviderSetupWizardPage() {
  const [active, setActive] = useState(0);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({ presetCode: 'generic-transfer', name: '', code: '', baseUrl: '', apiKey: '', secretKey: '', merchantId: '', agentId: '', webhookSecret: '' });
  const progress = useMemo(() => `${active + 1}/6`, [active]);
  function update(key: keyof typeof form, value: string) { setForm((current) => ({ ...current, [key]: value })); }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    const res = await adminApiFetch('/admin/provider-presets/apply', { method: 'POST', body: JSON.stringify({ ...form, status: 'INACTIVE' }) });
    const data = await res.json().catch(() => null);
    setSaving(false);
    if (!res.ok || !data?.ok) { setMessage(data?.message ?? 'สร้าง provider จาก wizard ไม่สำเร็จ'); return; }
    setMessage(`สร้าง provider แล้ว: ${data.provider?.name ?? form.name}`);
    window.location.href = '/provider-risk';
  }
  return <AdminPage eyebrow="Game Platform" title="Provider Setup Wizard" description="ตั้งค่าค่ายเกมแบบ submit จริง: เลือก preset, ใส่ base URL/credential แล้วสร้าง provider + endpoint + credential + gate ในครั้งเดียว">
    <AdminNotice>สร้างเป็น INACTIVE ก่อน แล้วค่อยตรวจ Provider Risk/Preflight เพื่อเปิดใช้งานทีละ gate อย่าให้ปุ่มเงินจริงเป็นปุ่มทดลองใจมนุษย์</AdminNotice>
    {message && <AdminNotice>{message}</AdminNotice>}
    <AdminGrid>
      <AdminCard title={`ขั้นตอน ${progress}`} description="กรอกค่าหลักแล้วสร้าง provider จาก preset">
        <form onSubmit={submit} style={formStyle}>
          <label style={labelStyle}>Preset<select value={form.presetCode} onChange={(event) => { update('presetCode', event.target.value); setActive(0); }} style={inputStyle}>{presets.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
          <label style={labelStyle}>Provider name<input value={form.name} onChange={(event) => update('name', event.target.value)} style={inputStyle} placeholder="เช่น PG Soft UAT" /></label>
          <label style={labelStyle}>Provider code<input value={form.code} onChange={(event) => update('code', event.target.value)} style={inputStyle} placeholder="เช่น pgsoft-uat" /></label>
          <label style={labelStyle}>Sandbox/UAT Base URL<input value={form.baseUrl} onChange={(event) => update('baseUrl', event.target.value)} style={inputStyle} placeholder="https://provider.example.test/api" /></label>
          <label style={labelStyle}>API Key<input value={form.apiKey} onChange={(event) => update('apiKey', event.target.value)} style={inputStyle} /></label>
          <label style={labelStyle}>Secret Key<input value={form.secretKey} onChange={(event) => update('secretKey', event.target.value)} style={inputStyle} /></label>
          <label style={labelStyle}>Merchant ID<input value={form.merchantId} onChange={(event) => update('merchantId', event.target.value)} style={inputStyle} /></label>
          <label style={labelStyle}>Agent ID<input value={form.agentId} onChange={(event) => update('agentId', event.target.value)} style={inputStyle} /></label>
          <label style={labelStyle}>Webhook Secret<input value={form.webhookSecret} onChange={(event) => update('webhookSecret', event.target.value)} style={inputStyle} /></label>
          <div style={actionRowStyle}><AdminButton type="submit" disabled={saving}>{saving ? 'กำลังสร้าง...' : 'Create provider from preset'}</AdminButton><AdminLinkButton href="/provider-presets">ดู preset</AdminLinkButton></div>
        </form>
        <div style={stepNavStyle}>{[1,2,3,4,5,6].map((item, index) => <button key={item} onClick={() => setActive(index)} style={index === active ? activeStepStyle : stepStyle}>{item}</button>)}</div>
      </AdminCard>
      <AdminCard title="สถานะที่ควรเปิดตามลำดับ" description="ใช้ลำดับนี้ลดโอกาสเงินเพี้ยนและ debug นรกแตก"><AdminStack>{rollout.map(([stage, title, description]) => <AdminRow key={stage}><div><strong>{stage} · {title}</strong><p style={mutedStyle}>{description}</p></div><AdminBadge tone={stage === 'Stage 5' ? 'danger' : stage === 'Stage 4' ? 'warning' : 'success'}>{stage}</AdminBadge></AdminRow>)}</AdminStack></AdminCard>
    </AdminGrid>
    <h2 style={sectionTitleStyle}>Checklist ก่อนบอกว่าพร้อม</h2>
    <AdminGrid>{['Provider ACTIVE', 'Adapter registered', 'Endpoint ครบ', 'Credential ครบ', 'Wallet Sync enabled', 'Preflight ผ่าน', 'Reconcile ไม่มี mismatch', 'Webhook dedup/signature ผ่าน'].map((item, index) => <AdminCard key={item}><AdminRow><strong>{item}</strong><AdminBadge tone={index < 5 ? 'warning' : 'danger'}>{index < 5 ? 'Required' : 'Safety'}</AdminBadge></AdminRow></AdminCard>)}</AdminGrid>
  </AdminPage>;
}
const mutedStyle = { margin: 0, color: '#94a3b8', lineHeight: 1.55 } as const;
const sectionTitleStyle = { margin: '24px 0 12px', fontSize: 'clamp(24px, 7vw, 34px)', lineHeight: 1 } as const;
const formStyle = { display: 'grid', gap: 12 } as const;
const labelStyle = { display: 'grid', gap: 6, color: '#94a3b8', fontSize: 12, fontWeight: 900 } as const;
const inputStyle = { width: '100%', minHeight: 44, borderRadius: 12, border: '1px solid rgba(148,163,184,.22)', background: '#0b1220', color: '#f8fafc', padding: '0 12px', boxSizing: 'border-box' as const, fontSize: 15 };
const actionRowStyle = { display: 'flex', gap: 10, flexWrap: 'wrap' as const };
const stepNavStyle = { display: 'flex', gap: 8, flexWrap: 'wrap' as const, marginTop: 12 };
const stepStyle = { width: 38, height: 38, borderRadius: 12, border: '1px solid rgba(148,163,184,.22)', background: '#0b1220', color: '#cbd5e1', fontWeight: 950 } as const;
const activeStepStyle = { ...stepStyle, background: '#f5c542', color: '#111827', borderColor: '#f5c542' } as const;
