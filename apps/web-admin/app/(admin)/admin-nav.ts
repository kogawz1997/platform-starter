export const navGroups = [
  { title: 'งานหลัก', items: [['งานแอดมิน', '/operations'], ['ตรวจฝาก', '/topups'], ['ตรวจถอน', '/withdrawals'], ['สมาชิก', '/members'], ['บัญชีธนาคาร', '/bank-accounts']] },
  { title: 'การเงิน', items: [['วอเลต', '/wallets'], ['ประวัติเงิน', '/wallet-ledgers'], ['ปัญหาที่ต้องดู', '/risk-alerts'], ['รายงาน', '/reports']] },
  { title: 'ค่ายเกม', items: [['ตั้งค่าง่าย', '/simple-game-settings'], ['เพิ่มค่ายใหม่', '/provider-setup-wizard'], ['แบบตั้งค่าค่าย', '/provider-presets'], ['ดูการโยกเงิน', '/game-transfers'], ['ตรวจยอดค่าย', '/reconciliation-center']] },
  { title: 'ขั้นสูง', items: [['เปลี่ยน API Key', '/provider-credentials'], ['ทดสอบ API ค่าย', '/adapter-test'], ['Webhook', '/webhook-logs'], ['ตรวจค่ายละเอียด', '/provider-risk'], ['ตั้งค่า API เดิม', '/game-api-settings'], ['ค่ายทั้งหมด', '/game-providers'], ['เกมทั้งหมด', '/games'], ['Session เกม', '/game-sessions'], ['Audit Logs', '/audit-logs']] },
  { title: 'ตั้งค่า', items: [['ตั้งค่าเว็บไซต์', '/settings'], ['ผู้ดูแลระบบ', '/admin-users'], ['ความปลอดภัย', '/security']] },
] as const;
