'use client';

import { PublicSiteSettings, textSetting } from './site-settings';

export default function MemberFooter({ settings }: { settings: PublicSiteSettings }) {
  const siteName = textSetting(settings, 'website', 'site_name', 'Platform Starter');
  const description = textSetting(settings, 'website', 'site_description', 'Member platform');
  const primaryColor = textSetting(settings, 'branding', 'primary_color', '#f5c542');
  const company = textSetting(settings, 'contact', 'company_name', siteName);
  const supportHours = textSetting(settings, 'contact', 'support_hours', 'ให้บริการทุกวัน');
  const phone = textSetting(settings, 'contact', 'phone', '');
  const email = textSetting(settings, 'contact', 'email', '');
  const links = [
    ['เงื่อนไขการใช้งาน', '/legal/terms'],
    ['นโยบายความเป็นส่วนตัว', '/legal/privacy'],
    ['การใช้งานอย่างรับผิดชอบ', '/legal/responsible-use'],
    ['ติดต่อเรา', '/contact'],
  ];
  return <footer style={footerStyle}>
    <div style={brandStyle}><strong style={{ color: primaryColor }}>{siteName}</strong><span>{description}</span><small>{company} · {supportHours}</small></div>
    <nav style={linkGridStyle} aria-label="ข้อมูลเว็บไซต์">{links.map(([label, href]) => <a key={href} href={href} style={{ ...linkStyle, color: primaryColor }}>{label}</a>)}</nav>
    {(phone || email) && <div style={contactStyle}>{phone && <a href={`tel:${phone}`} style={contactLinkStyle}>{phone}</a>}{email && <a href={`mailto:${email}`} style={contactLinkStyle}>{email}</a>}</div>}
    <small style={copyrightStyle}>© {new Date().getFullYear()} {company}. สงวนลิขสิทธิ์</small>
  </footer>;
}

const footerStyle = { width: '100%', maxWidth: 920, margin: '8px auto 96px', padding: 18, border: '1px solid rgba(255,255,255,.10)', borderRadius: 24, background: 'rgba(255,255,255,.035)', display: 'grid', gap: 14 } as const;
const brandStyle = { display: 'grid', gap: 4 } as const;
const linkGridStyle = { display: 'flex', gap: 10, flexWrap: 'wrap' as const };
const linkStyle = { textDecoration: 'none', fontWeight: 850, fontSize: 13 } as const;
const contactStyle = { display: 'flex', gap: 10, flexWrap: 'wrap' as const };
const contactLinkStyle = { color: '#cbd5e1', textDecoration: 'none', fontSize: 13 } as const;
const copyrightStyle = { color: '#64748b' } as const;
