'use client';

import { ReactNode, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { clearMemberSession, refreshMemberToken } from './member-api';

const menuItems = [
  ['หน้าหลัก', '/'],
  ['ฝากเงิน', '/deposit'],
  ['ถอนเงิน', '/withdraw'],
  ['ประวัติธุรกรรม', '/transactions'],
  ['บัญชีถอนเงิน', '/bank-accounts'],
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
      const hasToken = Boolean(window.localStorage.getItem('member_access_token'));
      let ok = hasToken;
      if (!ok && window.localStorage.getItem('member_refresh_token')) ok = Boolean(await refreshMemberToken());
      if (cancelled) return;
      setIsLoggedIn(ok);
      setReady(true);
      if (!isAuthPage && !ok) {
        const next = encodeURIComponent(`${pathname}${window.location.search}`);
        window.location.replace(`/login?next=${next}`);
      }
      if (isAuthPage && ok) window.location.replace('/');
    }
    checkAuth();
    return () => { cancelled = true; };
  }, [pathname, isAuthPage]);

  function logout() {
    clearMemberSession();
    window.location.href = '/login';
  }

  if (isAuthPage) return <>{children}</>;
  if (!ready || !isLoggedIn) return <main style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', background: '#080808', color: '#fff', padding: 16 }}>กำลังตรวจสอบสิทธิ์...</main>;

  return (
    <>
      <header className="member-topbar global-member-topbar">
        <a href="/" className="member-brand"><span className="member-brand-mark">P</span><span className="member-brand-copy"><strong>Member Center</strong><small>บัญชีสมาชิก</small></span></a>
        <div className="member-actions"><button type="button" className="member-menu-button" onClick={() => setMenuOpen(true)} aria-label="เปิดเมนู">☰</button></div>
      </header>
      {menuOpen && <button type="button" className="member-menu-backdrop" onClick={() => setMenuOpen(false)} aria-label="ปิดเมนู" />}
      <aside className={menuOpen ? 'member-drawer open' : 'member-drawer'}>
        <div className="member-drawer-head"><div><strong>Member Center</strong><p>บัญชีสมาชิก</p></div><button type="button" onClick={() => setMenuOpen(false)} aria-label="ปิดเมนู">×</button></div>
        <nav className="member-drawer-nav">{menuItems.map(([title, href]) => <a key={href} href={href} onClick={() => setMenuOpen(false)} className={pathname === href ? 'active' : ''}>{title}</a>)}</nav>
        <button type="button" className="member-logout-button" onClick={logout}>ออกจากระบบ</button>
      </aside>
      {children}
    </>
  );
}
