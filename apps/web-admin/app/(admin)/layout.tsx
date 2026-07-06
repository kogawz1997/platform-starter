'use client';

import { ReactNode, useEffect } from 'react';

const navItems = [
  ['Finance', '/finance'],
  ['Settings', '/settings'],
  ['Topups', '/topups'],
  ['Withdrawals', '/withdrawals'],
  ['Wallets', '/wallets'],
  ['Ledgers', '/ledgers'],
];

export default function AdminProtectedLayout({ children }: { children: ReactNode }) {
  useEffect(() => {
    const token = window.localStorage.getItem('admin_access_token');
    if (!token) window.location.href = '/login';
  }, []);

  return (
    <main style={shellStyle}>
      <aside style={sideStyle}>
        <a href="/finance" style={brandStyle}>A</a>
        <nav style={navStyle}>
          {navItems.map(([title, href]) => <a key={href} href={href} style={linkStyle}>{title}</a>)}
        </nav>
      </aside>
      <section style={contentStyle}>{children}</section>
    </main>
  );
}

const shellStyle = { minHeight: '100vh', background: '#080808', color: '#fff', display: 'grid', gridTemplateColumns: '220px 1fr' } as const;
const sideStyle = { position: 'sticky', top: 0, height: '100vh', padding: 16, borderRight: '1px solid rgba(255,255,255,0.10)', background: '#101010', display: 'grid', alignContent: 'start', gap: 14 } as const;
const brandStyle = { width: 48, height: 48, borderRadius: 16, display: 'grid', placeItems: 'center', fontWeight: 900, background: '#f5c542', color: '#111', textDecoration: 'none' } as const;
const navStyle = { display: 'grid', gap: 10 } as const;
const linkStyle = { color: 'inherit', textDecoration: 'none', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 999, padding: '12px 14px', fontWeight: 900, background: 'rgba(255,255,255,0.04)' } as const;
const contentStyle = { minWidth: 0 } as const;
