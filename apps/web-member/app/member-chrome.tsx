'use client';

import { ReactNode, useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { memberApiFetch } from './member-api';
import { defaultIconSettings, iconSettings, isIconUrl, memberFeatureFlags, textSetting } from './site-settings';
import { activeNavigationHref, navigationFor } from './member-navigation';
import MemberFooter from './member-footer';
import { useSiteSettings } from './site-settings-provider';
import { useMemberSession } from './member-session-provider';

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

const publicPrefixes = ['/login', '/register', '/contact', '/legal'];

export default function MemberChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const { settings } = useSiteSettings();
  const { ready, isLoggedIn, logout } = useMemberSession();

  const icons = iconSettings(settings);
  const features = memberFeatureFlags(settings);
  const siteName = textSetting(settings, 'website', 'site_name', 'ศูนย์สมาชิก');
  const siteDescription = textSetting(settings, 'website', 'site_description', 'เมนูหลักอยู่ด้านล่างจอ');
  const logoUrl = textSetting(settings, 'branding', 'logo_url', '');
  const brandMark = textSetting(settings, 'branding', 'brand_mark', siteName.slice(0, 1).toUpperCase() || 'P');
  const primaryColor = textSetting(settings, 'branding', 'primary_color', '#f5c542');
  const isPublicRoute = publicPrefixes.some((prefix) => pathname.startsWith(prefix));
  const activeHref = useMemo(() => activeNavigationHref(pathname), [pathname]);
  const blockedRoute = disabledRoutes.find((route) => pathname.startsWith(route.prefix) && !features[route.feature]);
  const visibleBottomNav = navigationFor('bottom', features);
  const visibleDrawer = navigationFor('drawer', features);

  useEffect(() => {
    if (!ready) return;
    if ((pathname.startsWith('/login') || pathname.startsWith('/register')) && isLoggedIn) {
      window.location.replace('/');
      return;
    }
    if (!isPublicRoute && !isLoggedIn) {
      const next = encodeURIComponent(`${pathname}${window.location.search}`);
      window.location.replace(`/login?next=${next}`);
    }
  }, [ready, isLoggedIn, isPublicRoute, pathname]);

  useEffect(() => {
    if (!isLoggedIn || isPublicRoute) return;
    let cancelled = false;
    async function loadPendingCount() {
      const responses = await Promise.all([memberApiFetch('/member/topups'), memberApiFetch('/member/withdrawals')]).catch(() => [] as Response[]);
      const [topupRes, withdrawalRes] = responses;
      if (!topupRes || !withdrawalRes || cancelled) return;
      const [topupData, withdrawalData] = await Promise.all([
        topupRes.json().catch(() => null),
        withdrawalRes.json().catch(() => null),
      ]);
      const topups = Array.isArray(topupData?.items) ? topupData.items as MoneyRequest[] : [];
      const withdrawals = Array.isArray(withdrawalData?.items) ? withdrawalData.items as MoneyRequest[] : [];
      setPendingCount([...topups, ...withdrawals].filter((item) => item.status === 'PENDING').length);
    }
    void loadPendingCount();
    return () => { cancelled = true; };
  }, [isLoggedIn, isPublicRoute]);

  useEffect(() => {
    if (!menuOpen) return;
    const bodyOverflow = document.body.style.overflow;
    const htmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = bodyOverflow;
      document.documentElement.style.overflow = htmlOverflow;
    };
  }, [menuOpen]);

  if (isPublicRoute) return <>{children}</>;
  if (!ready || !isLoggedIn) return <main style={loadingPageStyle}>กำลังโหลด...</main>;

  const content = blockedRoute ? <FeatureDisabled label={blockedRoute.label} siteName={siteName} primaryColor={primaryColor} /> : children;

  return <>
    <header className="member-topbar global-member-topbar" style={{ borderColor: `${primaryColor}33` }}>
      <a href="/" className="member-brand">
        <span className="member-brand-mark" style={{ background: primaryColor }}>{logoUrl ? <img src={logoUrl} alt="" style={logoStyle} /> : brandMark}</span>
        <span className="member-brand-copy"><strong>{siteName}</strong><small>{siteDescription}</small></span>
      </a>
      <div className="member-actions"><button type="button" className="member-menu-button" onClick={() => setMenuOpen(true)} aria-label="เปิดเมนู">☰</button></div>
    </header>

    {menuOpen && <button type="button" className="member-menu-backdrop" onClick={() => setMenuOpen(false)} aria-label="ปิดเมนู" />}

    <aside className={menuOpen ? 'member-drawer open' : 'member-drawer'} aria-hidden={!menuOpen}>
      <div className="member-drawer-head"><div><strong>{siteName}</strong><p>{siteDescription}</p></div><button type="button" onClick={() => setMenuOpen(false)} aria-label="ปิดเมนู">×</button></div>
      <nav className="member-drawer-nav">
        {visibleDrawer.map((item) => <a key={item.key} href={item.href} onClick={() => setMenuOpen(false)} className={activeHref === item.href ? 'active' : ''}>
          <IconValue value={icons[item.iconKey] ?? defaultIconSettings[item.iconKey]} />
          <span className="member-drawer-copy"><strong>{item.title}</strong><small>{item.badge === 'pending' && pendingCount > 0 ? `${pendingCount} รายการรอตรวจสอบ` : item.description}</small></span>
          {item.badge === 'pending' && pendingCount > 0 && <em>{pendingCount}</em>}
        </a>)}
      </nav>
      <button type="button" className="member-logout-button" onClick={logout}>ออกจากระบบ</button>
    </aside>

    {content}
    <MemberFooter settings={settings} />

    <nav className="member-bottom-nav" aria-label="เมนูหลัก">
      {visibleBottomNav.map((item) => <a key={item.key} href={item.href} className={activeHref === item.href ? 'active' : ''} aria-current={activeHref === item.href ? 'page' : undefined}>
        <span className="member-bottom-icon"><IconValue value={icons[item.iconKey] ?? defaultIconSettings[item.iconKey]} /></span>
        <span>{item.shortTitle ?? item.title}</span>
        {item.badge === 'pending' && pendingCount > 0 && <em>{pendingCount}</em>}
      </a>)}
    </nav>
  </>;
}

function FeatureDisabled({ label, siteName, primaryColor }: { label: string; siteName: string; primaryColor: string }) {
  return <main style={disabledPageStyle}><section style={disabledCardStyle}><span style={{ ...disabledBadgeStyle, color: primaryColor, borderColor: `${primaryColor}55`, background: `${primaryColor}12` }}>ปิดใช้งานชั่วคราว</span><h1 style={disabledTitleStyle}>{label}</h1><p style={disabledTextStyle}>{siteName} ปิดฟีเจอร์นี้จากการตั้งค่าระบบ กรุณากลับหน้าแรกหรือรอประกาศเปิดใช้งานอีกครั้ง</p><a href="/" style={{ ...disabledButtonStyle, background: primaryColor }}>กลับหน้าแรก</a></section></main>;
}

function IconValue({ value }: { value: string }) {
  return isIconUrl(value) ? <img src={value} alt="" style={iconImageStyle} /> : <>{value}</>;
}

const loadingPageStyle = { minHeight: '100dvh', display: 'grid', placeItems: 'center', background: '#080808', color: '#fff', padding: 16 } as const;
const logoStyle = { width: '100%', height: '100%', objectFit: 'cover' as const, borderRadius: 12, display: 'block' };
const iconImageStyle = { width: 22, height: 22, objectFit: 'cover' as const, borderRadius: 7, display: 'block', flex: '0 0 auto' };
const disabledPageStyle = { minHeight: 'calc(100dvh - 80px)', display: 'grid', placeItems: 'center', padding: '24px 16px 120px', background: 'linear-gradient(180deg,#080808,#111827)', color: '#fff' } as const;
const disabledCardStyle = { width: 'min(520px,100%)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 26, padding: 22, background: 'rgba(15,23,42,.86)', display: 'grid', gap: 12, textAlign: 'center' as const };
const disabledBadgeStyle = { justifySelf: 'center', border: '1px solid', borderRadius: 999, padding: '8px 12px', fontWeight: 950, fontSize: 13 } as const;
const disabledTitleStyle = { margin: 0, fontSize: 34, lineHeight: 1.05 } as const;
const disabledTextStyle = { margin: 0, color: '#cbd5e1', lineHeight: 1.6 } as const;
const disabledButtonStyle = { justifySelf: 'center', minHeight: 44, borderRadius: 14, padding: '0 16px', display: 'inline-flex', alignItems: 'center', color: '#111827', textDecoration: 'none', fontWeight: 950 } as const;
