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

const categories = [
  ['🏠', 'หน้าแรก'],
  ['🎲', 'คาสิโน'],
  ['🎰', 'สล็อต'],
  ['🐟', 'ยิงปลา'],
  ['⚽', 'กีฬา'],
  ['🃏', 'ไพ่'],
  ['🔮', 'หวย'],
];

const winners = [
  ['🥇', '062XXXX324', 'Dragon Hatch', '4,000'],
  ['🥈', '090XXXX169', 'Treasures of Aztec', '3,600'],
  ['🥉', '094XXXX910', 'Pragmatic Casino', '3,000'],
  ['4', '094XXXX014', 'Lalika', '1,520'],
  ['5', '062XXXX047', 'Fa Chai Slot', '1,280'],
];

const popularGames = [
  ['ROMA 10000', 'JILI', '🔥 HOT'],
  ['MAYA GOLDEN CITY', 'YGR', '🔥 HOT'],
  ['FORTUNE COINS', 'JILI', '⭐ NEW'],
  ['SEXY CASINO', 'Live', '🔥 HOT'],
  ['ZEUS RUSH', 'Pragmatic', '🔥 HOT'],
  ['JOKER WILD', 'Joker', '🔥 HOT'],
];

const banks = ['BBL', 'KBANK', 'KTB', 'TTB', 'SCB', 'BAY', 'KBank', 'GSB', 'LH', 'EXIM', 'UOB', 'TISCO', 'KKP', 'CIMB'];

export default function MemberHome(props: MemberHomeProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setIsLoggedIn(Boolean(window.localStorage.getItem('member_access_token')));
    setReady(true);
  }, []);

  return (
    <section className="casino-shell" style={{ '--casino-brand': props.primaryColor, '--casino-card': props.cardColor, color: props.textColor } as any}>
      <header className="casino-topbar">
        <button className="casino-icon-button" aria-label="เปิดเมนู">☰</button>
        <a href="/" className="casino-logo">{props.siteName}</a>
        <span className="casino-lang">🇹🇭</span>
      </header>

      <section className="casino-main-layout">
        <aside className="casino-side-nav" aria-label="หมวดเกม">
          {categories.map(([icon, label], index) => <a key={label} href="#" className={index === 0 ? 'active' : ''}><span>{icon}</span><strong>{label}</strong></a>)}
        </aside>

        <div className="casino-content">
          {props.showPromotion && <HeroBanner siteName={props.siteName} description={props.description} />}

          {!ready ? null : isLoggedIn && props.showBalanceHeader ? <WalletCard primaryColor={props.primaryColor} cardColor={props.cardColor} showButtons={props.showButtons} /> : <div className="casino-auth-actions"><a href="/register">สมัครสมาชิก</a><a href="/login">เข้าสู่ระบบ</a></div>}

          <div className="casino-announcement"><span>📣</span><marquee>ยินดีต้อนรับสู่ {props.siteName} ฝาก-ถอนรวดเร็ว โปรโมชั่นและกิจกรรมอัปเดตทุกวัน</marquee></div>

          {props.showCategories && <section className="casino-tabs"><a className="active" href="#highlight">⭐ ไฮไลท์</a><a href="#promo">🎁 โปรโมชั่นแนะนำ</a><a href="#event">🏆 กิจกรรม</a></section>}

          <section id="highlight" className="casino-tournament-card">
            <div className="casino-trophy">🏆</div>
            <div><p>TOURNAMENT</p><h2>เข้าร่วมชิงความเป็นที่ 1</h2><span>กิจกรรมใหม่สำหรับสมาชิกทุกคน</span></div>
            <a href="/promotions">›</a>
          </section>

          <SectionTitle icon="🏆" title="ทัวร์นาเมนต์" />
          <Leaderboard />

          {props.showRecommended && <section className="casino-promo-strip"><strong>ปรับใหม่ยอดเสีย</strong><span>จาก 5% เพิ่มเป็น 10% เฉพาะเดือนนี้เท่านั้น</span></section>}

          {props.showProviders && <><SectionTitle icon="🔥" title="Top 10 Popular Games" /><PopularGames /></>}

          <SectionTitle icon="⚡" title="Most Online Now" />
          <OnlineProviders />

          <FooterInfo />
        </div>
      </section>

      <a className="casino-support" href="/contact" aria-label="ติดต่อ support">🎧</a>
    </section>
  );
}

function HeroBanner({ siteName, description }: { siteName: string; description: string }) {
  return <section className="casino-hero-banner"><div><p>{siteName}</p><h1>ชวนเพื่อนรับฟรี 300 บาท</h1><span>{description}</span></div><div className="casino-coin-orbit"><b>345</b></div></section>;
}

function SectionTitle({ icon, title }: { icon: string; title: string }) {
  return <h2 className="casino-section-title"><span>{icon}</span>{title}</h2>;
}

function Leaderboard() {
  return <section className="casino-board"><div className="casino-board-head"><span>ลำดับ</span><span>ชื่อผู้ใช้</span><span>เกม</span><span>รายได้</span></div>{winners.map((row) => <div key={row[1]} className="casino-board-row"><strong>{row[0]}</strong><span>{row[1]}</span><span>{row[2]}</span><span>{row[3]}</span></div>)}</section>;
}

function PopularGames() {
  return <section className="casino-popular-games">{popularGames.map(([name, provider, badge]) => <article key={name} className="casino-game-card"><div className="casino-game-art"><span>{badge}</span></div><strong>{name}</strong><p>{provider}</p></article>)}</section>;
}

function OnlineProviders() {
  return <section className="casino-provider-grid">{popularGames.slice(0, 4).map(([name, provider], index) => <article key={provider + index}><div>{provider}</div><span>ออนไลน์</span><strong>{(3200 + index * 681).toLocaleString('th-TH')}</strong></article>)}</section>;
}

function FooterInfo() {
  return <footer className="casino-footer"><section><h3>วิธีการชำระเงิน</h3><div className="casino-bank-grid">{banks.map((bank) => <span key={bank}>{bank}</span>)}</div></section><section className="casino-footer-grid"><div><h3>ติดต่อเรา</h3><p>LINE · Telegram · Support 24 ชั่วโมง</p></div><div><h3>รับผิดชอบในการเล่น</h3><p>18+ · เล่นอย่างมีสติ · จำกัดงบประมาณ</p></div><div><h3>ความปลอดภัย</h3><p>SSL · Verified · Secure Payment</p></div></section></footer>;
}
