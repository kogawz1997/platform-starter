'use client';

import { FormEvent, useEffect, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

type WalletItem = {
  id: string;
  userId: string;
  currency: string;
  balance: string;
  lockedBalance: string;
  availableBalance: string;
  status: string;
  updatedAt: string;
  user?: { id: string; username: string; phone?: string | null; email?: string | null; status: string };
};

export default function AdminWalletsPage() {
  const [items, setItems] = useState<WalletItem[]>([]);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');

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

  return (
    <main style={{ maxWidth: 1180, margin: '32px auto', padding: 24 }}>
      <a href="/settings">← Settings</a>
      <h1>Member Wallets</h1>
      <p>ค้นหาและดูยอด wallet ของสมาชิก พร้อมลิงก์ไปประวัติ ledger</p>

      <form onSubmit={loadItems} style={toolbarStyle}>
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ค้นหา username / phone / email" style={inputStyle} />
        <button type="submit" style={buttonStyle}>Search</button>
      </form>

      {message && <p>{message}</p>}
      <div style={{ display: 'grid', gap: 12 }}>
        {items.map((item) => (
          <section key={item.id} style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
              <div>
                <h2>{item.user?.username ?? item.userId}</h2>
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
                <a href={`/ledgers?userId=${item.userId}`}>ดู Ledger</a>
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
const cardStyle = { border: '1px solid #ddd', borderRadius: 18, padding: 18, background: '#fff' } as const;
const inputStyle = { display: 'block', minWidth: 260, padding: 10, borderRadius: 10, border: '1px solid #ccc', boxSizing: 'border-box' } as const;
const buttonStyle = { padding: '10px 14px', borderRadius: 10, cursor: 'pointer' } as const;
