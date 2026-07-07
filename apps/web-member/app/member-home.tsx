'use client';

import { useEffect, useMemo, useState } from 'react';
import { memberApiFetch } from './member-api';
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

type MoneyRequest = { id: string; amount: string; currency: string; status: string; method?: string | null; createdAt: string };
type LedgerItem = { id: string; type: string; direction: string; amount: string; balanceAfter: string; createdAt: string };

const quickActions = [
  ['ฝากเงิน', '/deposit', 'เติมยอดเข้ากระเป๋า'],
  ['ถอนเงิน', '/withdraw', 'ส่งคำขอถอน'],
  ['ประวัติ', '/transactions', 'ดูรายการล่าสุด'],
  ['บัญชีถอน', '/bank-accounts', 'จัดการบัญชี'],
];

export default function MemberHome(props: MemberHomeProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [ready, setReady] = useState(false);
  const [topups, setTopups] = useState<MoneyRequest[]>([]);
  const [withdrawals, setWithdrawals] = useState<MoneyRequest[]>([]);
  const [ledgers, setLedgers] = useState<LedgerItem[]>([]);
  const [activityMessage, setActivityMessage] = useState('');

  useEffect(() => {
    const ok = Boolean(window.localStorage.getItem('member_access_token') || window.localStorage.getItem('member_refresh_token'));
    setIsLoggedIn(ok);
    setReady(true);
    if (ok) loadActivity();
  }, []);

  async function loadActivity() {
    setActivityMessage('กำลังโหลดรายการล่าสุด...');
    const [topupRes, withdrawalRes, ledgerRes] = await Promise.all([
      memberApiFetch('/member/topups'),
      memberApiFetch('/member/withdrawals'),
      memberApiFetch('/member/wallet/ledger?limit=5'),
    ]);
    const topupData = await topupRes.json().catch(() => null);
    const withdrawalData = await withdrawalRes.json().catch(() => null);
    const ledgerData = await ledgerRes.json().catch(() => null);
    if (topupRes.ok) setTopups(topupData.items ?? []);
    if (withdrawalRes.ok) setWithdrawals(withdrawalData.items ?? []);
    if (ledgerRes.ok) setLedgers(ledgerData.items ?? []);
    if (!topupRes.ok || !withdrawalRes.ok || !ledgerRes.ok) setActivityMessage(topupData?.message ?? withdrawalData?.message ?? ledgerData?.message ?? 'โหลดรายการล่าสุดไม่สำเร็จ');
    else setActivityMessage('');
  }

  const pendingTopups = useMemo(() => topups.filter((item) => item.status === 'PENDING').slice(0, 3), [topups]);
  const pendingWithdrawals = useMemo(() => withdrawals.filter((item) => item.status === 'PENDING').slice(0, 3), [withdrawals]);
  const pendingCount = pendingTopups.length + pendingWithdrawals.length;

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

      {isLoggedIn && pendingCount > 0 && <section className="member-info-card" style={alertCardStyle}>
        <p>Pending</p>
        <h2>มีรายการรอตรวจสอบ {pendingCount} รายการ</h2>
        <span>รายการฝาก/ถอนที่ยังรอแอดมินดำเนินการจะแสดงอยู่ตรงนี้</span>
        <div style={pendingListStyle}>
          {pendingTopups.map((item) => <ActivityRow key={item.id} title="ฝากเงินรอตรวจ" href="/deposit" item={item} />)}
          {pendingWithdrawals.map((item) => <ActivityRow key={item.id} title="ถอนเงินรอดำเนินการ" href="/withdraw" item={item} />)}
        </div>
      </section>}

      <section className="member-info-card">
        <p>Quick actions</p>
        <div className="member-quick-grid">
          {quickActions.map(([title, href, text]) => <a key={href} href={href} className="member-quick-card"><strong>{title}</strong><span>{text}</span></a>)}
        </div>
      </section>

      {isLoggedIn && <section className="member-info-card">
        <div style={sectionHeadStyle}><div><p>Recent activity</p><h2>รายการล่าสุด</h2></div><a href="/transactions" style={{ color: props.primaryColor, fontWeight: 900, textDecoration: 'none' }}>ดูทั้งหมด</a></div>
        {activityMessage && <div style={noticeStyle}>{activityMessage}</div>}
        <div style={pendingListStyle}>
          {ledgers.slice(0, 5).map((item) => <LedgerRow key={item.id} item={item} />)}
          {ledgers.length === 0 && !activityMessage && <span>ยังไม่มีรายการล่าสุด</span>}
        </div>
      </section>}

      {isLoggedIn && <section className="member-info-card">
        <div style={sectionHeadStyle}><div><p>Latest requests</p><h2>คำขอล่าสุด</h2></div><button type="button" onClick={loadActivity} style={refreshButtonStyle}>Refresh</button></div>
        <div style={twoColStyle}>
          <RequestBox title="ฝากล่าสุด" href="/deposit" items={topups.slice(0, 3)} />
          <RequestBox title="ถอนล่าสุด" href="/withdraw" items={withdrawals.slice(0, 3)} />
        </div>
      </section>}

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

function ActivityRow({ title, href, item }: { title: string; href: string; item: MoneyRequest }) {
  return <a href={href} style={rowLinkStyle}><div><strong>{title}</strong><span>{new Date(item.createdAt).toLocaleString('th-TH')}</span></div><div style={rightStyle}><strong>{formatMoney(item.amount, item.currency)}</strong><span>{item.status}</span></div></a>;
}

function LedgerRow({ item }: { item: LedgerItem }) {
  return <div style={rowStyle}><div><strong>{item.type} / {item.direction}</strong><span>{new Date(item.createdAt).toLocaleString('th-TH')}</span></div><div style={rightStyle}><strong>{item.direction === 'CREDIT' ? '+' : '-'} {formatMoney(item.amount, 'THB')}</strong><span>หลัง: {formatMoney(item.balanceAfter, 'THB')}</span></div></div>;
}

function RequestBox({ title, href, items }: { title: string; href: string; items: MoneyRequest[] }) {
  return <div style={requestBoxStyle}><div style={sectionHeadStyle}><strong>{title}</strong><a href={href} style={smallLinkStyle}>เปิด</a></div>{items.map((item) => <ActivityRow key={item.id} title={item.status} href={href} item={item} />)}{items.length === 0 && <span>ยังไม่มีรายการ</span>}</div>;
}

function formatMoney(value: string | number, currency: string) {
  return `${currency} ${Number(value).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`;
}

const alertCardStyle = { borderColor: 'rgba(245,197,66,.32)', background: 'linear-gradient(180deg, rgba(245,197,66,.13), rgba(255,255,255,.04))' } as const;
const pendingListStyle = { display: 'grid', gap: 10, marginTop: 12, minWidth: 0 } as const;
const sectionHeadStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' as const, minWidth: 0 };
const rowStyle = { display: 'flex', justifyContent: 'space-between', gap: 12, border: '1px solid rgba(255,255,255,.10)', borderRadius: 16, padding: 12, background: 'rgba(255,255,255,.045)', flexWrap: 'wrap' as const, minWidth: 0 };
const rowLinkStyle = { ...rowStyle, color: 'inherit', textDecoration: 'none' } as const;
const rightStyle = { textAlign: 'right' as const, display: 'grid', gap: 4, minWidth: 0 };
const noticeStyle = { border: '1px solid rgba(255,255,255,.12)', borderRadius: 16, padding: 12, background: 'rgba(255,255,255,.06)', marginTop: 12 } as const;
const twoColStyle = { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12, marginTop: 12 } as const;
const requestBoxStyle = { border: '1px solid rgba(255,255,255,.10)', borderRadius: 18, padding: 12, background: 'rgba(255,255,255,.04)', display: 'grid', gap: 10, minWidth: 0 } as const;
const smallLinkStyle = { color: '#f5c542', fontWeight: 900, textDecoration: 'none' } as const;
const refreshButtonStyle = { border: '1px solid rgba(255,255,255,.14)', borderRadius: 999, background: 'rgba(255,255,255,.08)', color: '#fff', padding: '9px 12px', fontWeight: 900, cursor: 'pointer' } as const;
