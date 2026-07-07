'use client';

import { useEffect, useState } from 'react';
import WalletCard from './wallet-card';

type MemberHomeProps = {
  siteName: string;
  description: string;
  primaryColor: string;
  cardColor: string;
  textColor: string;
  showBalanceHeader: boolean;
  showButtons: boolean;
  showPromotion: boolean;
  showCategories: boolean;
  showProviders: boolean;
  showRecommended: boolean;
};

const menuItems = [
  ['หน้าหลัก', '/'],
  ['ฝากเงิน', '/deposit'],
  ['ถอนเงิน', '/withdraw'],
  ['ประวัติธุรกรรม', '/transactions'],
];

export default function MemberHome(props: MemberHomeProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setIsLoggedIn(Boolean(window.localStorage.getItem('member_access_token')));
    setReady(true);
  }, []);

  function logout() {
    window.localStorage.removeItem('member_access_token');
    window.localStorage.removeItem('member_refresh_token');
    window.location.href = '/login';
  }

  return (
    <section className="member-shell">
      <header className="member-topbar">
        <a href="/" className="member-brand">
          <span className="member-brand-mark" style={{ background: props.primaryColor, color: '#111' }}>{props.siteName.slice(0, 1).toUpperCase()}</span>
          <span className="member-brand-copy"><strong>{props.siteName}</strong><small>Member Center</small></span>
        </a>

        <div className="member-actions">
          {ready && !isLoggedIn && <a href="/login" className="member-login-link">เข้าสู่ระบบ</a>}
          <button type="button" className="member-menu-button" onClick={() => setMenuOpen(true)} aria-label="เปิดเมนู">☰</button>
        </div>
      </header>

      {menuOpen && <button type="button" className="member-menu-backdrop" onClick={() => setMenuOpen(false)} aria-label="ปิดเมนู" />}
      <aside className={menuOpen ? 'member-drawer open' : 'member-drawer'}>
        <div className="member-drawer-head">
          <div>
            <strong>{props.siteName}</strong>
            <p>{isLoggedIn ? 'บัญชีสมาชิก' : 'ยังไม่ได้เข้าสู่ระบบ'}</p>
          </div>
          <button type="button" onClick={() => setMenuOpen(false)}>×</button>
        </div>
        <nav className="member-drawer-nav">
          {menuItems.map(([title, href]) => <a key={href} href={href} onClick={() => setMenuOpen(false)}>{title}</a>)}
        </nav>
        {ready && isLoggedIn ? (
          <button type="button" className="member-logout-button" onClick={logout}>ออกจากระบบ</button>
        ) : (
          <div className="member-auth-box"><a href="/login">เข้าสู่ระบบ</a><a href="/register">สมัครสมาชิก</a></div>
        )}
      </aside>

      <section className="member-hero-card" style={{ background: props.cardColor, color: props.textColor }}>
        <div>
          <p className="member-eyebrow">Member Dashboard</p>
          <h1>จัดการบัญชีของคุณ</h1>
          <p>{props.description}</p>
        </div>
        {!ready ? null : isLoggedIn ? <span className="member-status-pill">Online</span> : <span className="member-status-pill muted">Guest</span>}
      </section>

      {props.showBalanceHeader && <WalletCard primaryColor={props.primaryColor} cardColor={props.cardColor} showButtons={props.showButtons && isLoggedIn} />}

      <section className="member-quick-grid">
        <QuickAction href="/deposit" title="ฝากเงิน" text="สร้างรายการเติมเงิน" color={props.primaryColor} />
        <QuickAction href="/withdraw" title="ถอนเงิน" text="ส่งคำขอถอน" />
        <QuickAction href="/transactions" title="ประวัติ" text="ดูรายการเงินล่าสุด" />
      </section>

      {props.showPromotion && <InfoCard title="Promotion" text="พื้นที่แสดงโปรโมชั่นและประกาศสำคัญ" />}
      {props.showCategories && <InfoCard title="Categories" text="หมวดหมู่บริการจะแสดงตรงนี้" />}
      {props.showProviders && <InfoCard title="Popular Providers" text="ผู้ให้บริการยอดนิยมจะแสดงตรงนี้" />}
      {props.showRecommended && <InfoCard title="Recommended" text="รายการแนะนำสำหรับสมาชิก" />}
    </section>
  );
}

function QuickAction({ href, title, text, color }: { href: string; title: string; text: string; color?: string }) {
  return <a href={href} className="member-quick-card" style={color ? { background: color, color: '#111' } : undefined}><strong>{title}</strong><span>{text}</span></a>;
}

function InfoCard({ title, text }: { title: string; text: string }) {
  return <section className="member-info-card"><p>Section</p><h2>{title}</h2><span>{text}</span></section>;
}
