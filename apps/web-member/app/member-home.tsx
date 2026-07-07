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

const quickActions = [
  ['ฝากเงิน', '/deposit', 'เติมยอดเข้ากระเป๋า'],
  ['ถอนเงิน', '/withdraw', 'ส่งคำขอถอน'],
  ['ประวัติ', '/transactions', 'ดูรายการล่าสุด'],
  ['บัญชีถอน', '/bank-accounts', 'จัดการบัญชี'],
];

export default function MemberHome(props: MemberHomeProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setIsLoggedIn(Boolean(window.localStorage.getItem('member_access_token') || window.localStorage.getItem('member_refresh_token')));
    setReady(true);
  }, []);

  return (
    <section className="member-shell member-home-shell">
      <section className="member-hero-card" style={{ background: props.cardColor, color: props.textColor }}>
        <div>
          <p className="member-eyebrow">{props.siteName}</p>
          <h1>Member Dashboard</h1>
          <p>{props.description || 'จัดการยอดเงิน ฝาก ถอน และบัญชีสมาชิกได้จากที่เดียว'}</p>
        </div>
        {!ready ? null : isLoggedIn ? <span className="member-status-pill">Online</span> : <span className="member-status-pill muted">Guest</span>}
      </section>

      {props.showBalanceHeader && <WalletCard primaryColor={props.primaryColor} cardColor={props.cardColor} showButtons={props.showButtons && isLoggedIn} />}

      <section className="member-info-card">
        <p>Quick actions</p>
        <div className="member-quick-grid">
          {quickActions.map(([title, href, text]) => <a key={href} href={href} className="member-quick-card"><strong>{title}</strong><span>{text}</span></a>)}
        </div>
      </section>

      {props.showPromotion && <InfoCard title="ประกาศ" text="ติดตามสถานะรายการ ฝาก ถอน และข่าวสำคัญจากระบบได้ที่นี่" />}
      {props.showCategories && <InfoCard title="ขั้นตอนใช้งาน" text="ฝากเงินผ่านบัญชีที่ระบบแสดง แนบสลิป แล้วรอแอดมินตรวจสอบ" />}
      {props.showProviders && <InfoCard title="ความปลอดภัย" text="ข้อมูลสลิปและธุรกรรมถูกเก็บแบบ private และตรวจสอบผ่านระบบหลังบ้าน" />}
      {props.showRecommended && <InfoCard title="แนะนำ" text="ตรวจสอบบัญชีถอนให้พร้อมก่อนส่งคำขอถอนเงิน" />}
    </section>
  );
}

function InfoCard({ title, text }: { title: string; text: string }) {
  return <section className="member-info-card"><p>Overview</p><h2>{title}</h2><span>{text}</span></section>;
}
