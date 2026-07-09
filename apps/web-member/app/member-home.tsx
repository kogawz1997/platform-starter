'use client';

import { useEffect, useMemo, useState } from 'react';
import { CmsContent } from './site-settings';
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
  cmsContent: CmsContent;
};

type MoneyRequest = { id: string; amount: string; currency: string; status: string; method?: string | null; createdAt: string };
type LedgerItem = { id: string; type: string; direction: string; amount: string; balanceAfter: string; createdAt: string };
type GameMedia = { type: string; sourceUrl?: string | null; cachedUrl?: string | null };
type Game = { id: string; providerGameCode: string; name: string; category: string; isFeatured?: boolean; isNew?: boolean; isPopular?: boolean; provider?: { name?: string | null; code?: string | null } | null; media?: GameMedia[] };
type LobbyPayload = { items?: Game[]; featured?: Game[]; newest?: Game[]; popular?: Game[]; categories?: string[] };

const FAVORITES_KEY = 'member_favorite_game_ids';
const RECENT_KEY = 'member_recent_game_ids';

export default function MemberHome(props: MemberHomeProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [topups, setTopups] = useState<MoneyRequest[]>([]);
  const [withdrawals, setWithdrawals] = useState<MoneyRequest[]>([]);
  const [ledgers, setLedgers] = useState<LedgerItem[]>([]);
  const [lobby, setLobby] = useState<LobbyPayload>({});
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [popupClosed, setPopupClosed] = useState(false);
  const [activityMessage, setActivityMessage] = useState('');
  const [isActivityLoading, setIsActivityLoading] = useState(false);

  useEffect(() => {
    const ok = Boolean(window.localStorage.getItem('member_access_token') || window.localStorage.getItem('member_refresh_token'));
    setIsLoggedIn(ok);
    setFavoriteIds(readIds(FAVORITES_KEY));
    setRecentIds(readIds(RECENT_KEY));
    setPopupClosed(window.localStorage.getItem('member_cms_popup_closed') === 'true');
    loadGames();
    if (ok) loadActivity();
  }, []);

  async function loadGames() {
    const res = await memberApiFetch('/member/games');
    const data = await res.json().catch(() => null);
    if (res.ok) setLobby(data ?? {});
  }
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
  const games = lobby.items ?? [];
  const featured = (lobby.featured?.length ? lobby.featured : games.filter((game) => game.isFeatured)).slice(0, 8);
  const popular = (lobby.popular?.length ? lobby.popular : games.filter((game) => game.isPopular)).slice(0, 8);
  const recentGames = recentIds.map((id) => games.find((game) => game.id === id)).filter(Boolean) as Game[];
  const favoriteGames = favoriteIds.map((id) => games.find((game) => game.id === id)).filter(Boolean) as Game[];
  const cmsBanner = props.cmsContent.banners.find((item) => item.enabled);
  const announcements = props.cmsContent.announcements.filter((item) => item.enabled).slice(0, 3);
  const faqs = props.cmsContent.faqs.filter((item) => item.enabled).slice(0, 4);
  const popup = props.cmsContent.popup;

  function closePopup() { window.localStorage.setItem('member_cms_popup_closed', 'true'); setPopupClosed(true); }

  return (
    <section className="member-shell member-home-shell">
      {props.showPromotion && <section style={bannerStyle}>{cmsBanner?.imageUrl && <img src={cmsBanner.imageUrl} alt="" style={bannerImageStyle} />}<div><span style={eyebrowStyle}>พร้อมเล่น</span><h1 style={bannerTitleStyle}>{cmsBanner?.title || props.siteName}</h1><p style={mutedStyle}>{cmsBanner?.subtitle || props.description || 'เลือกเกมที่ชอบ ฝาก ถอน และดูประวัติได้จากมือถือเครื่องเดียว'}</p></div><a href={cmsBanner?.href || '/games'} style={{ ...bannerButtonStyle, background: props.primaryColor }}>เข้าเล่นเกม</a></section>}

      {announcements.length > 0 && <section className="member-info-card" style={announcementCardStyle}><div style={sectionHeadStyle}><h2>ประกาศ</h2><span style={mutedStyle}>{announcements.length} รายการ</span></div><div style={pendingListStyle}>{announcements.map((item, index) => <div key={`${item.title}-${index}`} style={announcementRowStyle}><strong>{item.title}</strong><span>{item.message}</span></div>)}</div></section>}

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

      {props.showRecommended && <GameRail title="เกมแนะนำ" href="/games" items={featured} primaryColor={props.primaryColor} />}
      {recentGames.length > 0 && <GameRail title="เล่นล่าสุด" href="/games" items={recentGames} primaryColor={props.primaryColor} />}
      {favoriteGames.length > 0 && <GameRail title="เกมโปรด" href="/games" items={favoriteGames} primaryColor={props.primaryColor} />}
      {popular.length > 0 && <GameRail title="ยอดนิยม" href="/games" items={popular} primaryColor={props.primaryColor} />}

      {props.showCategories && <section className="member-info-card"><div style={sectionHeadStyle}><h2>หมวดเกม</h2><a href="/games" style={{ color: props.primaryColor, fontWeight: 900, textDecoration: 'none' }}>ดูทั้งหมด</a></div><div style={categoryGridStyle}>{(lobby.categories ?? []).slice(0, 8).map((item) => <a key={item} href={`/games?category=${encodeURIComponent(item)}`} style={categoryPillStyle}>{categoryLabel(item)}</a>)}{(lobby.categories ?? []).length === 0 && <span style={mutedStyle}>ยังไม่มีหมวดเกม</span>}</div></section>}

      {faqs.length > 0 && <section className="member-info-card"><div style={sectionHeadStyle}><h2>คำถามที่พบบ่อย</h2></div><div style={pendingListStyle}>{faqs.map((item, index) => <details key={`${item.question}-${index}`} style={faqStyle}><summary>{item.question}</summary><p style={mutedStyle}>{item.answer}</p></details>)}</div></section>}

      {isLoggedIn && <section className="member-info-card">
        <div style={sectionHeadStyle}><h2>ล่าสุด</h2><a href="/transactions" style={{ color: props.primaryColor, fontWeight: 900, textDecoration: 'none' }}>ทั้งหมด</a></div>
        {isActivityLoading && <div style={noticeStyle}>กำลังโหลด...</div>}
        {activityMessage && <div style={noticeStyle}><strong>โหลดข้อมูลไม่สำเร็จ</strong><span>{activityMessage}</span><button type="button" onClick={loadActivity} style={retryButtonStyle}>ลองใหม่</button></div>}
        <div style={pendingListStyle}>
          {ledgers.slice(0, 5).map((item) => <LedgerRow key={item.id} item={item} />)}
          {ledgers.length === 0 && !activityMessage && !isActivityLoading && <EmptyState compact title="ยังไม่มีประวัติ" description="เมื่อมีรายการฝาก ถอน หรือปรับยอด รายการล่าสุดจะแสดงตรงนี้" actionHref="/deposit" actionLabel="ฝาก" />}
        </div>
      </section>}

      {popup.enabled && !popupClosed && <div style={popupOverlayStyle}><section style={popupCardStyle}><button type="button" onClick={closePopup} style={popupCloseStyle}>×</button><h2>{popup.title}</h2><p style={mutedStyle}>{popup.message}</p><a href={popup.href} style={{ ...bannerButtonStyle, background: props.primaryColor }}>{popup.ctaLabel}</a></section></div>}

      <MemberBottomNav pendingCount={pendingCount} />
    </section>
  );
}

function QuickAction({ href, title, subtitle }: { href: string; title: string; subtitle: string }) {
  return <a href={href} className="member-quick-action"><strong>{title}</strong><span>{subtitle}</span></a>;
}
function GameRail({ title, href, items, primaryColor }: { title: string; href: string; items: Game[]; primaryColor: string }) { if (items.length === 0) return null; return <section className="member-info-card"><div style={sectionHeadStyle}><h2>{title}</h2><a href={href} style={{ color: primaryColor, fontWeight: 900, textDecoration: 'none' }}>ดูทั้งหมด</a></div><div style={gameRailStyle}>{items.slice(0, 8).map((game) => <a key={game.id} href="/games" style={gameTileStyle}>{pickImage(game) ? <img src={pickImage(game) ?? ''} alt="" style={gameImageStyle} /> : <div style={gameFallbackStyle}>{game.name.slice(0, 2).toUpperCase()}</div>}<strong>{game.name}</strong><span>{game.provider?.name ?? game.providerGameCode}</span></a>)}</div></section>; }
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
  if (upper.includes('TRANSFER')) return 'โยกเงิน';
  if (upper.includes('REVERSAL')) return 'คืนเงิน';
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
function pickImage(game: Game) { const media = game.media ?? []; return media.find((item) => item.type === 'COVER')?.cachedUrl ?? media.find((item) => item.type === 'COVER')?.sourceUrl ?? media.find((item) => item.type === 'ICON')?.cachedUrl ?? media.find((item) => item.type === 'ICON')?.sourceUrl ?? null; }
function categoryLabel(value: string) { const map: Record<string, string> = { slot: 'สล็อต', casino: 'คาสิโน', sport: 'กีฬา', fishing: 'Winvalidปลา', popular: 'ยอดนิยม', new: 'ใหม่' }; return map[value?.toLowerCase?.()] ?? value; }
function readIds(key: string) { try { return JSON.parse(window.localStorage.getItem(key) ?? '[]') as string[]; } catch { return []; } }
function formatMoney(value: string | number, currency: string) {
  return `${currency} ${Number(value).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`;
}
const bannerStyle = { border: '1px solid rgba(245,197,66,.26)', borderRadius: 28, padding: 18, background: 'radial-gradient(circle at top left, rgba(245,197,66,.24), transparent 38%), rgba(255,255,255,.05)', display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'center', flexWrap: 'wrap' as const, overflow: 'hidden' as const } as const;
const bannerImageStyle = { width: 86, height: 86, borderRadius: 20, objectFit: 'cover' as const, border: '1px solid rgba(255,255,255,.14)' };
const eyebrowStyle = { color: '#facc15', fontWeight: 950, fontSize: 12, letterSpacing: '.1em', textTransform: 'uppercase' as const } as const;
const bannerTitleStyle = { margin: '4px 0 6px', fontSize: 30, lineHeight: 1.05 } as const;
const bannerButtonStyle = { minHeight: 44, borderRadius: 14, padding: '0 16px', display: 'inline-flex', alignItems: 'center', color: '#111827', fontWeight: 950, textDecoration: 'none' } as const;
const alertCardStyle = { borderColor: 'rgba(245,197,66,.32)', background: 'linear-gradient(180deg, rgba(245,197,66,.13), rgba(255,255,255,.04))' } as const;
const announcementCardStyle = { borderColor: 'rgba(245,197,66,.28)', background: 'rgba(245,197,66,.07)' } as const;
const announcementRowStyle = { border: '1px solid rgba(255,255,255,.10)', borderRadius: 14, padding: 12, display: 'grid', gap: 4, background: 'rgba(255,255,255,.04)' } as const;
const pendingListStyle = { display: 'grid', gap: 10, marginTop: 12, minWidth: 0 } as const;
const sectionHeadStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' as const, minWidth: 0 };
const rowStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(190px, 100%), 1fr))', gap: 12, border: '1px solid rgba(255,255,255,.10)', borderRadius: 16, padding: 12, background: 'rgba(255,255,255,.045)', minWidth: 0 };
const rowLinkStyle = { ...rowStyle, color: 'inherit', textDecoration: 'none' } as const;
const rightStyle = { textAlign: 'left' as const, display: 'grid', gap: 4, minWidth: 0 };
const noticeStyle = { border: '1px solid rgba(255,255,255,.12)', borderRadius: 16, padding: 12, background: 'rgba(255,255,255,.06)', marginTop: 12, display: 'grid', gap: 6 } as const;
const retryButtonStyle = { justifySelf: 'start', border: '1px solid rgba(255,255,255,.16)', borderRadius: 999, padding: '8px 12px', background: 'rgba(255,255,255,.08)', color: '#fff', cursor: 'pointer' } as const;
const emptyStyle = { border: '1px dashed rgba(245,197,66,.34)', borderRadius: 24, padding: 16, background: 'rgba(245,197,66,.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' as const } as const;
const compactEmptyStyle = { ...emptyStyle, borderColor: 'rgba(255,255,255,.16)', background: 'rgba(255,255,255,.04)' } as const;
const mutedStyle = { margin: 0, color: '#cbd5e1', lineHeight: 1.55 } as const;
const gameRailStyle = { display: 'grid', gridAutoFlow: 'column', gridAutoColumns: 'minmax(132px, 38%)', gap: 12, overflowX: 'auto' as const, paddingTop: 12 } as const;
const gameTileStyle = { color: 'inherit', textDecoration: 'none', border: '1px solid rgba(255,255,255,.10)', borderRadius: 18, overflow: 'hidden', background: 'rgba(15,23,42,.65)', display: 'grid', gap: 6, paddingBottom: 10 } as const;
const gameImageStyle = { width: '100%', aspectRatio: '4 / 3', objectFit: 'cover' as const, display: 'block' };
const gameFallbackStyle = { aspectRatio: '4 / 3', display: 'grid', placeItems: 'center', background: 'rgba(245,197,66,.12)', color: '#facc15', fontSize: 26, fontWeight: 950 } as const;
const categoryGridStyle = { display: 'flex', gap: 10, overflowX: 'auto' as const, paddingTop: 12 } as const;
const categoryPillStyle = { border: '1px solid rgba(255,255,255,.14)', borderRadius: 999, padding: '10px 14px', color: '#fff', background: 'rgba(255,255,255,.06)', textDecoration: 'none', whiteSpace: 'nowrap' as const, fontWeight: 900 } as const;
const faqStyle = { border: '1px solid rgba(255,255,255,.10)', borderRadius: 14, padding: 12, background: 'rgba(255,255,255,.04)' } as const;
const popupOverlayStyle = { position: 'fixed' as const, inset: 0, zIndex: 50, display: 'grid', placeItems: 'center', padding: 18, background: 'rgba(2,6,23,.72)' };
const popupCardStyle = { width: 'min(420px, 100%)', border: '1px solid rgba(245,197,66,.28)', borderRadius: 24, padding: 20, background: '#111827', display: 'grid', gap: 12, position: 'relative' as const };
const popupCloseStyle = { position: 'absolute' as const, top: 10, right: 10, width: 34, height: 34, borderRadius: 999, border: '1px solid rgba(255,255,255,.16)', background: 'rgba(255,255,255,.06)', color: '#fff', fontSize: 22 };
