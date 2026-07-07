'use client';

import { ReactNode, useEffect } from 'react';
import { usePathname } from 'next/navigation';

const navItems = [
  ['Finance', '/finance'],
  ['Settings', '/settings'],
  ['Topups', '/topups'],
  ['Withdrawals', '/withdrawals'],
  ['Wallets', '/wallets'],
  ['Ledgers', '/ledgers'],
];

export default function AdminProtectedLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    const token = window.localStorage.getItem('admin_access_token');
    if (!token) window.location.href = '/login';
  }, []);

  return (
    <main className="admin-shell">
      <aside className="admin-nav-shell">
        <div className="admin-brand-row">
          <a href="/finance" className="admin-brand-mark">A</a>
          <div className="admin-brand-text">
            <strong>Admin Console</strong>
            <span>Operation Center</span>
          </div>
        </div>
        <nav className="admin-nav-scroll" aria-label="Admin navigation">
          {navItems.map(([title, href]) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return <a key={href} href={href} className={active ? 'admin-nav-link active' : 'admin-nav-link'}>{title}</a>;
          })}
        </nav>
      </aside>
      <section className="admin-content-shell">{children}</section>
    </main>
  );
}
