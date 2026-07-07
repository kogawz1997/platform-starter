'use client';

import { FormEvent, useEffect, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

type WalletItem = { id: string; userId: string; shortUserId?: string | null; currency: string; balance: string; lockedBalance: string; availableBalance: string; status: string; updatedAt: string; user?: { id: string; username: string; shortId?: string | null; phone?: string | null; email?: string | null; status: string } };

export default function AdminWalletsPage() {
  const [items, setItems] = useState<WalletItem[]>([]);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');
  const [adjustUserId, setAdjustUserId] = useState('');
  const [direction, setDirection] = useState<'CREDIT' | 'DEBIT'>('CREDIT');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { loadItems(); }, []);

  async function loadItems(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const token = window.localStorage.getItem('admin_access_token');
    if (!token) { setMessage('กรุณา login admin ก่อน'); return; }
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    params.set('limit', '200');
    setMessage('กำลังโหลด wallets...');
    const res = await fetch(`${API_URL}/admin/wallets?${params.toString()}`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json().catch(() => null);
    if (!res.ok) { setMessage(data?.message ?? 'โหลด wallets ไม่สำเร็จ'); return; }
    setItems(data.items ?? []); setMessage('');
  }

  async function adjustWallet(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = window.localStorage.getItem('admin_access_token');
    if (!token) { setMessage('กรุณา login admin ก่อน'); return; }
    if (!adjustUserId) { setMessage('เลือก member ก่อน'); return; }
    const parsedAmount = Number(amount.replace(/,/g, '').trim());
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) { setMessage('จำนวนเงินต้องมากกว่า 0'); return; }
    if (!reason.trim()) { setMessage('ต้องใส่เหตุผล'); return; }
    setBusy(true); setMessage('กำลังปรับยอด...');
    const res = await fetch(`${API_URL}/admin/wallets/${adjustUserId}/adjust`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ direction, amount: parsedAmount, reason }) });
    const data = await res.json().catch(() => null); setBusy(false);
    if (!res.ok) { setMessage(data?.message ?? 'ปรับยอดไม่สำเร็จ'); return; }
    setItems((current) => current.map((item) => (item.userId === adjustUserId ? { ...item, ...data.wallet } : item)));
    setAmount(''); setReason(''); setMessage('ปรับยอดสำเร็จ และเขียน ledger แล้ว');
  }

  function startAdjust(item: WalletItem, nextDirection: 'CREDIT' | 'DEBIT') { setAdjustUserId(item.userId); setDirection(nextDirection); setMessage(`กำลังปรับยอดให้ ${item.user?.username ?? item.shortUserId}`); setTimeout(() => document.getElementById('adjust-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50); }

  return (
    <main style={pageStyle}>
      <a href="/settings" style={backStyle}>← Settings</a>
      <p style={eyebrowStyle}>Wallet Operations</p>
      <h1 style={titleStyle}>Member Wallets</h1>
      <p style={mutedStyle}>ค้นหา member และปรับยอด manual พร้อมบันทึก ledger</p>

      <form onSubmit={loadItems} style={toolbarStyle}><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="username / short ID / user ID" style={inputStyle} /><button type="submit" style={buttonStyle}>Search</button></form>

      <form id="adjust-form" onSubmit={adjustWallet} style={adjustStyle}>
        <strong style={{ fontSize: 20 }}>Manual Wallet Adjustment</strong>
        <input value={adjustUserId} onChange={(event) => setAdjustUserId(event.target.value)} placeholder="full userId" style={inputStyle} />
        <select value={direction} onChange={(event) => setDirection(event.target.value as 'CREDIT' | 'DEBIT')} style={inputStyle}><option value="CREDIT">เพิ่มยอด / CREDIT</option><option value="DEBIT">ลดยอด / DEBIT</option></select>
        <input value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="amount" inputMode="decimal" style={inputStyle} />
        <input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="reason จำเป็น" style={inputStyle} />
        <button type="submit" disabled={busy} style={buttonStyle}>{busy ? 'กำลังทำ...' : 'Confirm Adjustment'}</button>
      </form>

      {message && <div style={noticeStyle}>{message}</div>}
      <div style={{ display: 'grid', gap: 12 }}>
        {items.map((item) => <section key={item.id} style={cardStyle}><div style={walletRowStyle}><div><span style={badgeStyle}>{item.status}</span><h2 style={{ margin: '10px 0 4px' }}>{item.user?.username ?? item.userId}</h2><p style={mutedStyle}>Short ID: <strong>{item.user?.shortId ?? item.shortUserId ?? '-'}</strong></p><p style={mutedStyle}>User ID: <code>{item.userId}</code></p><p style={mutedStyle}>Phone: {item.user?.phone ?? '-'}</p><p style={mutedStyle}>Email: {item.user?.email ?? '-'}</p><p style={mutedStyle}>Updated: {new Date(item.updatedAt).toLocaleString('th-TH')}</p></div><div><h2 style={amountStyle}>{item.currency} {Number(item.availableBalance).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</h2><p style={mutedStyle}>Balance: {Number(item.balance).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</p><p style={mutedStyle}>Locked: {Number(item.lockedBalance).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</p><div style={actionRowStyle}><a href={`/ledgers?identifier=${item.user?.shortId ?? item.shortUserId ?? item.userId}`} style={linkPillStyle}>ดู Ledger</a><button type="button" onClick={() => navigator.clipboard?.writeText(item.userId)} style={smallButtonStyle}>Copy ID</button><button type="button" onClick={() => startAdjust(item, 'CREDIT')} style={smallButtonStyle}>+ เพิ่มยอด</button><button type="button" onClick={() => startAdjust(item, 'DEBIT')} style={smallButtonStyle}>- ลดยอด</button></div></div></div></section>)}
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
const toolbarStyle = { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 10, border: '1px solid rgba(255,255,255,0.14)', borderRadius: 24, padding: 16, margin: '18px 0', background: '#181818' } as const;
const adjustStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, border: '1px solid rgba(255,255,255,0.14)', borderRadius: 24, padding: 16, marginBottom: 18, background: '#181818' } as const;
const cardStyle = { border: '1px solid rgba(255,255,255,0.12)', borderRadius: 24, padding: 16, background: '#181818' } as const;
const inputStyle = { display: 'block', width: '100%', minWidth: 0, padding: '13px 14px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.16)', background: '#242424', color: '#fff', boxSizing: 'border-box' } as const;
const buttonStyle = { padding: '13px 14px', borderRadius: 14, cursor: 'pointer', background: '#f5c542', color: '#111', border: 0, fontWeight: 900 } as const;
const smallButtonStyle = { padding: '10px 12px', borderRadius: 999, cursor: 'pointer', background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.14)', fontWeight: 900 } as const;
const noticeStyle = { border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16, padding: 12, background: 'rgba(255,255,255,0.07)', marginBottom: 12 } as const;
const walletRowStyle = { display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' } as const;
const badgeStyle = { display: 'inline-block', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 999, padding: '6px 10px', fontSize: 12, fontWeight: 900, background: 'rgba(80,255,140,0.12)' } as const;
const amountStyle = { margin: '0 0 8px', fontSize: 'clamp(26px, 7vw, 40px)', lineHeight: 1, textAlign: 'right' } as const;
const actionRowStyle = { display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 } as const;
const linkPillStyle = { color: '#f5c542', textDecoration: 'none', border: '1px solid rgba(245,197,66,0.35)', borderRadius: 999, padding: '10px 12px', fontWeight: 900 } as const;
