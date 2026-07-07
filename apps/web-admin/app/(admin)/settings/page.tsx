import { AdminBadge, AdminCard, AdminGrid, AdminLinkButton, AdminMetric, AdminMetricGrid, AdminPage } from '../_components/admin-ui';

const settingsItems = [
  ['Website', '/settings/website', 'ข้อมูลเว็บหลัก ภาษา โดเมน และสถานะ login/register', 'Core'],
  ['Branding', '/settings/branding', 'โลโก้ สีหลัก ไอคอน และตัวอย่างหน้าตาแบรนด์', 'Brand'],
  ['Theme', '/settings/theme', 'Layout ผู้เล่น มือถือ เดสก์ท็อป และเกม', 'UI'],
  ['SEO', '/settings/seo', 'Meta, sitemap, robots และ social preview', 'Growth'],
  ['Contact', '/settings/contact', 'Line, Telegram, Facebook, email และช่องทางช่วยเหลือ', 'Support'],
  ['Maintenance', '/settings/maintenance', 'เปิด/ปิดปรับปรุงเว็บ ฝาก ถอน และ Provider', 'Ops'],
  ['Scripts', '/settings/scripts', 'Analytics, pixels และ custom scripts', 'Tracking'],
  ['Feature Flags', '/settings/features', 'เปิด/ปิดฟีเจอร์โดยไม่ต้อง deploy ใหม่', 'Release'],
  ['Legal Pages', '/settings/legal', 'Terms, Privacy, Cookie และนโยบายต่าง ๆ', 'Legal'],
];

const moneyItems = [
  ['Finance Summary', '/finance', 'ภาพรวมยอดเงินรวม คิว pending และรายการล่าสุด', 'Money'],
  ['Top Up Review', '/topups', 'ตรวจสลิปและอนุมัติรายการฝากเงิน', 'Queue'],
  ['Withdrawal Review', '/withdrawals', 'ตรวจและปิดรายการถอนเงิน', 'Queue'],
  ['Wallet Ledgers', '/ledgers', 'ดูประวัติเงินทั้งหมด ฝาก ถอน และยอดก่อน/หลัง', 'Audit'],
  ['Member Wallets', '/wallets', 'ค้นหา wallet สมาชิกและดูยอดคงเหลือ', 'Wallet'],
  ['Risk Alerts', '/risk-alerts', 'ตรวจพฤติกรรมเสี่ยงและรายการผิดปกติจากระบบเงิน', 'Risk'],
];

export default function SettingsPage() {
  return (
    <AdminPage eyebrow="Admin Console" title="Settings" description="ตั้งค่าเว็บไซต์ แบรนด์ SEO ฟีเจอร์ และทางลัดระบบเงิน">
      <AdminMetricGrid>
        <AdminMetric title="Config modules" value={String(settingsItems.length)} helper="Website, branding, SEO และ feature flags" />
        <AdminMetric title="Money shortcuts" value={String(moneyItems.length)} helper="คิวเงิน, wallet, ledger และ risk" />
        <AdminMetric title="Deploy safety" value="Runbook" helper="มี docs/production-runbook.md แล้ว" />
      </AdminMetricGrid>

      <section style={quickPanelStyle}>
        <div>
          <h2 style={{ margin: 0 }}>Quick actions</h2>
          <p style={mutedStyle}>ทางลัดที่ใช้บ่อยตอนดู production ไม่ต้องกดหลงเหมือนเดินห้างแล้วหาทางออกไม่เจอ</p>
        </div>
        <div style={quickActionsStyle}>
          <AdminLinkButton href="/settings/features">Feature Flags</AdminLinkButton>
          <AdminLinkButton href="/settings/maintenance">Maintenance</AdminLinkButton>
          <AdminLinkButton href="/risk-alerts">Risk Alerts</AdminLinkButton>
        </div>
      </section>

      <h2 style={sectionTitleStyle}>Website Settings</h2>
      <AdminGrid>{settingsItems.map(([title, href, description, badge]) => <HubCard key={href} title={title} href={href} description={description} badge={badge} />)}</AdminGrid>
      <h2 style={sectionTitleStyle}>Money Operations</h2>
      <AdminGrid>{moneyItems.map(([title, href, description, badge]) => <HubCard key={href} title={title} href={href} description={description} badge={badge} accent />)}</AdminGrid>
    </AdminPage>
  );
}

function HubCard({ title, href, description, badge, accent }: { title: string; href: string; description: string; badge: string; accent?: boolean }) {
  return <AdminCard><div style={cardStackStyle}><div style={cardTopStyle}><AdminBadge tone={accent ? 'warning' : 'neutral'}>{badge}</AdminBadge><span style={smallMutedStyle}>{accent ? 'Operation' : 'Config'}</span></div><h2 style={{ margin: 0, fontSize: 24 }}>{title}</h2><p style={mutedStyle}>{description}</p><AdminLinkButton href={href}>Open</AdminLinkButton></div></AdminCard>;
}

const sectionTitleStyle = { margin: '24px 0 12px', fontSize: 'clamp(24px, 7vw, 34px)', lineHeight: 1 } as const;
const quickPanelStyle = { border: '1px solid rgba(148,163,184,.18)', background: 'rgba(15,23,42,.58)', borderRadius: 22, padding: 18, display: 'flex', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' as const, alignItems: 'center' };
const quickActionsStyle = { display: 'flex', gap: 10, flexWrap: 'wrap' as const };
const cardStackStyle = { display: 'grid', gap: 10 } as const;
const cardTopStyle = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 } as const;
const mutedStyle = { margin: 0, color: '#94a3b8', lineHeight: 1.55 } as const;
const smallMutedStyle = { color: '#64748b', fontSize: 12, fontWeight: 900, textTransform: 'uppercase' as const, letterSpacing: '.08em' };
