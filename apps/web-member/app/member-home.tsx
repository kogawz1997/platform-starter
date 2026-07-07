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

const categories = [['🏠', 'หน้าแรก'], ['🎲', 'คาสิโน'], ['🎰', 'สล็อต'], ['🐟', 'ตกปลา'], ['⚽', 'กีฬา'], ['🃏', 'ไพ่'], ['🔮', 'หวย']];
const winners = [['🥇', '062XXXX324', 'Dragon Hatch', '4,000'], ['🥈', '090XXXX169', 'Treasures of Aztec', '3,600'], ['🥉', '094XXXX910', 'Pragmatic Casino', '3,000'], ['4', '094XXXX014', 'Lalika', '1,520'], ['5', '062XXXX047', 'Fa Chai Slot', '1,280']];
const popularGames = [['ROMA 10000', 'JILI', '🔥 HOT'], ['MAYA GOLDEN CITY', 'YGR', '🔥 HOT'], ['FORTUNE COINS', 'JILI', '⭐ NEW'], ['SEXY CASINO', 'Live', '🔥 HOT'], ['ZEUS RUSH', 'Pragmatic', '🔥 HOT'], ['JOKER WILD', 'Joker', '🔥 HOT']];
const banks = ['BBL', 'KBANK', 'KTB', 'TTB', 'SCB', 'BAY', 'KBank', 'GSB', 'LH', 'EXIM', 'UOB', 'TISCO', 'KKP', 'CIMB'];
const thaiBanks = ['ธนาคารกสิกรไทย', 'ธนาคารไทยพาณิชย์', 'ธนาคารกรุงเทพ', 'ธนาคารกรุงไทย', 'ธนาคารกรุงศรี', 'ธนาคารทหารไทยธนชาต', 'ธนาคารออมสิน'];

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
      <AuthModalStyles />
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
  return <div className="member-profile-full"><header><button type="button" onClick={back}>←</button><h1>รายละเอียดโปรไฟล์</h1><button type="button" onClick={close}>×</button></header><form onSubmit={submit}><section className="profile-step"><div className="profile-step-title"><strong>1</strong><h2>กรอกเบอร์โทรศัพท์</h2><span>⌃</span></div><label className="profile-input"><span>เบอร์โทรศัพท์</span><input value={phone || '0618808761'} readOnly /><b>✓</b></label></section><section className="profile-step"><div className="profile-step-title"><strong>2</strong><h2>สร้างบัญชีผู้ใช้งาน ข้อมูลธนาคาร</h2><span>⌃</span></div><div className="profile-grid"><label><input type="password" placeholder="สร้างรหัสผ่าน" /></label><label><input type="password" placeholder="ยืนยันรหัสผ่านอีกครั้ง" /></label><label><select defaultValue=""><option value="" disabled>กรุณาเลือกธนาคาร</option>{thaiBanks.map((bank) => <option key={bank}>{bank}</option>)}</select></label><label><input placeholder="กรุณากรอกเลขที่บัญชีของคุณ" /></label></div><p className="profile-label">เพศ</p><div className="profile-radio-row"><label><input type="radio" name="gender" /> ชาย</label><label><input type="radio" name="gender" /> หญิง</label></div><p className="profile-label">ข้อกำหนดและเงื่อนไข</p><label className="profile-terms"><input type="checkbox" /> ข้าพเจ้ามีอายุครบ 20 ปีบริบูรณ์ และได้อ่านข้อกำหนดและเงื่อนไขทั่วไป</label></section><button className="member-gradient-button profile-submit" type="submit">สมัครสมาชิก</button><p className="profile-help">พบปัญหาการใช้งาน <a href="/contact">ติดต่อเจ้าหน้าที่</a></p></form></div>;
}

function AuthModalStyles() {
  return <style>{`.casino-auth-actions button{min-height:68px;border-radius:14px;border:0;color:#fff;font-size:24px;font-weight:950;display:grid;place-items:center;background:linear-gradient(180deg,#dfbce9,#b978ce);box-shadow:inset 0 1px rgba(255,255,255,.25);cursor:pointer}.casino-auth-actions button:last-child{background:linear-gradient(180deg,#cc3da9,#9e006e)}.member-auth-modal-backdrop{position:fixed;inset:0;z-index:120;background:rgba(0,0,0,.78);display:grid;place-items:center;padding:18px;backdrop-filter:blur(3px)}.member-auth-modal{position:relative;width:min(88vw,720px);border-radius:0 0 18px 18px;border:1px solid rgba(255,255,255,.2);background:linear-gradient(180deg,#4a4558,#25202f 50%,#17131e);box-shadow:0 26px 90px rgba(0,0,0,.72);overflow:visible}.member-auth-close{position:absolute;right:-22px;top:-24px;width:48px;height:48px;border-radius:50%;border:0;background:#fff;color:#111;font-size:42px;line-height:1;display:grid;place-items:center;z-index:2;cursor:pointer}.member-auth-tabs{display:grid;grid-template-columns:1fr 1fr}.member-auth-tabs button{min-height:92px;border:0;background:#111017;color:#fff;font-size:28px;font-weight:950;cursor:pointer}.member-auth-tabs button.active{background:#4a4558}.member-auth-form{display:grid;gap:28px;padding:54px 48px 30px}.floating-input{position:relative;display:block}.floating-input input,.floating-input select{width:100%;min-height:108px;border-radius:13px;border:3px solid rgba(255,255,255,.5);background:#15131a;color:#fff;font-size:28px;padding:0 74px 0 40px;outline:none}.floating-input input:focus{border-color:#21d765}.floating-input span{position:absolute;top:-16px;left:34px;background:#25202f;color:#fff;padding:0 12px;font-size:22px;z-index:1}.floating-input b{position:absolute;right:34px;top:50%;transform:translateY(-50%);width:34px;height:34px;border-radius:50%;background:#24d834;color:#061006;display:grid;place-items:center;font-size:24px}.floating-input i{position:absolute;right:34px;top:50%;transform:translateY(-50%);font-style:normal;color:#aaa;font-size:28px}.member-captcha{height:112px;border:8px solid #fff;background:#30302f;display:flex;align-items:center;justify-content:space-between;gap:18px;padding:0 28px;color:#fff;font-size:24px}.member-captcha span{font-size:22px;letter-spacing:.12em;font-weight:950}.member-gradient-button{min-height:88px;border:0;border-radius:10px;background:linear-gradient(180deg,#a83af0,#8b00bd);color:#fff;font-size:30px;font-weight:950;cursor:pointer;box-shadow:0 6px 0 rgba(0,0,0,.14)}.member-auth-form p,.profile-help{margin:0;text-align:center;color:#aaa;font-size:20px;font-weight:700}.member-auth-form a,.member-forgot-link,.profile-help a{color:#9e00e9!important;font-weight:950}.member-forgot-link{text-align:right;font-size:24px;text-decoration:underline}.member-profile-full{position:fixed;inset:0;z-index:130;background:linear-gradient(180deg,#17111e,#0d0a12);color:#fff;overflow-y:auto;padding-bottom:110px}.member-profile-full header{position:sticky;top:0;z-index:2;height:96px;background:#17111f;display:grid;grid-template-columns:64px 1fr 64px;align-items:center;padding:0 22px;border-bottom:1px solid rgba(255,255,255,.08)}.member-profile-full header button{border:0;background:transparent;color:#fff;font-size:42px}.member-profile-full header h1{margin:0;text-align:center;font-size:36px}.member-profile-full form{display:grid;gap:24px;max-width:980px;margin:0 auto;padding:36px 26px}.profile-step{border-bottom:1px solid rgba(255,255,255,.18);padding-bottom:28px}.profile-step-title{display:grid;grid-template-columns:64px 1fr 42px;align-items:center;gap:18px;margin-bottom:30px}.profile-step-title strong{width:58px;height:58px;border-radius:50%;background:#fff;color:#111;display:grid;place-items:center;font-size:28px}.profile-step-title h2{margin:0;font-size:30px}.profile-input{position:relative;display:block}.profile-input input{width:100%;min-height:108px;border-radius:12px;border:3px solid #19d462;background:#111016;color:#fff;font-size:28px;padding:0 72px 0 24px}.profile-input span{position:absolute;top:-16px;left:24px;background:#17111e;padding:0 10px;font-size:22px}.profile-input b{position:absolute;right:28px;top:50%;transform:translateY(-50%);width:34px;height:34px;border-radius:50%;background:#24d834;color:#061006;display:grid;place-items:center}.profile-grid{display:grid;grid-template-columns:1fr 1fr;gap:28px}.profile-grid input,.profile-grid select{width:100%;min-height:96px;border-radius:10px;border:2px solid rgba(255,255,255,.45);background:#15131a;color:#fff;font-size:24px;padding:0 24px}.profile-label{font-size:24px;margin:28px 0 14px}.profile-radio-row{display:grid;grid-template-columns:1fr 1fr;gap:28px}.profile-radio-row label,.profile-terms{display:flex;align-items:flex-start;gap:16px;color:#aaa;font-size:22px;line-height:1.45}.profile-radio-row input,.profile-terms input{width:34px;height:34px;accent-color:#9e00e9;flex:0 0 auto}.profile-help{padding-bottom:40px}@media(max-width:560px){.member-auth-modal-backdrop{align-items:center;padding:0 28px}.member-auth-modal{width:100%}.member-auth-tabs button{min-height:92px;font-size:26px}.member-auth-form{padding:52px 24px 28px;gap:26px}.floating-input input{min-height:96px;font-size:26px;padding-left:28px}.member-captcha{height:92px;padding:0 18px;font-size:20px}.member-captcha span{font-size:16px}.member-gradient-button{min-height:82px;font-size:28px}.member-profile-full header{height:82px;padding:0 16px}.member-profile-full header h1{font-size:30px}.member-profile-full form{padding:30px 22px}.profile-step-title{grid-template-columns:58px 1fr 34px}.profile-step-title h2{font-size:26px}.profile-grid{grid-template-columns:1fr;gap:18px}.profile-input input,.profile-grid input,.profile-grid select{min-height:86px;font-size:22px}.profile-radio-row{grid-template-columns:1fr 1fr}.profile-radio-row label,.profile-terms{font-size:18px}}`}</style>;
}

function HeroBanner({ siteName, description }: { siteName: string; description: string }) { return <section className="casino-hero-banner"><div><p>{siteName}</p><h1>ชวนเพื่อนรับฟรี 300 บาท</h1><span>{description}</span></div><div className="casino-coin-orbit"><b>345</b></div></section>; }
function SectionTitle({ icon, title }: { icon: string; title: string }) { return <h2 className="casino-section-title"><span>{icon}</span>{title}</h2>; }
function Leaderboard() { return <section className="casino-board"><div className="casino-board-head"><span>ลำดับ</span><span>ชื่อผู้ใช้</span><span>เกม</span><span>รายได้</span></div>{winners.map((row) => <div key={row[1]} className="casino-board-row"><strong>{row[0]}</strong><span>{row[1]}</span><span>{row[2]}</span><span>{row[3]}</span></div>)}</section>; }
function PopularGames() { return <section className="casino-popular-games">{popularGames.map(([name, provider, badge]) => <article key={name} className="casino-game-card"><div className="casino-game-art"><span>{badge}</span></div><strong>{name}</strong><p>{provider}</p></article>)}</section>; }
function OnlineProviders() { return <section className="casino-provider-grid">{popularGames.slice(0, 4).map(([name, provider], index) => <article key={provider + index}><div>{provider}</div><span>ออนไลน์</span><strong>{(3200 + index * 681).toLocaleString('th-TH')}</strong></article>)}</section>; }
function FooterInfo() { return <footer className="casino-footer"><section><h3>วิธีการชำระเงิน</h3><div className="casino-bank-grid">{banks.map((bank) => <span key={bank}>{bank}</span>)}</div></section><section className="casino-footer-grid"><div><h3>ติดต่อเรา</h3><p>LINE · Telegram · Support 24 ชั่วโมง</p></div><div><h3>รับผิดชอบในการเล่น</h3><p>18+ · เล่นอย่างมีสติ · จำกัดงบประมาณ</p></div><div><h3>ความปลอดภัย</h3><p>SSL · Verified · Secure Payment</p></div></section></footer>; }
