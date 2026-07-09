'use client';

import { useEffect, useMemo, useState } from 'react';
import { memberApiFetch } from './member-api';
import WalletCard from './wallet-card';
import MemberBottomNav from './member-bottom-nav';

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

export default function MemberHome(props: MemberHomeProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [topups, setTopups] = useState<MoneyRequest[]>([]);
  const [withdrawals, setWithdrawals] = useState<MoneyRequest[]>([]);
  const [ledgers, setLedgers] = useState<LedgerItem[]>([]);
  const [activityMessage, setActivityMessage] = useState('');
  const [isActivityLoading, setIsActivityLoading] = useState(false);

  useEffect(() => {
    const ok = Boolean(window.localStorage.getItem('member_access_token') || window.localStorage.getItem('member_refresh_token'));
    setIsLoggedIn(ok);
    if (ok) loadActivity();
  }, []);

  async function loadActivity() {
    setIsActivityLoading(true);
    setActivityMessage('');
    try {
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
      if (!topupRes.ok || !withdrawalRes.ok || !ledgerRes.ok) setActivityMessage(topupData?.message ?? withdrawalData?.message ?? ledgerData?.message ?? 'โหลดข้อมูลไม่สำเร็จ');
    } catch (error) {
      setActivityMessage(error instanceof Error ? error.message : 'โหลดข้อมูลไม่สำเร็จ');
    } finally {
      setIsActivityLoading(false);
    }
  }

  const pendingTopups = useMemo(() => topups.filter((item) => item.status === 'PENDING').slice(0, 3), [topups]);
  const pendingWithdrawals = useMemo(() => withdrawals.filter((item) => item.status === 'PENDING').slice(0, 3), [withdrawals]);
  const pendingCount = pendingTopups.length + pendingWithdrawals.length;

  return (
    <section className="member-shell member-home-shell">
      {props.showBalanceHeader && <WalletCard primaryColor={props.primaryColor} cardColor={props.cardColor} showButtons={props.showButtons && isLoggedIn} />}

      <section className="member-quick-panel">
        <QuickAction href="/deposit" title="ฝาก" subtitle="เพิ่มยอด" />
        <QuickAction href="/withdraw" title="ถอนเงิน" subtitle="ส่งคำขอ" />
        <QuickAction href="/games" title="เกม" subtitle="เข้าเล่น" />
        <QuickAction href="/bank-accounts" title="บัญชี" subtitle="จัดการ" />
      </section>

      {isLoggedIn && pendingCount > 0 && <section className="member-info-card" style={alertCardStyle}>
        <div style={sectionHeadStyle}><div><p>รอดำเนินการ</p><h2>{pendingCount} รายการ</h2></div><a href="/transactions" style={{ color: props.primaryColor, fontWeight: 900, textDecoration: 'none' }}>ดูทั้งหมด</a></div>
        <div style={pendingListStyle}>
          {pendingTopups.map((item) => <ActivityRow key={item.id} title="ฝาก" href="/deposit" item={item} />)}
          {pendingWithdrawals.map((item) => <ActivityRow key={item.id} title="ถอนเงิน" href="/withdraw" item={item} />)}
        </div>
      </section>}

      {isLoggedIn && <section className="member-info-card">
        <div style={sectionHeadStyle}><h2>ล่าสุด</h2><a href="/transactions" style={{ color: props.primaryColor, fontWeight: 900, textDecoration: 'none' }}>ทั้งหมด</a></div>
        {isActivityLoading && <div style={noticeStyle}>กำลังโหลด...</div>}
        {activityMessage && <div style={noticeStyle}><strong>โหลดข้อมูลไม่สำเร็จ</strong><span>{activityMessage}</span><button type="button" onClick={loadActivity} style={retryButtonStyle}>ลองใหม่</button></div>}
        <div style={pendingListStyle}>
          {ledgers.slice(0, 5).map((item) => <LedgerRow key={item.id} item={item} />)}
          {ledgers.length === 0 && !activityMessage && !isActivityLoading && <EmptyState compact title="ยังไม่มีประวัติ" description="เมื่อมีรายการฝาก ถอน หรือปรับยอด รายการล่าสุดจะแสดงตรงนี้" actionHref="/deposit" actionLabel="ฝาก" />}
        </div>
      </section>}

      <MemberBottomNav pendingCount={pendingCount} />
    </section>
  );
}

function QuickAction({ href, title, subtitle }: { href: string; title: string; subtitle: string }) {
  return <a href={href} className="member-quick-action"><strong>{title}</strong><span>{subtitle}</span></a>;
}
function EmptyState({ title, description, actionHref, actionLabel, compact = false }: { title: string; description: string; actionHref: string; actionLabel: string; compact?: boolean }) {
  return <div style={compact ? compactEmptyStyle : emptyStyle}><div><strong>{title}</strong><span>{description}</span></div><a href={actionHref}>{actionLabel}</a></div>;
}
function ActivityRow({ title, href, item }: { title: string; href: string; item: MoneyRequest }) {
  return <a href={href} style={rowLinkStyle}><div><strong>{title}</strong><span>{new Date(item.createdAt).toLocaleString('th-TH')}</span></div><div style={rightStyle}><strong>{formatMoney(item.amount, item.currency)}</strong><span>{statusLabel(item.status)}</span></div></a>;
}
function LedgerRow({ item }: { item: LedgerItem }) {
  return <div style={rowStyle}><div><strong>{ledgerTypeLabel(item.type)}</strong><span>{new Date(item.createdAt).toLocaleString('th-TH')}</span></div><div style={rightStyle}><strong>{item.direction === 'CREDIT' ? '+' : '-'} {formatMoney(item.amount, 'THB')}</strong></div></div>;
}
function ledgerTypeLabel(type: string) {
  const upper = type.toUpperCase();
  if (upper.includes('DEPOSIT') || upper.includes('TOPUP')) return 'ฝาก';
  if (upper.includes('WITHDRAW')) return 'ถอนเงิน';
  if (upper.includes('ADJUST')) return 'ปรับยอด';
  return 'รายการ';
}
function statusLabel(status: string) {
  const upper = status.toUpperCase();
  if (upper === 'PENDING') return 'รอตรวจสอบ';
  if (upper === 'APPROVED' || upper === 'COMPLETED') return 'สำเร็จ';
  if (upper === 'REJECTED') return 'ไม่อนุมัติ';
  return status;
}
function formatMoney(value: string | number, currency: string) {
  return `${currency} ${Number(value).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`;
}
const alertCardStyle = { borderColor: 'rgba(245,197,66,.32)', background: 'linear-gradient(180deg, rgba(245,197,66,.13), rgba(255,255,255,.04))' } as const;
const pendingListStyle = { display: 'grid', gap: 10, marginTop: 12, minWidth: 0 } as const;
const sectionHeadStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' as const, minWidth: 0 };
const rowStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(190px, 100%), 1fr))', gap: 12, border: '1px solid rgba(255,255,255,.10)', borderRadius: 16, padding: 12, background: 'rgba(255,255,255,.045)', minWidth: 0 };
const rowLinkStyle = { ...rowStyle, color: 'inherit', textDecoration: 'none' } as const;
const rightStyle = { textAlign: 'left' as const, display: 'grid', gap: 4, minWidth: 0 };
const noticeStyle = { border: '1px solid rgba(255,255,255,.12)', borderRadius: 16, padding: 12, background: 'rgba(255,255,255,.06)', marginTop: 12, display: 'grid', gap: 6 } as const;
const retryButtonStyle = { justifySelf: 'start', border: '1px solid rgba(255,255,255,.16)', borderRadius: 999, padding: '8px 12px', background: 'rgba(255,255,255,.08)', color: '#fff', cursor: 'pointer' } as const;
const emptyStyle = { border: '1px dashed rgba(245,197,66,.34)', borderRadius: 24, padding: 16, background: 'rgba(245,197,66,.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' as const } as const;
const compactEmptyStyle = { ...emptyStyle, borderColor: 'rgba(255,255,255,.16)', background: 'rgba(255,255,255,.04)' } as const;
