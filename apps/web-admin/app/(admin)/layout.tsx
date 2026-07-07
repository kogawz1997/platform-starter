'use client';

import { ReactNode, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

const navItems = [
  ['Finance', '/finance'],
  ['Reports', '/reports'],
  ['Exports', '/exports'],
  ['Settings', '/settings'],
  ['Topups', '/topups'],
  ['Withdrawals', '/withdrawals'],
  ['Wallets', '/wallets'],
  ['Ledgers', '/ledgers'],
];

export default function AdminProtectedLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const token = window.localStorage.getItem('admin_access_token');
    if (!token) window.location.href = '/login';
  }, []);

  function logout() {
    window.localStorage.removeItem('admin_access_token');
    window.localStorage.removeItem('admin_refresh_token');
    window.location.href = '/login';
  }

  return (
    <main className="admin-shell admin-shell-drawer-mode">
      <header className="admin-topbar">
        <a href="/finance" className="admin-brand-row admin-brand-link">
          <span className="admin-brand-mark">A</span>
          <span className="admin-brand-text"><strong>Admin Console</strong><small>Operation Center</small></span>
        </a>
        <button type="button" className="admin-menu-button" onClick={() => setMenuOpen(true)} aria-label="เปิดเมนูแอดมิน">☰</button>
      </header>
      {menuOpen && <button type="button" className="admin-drawer-backdrop" onClick={() => setMenuOpen(false)} aria-label="ปิดเมนู" />}
      <aside className={menuOpen ? 'admin-drawer open' : 'admin-drawer'}>
        <div className="admin-drawer-head"><div><strong>Admin Console</strong><p>เมนูจัดการระบบ</p></div><button type="button" onClick={() => setMenuOpen(false)} aria-label="ปิดเมนู">×</button></div>
        <nav className="admin-drawer-nav" aria-label="Admin navigation">
          {navItems.map(([title, href]) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return <a key={href} href={href} onClick={() => setMenuOpen(false)} className={active ? 'active' : ''}>{title}</a>;
          })}
        </nav>
        <button type="button" className="admin-logout-button" onClick={logout}>ออกจากระบบ</button>
      </aside>
      <section className="admin-content-shell">{children}</section>
    </main>
  );
}
