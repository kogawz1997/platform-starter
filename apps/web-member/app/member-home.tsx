'use client';

import { FormEvent, useEffect, useState } from 'react';
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

type AuthMode = 'register' | 'login';
type RegisterStep = 'phone' | 'profile';

const categories = [['🏠', 'หน้าแรก'], ['🎲', 'คาสิโน'], ['🎰', 'สล็อต'], ['🐟', 'ยิงปลา'], ['⚽', 'กีฬา'], ['🃏', 'ไพ่'], ['🔮', 'หวย']];
const winners = [['🥇', '062XXXX324', 'Dragon Hatch', '4,000'], ['🥈', '090XXXX169', 'Treasures of Aztec', '3,600'], ['🥉', '094XXXX910', 'Pragmatic Casino', '3,000'], ['4', '094XXXX014', 'Lalika', '1,520'], ['5', '062XXXX047', 'Fa Chai Slot', '1,280']];
const popularGames = [['ROMA 10000', 'JILI', '🔥 HOT'], ['MAYA GOLDEN CITY', 'YGR', '🔥 HOT'], ['FORTUNE COINS', 'JILI', '⭐ NEW'], ['SEXY CASINO', 'Live', '🔥 HOT'], ['ZEUS RUSH', 'Pragmatic', '🔥 HOT'], ['JOKER WILD', 'Joker', '🔥 HOT']];
const banks = ['BBL', 'KBANK', 'KTB', 'TTB', 'SCB', 'BAY', 'KBank', 'GSB', 'LH', 'EXIM', 'UOB', 'TISCO', 'KKP', 'CIMB'];
const thaiBanks = ['กรุณาเลือกธนาคาร', 'ธนาคารกสิกรไทย', 'ธนาคารไทยพาณิชย์', 'ธนาคารกรุงเทพ', 'ธนาคารกรุงไทย', 'ธนาคารกรุงศรี', 'ธนาคารทหารไทยธนชาต', 'ธนาคารออมสิน'];

export default function MemberHome(props: MemberHomeProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [ready, setReady] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode | null>(null);
  const [registerStep, setRegisterStep] = useState<RegisterStep>('phone');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    setIsLoggedIn(Boolean(window.localStorage.getItem('member_access_token')));
    setReady(true);
  }, []);

  function openAuth(mode: AuthMode) {
    setAuthMode(mode);
    setRegisterStep('phone');
  }

  function closeAuth() {
    setAuthMode(null);
    setRegisterStep('phone');
  }

  return (
    <section className="casino-shell" style={{ '--casino-brand': props.primaryColor, '--casino-card': props.cardColor, color: props.textColor } as any}>
      <header className="casino-topbar"><button className="casino-icon-button" aria-label="เปิดเมนู">☰</button><a href="/" className="casino-logo">{props.siteName}</a><span className="casino-lang">🇹🇭</span></header>
      <section className="casino-main-layout">
        <aside className="casino-side-nav" aria-label="หมวดเกม">{categories.map(([icon, label], index) => <a key={label} href="#" className={index === 0 ? 'active' : ''}><span>{icon}</span><strong>{label}</strong></a>)}</aside>
        <div className="casino-content">
          {props.showPromotion && <HeroBanner siteName={props.siteName} description={props.description} />}
          {!ready ? null : isLoggedIn && props.showBalanceHeader ? <WalletCard primaryColor={props.primaryColor} cardColor={props.cardColor} showButtons={props.showButtons} /> : <div className="casino-auth-actions"><button type="button" onClick={() => openAuth('register')}>สมัครสมาชิก</button><button type="button" onClick={() => openAuth('login')}>เข้าสู่ระบบ</button></div>}
          <div className="casino-announcement"><span>📣</span><marquee>ยินดีต้อนรับสู่ {props.siteName} ฝาก-ถอนรวดเร็ว โปรโมชั่นและกิจกรรมอัปเดตทุกวัน</marquee></div>
          {props.showCategories && <section className="casino-tabs"><a className="active" href="#highlight">⭐ ไฮไลท์</a><a href="#promo">🎁 โปรโมชั่นแนะนำ</a><a href="#event">🏆 กิจกรรม</a></section>}
          <section id="highlight" className="casino-tournament-card"><div className="casino-trophy">🏆</div><div><p>TOURNAMENT</p><h2>เข้าร่วมชิงความเป็นที่ 1</h2><span>กิจกรรมใหม่สำหรับสมาชิกทุกคน</span></div><a href="/promotions">›</a></section>
          <SectionTitle icon="🏆" title="ทัวร์นาเมนต์" /><Leaderboard />
          {props.showRecommended && <section className="casino-promo-strip"><strong>ปรับใหม่ยอดเสีย</strong><span>จาก 5% เพิ่มเป็น 10% เฉพาะเดือนนี้เท่านั้น</span></section>}
          {props.showProviders && <><SectionTitle icon="🔥" title="Top 10 Popular Games" /><PopularGames /></>}
          <SectionTitle icon="⚡" title="Most Online Now" /><OnlineProviders /><FooterInfo />
        </div>
      </section>
      <a className="casino-support" href="/contact" aria-label="ติดต่อ support">🎧</a>
      {authMode && <AuthModal mode={authMode} setMode={setAuthMode} registerStep={registerStep} setRegisterStep={setRegisterStep} phone={phone} setPhone={setPhone} close={closeAuth} />}
    </section>
  );
}

function AuthModal({ mode, setMode, registerStep, setRegisterStep, phone, setPhone, close }: { mode: AuthMode; setMode: (mode: AuthMode) => void; registerStep: RegisterStep; setRegisterStep: (step: RegisterStep) => void; phone: string; setPhone: (value: string) => void; close: () => void }) {
  function submitPhone(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setRegisterStep('profile'); }
  function submitProfile(event: FormEvent<HTMLFormElement>) { event.preventDefault(); window.location.href = '/register'; }
  function submitLogin(event: FormEvent<HTMLFormElement>) { event.preventDefault(); window.location.href = '/login'; }

  if (mode === 'register' && registerStep === 'profile') return <ProfileSetup phone={phone} close={close} submit={submitProfile} back={() => setRegisterStep('phone')} />;

  return <div className="member-auth-modal-backdrop" role="dialog" aria-modal="true"><section className="member-auth-modal"><button className="member-auth-close" onClick={close} type="button">×</button><div className="member-auth-tabs"><button type="button" className={mode === 'register' ? 'active' : ''} onClick={() => { setMode('register'); setRegisterStep('phone'); }}>สมัครสมาชิก</button><button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>เข้าสู่ระบบ</button></div>{mode === 'register' ? <form className="member-auth-form" onSubmit={submitPhone}><label className="floating-input"><span>เบอร์โทรศัพท์</span><input inputMode="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="เบอร์โทรศัพท์" /><b>✓</b></label>{phone.length >= 9 && <div className="member-captcha"><strong>✓ สำเร็จ!</strong><span>CLOUDFLARE</span></div>}<button className="member-gradient-button" type="submit">ถัดไป</button><p>พบปัญหาการใช้งาน <a href="/contact">ติดต่อเจ้าหน้าที่</a></p></form> : <form className="member-auth-form" onSubmit={submitLogin}><label className="floating-input"><input inputMode="tel" placeholder="เบอร์โทรศัพท์" /></label><label className="floating-input"><input type="password" placeholder="รหัสผ่าน" /><i>◉</i></label><a className="member-forgot-link" href="/forgot-password">ลืมรหัสผ่าน?</a><button className="member-gradient-button" type="submit">เข้าสู่ระบบ</button><p>พบปัญหาการใช้งาน <a href="/contact">ติดต่อเจ้าหน้าที่</a></p></form>}</section></div>;
}

function ProfileSetup({ phone, close, submit, back }: { phone: string; close: () => void; submit: (event: FormEvent<HTMLFormElement>) => void; back: () => void }) {
  return <div className="member-profile-full"><header><button type="button" onClick={back}>←</button><h1>รายละเอียดโปรไฟล์</h1><button type="button" onClick={close}>×</button></header><form onSubmit={submit}><section className="profile-step"><div className="profile-step-title"><strong>1</strong><h2>กรอกเบอร์โทรศัพท์</h2><span>⌃</span></div><label className="profile-input"><span>เบอร์โทรศัพท์</span><input value={phone} onChange={() => null} placeholder="0618808761" /><b>✓</b></label></section><section className="profile-step"><div className="profile-step-title"><strong>2</strong><h2>สร้างบัญชีผู้ใช้งาน ข้อมูลธนาคาร</h2><span>⌃</span></div><div className="profile-grid"><label><input type="password" placeholder="สร้างรหัสผ่าน" /></label><label><input type="password" placeholder="ยืนยันรหัสผ่านอีกครั้ง" /></label><label><select defaultValue=""><option value="" disabled>กรุณาเลือกธนาคาร</option>{thaiBanks.slice(1).map((bank) => <option key={bank}>{bank}</option>)}</select></label><label><input placeholder="กรุณากรอกเลขที่บัญชีของคุณ" /></label></div><p className="profile-label">เพศ</p><div className="profile-radio-row"><label><input type="radio" name="gender" /> ชาย</label><label><input type="radio" name="gender" /> หญิง</label></div><p className="profile-label">ข้อกำหนดและเงื่อนไข</p><label className="profile-terms"><input type="checkbox" /> ข้าพเจ้ามีอายุครบ 20 ปีบริบูรณ์ และได้อ่านข้อกำหนดและเงื่อนไขทั่วไป</label></section><button className="member-gradient-button profile-submit" type="submit">สมัครสมาชิก</button><p className="profile-help">พบปัญหาการใช้งาน <a href="/contact">ติดต่อเจ้าหน้าที่</a></p></form></div>;
}

function HeroBanner({ siteName, description }: { siteName: string; description: string }) { return <section className="casino-hero-banner"><div><p>{siteName}</p><h1>ชวนเพื่อนรับฟรี 300 บาท</h1><span>{description}</span></div><div className="casino-coin-orbit"><b>345</b></div></section>; }
function SectionTitle({ icon, title }: { icon: string; title: string }) { return <h2 className="casino-section-title"><span>{icon}</span>{title}</h2>; }
function Leaderboard() { return <section className="casino-board"><div className="casino-board-head"><span>ลำดับ</span><span>ชื่อผู้ใช้</span><span>เกม</span><span>รายได้</span></div>{winners.map((row) => <div key={row[1]} className="casino-board-row"><strong>{row[0]}</strong><span>{row[1]}</span><span>{row[2]}</span><span>{row[3]}</span></div>)}</section>; }
function PopularGames() { return <section className="casino-popular-games">{popularGames.map(([name, provider, badge]) => <article key={name} className="casino-game-card"><div className="casino-game-art"><span>{badge}</span></div><strong>{name}</strong><p>{provider}</p></article>)}</section>; }
function OnlineProviders() { return <section className="casino-provider-grid">{popularGames.slice(0, 4).map(([name, provider], index) => <article key={provider + index}><div>{provider}</div><span>ออนไลน์</span><strong>{(3200 + index * 681).toLocaleString('th-TH')}</strong></article>)}</section>; }
function FooterInfo() { return <footer className="casino-footer"><section><h3>วิธีการชำระเงิน</h3><div className="casino-bank-grid">{banks.map((bank) => <span key={bank}>{bank}</span>)}</div></section><section className="casino-footer-grid"><div><h3>ติดต่อเรา</h3><p>LINE · Telegram · Support 24 ชั่วโมง</p></div><div><h3>รับผิดชอบในการเล่น</h3><p>18+ · เล่นอย่างมีสติ · จำกัดงบประมาณ</p></div><div><h3>ความปลอดภัย</h3><p>SSL · Verified · Secure Payment</p></div></section></footer>; }
