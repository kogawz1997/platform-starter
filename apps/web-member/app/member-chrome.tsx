'use client';

import { ReactNode, useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { API_URL, clearMemberSession, memberApiFetch, refreshMemberToken } from './member-api';

const bottomNavItems = [
  { title: 'หน้าหลัก', href: '/', icon: '⌂' },
  { title: 'เกม', href: '/games', icon: '▦' },
  { title: 'ฝาก', href: '/deposit', icon: '＋' },
  { title: 'ถอนเงิน', href: '/withdraw', icon: '−' },
  { title: 'ประวัติ', href: '/transactions', icon: '≡', badge: true },
];

const drawerItems = [
  { title: 'เกมทั้งหมด', href: '/games', description: 'เลือกเกม แนะนำ มาใหม่ และยอดนิยม' },
  { title: 'สถานะรายการ', href: '/transactions', description: 'เช็กรายการรอตรวจสอบ', badge: true },
  { title: 'การจัดการบัญชีธนาคาร', href: '/bank-accounts', description: 'เพิ่มหรือแก้ไขบัญชีธนาคาร' },
];

type MoneyRequest = { status: string };

export default function MemberChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register');
  const activeHref = useMemo(() => { if (pathname.startsWith('/games')) return '/games'; if (pathname.startsWith('/deposit')) return '/deposit'; if (pathname.startsWith('/withdraw')) return '/withdraw'; if (pathname.startsWith('/transactions')) return '/transactions'; if (pathname.startsWith('/bank-accounts')) return '/bank-accounts'; return '/'; }, [pathname]);

  useEffect(() => { let cancelled = false; async function checkAuth() { const ok = await verifyMemberSession(); if (cancelled) return; setIsLoggedIn(ok); setReady(true); if (!isAuthPage && !ok) { const next = encodeURIComponent(`${pathname}${window.location.search}`); window.location.replace(`/login?next=${next}`); } if (isAuthPage && ok) window.location.replace('/'); } setReady(false); checkAuth(); return () => { cancelled = true; }; }, [pathname, isAuthPage]);
  useEffect(() => { if (!isLoggedIn || isAuthPage) return; let cancelled = false; async function loadPendingCount() { const [topupRes, withdrawalRes] = await Promise.all([memberApiFetch('/member/topups'), memberApiFetch('/member/withdrawals')]).catch(() => [] as Response[]); if (!topupRes || !withdrawalRes || cancelled) return; const topupData = await topupRes.json().catch(() => null); const withdrawalData = await withdrawalRes.json().catch(() => null); const topups = Array.isArray(topupData?.items) ? topupData.items as MoneyRequest[] : []; const withdrawals = Array.isArray(withdrawalData?.items) ? withdrawalData.items as MoneyRequest[] : []; setPendingCount([...topups, ...withdrawals].filter((item) => item.status === 'PENDING').length); } loadPendingCount(); return () => { cancelled = true; }; }, [isLoggedIn, isAuthPage]);
  useEffect(() => { if (!menuOpen) return; const bodyOverflow = document.body.style.overflow; const htmlOverflow = document.documentElement.style.overflow; document.body.style.overflow = 'hidden'; document.documentElement.style.overflow = 'hidden'; return () => { document.body.style.overflow = bodyOverflow; document.documentElement.style.overflow = htmlOverflow; }; }, [menuOpen]);
  function logout() { clearMemberSession(); window.location.href = '/login'; }
  if (isAuthPage) return <>{children}</>;
  if (!ready || !isLoggedIn) return <main style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', background: '#080808', color: '#fff', padding: 16 }}>กำลังโหลด...</main>;

  return <><header className="member-topbar global-member-topbar"><a href="/" className="member-brand"><span className="member-brand-mark">P</span><span className="member-brand-copy"><strong>ศูนย์สมาชิก</strong></span></a><div className="member-actions"><button type="button" className="member-menu-button" onClick={() => setMenuOpen(true)} aria-label="เปิดเมนู">☰</button></div></header>{menuOpen && <button type="button" className="member-menu-backdrop" onClick={() => setMenuOpen(false)} aria-label="ปิดเมนู" />}<aside className={menuOpen ? 'member-drawer open' : 'member-drawer'} aria-hidden={!menuOpen}><div className="member-drawer-head"><div><strong>เมนูเพิ่มเติม</strong><p>เมนูหลักอยู่ด้านล่างจอ</p></div><button type="button" onClick={() => setMenuOpen(false)} aria-label="ปิดเมนู">×</button></div><nav className="member-drawer-nav">{drawerItems.map((item) => <a key={item.href} href={item.href} onClick={() => setMenuOpen(false)} className={activeHref === item.href ? 'active' : ''}><span className="member-drawer-copy"><strong>{item.title}</strong><small>{item.badge && pendingCount > 0 ? `${pendingCount} รายการรอตรวจสอบ` : item.description}</small></span>{item.badge && pendingCount > 0 && <em>{pendingCount}</em>}</a>)}</nav><button type="button" className="member-logout-button" onClick={logout}>ออกจากระบบ</button></aside>{children}<nav className="member-bottom-nav" aria-label="เมนูหลัก">{bottomNavItems.map((item) => <a key={item.href} href={item.href} className={activeHref === item.href ? 'active' : ''} aria-current={activeHref === item.href ? 'page' : undefined}><span className="member-bottom-icon">{item.icon}</span><span>{item.title}</span>{item.badge && pendingCount > 0 && <em>{pendingCount}</em>}</a>)}</nav></>;
}

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
