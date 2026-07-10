'use client';

import { ReactNode, useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { API_URL, clearMemberSession, memberApiFetch, refreshMemberToken } from './member-api';
import { defaultIconSettings, defaultSettings, iconSettings, isIconUrl, loadPublicSiteSettings, memberFeatureFlags, PublicSiteSettings, SiteIconSettings, textSetting } from './site-settings';

const bottomNavItems: Array<{ title: string; href: string; iconKey: keyof SiteIconSettings; badge?: boolean; feature?: keyof ReturnType<typeof memberFeatureFlags> }> = [
  { title: 'หน้าแรก', href: '/', iconKey: 'home' },
  { title: 'เกม', href: '/games', iconKey: 'games', feature: 'games' },
  { title: 'ฝาก', href: '/deposit', iconKey: 'deposit', feature: 'deposit' },
  { title: 'ถอนเงิน', href: '/withdraw', iconKey: 'withdraw', feature: 'withdraw' },
  { title: 'ประวัติ', href: '/transactions', iconKey: 'history', badge: true },
];

const drawerItems: Array<{ title: string; href: string; description: string; iconKey: keyof SiteIconSettings; badge?: boolean; feature?: keyof ReturnType<typeof memberFeatureFlags> }> = [
  { title: 'เกมทั้งหมด', href: '/games', description: 'เลือกเกม แนะนำ มาใหม่ และยอดนิยม', iconKey: 'games', feature: 'games' },
  { title: 'โปรโมชัน', href: '/promotions', description: 'ดูโปรที่เปิดให้รับสิทธิ์', iconKey: 'promotion', feature: 'promotion' },
  { title: 'โบนัส', href: '/bonus', description: 'ดูสถานะโบนัสและเทิร์น', iconKey: 'bonus', feature: 'bonus' },
  { title: 'ตัวแทน', href: '/affiliate', description: 'ลิงก์แนะนำและค่าคอม', iconKey: 'affiliate', feature: 'affiliate' },
  { title: 'สถานะรายการ', href: '/transactions', description: 'เช็กรายการรอตรวจสอบ', iconKey: 'history', badge: true },
  { title: 'การจัดการบัญชีธนาคาร', href: '/bank-accounts', description: 'เพิ่มหรือแก้ไขบัญชีธนาคาร', iconKey: 'bank', feature: 'kyc' },
  { title: 'ช่วยเหลือ', href: '/support', description: 'เปิด ticket และดูคำตอบ', iconKey: 'support', feature: 'support' },
];

type MoneyRequest = { status: string };

type DisabledRoute = { prefix: string; feature: keyof ReturnType<typeof memberFeatureFlags>; label: string };
const disabledRoutes: DisabledRoute[] = [
  { prefix: '/games', feature: 'games', label: 'เกม' },
  { prefix: '/deposit', feature: 'deposit', label: 'ฝาก' },
  { prefix: '/withdraw', feature: 'withdraw', label: 'ถอนเงิน' },
  { prefix: '/promotions', feature: 'promotion', label: 'โปรโมชัน' },
  { prefix: '/bonus', feature: 'bonus', label: 'โบนัส' },
  { prefix: '/affiliate', feature: 'affiliate', label: 'ตัวแทน' },
  { prefix: '/support', feature: 'support', label: 'ช่วยเหลือ' },
  { prefix: '/bank-accounts', feature: 'kyc', label: 'บัญชีธนาคาร' },
  { prefix: '/profile', feature: 'profile', label: 'โปรไฟล์' },
  { prefix: '/notifications', feature: 'notifications', label: 'แจ้งเตือน' },
];

export default function MemberChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [settings, setSettings] = useState<PublicSiteSettings>(defaultSettings);
  const icons = iconSettings(settings);
  const features = memberFeatureFlags(settings);
  const siteName = textSetting(settings, 'website', 'site_name', 'ศูนย์สมาชิก');
  const siteDescription = textSetting(settings, 'website', 'site_description', 'เมนูหลักอยู่ด้านล่างจอ');
  const logoUrl = textSetting(settings, 'branding', 'logo_url', '');
  const brandMark = textSetting(settings, 'branding', 'brand_mark', siteName.slice(0, 1).toUpperCase() || 'P');
  const primaryColor = textSetting(settings, 'branding', 'primary_color', '#f5c542');
  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register');
  const activeHref = useMemo(() => { if (pathname.startsWith('/games')) return '/games'; if (pathname.startsWith('/promotions')) return '/promotions'; if (pathname.startsWith('/bonus')) return '/bonus'; if (pathname.startsWith('/affiliate')) return '/affiliate'; if (pathname.startsWith('/deposit')) return '/deposit'; if (pathname.startsWith('/withdraw')) return '/withdraw'; if (pathname.startsWith('/transactions')) return '/transactions'; if (pathname.startsWith('/bank-accounts')) return '/bank-accounts'; if (pathname.startsWith('/support')) return '/support'; return '/'; }, [pathname]);
  const blockedRoute = disabledRoutes.find((route) => pathname.startsWith(route.prefix) && !features[route.feature]);
  const visibleBottomNav = bottomNavItems.filter((item) => !item.feature || features[item.feature]);
  const visibleDrawer = drawerItems.filter((item) => !item.feature || features[item.feature]);

  useEffect(() => { loadPublicSiteSettings().then(setSettings).catch(() => setSettings(defaultSettings)); }, []);
  useEffect(() => { let cancelled = false; async function checkAuth() { const ok = await verifyMemberSession(); if (cancelled) return; setIsLoggedIn(ok); setReady(true); if (!isAuthPage && !ok) { const next = encodeURIComponent(`${pathname}${window.location.search}`); window.location.replace(`/login?next=${next}`); } if (isAuthPage && ok) window.location.replace('/'); } setReady(false); checkAuth(); return () => { cancelled = true; }; }, [pathname, isAuthPage]);
  useEffect(() => { if (!isLoggedIn || isAuthPage) return; let cancelled = false; async function loadPendingCount() { const [topupRes, withdrawalRes] = await Promise.all([memberApiFetch('/member/topups'), memberApiFetch('/member/withdrawals')]).catch(() => [] as Response[]); if (!topupRes || !withdrawalRes || cancelled) return; const topupData = await topupRes.json().catch(() => null); const withdrawalData = await withdrawalRes.json().catch(() => null); const topups = Array.isArray(topupData?.items) ? topupData.items as MoneyRequest[] : []; const withdrawals = Array.isArray(withdrawalData?.items) ? withdrawalData.items as MoneyRequest[] : []; setPendingCount([...topups, ...withdrawals].filter((item) => item.status === 'PENDING').length); } loadPendingCount(); return () => { cancelled = true; }; }, [isLoggedIn, isAuthPage]);
  useEffect(() => { if (!menuOpen) return; const bodyOverflow = document.body.style.overflow; const htmlOverflow = document.documentElement.style.overflow; document.body.style.overflow = 'hidden'; document.documentElement.style.overflow = 'hidden'; return () => { document.body.style.overflow = bodyOverflow; document.documentElement.style.overflow = htmlOverflow; }; }, [menuOpen]);
  function logout() { clearMemberSession(); window.location.href = '/login'; }
  if (isAuthPage) return <>{children}</>;
  if (!ready || !isLoggedIn) return <main style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', background: '#080808', color: '#fff', padding: 16 }}>กำลังโหลด...</main>;

  const content = blockedRoute ? <FeatureDisabled label={blockedRoute.label} siteName={siteName} primaryColor={primaryColor} /> : children;

  return <><header className="member-topbar global-member-topbar" style={{ borderColor: `${primaryColor}33` }}><a href="/" className="member-brand"><span className="member-brand-mark" style={{ background: primaryColor }}>{logoUrl ? <img src={logoUrl} alt="" style={logoStyle} /> : brandMark}</span><span className="member-brand-copy"><strong>{siteName}</strong><small>{siteDescription}</small></span></a><div className="member-actions"><button type="button" className="member-menu-button" onClick={() => setMenuOpen(true)} aria-label="เปิดเมนู">☰</button></div></header>{menuOpen && <button type="button" className="member-menu-backdrop" onClick={() => setMenuOpen(false)} aria-label="ปิดเมนู" />}<aside className={menuOpen ? 'member-drawer open' : 'member-drawer'} aria-hidden={!menuOpen}><div className="member-drawer-head"><div><strong>{siteName}</strong><p>{siteDescription}</p></div><button type="button" onClick={() => setMenuOpen(false)} aria-label="ปิดเมนู">×</button></div><nav className="member-drawer-nav">{visibleDrawer.map((item) => <a key={item.href} href={item.href} onClick={() => setMenuOpen(false)} className={activeHref === item.href ? 'active' : ''}><IconValue value={icons[item.iconKey] ?? defaultIconSettings[item.iconKey]} /><span className="member-drawer-copy"><strong>{item.title}</strong><small>{item.badge && pendingCount > 0 ? `${pendingCount} รายการรอตรวจสอบ` : item.description}</small></span>{item.badge && pendingCount > 0 && <em>{pendingCount}</em>}</a>)}</nav><button type="button" className="member-logout-button" onClick={logout}>ออกจากระบบ</button></aside>{content}<nav className="member-bottom-nav" aria-label="เมนูหลัก">{visibleBottomNav.map((item) => <a key={item.href} href={item.href} className={activeHref === item.href ? 'active' : ''} aria-current={activeHref === item.href ? 'page' : undefined}><span className="member-bottom-icon"><IconValue value={icons[item.iconKey] ?? defaultIconSettings[item.iconKey]} /></span><span>{item.title}</span>{item.badge && pendingCount > 0 && <em>{pendingCount}</em>}</a>)}</nav></>;
}

function FeatureDisabled({ label, siteName, primaryColor }: { label: string; siteName: string; primaryColor: string }) {
  return <main style={disabledPageStyle}><section style={disabledCardStyle}><span style={{ ...disabledBadgeStyle, color: primaryColor, borderColor: `${primaryColor}55`, background: `${primaryColor}12` }}>ปิดใช้งานชั่วคราว</span><h1 style={disabledTitleStyle}>{label}</h1><p style={disabledTextStyle}>{siteName} ปิดฟีเจอร์นี้จากการตั้งค่าระบบ กรุณากลับหน้าแรกหรือรอประกาศเปิดใช้งานอีกครั้ง</p><a href="/" style={{ ...disabledButtonStyle, background: primaryColor }}>กลับหน้าแรก</a></section></main>;
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
const disabledPageStyle = { minHeight: 'calc(100dvh - 80px)', display: 'grid', placeItems: 'center', padding: '24px 16px 120px', background: 'linear-gradient(180deg,#080808,#111827)', color: '#fff' } as const;
const disabledCardStyle = { width: 'min(520px,100%)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 26, padding: 22, background: 'rgba(15,23,42,.86)', display: 'grid', gap: 12, textAlign: 'center' as const };
const disabledBadgeStyle = { justifySelf: 'center', border: '1px solid', borderRadius: 999, padding: '8px 12px', fontWeight: 950, fontSize: 13 } as const;
const disabledTitleStyle = { margin: 0, fontSize: 34, lineHeight: 1.05 } as const;
const disabledTextStyle = { margin: 0, color: '#cbd5e1', lineHeight: 1.6 } as const;
const disabledButtonStyle = { justifySelf: 'center', minHeight: 44, borderRadius: 14, padding: '0 16px', display: 'inline-flex', alignItems: 'center', color: '#111827', textDecoration: 'none', fontWeight: 950 } as const;
