'use client';

import { FormEvent, useEffect, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

type WalletItem = {
  id: string;
  userId: string;
  shortUserId?: string | null;
  currency: string;
  balance: string;
  lockedBalance: string;
  availableBalance: string;
  status: string;
  updatedAt: string;
  user?: { id: string; username: string; shortId?: string | null; phone?: string | null; email?: string | null; status: string };
};

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
    setItems(data.items ?? []);
    setMessage('');
  }

  async function adjustWallet(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = window.localStorage.getItem('admin_access_token');
    if (!token) { setMessage('กรุณา login admin ก่อน'); return; }
    if (!adjustUserId) { setMessage('เลือก member ก่อน'); return; }

    const parsedAmount = Number(amount.replace(/,/g, '').trim());
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) { setMessage('จำนวนเงินต้องมากกว่า 0'); return; }
    if (!reason.trim()) { setMessage('ต้องใส่เหตุผล'); return; }

    setBusy(true);
    setMessage('กำลังปรับยอด...');
    const res = await fetch(`${API_URL}/admin/wallets/${adjustUserId}/adjust`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ direction, amount: parsedAmount, reason }),
    });
    const data = await res.json().catch(() => null);
    setBusy(false);

    if (!res.ok) { setMessage(data?.message ?? 'ปรับยอดไม่สำเร็จ'); return; }
    setItems((current) => current.map((item) => (item.userId === adjustUserId ? { ...item, ...data.wallet } : item)));
    setAmount('');
    setReason('');
    setMessage('ปรับยอดสำเร็จ และเขียน ledger แล้ว');
  }

  function startAdjust(item: WalletItem, nextDirection: 'CREDIT' | 'DEBIT') {
    setAdjustUserId(item.userId);
    setDirection(nextDirection);
    setMessage(`กำลังปรับยอดให้ ${item.user?.username ?? item.shortUserId}`);
    setTimeout(() => document.getElementById('adjust-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
  }

  return (
    <main style={{ maxWidth: 1180, margin: '32px auto', padding: 24 }}>
      <a href="/settings">← Settings</a>
      <h1>Member Wallets</h1>
      <p>ค้นหาได้ด้วย username / Short ID / userId และปรับยอด manual ได้</p>

      <form onSubmit={loadItems} style={toolbarStyle}>
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="username / short ID / user ID" style={inputStyle} />
        <button type="submit" style={buttonStyle}>Search</button>
      </form>

      <form id="adjust-form" onSubmit={adjustWallet} style={adjustStyle}>
        <strong>Manual Wallet Adjustment</strong>
        <input value={adjustUserId} onChange={(event) => setAdjustUserId(event.target.value)} placeholder="full userId" style={inputStyle} />
        <select value={direction} onChange={(event) => setDirection(event.target.value as 'CREDIT' | 'DEBIT')} style={inputStyle}>
          <option value="CREDIT">เพิ่มยอด / CREDIT</option>
          <option value="DEBIT">ลดยอด / DEBIT</option>
        </select>
        <input value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="amount" inputMode="decimal" style={inputStyle} />
        <input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="reason จำเป็น" style={inputStyle} />
        <button type="submit" disabled={busy} style={buttonStyle}>{busy ? 'กำลังทำ...' : 'Confirm Adjustment'}</button>
      </form>

      {message && <p>{message}</p>}
      <div style={{ display: 'grid', gap: 12 }}>
        {items.map((item) => (
          <section key={item.id} style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
              <div>
                <h2>{item.user?.username ?? item.userId}</h2>
                <p>Short ID: <strong>{item.user?.shortId ?? item.shortUserId ?? '-'}</strong></p>
                <p>User ID: <code>{item.userId}</code></p>
                <p>User status: {item.user?.status ?? '-'}</p>
                <p>Phone: {item.user?.phone ?? '-'}</p>
                <p>Email: {item.user?.email ?? '-'}</p>
                <p>Wallet status: {item.status}</p>
                <p>Updated: {new Date(item.updatedAt).toLocaleString('th-TH')}</p>
              </div>
              <div>
                <h2>{item.currency} {Number(item.availableBalance).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</h2>
                <p>Balance: {Number(item.balance).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</p>
                <p>Locked: {Number(item.lockedBalance).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <a href={`/ledgers?identifier=${item.user?.shortId ?? item.shortUserId ?? item.userId}`}>ดู Ledger</a>
                  <button type="button" onClick={() => navigator.clipboard?.writeText(item.userId)} style={buttonStyle}>Copy ID</button>
                  <button type="button" onClick={() => startAdjust(item, 'CREDIT')} style={buttonStyle}>+ เพิ่มยอด</button>
                  <button type="button" onClick={() => startAdjust(item, 'DEBIT')} style={buttonStyle}>- ลดยอด</button>
                </div>
              </div>
            </div>
          </section>
        ))}
        {items.length === 0 && <p>ยังไม่มีรายการ</p>}
      </div>
    </main>
  );
}

const toolbarStyle = { display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', border: '1px solid #ddd', borderRadius: 16, padding: 16, marginBottom: 18 } as const;
const adjustStyle = { display: 'grid', gap: 10, border: '1px solid #ddd', borderRadius: 16, padding: 16, marginBottom: 18, background: '#fafafa' } as const;
const cardStyle = { border: '1px solid #ddd', borderRadius: 18, padding: 18, background: '#fff' } as const;
const inputStyle = { display: 'block', minWidth: 260, padding: 10, borderRadius: 10, border: '1px solid #ccc', boxSizing: 'border-box' } as const;
const buttonStyle = { padding: '10px 14px', borderRadius: 10, cursor: 'pointer' } as const;
