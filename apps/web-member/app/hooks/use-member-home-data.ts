'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { memberApiFetch } from '../member-api';
import type { Game, LedgerItem, MoneyRequest } from '../components/member-home-sections';

const FAVORITES_KEY = 'member_favorite_game_ids';
const RECENT_KEY = 'member_recent_game_ids';

type LobbyPayload = { items?: Game[]; featured?: Game[]; newest?: Game[]; popular?: Game[]; categories?: string[] };

export function useMemberHomeData(gamesEnabled: boolean) {
  const [topups, setTopups] = useState<MoneyRequest[]>([]);
  const [withdrawals, setWithdrawals] = useState<MoneyRequest[]>([]);
  const [ledgers, setLedgers] = useState<LedgerItem[]>([]);
  const [lobby, setLobby] = useState<LobbyPayload>({});
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [activityMessage, setActivityMessage] = useState('');
  const [isActivityLoading, setIsActivityLoading] = useState(false);

  const loadGames = useCallback(async () => {
    if (!gamesEnabled) { setLobby({}); return; }
    const res = await memberApiFetch('/member/games');
    const data = await res.json().catch(() => null);
    if (res.ok) setLobby(data ?? {});
  }, [gamesEnabled]);

  const loadActivity = useCallback(async () => {
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
      if (topupRes.ok) setTopups(Array.isArray(topupData?.items) ? topupData.items : []);
      if (withdrawalRes.ok) setWithdrawals(Array.isArray(withdrawalData?.items) ? withdrawalData.items : []);
      if (ledgerRes.ok) setLedgers(Array.isArray(ledgerData?.items) ? ledgerData.items : []);
      if (!topupRes.ok || !withdrawalRes.ok || !ledgerRes.ok) setActivityMessage(topupData?.message ?? withdrawalData?.message ?? ledgerData?.message ?? 'โหลดข้อมูลไม่สำเร็จ');
    } catch (error) {
      setActivityMessage(error instanceof Error ? error.message : 'โหลดข้อมูลไม่สำเร็จ');
    } finally {
      setIsActivityLoading(false);
    }
  }, []);

  useEffect(() => {
    setFavoriteIds(readIds(FAVORITES_KEY));
    setRecentIds(readIds(RECENT_KEY));
    loadGames();
    loadActivity();
  }, [loadGames, loadActivity]);

  const pendingTopups = useMemo(() => topups.filter((item) => item.status === 'PENDING').slice(0, 3), [topups]);
  const pendingWithdrawals = useMemo(() => withdrawals.filter((item) => item.status === 'PENDING').slice(0, 3), [withdrawals]);
  const games = lobby.items ?? [];
  const featured = (lobby.featured?.length ? lobby.featured : games.filter((game) => game.isFeatured)).slice(0, 8);
  const popular = (lobby.popular?.length ? lobby.popular : games.filter((game) => game.isPopular)).slice(0, 8);
  const recentGames = recentIds.map((id) => games.find((game) => game.id === id)).filter(Boolean) as Game[];
  const favoriteGames = favoriteIds.map((id) => games.find((game) => game.id === id)).filter(Boolean) as Game[];

  return {
    pendingTopups,
    pendingWithdrawals,
    ledgers,
    categories: lobby.categories ?? [],
    featured,
    popular,
    recentGames,
    favoriteGames,
    activityMessage,
    isActivityLoading,
    reloadActivity: loadActivity,
  };
}

function readIds(key: string) {
  try { return JSON.parse(window.localStorage.getItem(key) ?? '[]') as string[]; }
  catch { return []; }
}
