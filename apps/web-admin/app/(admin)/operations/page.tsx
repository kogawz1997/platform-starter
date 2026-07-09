import { AdminBadge, AdminCard, AdminGrid, AdminLinkButton, AdminNotice, AdminPage, AdminRow, AdminStack } from '../_components/admin-ui';

const groups = [
  { title: 'Money Operation', description: 'งานเงินจริงและบัญชี', items: [
    ['ฝาก', '/topups', 'ตรวจรายการฝาก'],
    ['ถอนเงิน', '/withdrawals', 'ตรวจรายการถอน'],
    ['Wallet Ledgers', '/wallet-ledgers', 'ดูรายการเดินเงิน'],
    ['Money Ops', '/money-ops', 'control center / alert scan'],
    ['Risk Alerts', '/risk-alerts', 'workflow ความเสี่ยง'],
  ] },
  { title: 'Game Platform', description: 'ค่ายเกม เกม และการโยกเงิน', items: [
    ['Provider Setup Wizard', '/provider-setup-wizard', 'ตั้งค่าค่ายเกมแบบเป็นขั้น'],
    ['Provider Presets', '/provider-presets', 'template endpoint/credential'],
    ['ค่ายเกม', '/game-providers', 'provider profile'],
    ['ตั้งค่า API เกม', '/game-api-settings', 'quick setup overview'],
    ['Provider Risk', '/provider-risk', 'preflight / gates'],
    ['Game Transfers', '/game-transfers', 'โยกเงินเข้าออกเกม'],
    ['Reconciliation Center', '/reconciliation-center', 'เทียบยอด provider'],
    ['Webhook Settlement', '/webhook-settlement', 'ตรวจ webhook ก่อน settle'],
    ['Webhook Logs', '/webhook-logs', 'callback logs'],
  ] },
  { title: 'Catalog', description: 'เกมและ asset', items: [
    ['Games', '/games', 'จัดการเกม'],
    ['Game Sessions', '/game-sessions', 'session สมาชิก'],
    ['Provider Wallet Snapshots', '/provider-wallet-snapshots', 'snapshot reconciliation'],
  ] },
  { title: 'Security / Audit', description: 'ตรวจสอบย้อนหลัง', items: [
    ['Audit Logs', '/audit-logs', 'ประวัติ admin'],
    ['Admin Users', '/admin-users', 'ผู้ดูแลระบบ'],
  ] },
];

export default function OperationsPage() {
  return <AdminPage eyebrow="Admin" title="Operations Hub" description="เมนูรวมแบบตลาดจริง แยกงานตามสิ่งที่แอดมินต้องทำ ไม่ใช่ตามชื่อ table ที่ developer ภูมิใจเกินเหตุ">
    <AdminNotice>ใช้หน้านี้เป็นทางลัดหลักแทนการไล่หาเมนูทีละหน้า เหมาะกับมือถือและแอดมินที่ยังอยากมีชีวิตหลังเลิกงาน</AdminNotice>
    <AdminGrid>{groups.map((group) => <AdminCard key={group.title} title={group.title} description={group.description}><AdminStack>{group.items.map(([title, href, description]) => <AdminRow key={href}><div><strong>{title}</strong><p style={mutedStyle}>{description}</p></div><div style={actionStyle}><AdminBadge tone={group.title.includes('Money') ? 'warning' : group.title.includes('Game') ? 'success' : 'neutral'}>{group.title}</AdminBadge><AdminLinkButton href={href}>เปิด</AdminLinkButton></div></AdminRow>)}</AdminStack></AdminCard>)}</AdminGrid>
  </AdminPage>;
}
const mutedStyle = { margin: 0, color: '#94a3b8', lineHeight: 1.55 } as const;
const actionStyle = { display: 'flex', gap: 8, flexWrap: 'wrap' as const, justifyContent: 'flex-end' as const };
