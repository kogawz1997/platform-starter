'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminEmpty, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminRow, AdminStack, AdminToolbar } from '../_components/admin-ui';

type ProviderStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'DEGRADED';
type WalletMode = 'SEAMLESS' | 'TRANSFER' | 'HYBRID';
type ProviderCounts = { endpoints?: number; credentials?: number; games?: number; sessions?: number; transfers?: number; webhookLogs?: number };
type GameProvider = {
  id: string;
  name: string;
  code: string;
  logoUrl?: string | null;
  status: ProviderStatus;
  walletMode: WalletMode;
  currency: string;
  timezone: string;
  sortOrder: number;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  _count?: ProviderCounts;
};

type ProviderFormState = {
  id?: string;
  name: string;
  code: string;
  logoUrl: string;
  status: ProviderStatus;
  walletMode: WalletMode;
  currency: string;
  timezone: string;
  sortOrder: string;
};

const emptyForm: ProviderFormState = { name: '', code: '', logoUrl: '', status: 'INACTIVE', walletMode: 'TRANSFER', currency: 'THB', timezone: 'Asia/Bangkok', sortOrder: '100' };

export default function GameProvidersPage() {
  const [items, setItems] = useState<GameProvider[]>([]);
  const [form, setForm] = useState<ProviderFormState>(emptyForm);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadProviders(); }, []);

  const metrics = useMemo(() => ({
    total: items.length,
    active: items.filter((item) => item.status === 'ACTIVE').length,
    maintenance: items.filter((item) => item.status === 'MAINTENANCE' || item.status === 'DEGRADED').length,
    games: items.reduce((sum, item) => sum + Number(item._count?.games ?? 0), 0),
  }), [items]);

  async function loadProviders() {
    setLoading(true);
    setMessage('กำลังโหลด provider...');
    const res = await adminApiFetch('/admin/game-providers');
    const data = await res.json().catch(() => null);
    setLoading(false);
    if (!res.ok) { setMessage(data?.message ?? 'โหลด provider ไม่สำเร็จ'); return; }
    setItems(data.items ?? []);
    setMessage('');
  }

  function updateField<K extends keyof ProviderFormState>(key: K, value: ProviderFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function editProvider(item: GameProvider) {
    setForm({
      id: item.id,
      name: item.name,
      code: item.code,
      logoUrl: item.logoUrl ?? '',
      status: item.status,
      walletMode: item.walletMode,
      currency: item.currency,
      timezone: item.timezone,
      sortOrder: String(item.sortOrder),
    });
    setMessage(`กำลังแก้ไข ${item.name}`);
  }

  function resetForm() {
    setForm(emptyForm);
    setMessage('');
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = {
      name: form.name.trim(),
      code: form.code.trim(),
      logoUrl: form.logoUrl.trim() || null,
      status: form.status,
      walletMode: form.walletMode,
      currency: form.currency.trim() || 'THB',
      timezone: form.timezone.trim() || 'Asia/Bangkok',
      sortOrder: Number(form.sortOrder || 100),
    };
    if (!payload.name || !payload.code) { setMessage('กรุณากรอกชื่อ provider และ code'); return; }
    setSaving(true);
    setMessage(form.id ? 'กำลังบันทึก provider...' : 'กำลังสร้าง provider...');
    const res = await adminApiFetch(form.id ? `/admin/game-providers/${form.id}` : '/admin/game-providers', { method: form.id ? 'PATCH' : 'POST', body: JSON.stringify(payload) });
    const data = await res.json().catch(() => null);
    setSaving(false);
    if (!res.ok) { setMessage(data?.message ?? 'บันทึก provider ไม่สำเร็จ'); return; }
    setMessage(form.id ? 'บันทึก provider แล้ว' : 'สร้าง provider แล้ว');
    setForm(emptyForm);
    await loadProviders();
  }

  async function quickStatus(item: GameProvider, status: ProviderStatus) {
    setMessage(`กำลังเปลี่ยนสถานะ ${item.name}...`);
    const res = await adminApiFetch(`/admin/game-providers/${item.id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
    const data = await res.json().catch(() => null);
    if (!res.ok) { setMessage(data?.message ?? 'เปลี่ยนสถานะไม่สำเร็จ'); return; }
    setItems((current) => current.map((provider) => provider.id === item.id ? { ...provider, ...data } : provider));
    setMessage(`เปลี่ยนสถานะ ${item.name} เป็น ${status} แล้ว`);
  }

  return <AdminPage eyebrow="Game Platform" title="Game Providers" description="จัดการค่ายเกมจริงจากฐานข้อมูล: profile, status, wallet mode และ operation readiness" actions={<AdminButton onClick={loadProviders} disabled={loading}>Refresh</AdminButton>}>
    <AdminMetricGrid>
      <AdminMetric title="Providers" value={String(metrics.total)} helper="all configured providers" />
      <AdminMetric title="Active" value={String(metrics.active)} helper="เปิดใช้งานอยู่" />
      <AdminMetric title="Attention" value={String(metrics.maintenance)} helper="maintenance/degraded" />
      <AdminMetric title="Games" value={String(metrics.games)} helper="catalog count" />
    </AdminMetricGrid>

    {message && <AdminNotice>{message}</AdminNotice>}

    <AdminCard title={form.id ? 'Edit provider' : 'Create provider'} description="เพิ่มหรือแก้ไขค่ายเกม ก่อนต่อ endpoint/credential/API จริง">
      <form onSubmit={submit} style={formStyle}>
        <label style={labelStyle}>Provider name<input value={form.name} onChange={(event) => updateField('name', event.target.value)} style={inputStyle} placeholder="เช่น PG Soft" /></label>
        <label style={labelStyle}>Provider code<input value={form.code} onChange={(event) => updateField('code', event.target.value)} style={inputStyle} placeholder="เช่น pgsoft" /></label>
        <label style={labelStyle}>Logo URL<input value={form.logoUrl} onChange={(event) => updateField('logoUrl', event.target.value)} style={inputStyle} placeholder="https://..." /></label>
        <label style={labelStyle}>Status<select value={form.status} onChange={(event) => updateField('status', event.target.value as ProviderStatus)} style={inputStyle}><option value="ACTIVE">ACTIVE</option><option value="INACTIVE">INACTIVE</option><option value="MAINTENANCE">MAINTENANCE</option><option value="DEGRADED">DEGRADED</option></select></label>
        <label style={labelStyle}>Wallet mode<select value={form.walletMode} onChange={(event) => updateField('walletMode', event.target.value as WalletMode)} style={inputStyle}><option value="TRANSFER">TRANSFER</option><option value="SEAMLESS">SEAMLESS</option><option value="HYBRID">HYBRID</option></select></label>
        <label style={labelStyle}>Currency<input value={form.currency} onChange={(event) => updateField('currency', event.target.value)} style={inputStyle} /></label>
        <label style={labelStyle}>Timezone<input value={form.timezone} onChange={(event) => updateField('timezone', event.target.value)} style={inputStyle} /></label>
        <label style={labelStyle}>Sort order<input value={form.sortOrder} onChange={(event) => updateField('sortOrder', event.target.value)} inputMode="numeric" style={inputStyle} /></label>
        <div style={actionRowStyle}><AdminButton type="submit" disabled={saving}>{saving ? 'Saving...' : form.id ? 'Save provider' : 'Create provider'}</AdminButton>{form.id && <AdminButton type="button" tone="secondary" onClick={resetForm}>Cancel edit</AdminButton>}</div>
      </form>
    </AdminCard>

    <AdminToolbar><strong>Provider list</strong><span style={mutedStyle}>{loading ? 'Loading...' : `${items.length} providers loaded`}</span></AdminToolbar>
    <AdminStack>{items.map((item) => <AdminCard key={item.id}>
      <AdminRow>
        <div style={providerTitleStyle}>{item.logoUrl ? <img src={item.logoUrl} alt="" style={logoStyle} /> : <div style={logoFallbackStyle}>{item.name.slice(0, 2).toUpperCase()}</div>}<div><h2 style={providerNameStyle}>{item.name}</h2><p style={mutedStyle}>{item.code} · {item.currency} · {item.timezone}</p></div></div>
        <div style={badgeStackStyle}><AdminBadge tone={statusTone(item.status)}>{item.status}</AdminBadge><AdminBadge>{item.walletMode}</AdminBadge></div>
      </AdminRow>
      <div style={countGridStyle}>
        <Count label="Endpoints" value={item._count?.endpoints ?? 0} />
        <Count label="Credentials" value={item._count?.credentials ?? 0} />
        <Count label="Games" value={item._count?.games ?? 0} />
        <Count label="Sessions" value={item._count?.sessions ?? 0} />
        <Count label="Transfers" value={item._count?.transfers ?? 0} />
        <Count label="Webhooks" value={item._count?.webhookLogs ?? 0} />
      </div>
      <div style={actionRowStyle}><AdminButton tone="secondary" onClick={() => editProvider(item)}>Edit</AdminButton><AdminButton tone={item.status === 'ACTIVE' ? 'danger' : 'success'} onClick={() => quickStatus(item, item.status === 'ACTIVE' ? 'MAINTENANCE' : 'ACTIVE')}>{item.status === 'ACTIVE' ? 'Maintenance' : 'Activate'}</AdminButton><AdminButton tone="secondary" onClick={() => quickStatus(item, 'INACTIVE')}>Disable</AdminButton></div>
      <p style={smallMutedStyle}>Updated: {new Date(item.updatedAt).toLocaleString('th-TH')}</p>
    </AdminCard>)}{!loading && items.length === 0 && <AdminEmpty>ยังไม่มี provider เพิ่ม provider แรกจากฟอร์มด้านบน</AdminEmpty>}</AdminStack>
  </AdminPage>;
}

function Count({ label, value }: { label: string; value: number }) { return <div style={countBoxStyle}><span>{label}</span><strong>{value}</strong></div>; }
function statusTone(status: ProviderStatus) { if (status === 'ACTIVE') return 'success'; if (status === 'MAINTENANCE' || status === 'DEGRADED') return 'warning'; return 'neutral'; }

const formStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(240px, 100%), 1fr))', gap: 12, minWidth: 0 } as const;
const labelStyle = { display: 'grid', gap: 6, color: '#cbd5e1', fontWeight: 900, minWidth: 0 } as const;
const inputStyle = { width: '100%', minHeight: 44, borderRadius: 12, border: '1px solid rgba(148,163,184,.22)', background: '#0b1220', color: '#f8fafc', padding: '0 12px', boxSizing: 'border-box' as const, fontSize: 15 };
const actionRowStyle = { display: 'flex', gap: 10, flexWrap: 'wrap' as const, alignItems: 'center' } as const;
const mutedStyle = { margin: 0, color: '#94a3b8', lineHeight: 1.55 } as const;
const smallMutedStyle = { margin: 0, color: '#64748b', fontSize: 12 } as const;
const providerTitleStyle = { display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 } as const;
const providerNameStyle = { margin: 0, fontSize: 22, lineHeight: 1.12 } as const;
const logoStyle = { width: 48, height: 48, borderRadius: 14, objectFit: 'cover' as const, border: '1px solid rgba(148,163,184,.18)' };
const logoFallbackStyle = { width: 48, height: 48, borderRadius: 14, display: 'grid', placeItems: 'center', background: 'rgba(245,197,66,.14)', color: '#fde68a', fontWeight: 950, border: '1px solid rgba(245,197,66,.25)' } as const;
const badgeStackStyle = { display: 'flex', gap: 8, flexWrap: 'wrap' as const, justifyContent: 'flex-end' as const };
const countGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(120px, 100%), 1fr))', gap: 10 } as const;
const countBoxStyle = { border: '1px solid rgba(148,163,184,.18)', borderRadius: 14, padding: 12, background: 'rgba(148,163,184,.045)', display: 'grid', gap: 5 } as const;
