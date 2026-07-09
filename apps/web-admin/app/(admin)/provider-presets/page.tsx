import { AdminBadge, AdminCard, AdminGrid, AdminLinkButton, AdminNotice, AdminPage, AdminRow, AdminStack } from '../_components/admin-ui';

const presets = [
  { name: 'Demo Provider', code: 'demo-provider', mode: 'TRANSFER', risk: 'Safe', endpoints: ['LAUNCH', 'BALANCE', 'TRANSFER_IN', 'TRANSFER_OUT', 'WEBHOOK', 'HEALTH_CHECK'], credentials: ['API_KEY', 'WEBHOOK_SECRET'], gates: ['launchEnabled', 'transferEnabled', 'walletSyncEnabled'] },
  { name: 'Simulator Provider', code: 'simulator-provider', mode: 'TRANSFER', risk: 'Safe', endpoints: ['LAUNCH', 'BALANCE', 'TRANSFER_IN', 'TRANSFER_OUT', 'WEBHOOK', 'HEALTH_CHECK'], credentials: ['API_KEY', 'WEBHOOK_SECRET'], gates: ['launchEnabled', 'transferEnabled', 'walletSyncEnabled'] },
  { name: 'Generic Transfer Wallet', code: 'generic-transfer', mode: 'TRANSFER', risk: 'Market', endpoints: ['LAUNCH', 'BALANCE', 'TRANSFER_IN', 'TRANSFER_OUT', 'GAME_LIST', 'WEBHOOK'], credentials: ['API_KEY', 'SECRET_KEY', 'MERCHANT_ID', 'WEBHOOK_SECRET'], gates: ['launchEnabled', 'transferEnabled', 'walletSyncEnabled'] },
  { name: 'Generic Seamless Wallet', code: 'generic-seamless', mode: 'SEAMLESS', risk: 'Advanced', endpoints: ['LAUNCH', 'BALANCE', 'BET_HISTORY', 'WEBHOOK'], credentials: ['API_KEY', 'SECRET_KEY', 'AGENT_ID', 'WEBHOOK_SECRET'], gates: ['launchEnabled', 'webhookSettlementEnabled'] },
  { name: 'Real Provider Hardening', code: 'real-provider', mode: 'HYBRID', risk: 'Danger', endpoints: ['LAUNCH', 'BALANCE', 'TRANSFER_IN', 'TRANSFER_OUT', 'GAME_LIST', 'BET_HISTORY', 'WEBHOOK', 'HEALTH_CHECK'], credentials: ['API_KEY', 'SECRET_KEY', 'MERCHANT_ID', 'AGENT_ID', 'WEBHOOK_SECRET'], gates: ['launchEnabled'] },
];

export default function ProviderPresetsPage() {
  return <AdminPage eyebrow="Game Platform" title="Provider Presets" description="Template ตั้งค่าค่ายเกมแบบตลาดจริง ใช้เป็น checklist ก่อนกรอก endpoint/credential">
    <AdminNotice>หน้านี้ยังเป็น preset library สำหรับ copy/config checklist ก่อน ยังไม่ auto-write DB เพื่อกันแอดมินกดสร้าง provider ผิดเป็นสิบตัวแล้วโทษระบบตามธรรมเนียมมนุษย์</AdminNotice>
    <AdminGrid>{presets.map((preset) => <AdminCard key={preset.code} title={preset.name} description={`${preset.mode} · ${preset.code}`} action={<AdminLinkButton href="/game-providers">ใช้ preset</AdminLinkButton>}>
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
