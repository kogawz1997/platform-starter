'use client';

import { useEffect, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminEmpty, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminRow, AdminStack } from '../_components/admin-ui';

type Provider = { id: string; name: string; code: string; status: string };
type Credential = { id: string; type: string; maskedValue: string; isEnabled: boolean; rotatedAt?: string | null; createdAt: string; updatedAt: string };

export default function ProviderCredentialsPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [providerId, setProviderId] = useState('');
  const [items, setItems] = useState<Credential[]>([]);
  const [message, setMessage] = useState('กำลังโหลด provider...');
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  useEffect(() => { loadProviders(); }, []);
  useEffect(() => { if (providerId) loadCredentials(providerId); }, [providerId]);
  async function loadProviders() { const res = await adminApiFetch('/admin/game-providers'); const data = await res.json().catch(() => null); if (!res.ok) { setMessage(data?.message ?? 'โหลด provider ไม่สำเร็จ'); return; } const rows = data.items ?? []; setProviders(rows); setProviderId(rows[0]?.id ?? ''); setMessage(''); }
  async function loadCredentials(id = providerId) { setLoading(true); const res = await adminApiFetch(`/admin/game-providers/${id}/credentials`); const data = await res.json().catch(() => null); setLoading(false); if (!res.ok) { setMessage(data?.message ?? 'โหลด credential ไม่สำเร็จ'); return; } setItems(data.items ?? []); setMessage(''); }
  async function rotate(item: Credential) { const value = window.prompt(`New value for ${item.type}`); if (!value) return; setLoading(true); const res = await adminApiFetch(`/admin/game-providers/${providerId}/credentials/${item.id}`, { method: 'PATCH', body: JSON.stringify({ value, isEnabled: true }) }); const data = await res.json().catch(() => null); setLoading(false); if (!res.ok) { setMessage(data?.message ?? 'rotate credential ไม่สำเร็จ'); return; } setMessage(`rotate ${item.type} แล้ว`); await loadCredentials(); }
  async function toggle(item: Credential) { setLoading(true); const res = await adminApiFetch(`/admin/game-providers/${providerId}/credentials/${item.id}`, { method: 'PATCH', body: JSON.stringify({ isEnabled: !item.isEnabled }) }); const data = await res.json().catch(() => null); setLoading(false); if (!res.ok) { setMessage(data?.message ?? 'อัปเดต credential ไม่สำเร็จ'); return; } setMessage(`${!item.isEnabled ? 'เปิดใช้' : 'ปิดใช้'} ${item.type} แล้ว`); await loadCredentials(); }
  async function testProvider() { setLoading(true); setMessage('กำลังทดสอบ provider health-check...'); const res = await adminApiFetch(`/admin/game-providers/${providerId}/health-check`, { method: 'POST' }); const data = await res.json().catch(() => null); setLoading(false); setTestResult(data); setMessage(res.ok ? 'ทดสอบ provider แล้ว' : data?.message ?? 'ทดสอบ provider ไม่สำเร็จ'); }
  const enabled = items.filter((item) => item.isEnabled).length;
  const placeholders = items.filter((item) => item.maskedValue?.includes('TODO')).length;
  return <AdminPage eyebrow="Game Platform" title="Credential Management" description="จัดการ secret แบบ production: rotate, enable/disable และทดสอบ provider โดยไม่แสดง raw secret" actions={<AdminButton onClick={testProvider} disabled={loading || !providerId}>Test Provider</AdminButton>}>
    {message && <AdminNotice>{message}</AdminNotice>}
    <AdminMetricGrid><AdminMetric title="Credentials" value={String(items.length)} helper="ทั้งหมด" /><AdminMetric title="Enabled" value={String(enabled)} helper="เปิดใช้งาน" /><AdminMetric title="Disabled" value={String(items.length - enabled)} helper="ปิดอยู่" /><AdminMetric title="Placeholders" value={String(placeholders)} helper="ควร rotate" /></AdminMetricGrid>
    <AdminCard title="Provider"><select value={providerId} onChange={(event) => setProviderId(event.target.value)} style={inputStyle}>{providers.map((provider) => <option key={provider.id} value={provider.id}>{provider.name} ({provider.code})</option>)}</select></AdminCard>
    {placeholders > 0 && <AdminNotice>ยังมี credential ที่เป็น placeholder อยู่ ต้อง rotate ก่อนใช้ UAT/Production จริง ไม่งั้น API ค่ายจะตอบกลับมาด้วยความดูถูกในรูปแบบ 401</AdminNotice>}
    <AdminStack>{items.map((item) => <AdminCard key={item.id} title={item.type} description={`rotated: ${item.rotatedAt ? new Date(item.rotatedAt).toLocaleString('th-TH') : '-'}`}><AdminRow><div><strong>{item.maskedValue}</strong><p style={mutedStyle}>updated: {new Date(item.updatedAt).toLocaleString('th-TH')}</p></div><AdminBadge tone={item.isEnabled ? 'success' : 'danger'}>{item.isEnabled ? 'ENABLED' : 'DISABLED'}</AdminBadge></AdminRow><div style={actionRowStyle}><AdminButton onClick={() => rotate(item)} disabled={loading}>Rotate</AdminButton><AdminButton tone="secondary" onClick={() => toggle(item)} disabled={loading}>{item.isEnabled ? 'Disable' : 'Enable'}</AdminButton></div></AdminCard>)}{!loading && items.length === 0 && <AdminEmpty>ยังไม่มี credential</AdminEmpty>}</AdminStack>
    {testResult && <AdminCard title="Health-check result"><pre style={preStyle}>{JSON.stringify(testResult, null, 2)}</pre></AdminCard>}
  </AdminPage>;
}
const inputStyle = { width: '100%', minHeight: 44, borderRadius: 12, border: '1px solid rgba(148,163,184,.22)', background: '#0b1220', color: '#f8fafc', padding: '0 12px', boxSizing: 'border-box' as const, fontSize: 15 };
const actionRowStyle = { display: 'flex', gap: 10, flexWrap: 'wrap' as const };
const mutedStyle = { margin: 0, color: '#94a3b8', lineHeight: 1.55 } as const;
const preStyle = { overflowX: 'auto' as const, whiteSpace: 'pre-wrap' as const, background: '#020617', borderRadius: 12, padding: 12, color: '#cbd5e1', maxHeight: 520 } as const;
