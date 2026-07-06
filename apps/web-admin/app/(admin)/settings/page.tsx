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
  ['Top Up Review', '/topups', 'ตรวจสลิปและอนุมัติรายการฝากเงิน'],
  ['Withdrawal Review', '/withdrawals', 'ตรวจและปิดรายการถอนเงิน'],
  ['Wallet Ledgers', '/ledgers', 'ดูประวัติเงินทั้งหมด ฝาก ถอน และยอดก่อน/หลัง'],
  ['Member Wallets', '/wallets', 'ค้นหา wallet สมาชิกและดูยอดคงเหลือ'],
];

export default function SettingsPage() {
  return (
    <main style={{ maxWidth: 1120, margin: '32px auto', padding: 24 }}>
      <h1>Settings</h1>
      <p>ตั้งค่าเว็บไซต์ แบรนด์ SEO และระบบเปิด/ปิดฟีเจอร์ แยกจากระบบเงินชัดเจน</p>

      <h2>Website Settings</h2>
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginTop: 18 }}>
        {settingsItems.map(([title, href, description]) => (
          <a key={href} href={href} style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>{title}</h2>
            <p>{description}</p>
          </a>
        ))}
      </section>

      <h2 style={{ marginTop: 32 }}>Money Operations</h2>
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginTop: 18 }}>
        {moneyItems.map(([title, href, description]) => (
          <a key={href} href={href} style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>{title}</h2>
            <p>{description}</p>
          </a>
        ))}
      </section>
    </main>
  );
}

const cardStyle = {
  border: '1px solid #ddd',
  borderRadius: 14,
  padding: 18,
  textDecoration: 'none',
  color: 'inherit',
} as const;
