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
    <main style={pageStyle}>
      <p style={eyebrowStyle}>Admin Console</p>
      <h1 style={titleStyle}>Settings</h1>
      <p style={mutedStyle}>ตั้งค่าเว็บไซต์ แบรนด์ SEO ฟีเจอร์ และทางลัดระบบเงิน</p>

      <SectionTitle title="Website Settings" />
      <section style={gridStyle}>{settingsItems.map(([title, href, description]) => <HubCard key={href} title={title} href={href} description={description} />)}</section>

      <SectionTitle title="Money Operations" />
      <section style={gridStyle}>{moneyItems.map(([title, href, description]) => <HubCard key={href} title={title} href={href} description={description} accent />)}</section>
    </main>
  );
}

function SectionTitle({ title }: { title: string }) { return <h2 style={sectionTitleStyle}>{title}</h2>; }
function HubCard({ title, href, description, accent }: { title: string; href: string; description: string; accent?: boolean }) { return <a href={href} style={{ ...cardStyle, borderColor: accent ? 'rgba(245,197,66,0.35)' : 'rgba(255,255,255,0.12)' }}><span style={pillStyle}>{accent ? 'Money' : 'Config'}</span><h2 style={{ margin: '12px 0 8px', fontSize: 24 }}>{title}</h2><p style={mutedStyle}>{description}</p></a>; }

const pageStyle = { maxWidth: 1120, margin: '0 auto', padding: '22px 16px 44px', color: '#fff' } as const;
const eyebrowStyle = { margin: '18px 0 0', opacity: 0.66, fontSize: 14 } as const;
const titleStyle = { margin: '6px 0 8px', fontSize: 'clamp(42px, 12vw, 74px)', lineHeight: 0.96, letterSpacing: -1.4 } as const;
const mutedStyle = { margin: 0, opacity: 0.76, lineHeight: 1.55 } as const;
const sectionTitleStyle = { margin: '26px 0 12px', fontSize: 'clamp(24px, 7vw, 34px)', lineHeight: 1 } as const;
const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 12 } as const;
const cardStyle = { border: '1px solid rgba(255,255,255,0.12)', borderRadius: 24, padding: 16, background: '#181818', textDecoration: 'none', color: 'inherit', minHeight: 150 } as const;
const pillStyle = { display: 'inline-block', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 999, padding: '6px 10px', fontSize: 12, fontWeight: 900, background: 'rgba(255,255,255,0.05)' } as const;
