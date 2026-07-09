'use client';

import { useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminGrid, AdminNotice, AdminPage, AdminRow, AdminStack } from '../_components/admin-ui';

const presets = [
  { name: 'Demo Provider', code: 'demo-provider', mode: 'TRANSFER', risk: 'Safe', endpoints: ['LAUNCH', 'BALANCE', 'TRANSFER_IN', 'TRANSFER_OUT', 'WEBHOOK', 'HEALTH_CHECK'], credentials: ['API_KEY', 'WEBHOOK_SECRET'], gates: ['launchEnabled', 'transferEnabled', 'walletSyncEnabled'] },
  { name: 'Simulator Provider', code: 'simulator-provider', mode: 'TRANSFER', risk: 'Safe', endpoints: ['LAUNCH', 'BALANCE', 'TRANSFER_IN', 'TRANSFER_OUT', 'WEBHOOK', 'HEALTH_CHECK'], credentials: ['API_KEY', 'WEBHOOK_SECRET'], gates: ['launchEnabled', 'transferEnabled', 'walletSyncEnabled'] },
  { name: 'Generic Transfer Wallet', code: 'generic-transfer', mode: 'TRANSFER', risk: 'Market', endpoints: ['LAUNCH', 'BALANCE', 'TRANSFER_IN', 'TRANSFER_OUT', 'GAME_LIST', 'WEBHOOK', 'HEALTH_CHECK'], credentials: ['API_KEY', 'SECRET_KEY', 'MERCHANT_ID', 'WEBHOOK_SECRET'], gates: ['launchEnabled', 'walletSyncEnabled'] },
  { name: 'Generic Seamless Wallet', code: 'generic-seamless', mode: 'SEAMLESS', risk: 'Advanced', endpoints: ['LAUNCH', 'BALANCE', 'BET_HISTORY', 'WEBHOOK', 'HEALTH_CHECK'], credentials: ['API_KEY', 'SECRET_KEY', 'AGENT_ID', 'WEBHOOK_SECRET'], gates: ['launchEnabled', 'webhookSettlementEnabled'] },
  { name: 'Real Provider Hardening', code: 'real-provider', mode: 'HYBRID', risk: 'Danger', endpoints: ['LAUNCH', 'BALANCE', 'TRANSFER_IN', 'TRANSFER_OUT', 'GAME_LIST', 'BET_HISTORY', 'WEBHOOK', 'HEALTH_CHECK'], credentials: ['API_KEY', 'SECRET_KEY', 'MERCHANT_ID', 'AGENT_ID', 'WEBHOOK_SECRET'], gates: ['launchEnabled'] },
];

export default function ProviderPresetsPage() {
  const [message, setMessage] = useState('');
  const [working, setWorking] = useState('');
  async function applyPreset(preset: typeof presets[number]) {
    const name = window.prompt('Provider name', preset.name);
    if (!name) return;
    const code = window.prompt('Provider code', preset.code);
    if (!code) return;
    const baseUrl = window.prompt('Sandbox/UAT Base URL', 'https://provider.example.test/api');
    if (!baseUrl) return;
    const apiKey = window.prompt('API Key (เว้นว่างได้ถ้ายังไม่มี)', '') ?? '';
    const secretKey = preset.credentials.includes('SECRET_KEY') ? window.prompt('Secret Key (เว้นว่างได้)', '') ?? '' : '';
    const merchantId = preset.credentials.includes('MERCHANT_ID') ? window.prompt('Merchant ID (เว้นว่างได้)', '') ?? '' : '';
    const agentId = preset.credentials.includes('AGENT_ID') ? window.prompt('Agent ID (เว้นว่างได้)', '') ?? '' : '';
    const webhookSecret = preset.credentials.includes('WEBHOOK_SECRET') ? window.prompt('Webhook Secret (เว้นว่างได้)', '') ?? '' : '';
    setWorking(preset.code);
    const res = await adminApiFetch('/admin/provider-presets/apply', { method: 'POST', body: JSON.stringify({ presetCode: preset.code, name, code, baseUrl, apiKey, secretKey, merchantId, agentId, webhookSecret, status: 'INACTIVE' }) });
    const data = await res.json().catch(() => null);
    setWorking('');
    if (!res.ok || !data?.ok) { setMessage(data?.message ?? 'ใช้ preset ไม่สำเร็จ'); return; }
    setMessage(`สร้าง provider แล้ว: ${data.provider?.name ?? name}`);
    window.location.href = `/provider-risk`;
  }
  return <AdminPage eyebrow="Game Platform" title="Provider Presets" description="Template ตั้งค่าค่ายเกมแบบตลาดจริง กดใช้แล้วสร้าง provider/endpoints/credentials/gates ได้เลย">
    <AdminNotice>ระบบจะสร้าง provider เป็น INACTIVE ก่อนเสมอ แล้วค่อยไปเปิด gate ใน Provider Risk อย่าเปิดเงินจริงด้วยอารมณ์เหมือนกดสุ่มกาชา</AdminNotice>
    {message && <AdminNotice>{message}</AdminNotice>}
    <AdminGrid>{presets.map((preset) => <AdminCard key={preset.code} title={preset.name} description={`${preset.mode} · ${preset.code}`} action={<AdminButton onClick={() => applyPreset(preset)} disabled={working === preset.code}>{working === preset.code ? 'กำลังสร้าง...' : 'ใช้ preset'}</AdminButton>}>
      <AdminRow><strong>ระดับความเสี่ยง</strong><AdminBadge tone={riskTone(preset.risk)}>{preset.risk}</AdminBadge></AdminRow>
      <section style={blockStyle}><strong>Endpoints</strong><div style={tagRowStyle}>{preset.endpoints.map((item) => <AdminBadge key={item} tone="neutral">{item}</AdminBadge>)}</div></section>
      <section style={blockStyle}><strong>Credentials</strong><div style={tagRowStyle}>{preset.credentials.map((item) => <AdminBadge key={item} tone="warning">{item}</AdminBadge>)}</div></section>
      <section style={blockStyle}><strong>Gates เริ่มต้น</strong><div style={tagRowStyle}>{preset.gates.map((item) => <AdminBadge key={item} tone="success">{item}</AdminBadge>)}</div></section>
    </AdminCard>)}</AdminGrid>
  </AdminPage>;
}
function riskTone(risk: string) { if (risk === 'Safe') return 'success'; if (risk === 'Market') return 'warning'; if (risk === 'Advanced') return 'warning'; return 'danger'; }
const blockStyle = { display: 'grid', gap: 8 } as const;
const tagRowStyle = { display: 'flex', gap: 8, flexWrap: 'wrap' as const };
