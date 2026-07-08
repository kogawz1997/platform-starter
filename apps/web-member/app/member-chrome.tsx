'use client';

import { ReactNode, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { API_URL, clearMemberSession, refreshMemberToken } from './member-api';

const menuItems = [
  ['หน้าหลัก', '/'],
  ['เติมเงิน', '/deposit'],
  ['ถอนเงิน', '/withdraw'],
  ['เงินเข้า-ออก', '/transactions'],
  ['บัญชีรับเงิน', '/bank-accounts'],
];

export default function MemberChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register');

  useEffect(() => {
    let cancelled = false;
    async function checkAuth() {
      const ok = await verifyMemberSession();
      if (cancelled) return;
      setIsLoggedIn(ok);
      setReady(true);
      if (!isAuthPage && !ok) {
        const next = encodeURIComponent(`${pathname}${window.location.search}`);
        window.location.replace(`/login?next=${next}`);
      }
      if (isAuthPage && ok) window.location.replace('/');
    }
    setReady(false);
    checkAuth();
    return () => { cancelled = true; };
  }, [pathname, isAuthPage]);

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

  function logout() {
    clearMemberSession();
    window.location.href = '/login';
  }

  if (isAuthPage) return <>{children}</>;
  if (!ready || !isLoggedIn) return <main style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', background: '#080808', color: '#fff', padding: 16 }}>กำลังโหลด...</main>;

  return (
    <>
      <header className="member-topbar global-member-topbar">
        <a href="/" className="member-brand"><span className="member-brand-mark">P</span><span className="member-brand-copy"><strong>ศูนย์สมาชิก</strong></span></a>
        <div className="member-actions"><button type="button" className="member-menu-button" onClick={() => setMenuOpen(true)} aria-label="เปิดเมนู">☰</button></div>
      </header>
      {menuOpen && <button type="button" className="member-menu-backdrop" onClick={() => setMenuOpen(false)} aria-label="ปิดเมนู" />}
      <aside className={menuOpen ? 'member-drawer open' : 'member-drawer'} aria-hidden={!menuOpen}>
        <div className="member-drawer-head"><div><strong>ศูนย์สมาชิก</strong></div><button type="button" onClick={() => setMenuOpen(false)} aria-label="ปิดเมนู">×</button></div>
        <nav className="member-drawer-nav">{menuItems.map(([title, href]) => <a key={href} href={href} onClick={() => setMenuOpen(false)} className={pathname === href ? 'active' : ''}>{title}</a>)}</nav>
        <button type="button" className="member-logout-button" onClick={logout}>ออกจากระบบ</button>
      </aside>
      {children}
    </>
  );
}

async function verifyMemberSession() {
  const token = window.localStorage.getItem('member_access_token');
  if (!token && !window.localStorage.getItem('member_refresh_token')) return false;

  if (token) {
    const res = await fetch(`${API_URL}/member/wallet`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) return true;
    if (res.status !== 401) return false;
  }

  const refreshed = await refreshMemberToken();
  if (!refreshed) {
    clearMemberSession();
    return false;
  }

  const retry = await fetch(`${API_URL}/member/wallet`, { headers: { Authorization: `Bearer ${refreshed}` } });
  if (retry.ok) return true;
  clearMemberSession();
  return false;
}
