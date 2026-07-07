'use client';

import { ReactNode, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

const navItems = [
  ['Dashboard', '/dashboard'],
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
  const [queueCount, setQueueCount] = useState({ topups: 0, withdrawals: 0 });

  useEffect(() => {
    const token = window.localStorage.getItem('admin_access_token');
    if (!token) { window.location.href = '/login'; return; }
    loadQueueCount(token);
    const interval = window.setInterval(() => loadQueueCount(token), 60000);
    return () => window.clearInterval(interval);
  }, []);

  async function loadQueueCount(token: string) {
    const res = await fetch(`${API_URL}/admin/queues/summary`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json().catch(() => null);
    if (res.ok && data) setQueueCount({ topups: Number(data.topUps?.count ?? 0), withdrawals: Number(data.withdrawals?.count ?? 0) });
  }

  function logout() {
    window.localStorage.removeItem('admin_access_token');
    window.localStorage.removeItem('admin_refresh_token');
    window.location.href = '/login';
  }

  function badgeFor(href: string) {
    if (href === '/topups' && queueCount.topups > 0) return queueCount.topups;
    if (href === '/withdrawals' && queueCount.withdrawals > 0) return queueCount.withdrawals;
    if (href === '/dashboard' && queueCount.topups + queueCount.withdrawals > 0) return queueCount.topups + queueCount.withdrawals;
    return 0;
  }

  return (
    <main className="admin-shell admin-shell-drawer-mode">
      <header className="admin-topbar">
        <a href="/dashboard" className="admin-brand-row admin-brand-link">
          <span className="admin-brand-mark">A</span>
          <span className="admin-brand-text"><strong>Admin Console</strong><small>{queueCount.topups + queueCount.withdrawals > 0 ? `${queueCount.topups + queueCount.withdrawals} pending reviews` : 'Operation Center'}</small></span>
        </a>
        <button type="button" className="admin-menu-button" onClick={() => setMenuOpen(true)} aria-label="เปิดเมนูแอดมิน">☰</button>
      </header>
      {menuOpen && <button type="button" className="admin-drawer-backdrop" onClick={() => setMenuOpen(false)} aria-label="ปิดเมนู" />}
      <aside className={menuOpen ? 'admin-drawer open' : 'admin-drawer'}>
        <div className="admin-drawer-head"><div><strong>Admin Console</strong><p>Topups {queueCount.topups} · Withdrawals {queueCount.withdrawals}</p></div><button type="button" onClick={() => setMenuOpen(false)} aria-label="ปิดเมนู">×</button></div>
        <nav className="admin-drawer-nav" aria-label="Admin navigation">
          {navItems.map(([title, href]) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            const badge = badgeFor(href);
            return <a key={href} href={href} onClick={() => setMenuOpen(false)} className={active ? 'active' : ''}><span>{title}</span>{badge > 0 && <em>{badge}</em>}</a>;
          })}
        </nav>
        <button type="button" className="admin-logout-button" onClick={logout}>ออกจากระบบ</button>
      </aside>
      <section className="admin-content-shell">{children}</section>
    </main>
  );
}
