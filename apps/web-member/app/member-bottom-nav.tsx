'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { defaultIconSettings, iconSettings, isIconUrl, loadPublicSiteSettings, SiteIconSettings, IconKey } from './site-settings';

const items: Array<{ href: string; label: string; key: IconKey }> = [
  { href: '/', label: 'หน้าแรก', key: 'home' },
  { href: '/deposit', label: 'ฝาก', key: 'deposit' },
  { href: '/withdraw', label: 'ถอนเงิน', key: 'withdraw' },
  { href: '/games', label: 'เกม', key: 'games' },
  { href: '/bonus', label: 'โบนัส', key: 'bonus' },
  { href: '/affiliate', label: 'ตัวแทน', key: 'affiliate' },
  { href: '/support', label: 'ช่วยเหลือ', key: 'support' },
  { href: '/transactions', label: 'ประวัติ', key: 'history' },
];

export default function MemberBottomNav({ pendingCount = 0, icons: overrideIcons }: { pendingCount?: number; icons?: SiteIconSettings }) {
  const pathname = usePathname();
  const [icons, setIcons] = useState<SiteIconSettings>(overrideIcons ?? defaultIconSettings);
  useEffect(() => { if (overrideIcons) { setIcons(overrideIcons); return; } loadPublicSiteSettings().then((settings) => setIcons(iconSettings(settings))).catch(() => setIcons(defaultIconSettings)); }, [overrideIcons]);
  return <nav className="member-bottom-nav" aria-label="เมนูสมาชิก">
    {items.map((item) => {
      const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
      return <a key={item.href} href={item.href} className={active ? 'active' : undefined}><span className="member-bottom-icon"><IconValue value={icons[item.key]} /></span><span>{item.label}</span>{item.href === '/transactions' && pendingCount > 0 && <em>{pendingCount}</em>}</a>;
    })}
  </nav>;
}
function IconValue({ value }: { value: string }) { return isIconUrl(value) ? <img src={value} alt="" style={iconImageStyle} /> : <>{value}</>; }
const iconImageStyle = { width: 22, height: 22, objectFit: 'cover' as const, borderRadius: 7, display: 'block' };
