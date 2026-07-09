'use client';

import { usePathname } from 'next/navigation';

const items = [
  { href: '/', label: 'หน้าแรก', icon: '⌂' },
  { href: '/deposit', label: 'ฝาก', icon: '＋' },
  { href: '/withdraw', label: 'ถอนเงิน', icon: '↗' },
  { href: '/games', label: 'เกม', icon: '🎮' },
  { href: '/bonus', label: 'โบนัส', icon: '★' },
  { href: '/affiliate', label: 'ตัวแทน', icon: '↔' },
  { href: '/support', label: 'ช่วยเหลือ', icon: '✉' },
  { href: '/transactions', label: 'ประวัติ', icon: '≡' },
];

export default function MemberBottomNav({ pendingCount = 0 }: { pendingCount?: number }) {
  const pathname = usePathname();
  return <nav className="member-bottom-nav" aria-label="เมนูสมาชิก">
    {items.map((item) => {
      const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
      return <a key={item.href} href={item.href} className={active ? 'active' : undefined}><span className="member-bottom-icon">{item.icon}</span><span>{item.label}</span>{item.href === '/transactions' && pendingCount > 0 && <em>{pendingCount}</em>}</a>;
    })}
  </nav>;
}
