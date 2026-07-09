'use client';

import { useEffect, useMemo, useState } from 'react';
import MemberBottomNav from '../member-bottom-nav';
import { memberApiFetch } from '../member-api';

type GameMedia = { type: string; sourceUrl?: string | null; cachedUrl?: string | null; status: string };
type Game = { id: string; providerGameCode: string; name: string; category: string; isFeatured: boolean; isNew: boolean; isPopular: boolean; provider?: { name: string; code: string }; media?: GameMedia[] };
type LobbyPayload = { items?: Game[]; categories?: string[]; featured?: Game[]; newest?: Game[]; popular?: Game[] };
type LaunchState = { gameId?: string; message?: string };

const FAVORITES_KEY = 'member_favorite_game_ids';
const RECENT_KEY = 'member_recent_game_ids';

export default function MemberGamesPage() {
  const [payload, setPayload] = useState<LobbyPayload>({});
  const [category, setCategory] = useState('all');
  const [provider, setProvider] = useState('all');
  const [query, setQuery] = useState('');
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [message, setMessage] = useState('กำลังโหลดเกม...');
  const [launching, setLaunching] = useState<LaunchState>({});
  useEffect(() => { setFavoriteIds(readIds(FAVORITES_KEY)); setRecentIds(readIds(RECENT_KEY)); let cancelled = false; async function loadGames() { const res = await memberApiFetch('/member/games'); const data = await res.json().catch(() => null); if (cancelled) return; if (!res.ok) { setMessage(data?.message ?? 'โหลดเกมไม่สำเร็จ'); return; } setPayload(data ?? {}); setMessage(''); } loadGames(); return () => { cancelled = true; }; }, []);
  const games = payload.items ?? [];
  const providers = useMemo(() => Array.from(new Map(games.map((game) => [game.provider?.code ?? 'unknown', game.provider?.name ?? game.provider?.code ?? 'ไม่ระบุค่าย'])).entries()), [games]);
  const favoriteGames = useMemo(() => favoriteIds.map((id) => games.find((game) => game.id === id)).filter(Boolean) as Game[], [favoriteIds, games]);
  const recentGames = useMemo(() => recentIds.map((id) => games.find((game) => game.id === id)).filter(Boolean) as Game[], [recentIds, games]);
  const filtered = useMemo(() => games.filter((item) => {
    const matchesCategory = category === 'all' || category === 'favorite' ? true : item.category === category;
    const matchesProvider = provider === 'all' || (item.provider?.code ?? 'unknown') === provider;
    const text = `${item.name} ${item.providerGameCode} ${item.provider?.name ?? ''} ${item.category}`.toLowerCase();
    const matchesSearch = !query.trim() || text.includes(query.trim().toLowerCase());
    const matchesFavorite = category !== 'favorite' || favoriteIds.includes(item.id);
    return matchesCategory && matchesProvider && matchesSearch && matchesFavorite;
  }), [games, category, provider, query, favoriteIds]);
  async function launchGame(game: Game) { rememberRecent(game.id, setRecentIds); setLaunching({ gameId: game.id, message: `กำลังเปิด ${game.name}...` }); const res = await memberApiFetch(`/member/games/${game.id}/launch`, { method: 'POST' }); const data = await res.json().catch(() => null); if (!res.ok || !data?.ok || !data?.launchUrl) { setLaunching({ gameId: game.id, message: data?.message ?? data?.errorMessage ?? 'เปิดเกมไม่สำเร็จ' }); return; } const sessionId = data.session?.id; setLaunching({ gameId: game.id, message: 'เปิดเกมแล้ว กำลังไปหน้าจัดการ session...' }); if (sessionId) window.location.href = `/games/session?session=${encodeURIComponent(sessionId)}&game=${encodeURIComponent(game.name)}&launchUrl=${encodeURIComponent(data.launchUrl)}`; else window.location.href = data.launchUrl; }
  function toggleFavorite(game: Game) { setFavoriteIds((current) => { const next = current.includes(game.id) ? current.filter((id) => id !== game.id) : [game.id, ...current].slice(0, 60); writeIds(FAVORITES_KEY, next); return next; }); }
  return <main style={pageStyle}><section style={heroStyle}><span style={eyebrowStyle}>Game Lobby</span><h1 style={titleStyle}>เลือกเกม</h1><p style={mutedStyle}>ค้นหา เลือกค่าย กดหัวใจเก็บเกมโปรด แล้วเปิด session เพื่อโยกเงินเข้า/ออกเกมจากหน้าเดียว</p><div style={searchRowStyle}><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ค้นหาเกมหรือค่าย" style={searchInputStyle} /><select value={provider} onChange={(event) => setProvider(event.target.value)} style={selectStyle}><option value="all">ทุกค่าย</option>{providers.map(([code, name]) => <option key={code} value={code}>{name}</option>)}</select></div></section>{message && <div style={noticeStyle}>{message}</div>}{launching.message && <div style={noticeStyle}>{launching.message}</div>}<div style={tabsStyle}><button style={category === 'all' ? activeTabStyle : tabStyle} onClick={() => setCategory('all')}>ทั้งหมด</button><button style={category === 'favorite' ? activeTabStyle : tabStyle} onClick={() => setCategory('favorite')}>โปรด</button>{(payload.categories ?? []).map((item) => <button key={item} style={category === item ? activeTabStyle : tabStyle} onClick={() => setCategory(item)}>{categoryLabel(item)}</button>)}</div><GameSection title="เล่นล่าสุด" items={recentGames} favoriteIds={favoriteIds} launchingGameId={launching.gameId} onLaunch={launchGame} onFavorite={toggleFavorite} /><GameSection title="เกมโปรด" items={favoriteGames} favoriteIds={favoriteIds} launchingGameId={launching.gameId} onLaunch={launchGame} onFavorite={toggleFavorite} /><GameSection title="เกมแนะนำ" items={payload.featured ?? []} favoriteIds={favoriteIds} launchingGameId={launching.gameId} onLaunch={launchGame} onFavorite={toggleFavorite} /><GameSection title="มาใหม่" items={payload.newest ?? []} favoriteIds={favoriteIds} launchingGameId={launching.gameId} onLaunch={launchGame} onFavorite={toggleFavorite} /><GameSection title="ยอดนิยม" items={payload.popular ?? []} favoriteIds={favoriteIds} launchingGameId={launching.gameId} onLaunch={launchGame} onFavorite={toggleFavorite} /><section style={sectionStyle}><div style={sectionHeadStyle}><h2 style={sectionTitleStyle}>เกมทั้งหมด</h2><span style={countStyle}>{filtered.length} เกม</span></div><div style={gridStyle}>{filtered.map((game) => <GameCard key={game.id} game={game} favorite={favoriteIds.includes(game.id)} launching={launching.gameId === game.id} onLaunch={launchGame} onFavorite={toggleFavorite} />)}{!message && filtered.length === 0 && <div style={emptyStyle}>ยังไม่มีเกมในเงื่อนไขนี้</div>}</div></section><MemberBottomNav /></main>;
}
function GameSection({ title, items, favoriteIds, launchingGameId, onLaunch, onFavorite }: { title: string; items: Game[]; favoriteIds: string[]; launchingGameId?: string; onLaunch: (game: Game) => void; onFavorite: (game: Game) => void }) { if (items.length === 0) return null; return <section style={sectionStyle}><div style={sectionHeadStyle}><h2 style={sectionTitleStyle}>{title}</h2><span style={countStyle}>{items.length} เกม</span></div><div style={gridStyle}>{items.slice(0, 8).map((game) => <GameCard key={game.id} game={game} favorite={favoriteIds.includes(game.id)} launching={launchingGameId === game.id} onLaunch={onLaunch} onFavorite={onFavorite} />)}</div></section>; }
function GameCard({ game, favorite, launching, onLaunch, onFavorite }: { game: Game; favorite: boolean; launching: boolean; onLaunch: (game: Game) => void; onFavorite: (game: Game) => void }) { const image = pickImage(game); return <article style={cardStyle}>{image ? <img src={image} alt="" style={imageStyle} /> : <div style={fallbackStyle}>{game.name.slice(0, 2).toUpperCase()}</div>}<button type="button" aria-label="favorite" style={favorite ? favoriteActiveStyle : favoriteStyle} onClick={() => onFavorite(game)}>{favorite ? '★' : '☆'}</button><div style={cardBodyStyle}><strong>{game.name}</strong><span>{game.provider?.name ?? game.providerGameCode}</span><div style={badgeRowStyle}>{game.isFeatured && <em>แนะนำ</em>}{game.isNew && <em>ใหม่</em>}{game.isPopular && <em>นิยม</em>}<em>{categoryLabel(game.category)}</em></div><button type="button" style={playButtonStyle} onClick={() => onLaunch(game)} disabled={launching}>{launching ? 'กำลังเปิด...' : 'เล่น'}</button></div></article>; }
function pickImage(game: Game) { const media = game.media ?? []; return media.find((item) => item.type === 'COVER')?.cachedUrl ?? media.find((item) => item.type === 'COVER')?.sourceUrl ?? media.find((item) => item.type === 'ICON')?.cachedUrl ?? media.find((item) => item.type === 'ICON')?.sourceUrl ?? null; }
function categoryLabel(value: string) { const map: Record<string, string> = { slot: 'สล็อต', casino: 'คาสิโน', sport: 'กีฬา', fishing: 'ยิงปลา', popular: 'ยอดนิยม', new: 'ใหม่' }; return map[value?.toLowerCase?.()] ?? value; }
function readIds(key: string) { try { return JSON.parse(window.localStorage.getItem(key) ?? '[]') as string[]; } catch { return []; } }
function writeIds(key: string, ids: string[]) { window.localStorage.setItem(key, JSON.stringify(ids)); }
function rememberRecent(id: string, setRecentIds: (updater: (current: string[]) => string[]) => void) { setRecentIds((current) => { const next = [id, ...current.filter((item) => item !== id)].slice(0, 12); writeIds(RECENT_KEY, next); return next; }); }
const pageStyle = { minHeight: '100dvh', background: 'linear-gradient(180deg,#080808,#111827)', color: '#fff', padding: '88px 16px 104px' } as const;
const heroStyle = { border: '1px solid rgba(245,197,66,.22)', borderRadius: 26, padding: 18, background: 'radial-gradient(circle at top left, rgba(245,197,66,.22), transparent 34%), rgba(245,197,66,.08)', display: 'grid', gap: 10 } as const;
const eyebrowStyle = { color: '#facc15', fontWeight: 900, letterSpacing: '.08em', textTransform: 'uppercase' as const, fontSize: 12 };
const titleStyle = { margin: 0, fontSize: 34, lineHeight: 1.05 } as const;
const mutedStyle = { margin: 0, color: '#cbd5e1', lineHeight: 1.55 } as const;
const noticeStyle = { marginTop: 14, padding: 14, borderRadius: 18, background: 'rgba(15,23,42,.78)', border: '1px solid rgba(148,163,184,.18)' } as const;
const searchRowStyle = { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(120px, 150px)', gap: 10, marginTop: 6 } as const;
const searchInputStyle = { width: '100%', minHeight: 44, borderRadius: 14, border: '1px solid rgba(255,255,255,.14)', background: 'rgba(2,6,23,.62)', color: '#fff', padding: '0 13px', outline: 'none' } as const;
const selectStyle = { ...searchInputStyle } as const;
const tabsStyle = { display: 'flex', gap: 10, overflowX: 'auto' as const, padding: '16px 0 4px' };
const tabStyle = { border: '1px solid rgba(148,163,184,.24)', background: '#111827', color: '#cbd5e1', borderRadius: 999, padding: '10px 14px', fontWeight: 900, whiteSpace: 'nowrap' as const };
const activeTabStyle = { ...tabStyle, background: '#f5c542', color: '#111827', borderColor: '#f5c542' };
const sectionStyle = { marginTop: 22, display: 'grid', gap: 12 } as const;
const sectionHeadStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 } as const;
const sectionTitleStyle = { margin: 0, fontSize: 22 } as const;
const countStyle = { color: '#94a3b8', fontSize: 13, fontWeight: 800 } as const;
const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 } as const;
const cardStyle = { border: '1px solid rgba(148,163,184,.18)', borderRadius: 20, overflow: 'hidden', background: 'rgba(15,23,42,.82)', minWidth: 0, position: 'relative' as const } as const;
const imageStyle = { width: '100%', aspectRatio: '4 / 3', objectFit: 'cover' as const, display: 'block' };
const fallbackStyle = { aspectRatio: '4 / 3', display: 'grid', placeItems: 'center', background: 'rgba(245,197,66,.12)', color: '#facc15', fontSize: 28, fontWeight: 950 } as const;
const favoriteStyle = { position: 'absolute' as const, top: 8, right: 8, width: 34, height: 34, borderRadius: 999, border: '1px solid rgba(255,255,255,.18)', background: 'rgba(2,6,23,.7)', color: '#fff', fontSize: 18 };
const favoriteActiveStyle = { ...favoriteStyle, background: '#f5c542', color: '#111827', borderColor: '#f5c542' };
const cardBodyStyle = { padding: 12, display: 'grid', gap: 6 } as const;
const badgeRowStyle = { display: 'flex', gap: 5, flexWrap: 'wrap' as const };
const playButtonStyle = { marginTop: 4, minHeight: 38, borderRadius: 12, border: 0, background: '#f5c542', color: '#111827', fontWeight: 950 } as const;
const emptyStyle = { gridColumn: '1 / -1', padding: 18, borderRadius: 18, background: 'rgba(15,23,42,.72)', color: '#94a3b8', textAlign: 'center' as const };
