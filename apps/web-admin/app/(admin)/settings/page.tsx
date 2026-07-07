import { AdminBadge, AdminCard, AdminGrid, AdminLinkButton, AdminPage } from './_components/admin-ui';

const settingsItems = [
  ['Website', '/settings/website', 'ข้อมูลเว็บหลัก ภาษา โดเมน และสถานะ login/register'],
  ['Branding', '/settings/branding', 'โลโก้ สีหลัก ไอคอน และตัวอย่างหน้าตาแบรนด์'],
  ['Theme', '/settings/theme', 'Layout ผู้เล่น มือถือ เดสก์ท็อป และเกม'],
  ['SEO', '/settings/seo', 'Meta, sitemap, robots และ social preview'],
  ['Contact', '/settings/contact', 'Line, Telegram, Facebook, email และช่องทางช่วยเหลือ'],
  ['Maintenance', '/settings/maintenance', 'เปิด/ปิดปรับปรุงเว็บ ฝาก ถอน และ Provider'],
  ['Scripts', '/settings/scripts', 'Analytics, pixels และ custom scripts'],
  ['Feature Flags', '/settings/features', 'เปิด/ปิดฟีเจอร์โดยไม่ต้อง deploy ใหม่'],
  ['Legal Pages', '/settings/legal', 'Terms, Privacy, Cookie และนโยบายต่าง ๆ'],
];

const moneyItems = [
  ['Finance Summary', '/finance', 'ภาพรวมยอดเงินรวม คิว pending และรายการล่าสุด'],
  ['Top Up Review', '/topups', 'ตรวจสลิปและอนุมัติรายการฝากเงิน'],
  ['Withdrawal Review', '/withdrawals', 'ตรวจและปิดรายการถอนเงิน'],
  ['Wallet Ledgers', '/ledgers', 'ดูประวัติเงินทั้งหมด ฝาก ถอน และยอดก่อน/หลัง'],
  ['Member Wallets', '/wallets', 'ค้นหา wallet สมาชิกและดูยอดคงเหลือ'],
];

export default function SettingsPage() {
  return (
    <AdminPage eyebrow="Admin Console" title="Settings" description="ตั้งค่าเว็บไซต์ แบรนด์ SEO ฟีเจอร์ และทางลัดระบบเงิน">
      <h2 style={sectionTitleStyle}>Website Settings</h2>
      <AdminGrid>{settingsItems.map(([title, href, description]) => <HubCard key={href} title={title} href={href} description={description} />)}</AdminGrid>
      <h2 style={sectionTitleStyle}>Money Operations</h2>
      <AdminGrid>{moneyItems.map(([title, href, description]) => <HubCard key={href} title={title} href={href} description={description} accent />)}</AdminGrid>
    </AdminPage>
  );
}

function HubCard({ title, href, description, accent }: { title: string; href: string; description: string; accent?: boolean }) {
  return <AdminCard><div style={{ display: 'grid', gap: 10 }}><AdminBadge tone={accent ? 'warning' : 'neutral'}>{accent ? 'Money' : 'Config'}</AdminBadge><h2 style={{ margin: 0, fontSize: 24 }}>{title}</h2><p style={{ margin: 0, color: '#94a3b8', lineHeight: 1.55 }}>{description}</p><AdminLinkButton href={href}>Open</AdminLinkButton></div></AdminCard>;
}

const sectionTitleStyle = { margin: '24px 0 12px', fontSize: 'clamp(24px, 7vw, 34px)', lineHeight: 1 } as const;
