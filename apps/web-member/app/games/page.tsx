'use client';

import { useEffect, useMemo, useState } from 'react';
import { memberApiFetch } from '../member-api';

type GameMedia = { type: string; sourceUrl?: string | null; cachedUrl?: string | null; status: string };
type Game = { id: string; providerGameCode: string; name: string; category: string; isFeatured: boolean; isNew: boolean; isPopular: boolean; provider?: { name: string; code: string }; media?: GameMedia[] };
type LobbyPayload = { items?: Game[]; categories?: string[]; featured?: Game[]; newest?: Game[]; popular?: Game[] };

export default function MemberGamesPage() {
  const [payload, setPayload] = useState<LobbyPayload>({});
  const [category, setCategory] = useState('all');
  const [message, setMessage] = useState('กำลังโหลดเกม...');

  useEffect(() => { let cancelled = false; async function loadGames() { const res = await memberApiFetch('/member/games'); const data = await res.json().catch(() => null); if (cancelled) return; if (!res.ok) { setMessage(data?.message ?? 'โหลดเกมไม่สำเร็จ'); return; } setPayload(data ?? {}); setMessage(''); } loadGames(); return () => { cancelled = true; }; }, []);

  const games = payload.items ?? [];
  const filtered = useMemo(() => category === 'all' ? games : games.filter((item) => item.category === category), [games, category]);

  return <main style={pageStyle}>
    <section style={heroStyle}><span style={eyebrowStyle}>Game Lobby</span><h1 style={titleStyle}>เลือกเกม</h1><p style={mutedStyle}>รวมเกมที่เปิดใช้งานแล้วจาก catalog ระบบ ยังเป็น lobby ก่อนต่อ launch จริง</p></section>
    {message && <div style={noticeStyle}>{message}</div>}
    <div style={tabsStyle}><button style={category === 'all' ? activeTabStyle : tabStyle} onClick={() => setCategory('all')}>ทั้งหมด</button>{(payload.categories ?? []).map((item) => <button key={item} style={category === item ? activeTabStyle : tabStyle} onClick={() => setCategory(item)}>{item}</button>)}</div>
    <GameSection title="เกมแนะนำ" items={payload.featured ?? []} />
    <GameSection title="มาใหม่" items={payload.newest ?? []} />
    <GameSection title="ยอดนิยม" items={payload.popular ?? []} />
    <section style={sectionStyle}><h2 style={sectionTitleStyle}>เกมทั้งหมด</h2><div style={gridStyle}>{filtered.map((game) => <GameCard key={game.id} game={game} />)}{!message && filtered.length === 0 && <div style={emptyStyle}>ยังไม่มีเกมในหมวดนี้</div>}</div></section>
  </main>;
}

function GameSection({ title, items }: { title: string; items: Game[] }) { if (items.length === 0) return null; return <section style={sectionStyle}><h2 style={sectionTitleStyle}>{title}</h2><div style={gridStyle}>{items.slice(0, 8).map((game) => <GameCard key={game.id} game={game} />)}</div></section>; }
function GameCard({ game }: { game: Game }) { const image = pickImage(game); return <article style={cardStyle}>{image ? <img src={image} alt="" style={imageStyle} /> : <div style={fallbackStyle}>{game.name.slice(0, 2).toUpperCase()}</div>}<div style={cardBodyStyle}><strong>{game.name}</strong><span>{game.provider?.name ?? game.providerGameCode}</span><div style={badgeRowStyle}>{game.isFeatured && <em>แนะนำ</em>}{game.isNew && <em>ใหม่</em>}{game.isPopular && <em>นิยม</em>}</div><button type="button" style={playButtonStyle} disabled>เร็ว ๆ นี้</button></div></article>; }
function pickImage(game: Game) { const media = game.media ?? []; return media.find((item) => item.type === 'COVER')?.cachedUrl ?? media.find((item) => item.type === 'COVER')?.sourceUrl ?? media.find((item) => item.type === 'ICON')?.cachedUrl ?? media.find((item) => item.type === 'ICON')?.sourceUrl ?? null; }

const pageStyle = { minHeight: '100dvh', background: 'linear-gradient(180deg,#080808,#111827)', color: '#fff', padding: '88px 16px 96px' } as const;
const heroStyle = { border: '1px solid rgba(245,197,66,.22)', borderRadius: 24, padding: 18, background: 'rgba(245,197,66,.08)', display: 'grid', gap: 8 } as const;
const eyebrowStyle = { color: '#facc15', fontWeight: 900, letterSpacing: '.08em', textTransform: 'uppercase' as const, fontSize: 12 };
const titleStyle = { margin: 0, fontSize: 34, lineHeight: 1.05 } as const;
const mutedStyle = { margin: 0, color: '#cbd5e1', lineHeight: 1.55 } as const;
const noticeStyle = { marginTop: 14, padding: 14, borderRadius: 18, background: 'rgba(15,23,42,.78)', border: '1px solid rgba(148,163,184,.18)' } as const;
const tabsStyle = { display: 'flex', gap: 10, overflowX: 'auto' as const, padding: '16px 0 4px' };
const tabStyle = { border: '1px solid rgba(148,163,184,.24)', background: '#111827', color: '#cbd5e1', borderRadius: 999, padding: '10px 14px', fontWeight: 900, whiteSpace: 'nowrap' as const };
const activeTabStyle = { ...tabStyle, background: '#f5c542', color: '#111827', borderColor: '#f5c542' };
const sectionStyle = { marginTop: 22, display: 'grid', gap: 12 } as const;
const sectionTitleStyle = { margin: 0, fontSize: 22 } as const;
const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 } as const;
const cardStyle = { border: '1px solid rgba(148,163,184,.18)', borderRadius: 20, overflow: 'hidden', background: 'rgba(15,23,42,.82)', minWidth: 0 } as const;
const imageStyle = { width: '100%', aspectRatio: '4 / 3', objectFit: 'cover' as const, display: 'block' };
const fallbackStyle = { aspectRatio: '4 / 3', display: 'grid', placeItems: 'center', background: 'rgba(245,197,66,.12)', color: '#facc15', fontSize: 28, fontWeight: 950 } as const;
const cardBodyStyle = { padding: 12, display: 'grid', gap: 6 } as const;
const badgeRowStyle = { display: 'flex', gap: 5, flexWrap: 'wrap' as const };
const playButtonStyle = { marginTop: 4, minHeight: 36, borderRadius: 12, border: 0, background: '#334155', color: '#cbd5e1', fontWeight: 950 } as const;
const emptyStyle = { gridColumn: '1 / -1', padding: 18, borderRadius: 18, background: 'rgba(15,23,42,.72)', color: '#94a3b8', textAlign: 'center' as const };
