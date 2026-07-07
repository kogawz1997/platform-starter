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

export default function MemberHome(props: MemberHomeProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setIsLoggedIn(Boolean(window.localStorage.getItem('member_access_token')));
    setReady(true);
  }, []);

  return (
    <section className="member-shell member-home-shell">
      <section className="member-hero-card" style={{ background: props.cardColor, color: props.textColor }}>
        <div>
          <p className="member-eyebrow">Member Dashboard</p>
          <h1>จัดการบัญชีของคุณ</h1>
          <p>{props.description}</p>
        </div>
        {!ready ? null : isLoggedIn ? <span className="member-status-pill">Online</span> : <span className="member-status-pill muted">Guest</span>}
      </section>

      {props.showBalanceHeader && <WalletCard primaryColor={props.primaryColor} cardColor={props.cardColor} showButtons={props.showButtons && isLoggedIn} />}

      {props.showPromotion && <InfoCard title="Promotion" text="พื้นที่แสดงโปรโมชั่นและประกาศสำคัญ" />}
      {props.showCategories && <InfoCard title="Categories" text="หมวดหมู่บริการจะแสดงตรงนี้" />}
      {props.showProviders && <InfoCard title="Popular Providers" text="ผู้ให้บริการยอดนิยมจะแสดงตรงนี้" />}
      {props.showRecommended && <InfoCard title="Recommended" text="รายการแนะนำสำหรับสมาชิก" />}
    </section>
  );
}

function InfoCard({ title, text }: { title: string; text: string }) {
  return <section className="member-info-card"><p>Section</p><h2>{title}</h2><span>{text}</span></section>;
}
