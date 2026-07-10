'use client';

import { useEffect, useMemo, useState } from 'react';
import { CmsContent, MemberFeatureFlags, SiteIconSettings, defaultFeatureFlags, defaultIconSettings } from './site-settings';
import { memberApiFetch } from './member-api';
import WalletCard from './wallet-card';
import {
  AnnouncementList,
  CategoryList,
  CmsPopup,
  FaqList,
  Game,
  GameRail,
  HomeHero,
  LedgerItem,
  MoneyRequest,
  PendingRequests,
  QuickActions,
  RecentActivity,
} from './components/member-home-sections';

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
  icons?: SiteIconSettings;
  features?: MemberFeatureFlags;
};

type LobbyPayload = { items?: Game[]; featured?: Game[]; newest?: Game[]; popular?: Game[]; categories?: string[] };

const FAVORITES_KEY = 'member_favorite_game_ids';
const RECENT_KEY = 'member_recent_game_ids';
const POPUP_CLOSED_VERSION_KEY = 'member_cms_popup_closed_version';

export default function MemberHome(props: MemberHomeProps) {
  const icons = props.icons ?? defaultIconSettings;
  const features = props.features ?? defaultFeatureFlags;
  const [topups, setTopups] = useState<MoneyRequest[]>([]);
  const [withdrawals, setWithdrawals] = useState<MoneyRequest[]>([]);
  const [ledgers, setLedgers] = useState<LedgerItem[]>([]);
  const [lobby, setLobby] = useState<LobbyPayload>({});
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [popupClosed, setPopupClosed] = useState(false);
  const [activityMessage, setActivityMessage] = useState('');
  const [isActivityLoading, setIsActivityLoading] = useState(false);
  const popupVersion = props.cmsContent.popup.version ?? 'v1';

  useEffect(() => {
    setFavoriteIds(readIds(FAVORITES_KEY));
    setRecentIds(readIds(RECENT_KEY));
    setPopupClosed(window.localStorage.getItem(POPUP_CLOSED_VERSION_KEY) === popupVersion);
    if (features.games) loadGames();
    loadActivity();
  }, [popupVersion, features.games]);

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
      const [topupData, withdrawalData, ledgerData] = await Promise.all([
        topupRes.json().catch(() => null),
        withdrawalRes.json().catch(() => null),
        ledgerRes.json().catch(() => null),
      ]);
      if (topupRes.ok) setTopups(topupData?.items ?? []);
      if (withdrawalRes.ok) setWithdrawals(withdrawalData?.items ?? []);
      if (ledgerRes.ok) setLedgers(ledgerData?.items ?? []);
      if (!topupRes.ok || !withdrawalRes.ok || !ledgerRes.ok) setActivityMessage(topupData?.message ?? withdrawalData?.message ?? ledgerData?.message ?? 'โหลดข้อมูลไม่สำเร็จ');
    } catch (error) {
      setActivityMessage(error instanceof Error ? error.message : 'โหลดข้อมูลไม่สำเร็จ');
    } finally {
      setIsActivityLoading(false);
    }
  }

  const pendingTopups = useMemo(() => topups.filter((item) => item.status === 'PENDING').slice(0, 3), [topups]);
  const pendingWithdrawals = useMemo(() => withdrawals.filter((item) => item.status === 'PENDING').slice(0, 3), [withdrawals]);
  const games = lobby.items ?? [];
  const featured = (lobby.featured?.length ? lobby.featured : games.filter((game) => game.isFeatured)).slice(0, 8);
  const popular = (lobby.popular?.length ? lobby.popular : games.filter((game) => game.isPopular)).slice(0, 8);
  const recentGames = recentIds.map((id) => games.find((game) => game.id === id)).filter(Boolean) as Game[];
  const favoriteGames = favoriteIds.map((id) => games.find((game) => game.id === id)).filter(Boolean) as Game[];

  function closePopup() {
    window.localStorage.setItem(POPUP_CLOSED_VERSION_KEY, popupVersion);
    setPopupClosed(true);
  }

  return <section className="member-shell member-home-shell">
    {props.showPromotion && features.games && <HomeHero siteName={props.siteName} description={props.description} primaryColor={props.primaryColor} content={props.cmsContent} />}
    <AnnouncementList content={props.cmsContent} />
    {props.showBalanceHeader && <WalletCard primaryColor={props.primaryColor} cardColor={props.cardColor} showButtons={props.showButtons && (features.deposit || features.withdraw)} />}
    <QuickActions icons={icons} features={features} />
    <PendingRequests pendingTopups={pendingTopups} pendingWithdrawals={pendingWithdrawals} primaryColor={props.primaryColor} features={features} />
    {features.games && props.showRecommended && <GameRail title="เกมแนะนำ" href="/games" items={featured} primaryColor={props.primaryColor} />}
    {features.games && recentGames.length > 0 && <GameRail title="เล่นล่าสุด" href="/games" items={recentGames} primaryColor={props.primaryColor} />}
    {features.games && favoriteGames.length > 0 && <GameRail title="เกมโปรด" href="/games" items={favoriteGames} primaryColor={props.primaryColor} />}
    {features.games && popular.length > 0 && <GameRail title="ยอดนิยม" href="/games" items={popular} primaryColor={props.primaryColor} />}
    {features.games && props.showCategories && <CategoryList categories={lobby.categories ?? []} primaryColor={props.primaryColor} />}
    <FaqList content={props.cmsContent} />
    <RecentActivity ledgers={ledgers} loading={isActivityLoading} message={activityMessage} onRetry={loadActivity} primaryColor={props.primaryColor} depositEnabled={features.deposit} />
    {props.cmsContent.popup.enabled && !popupClosed && <CmsPopup content={props.cmsContent} primaryColor={props.primaryColor} onClose={closePopup} />}
  </section>;
}

function readIds(key: string) {
  try { return JSON.parse(window.localStorage.getItem(key) ?? '[]') as string[]; }
  catch { return []; }
}
