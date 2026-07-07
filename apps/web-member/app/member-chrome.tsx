'use client';

import { ReactNode, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

const menuItems = [
  ['หน้าหลัก', '/'],
  ['ฝากเงิน', '/deposit'],
  ['ถอนเงิน', '/withdraw'],
  ['ประวัติธุรกรรม', '/transactions'],
];

export default function MemberChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register');

  useEffect(() => {
    setIsLoggedIn(Boolean(window.localStorage.getItem('member_access_token')));
    setReady(true);
  }, [pathname]);

  function logout() {
    window.localStorage.removeItem('member_access_token');
    window.localStorage.removeItem('member_refresh_token');
    window.location.href = '/login';
  }

  if (isAuthPage) return <>{children}</>;

  return (
    <>
      <header className="member-topbar global-member-topbar">
        <a href="/" className="member-brand">
          <span className="member-brand-mark">P</span>
          <span className="member-brand-copy"><strong>Member Center</strong><small>{ready && isLoggedIn ? 'บัญชีสมาชิก' : 'Guest'}</small></span>
        </a>
        <div className="member-actions">
          {ready && !isLoggedIn && <a href="/login" className="member-login-link">เข้าสู่ระบบ</a>}
          <button type="button" className="member-menu-button" onClick={() => setMenuOpen(true)} aria-label="เปิดเมนู">☰</button>
        </div>
      </header>

      {menuOpen && <button type="button" className="member-menu-backdrop" onClick={() => setMenuOpen(false)} aria-label="ปิดเมนู" />}
      <aside className={menuOpen ? 'member-drawer open' : 'member-drawer'}>
        <div className="member-drawer-head">
          <div><strong>Member Center</strong><p>{ready && isLoggedIn ? 'บัญชีสมาชิก' : 'ยังไม่ได้เข้าสู่ระบบ'}</p></div>
          <button type="button" onClick={() => setMenuOpen(false)} aria-label="ปิดเมนู">×</button>
        </div>
        <nav className="member-drawer-nav">
          {menuItems.map(([title, href]) => <a key={href} href={href} onClick={() => setMenuOpen(false)} className={pathname === href ? 'active' : ''}>{title}</a>)}
        </nav>
        {ready && isLoggedIn ? <button type="button" className="member-logout-button" onClick={logout}>ออกจากระบบ</button> : <div className="member-auth-box"><a href="/login">เข้าสู่ระบบ</a><a href="/register">สมัครสมาชิก</a></div>}
      </aside>
      {children}
    </>
  );
}
