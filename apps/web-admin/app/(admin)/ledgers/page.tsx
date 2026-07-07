'use client';

import { useEffect, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

type LedgerItem = { id: string; userId: string; shortUserId?: string | null; type: string; direction: string; amount: string; balanceBefore: string; balanceAfter: string; referenceType?: string | null; referenceId?: string | null; createdAt: string; user?: { id: string; username: string; shortId?: string | null; phone?: string | null; email?: string | null }; createdByAdmin?: { id: string; username: string; email?: string | null } | null };

export default function AdminLedgersPage() {
  const [items, setItems] = useState<LedgerItem[]>([]);
  const [type, setType] = useState('');
  const [direction, setDirection] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => { const params = new URLSearchParams(window.location.search); const nextIdentifier = params.get('identifier') ?? params.get('userId') ?? ''; setIdentifier(nextIdentifier); loadItems(nextIdentifier); }, []);

  async function loadItems(nextIdentifier = identifier) {
    const token = window.localStorage.getItem('admin_access_token');
    if (!token) { setMessage('กรุณา login admin ก่อน'); return; }
    const params = new URLSearchParams();
    if (type) params.set('type', type);
    if (direction) params.set('direction', direction);
    if (nextIdentifier) params.set('identifier', nextIdentifier);
    params.set('limit', '200');
    setMessage('กำลังโหลด ledger...');
    const res = await fetch(`${API_URL}/admin/ledgers?${params.toString()}`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json().catch(() => null);
    if (!res.ok) { setMessage(data?.message ?? 'โหลด ledger ไม่สำเร็จ'); return; }
    setItems(data.items ?? []); setMessage('');
  }

  return (
    <main style={pageStyle}>
      <a href="/settings" style={backStyle}>← Settings</a>
      <p style={eyebrowStyle}>Wallet Operations</p>
      <h1 style={titleStyle}>Wallet Ledgers</h1>
      <p style={mutedStyle}>ค้นหาด้วย username, Short ID หรือ userId และกรองประเภทรายการได้</p>

      <section style={toolbarStyle}>
        <input value={identifier} onChange={(event) => setIdentifier(event.target.value)} placeholder="username / short ID / user ID" style={inputStyle} />
        <select value={type} onChange={(event) => setType(event.target.value)} style={inputStyle}><option value="">ทุกประเภท</option><option value="DEPOSIT">DEPOSIT</option><option value="WITHDRAWAL">WITHDRAWAL</option><option value="ADJUSTMENT">ADJUSTMENT</option><option value="BONUS">BONUS</option><option value="REVERSAL">REVERSAL</option></select>
        <select value={direction} onChange={(event) => setDirection(event.target.value)} style={inputStyle}><option value="">ทุกทิศทาง</option><option value="CREDIT">CREDIT</option><option value="DEBIT">DEBIT</option></select>
        <button type="button" onClick={() => loadItems()} style={buttonStyle}>Apply</button>
      </section>

      {message && <div style={noticeStyle}>{message}</div>}
      <div style={{ display: 'grid', gap: 12 }}>
        {items.map((item) => <section key={item.id} style={cardStyle}><div style={rowTopStyle}><div><span style={badgeStyle}>{item.type}</span><h2 style={{ margin: '10px 0 4px' }}>{item.direction}</h2><p style={mutedStyle}>Member: {item.user?.username ?? item.userId}</p><p style={mutedStyle}>Short ID: {item.user?.shortId ?? item.shortUserId ?? '-'}</p><p style={mutedStyle}>Ref: {item.referenceType || '-'} {item.referenceId ? `#${item.referenceId.slice(0, 8)}` : ''}</p><p style={mutedStyle}>Admin: {item.createdByAdmin?.username ?? '-'}</p><p style={mutedStyle}>{new Date(item.createdAt).toLocaleString('th-TH')}</p></div><strong style={{ ...amountStyle, color: item.direction === 'CREDIT' ? '#7CFFB2' : '#FF9C9C' }}>{item.direction === 'CREDIT' ? '+' : '-'} THB {Number(item.amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</strong></div><div style={balanceGridStyle}><div><span>Before</span><strong>THB {Number(item.balanceBefore).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</strong></div><div><span>After</span><strong>THB {Number(item.balanceAfter).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</strong></div></div></section>)}
        {items.length === 0 && <div style={noticeStyle}>ยังไม่มีรายการ</div>}
      </div>
    </main>
  );
}

const pageStyle = { maxWidth: 1180, margin: '0 auto', padding: '22px 16px 44px', color: '#fff' } as const;
const backStyle = { color: '#f5c542', textDecoration: 'none', fontWeight: 900 } as const;
const eyebrowStyle = { margin: '18px 0 0', opacity: 0.66, fontSize: 14 } as const;
const titleStyle = { margin: '6px 0 8px', fontSize: 'clamp(36px, 10vw, 68px)', lineHeight: 0.96, letterSpacing: -1.4 } as const;
const mutedStyle = { margin: 0, opacity: 0.76, lineHeight: 1.55 } as const;
const toolbarStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, border: '1px solid rgba(255,255,255,0.14)', borderRadius: 24, padding: 16, margin: '18px 0', background: '#181818' } as const;
const cardStyle = { border: '1px solid rgba(255,255,255,0.12)', borderRadius: 24, padding: 16, background: '#181818' } as const;
const inputStyle = { display: 'block', width: '100%', padding: '13px 14px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.16)', background: '#242424', color: '#fff', boxSizing: 'border-box' } as const;
const buttonStyle = { padding: '13px 14px', borderRadius: 14, cursor: 'pointer', background: '#f5c542', color: '#111', border: 0, fontWeight: 900 } as const;
const noticeStyle = { border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16, padding: 12, background: 'rgba(255,255,255,0.07)' } as const;
const rowTopStyle = { display: 'flex', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' } as const;
const badgeStyle = { display: 'inline-block', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 999, padding: '6px 10px', fontSize: 12, fontWeight: 900, background: 'rgba(255,255,255,0.05)' } as const;
const amountStyle = { fontSize: 'clamp(22px, 6vw, 32px)', textAlign: 'right' } as const;
const balanceGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, marginTop: 14, borderTop: '1px solid rgba(255,255,255,0.10)', paddingTop: 12 } as const;
