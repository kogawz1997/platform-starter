'use client';

import { ReactNode, useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { API_URL, clearMemberSession, memberApiFetch, refreshMemberToken } from './member-api';
import { defaultIconSettings, defaultSettings, iconSettings, isIconUrl, loadPublicSiteSettings, PublicSiteSettings, SiteIconSettings, textSetting } from './site-settings';

const bottomNavItems: Array<{ title: string; href: string; iconKey: keyof SiteIconSettings; badge?: boolean }> = [
  { title: 'หน้าแรก', href: '/', iconKey: 'home' },
  { title: 'เกม', href: '/games', iconKey: 'games' },
  { title: 'ฝาก', href: '/deposit', iconKey: 'deposit' },
  { title: 'ถอนเงิน', href: '/withdraw', iconKey: 'withdraw' },
  { title: 'ประวัติ', href: '/transactions', iconKey: 'history', badge: true },
];

const drawerItems: Array<{ title: string; href: string; description: string; iconKey: keyof SiteIconSettings; badge?: boolean }> = [
  { title: 'เกมทั้งหมด', href: '/games', description: 'เลือกเกม แนะนำ มาใหม่ และยอดนิยม', iconKey: 'games' },
  { title: 'โปรโมชัน', href: '/promotions', description: 'ดูโปรที่เปิดให้รับสิทธิ์', iconKey: 'promotion' },
  { title: 'โบนัส', href: '/bonus', description: 'ดูสถานะโบนัสและเทิร์น', iconKey: 'bonus' },
  { title: 'ตัวแทน', href: '/affiliate', description: 'ลิงก์แนะนำและค่าคอม', iconKey: 'affiliate' },
  { title: 'สถานะรายการ', href: '/transactions', description: 'เช็กรายการรอตรวจสอบ', iconKey: 'history', badge: true },
  { title: 'การจัดการบัญชีธนาคาร', href: '/bank-accounts', description: 'เพิ่มหรือแก้ไขบัญชีธนาคาร', iconKey: 'bank' },
  { title: 'ช่วยเหลือ', href: '/support', description: 'เปิด ticket และดูคำตอบ', iconKey: 'support' },
];

type MoneyRequest = { status: string };

export default function MemberChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [settings, setSettings] = useState<PublicSiteSettings>(defaultSettings);
  const icons = iconSettings(settings);
  const siteName = textSetting(settings, 'website', 'site_name', 'ศูนย์สมาชิก');
  const siteDescription = textSetting(settings, 'website', 'site_description', 'เมนูหลักอยู่ด้านล่างจอ');
  const logoUrl = textSetting(settings, 'branding', 'logo_url', '');
  const brandMark = textSetting(settings, 'branding', 'brand_mark', siteName.slice(0, 1).toUpperCase() || 'P');
  const primaryColor = textSetting(settings, 'branding', 'primary_color', '#f5c542');
  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register');
  const activeHref = useMemo(() => { if (pathname.startsWith('/games')) return '/games'; if (pathname.startsWith('/promotions')) return '/promotions'; if (pathname.startsWith('/bonus')) return '/bonus'; if (pathname.startsWith('/affiliate')) return '/affiliate'; if (pathname.startsWith('/deposit')) return '/deposit'; if (pathname.startsWith('/withdraw')) return '/withdraw'; if (pathname.startsWith('/transactions')) return '/transactions'; if (pathname.startsWith('/bank-accounts')) return '/bank-accounts'; if (pathname.startsWith('/support')) return '/support'; return '/'; }, [pathname]);

  useEffect(() => { loadPublicSiteSettings().then(setSettings).catch(() => setSettings(defaultSettings)); }, []);
  useEffect(() => { let cancelled = false; async function checkAuth() { const ok = await verifyMemberSession(); if (cancelled) return; setIsLoggedIn(ok); setReady(true); if (!isAuthPage && !ok) { const next = encodeURIComponent(`${pathname}${window.location.search}`); window.location.replace(`/login?next=${next}`); } if (isAuthPage && ok) window.location.replace('/'); } setReady(false); checkAuth(); return () => { cancelled = true; }; }, [pathname, isAuthPage]);
  useEffect(() => { if (!isLoggedIn || isAuthPage) return; let cancelled = false; async function loadPendingCount() { const [topupRes, withdrawalRes] = await Promise.all([memberApiFetch('/member/topups'), memberApiFetch('/member/withdrawals')]).catch(() => [] as Response[]); if (!topupRes || !withdrawalRes || cancelled) return; const topupData = await topupRes.json().catch(() => null); const withdrawalData = await withdrawalRes.json().catch(() => null); const topups = Array.isArray(topupData?.items) ? topupData.items as MoneyRequest[] : []; const withdrawals = Array.isArray(withdrawalData?.items) ? withdrawalData.items as MoneyRequest[] : []; setPendingCount([...topups, ...withdrawals].filter((item) => item.status === 'PENDING').length); } loadPendingCount(); return () => { cancelled = true; }; }, [isLoggedIn, isAuthPage]);
  useEffect(() => { if (!menuOpen) return; const bodyOverflow = document.body.style.overflow; const htmlOverflow = document.documentElement.style.overflow; document.body.style.overflow = 'hidden'; document.documentElement.style.overflow = 'hidden'; return () => { document.body.style.overflow = bodyOverflow; document.documentElement.style.overflow = htmlOverflow; }; }, [menuOpen]);
  function logout() { clearMemberSession(); window.location.href = '/login'; }
  if (isAuthPage) return <>{children}</>;
  if (!ready || !isLoggedIn) return <main style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', background: '#080808', color: '#fff', padding: 16 }}>กำลังโหลด...</main>;

  return <><header className="member-topbar global-member-topbar" style={{ borderColor: `${primaryColor}33` }}><a href="/" className="member-brand"><span className="member-brand-mark" style={{ background: primaryColor }}>{logoUrl ? <img src={logoUrl} alt="" style={logoStyle} /> : brandMark}</span><span className="member-brand-copy"><strong>{siteName}</strong><small>{siteDescription}</small></span></a><div className="member-actions"><button type="button" className="member-menu-button" onClick={() => setMenuOpen(true)} aria-label="เปิดเมนู">☰</button></div></header>{menuOpen && <button type="button" className="member-menu-backdrop" onClick={() => setMenuOpen(false)} aria-label="ปิดเมนู" />}<aside className={menuOpen ? 'member-drawer open' : 'member-drawer'} aria-hidden={!menuOpen}><div className="member-drawer-head"><div><strong>{siteName}</strong><p>{siteDescription}</p></div><button type="button" onClick={() => setMenuOpen(false)} aria-label="ปิดเมนู">×</button></div><nav className="member-drawer-nav">{drawerItems.map((item) => <a key={item.href} href={item.href} onClick={() => setMenuOpen(false)} className={activeHref === item.href ? 'active' : ''}><IconValue value={icons[item.iconKey] ?? defaultIconSettings[item.iconKey]} /><span className="member-drawer-copy"><strong>{item.title}</strong><small>{item.badge && pendingCount > 0 ? `${pendingCount} รายการรอตรวจสอบ` : item.description}</small></span>{item.badge && pendingCount > 0 && <em>{pendingCount}</em>}</a>)}</nav><button type="button" className="member-logout-button" onClick={logout}>ออกจากระบบ</button></aside>{children}<nav className="member-bottom-nav" aria-label="เมนูหลัก">{bottomNavItems.map((item) => <a key={item.href} href={item.href} className={activeHref === item.href ? 'active' : ''} aria-current={activeHref === item.href ? 'page' : undefined}><span className="member-bottom-icon"><IconValue value={icons[item.iconKey] ?? defaultIconSettings[item.iconKey]} /></span><span>{item.title}</span>{item.badge && pendingCount > 0 && <em>{pendingCount}</em>}</a>)}</nav></>;
}
function IconValue({ value }: { value: string }) { return isIconUrl(value) ? <img src={value} alt="" style={iconImageStyle} /> : <>{value}</>; }
async function verifyMemberSession() {
  const token = window.localStorage.getItem('member_access_token');
  if (!token && !window.localStorage.getItem('member_refresh_token')) return false;
  if (token) { const res = await fetch(`${API_URL}/member/wallet`, { headers: { Authorization: `Bearer ${token}` } }); if (res.ok) return true; if (res.status !== 401) return false; }
  const refreshed = await refreshMemberToken();
  if (!refreshed) { clearMemberSession(); return false; }
  const retry = await fetch(`${API_URL}/member/wallet`, { headers: { Authorization: `Bearer ${refreshed}` } });
  if (retry.ok) return true;
  clearMemberSession();
  return false;
}
const logoStyle = { width: '100%', height: '100%', objectFit: 'cover' as const, borderRadius: 12, display: 'block' };
const iconImageStyle = { width: 22, height: 22, objectFit: 'cover' as const, borderRadius: 7, display: 'block', flex: '0 0 auto' };
