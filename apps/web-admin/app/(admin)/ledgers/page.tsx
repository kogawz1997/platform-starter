'use client';

import { useEffect, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

type LedgerItem = {
  id: string;
  userId: string;
  type: string;
  direction: string;
  amount: string;
  balanceBefore: string;
  balanceAfter: string;
  referenceType?: string | null;
  referenceId?: string | null;
  createdAt: string;
  user?: { id: string; username: string; phone?: string | null; email?: string | null };
  createdByAdmin?: { id: string; username: string; email?: string | null } | null;
};

export default function AdminLedgersPage() {
  const [items, setItems] = useState<LedgerItem[]>([]);
  const [type, setType] = useState('');
  const [direction, setDirection] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => { loadItems(); }, []);

  async function loadItems() {
    const token = window.localStorage.getItem('admin_access_token');
    if (!token) { setMessage('กรุณา login admin ก่อน'); return; }

    const params = new URLSearchParams();
    if (type) params.set('type', type);
    if (direction) params.set('direction', direction);
    params.set('limit', '200');

    setMessage('กำลังโหลด ledger...');
    const res = await fetch(`${API_URL}/admin/ledgers?${params.toString()}`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json().catch(() => null);
    if (!res.ok) { setMessage(data?.message ?? 'โหลด ledger ไม่สำเร็จ'); return; }
    setItems(data.items ?? []);
    setMessage('');
  }

  return (
    <main style={{ maxWidth: 1180, margin: '32px auto', padding: 24 }}>
      <a href="/settings">← Settings</a>
      <h1>Wallet Ledgers</h1>
      <p>ประวัติเงินทั้งหมด ฝาก ถอน ปรับยอด พร้อมยอดก่อนและหลัง</p>

      <section style={toolbarStyle}>
        <select value={type} onChange={(event) => setType(event.target.value)} style={inputStyle}>
          <option value="">ทุกประเภท</option>
          <option value="DEPOSIT">DEPOSIT</option>
          <option value="WITHDRAWAL">WITHDRAWAL</option>
          <option value="ADJUSTMENT">ADJUSTMENT</option>
          <option value="BONUS">BONUS</option>
          <option value="REVERSAL">REVERSAL</option>
        </select>
        <select value={direction} onChange={(event) => setDirection(event.target.value)} style={inputStyle}>
          <option value="">ทุกทิศทาง</option>
          <option value="CREDIT">CREDIT</option>
          <option value="DEBIT">DEBIT</option>
        </select>
        <button type="button" onClick={loadItems} style={buttonStyle}>Apply</button>
      </section>

      {message && <p>{message}</p>}
      <div style={{ display: 'grid', gap: 12 }}>
        {items.map((item) => (
          <section key={item.id} style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
              <div>
                <h2>{item.type} / {item.direction}</h2>
                <p>Member: {item.user?.username ?? item.userId}</p>
                <p>Ref: {item.referenceType || '-'} {item.referenceId ? `#${item.referenceId.slice(0, 8)}` : ''}</p>
                <p>Admin: {item.createdByAdmin?.username ?? '-'}</p>
                <p>{new Date(item.createdAt).toLocaleString('th-TH')}</p>
              </div>
              <h2>{item.direction === 'CREDIT' ? '+' : '-'} THB {Number(item.amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</h2>
            </div>
            <p>Balance before: THB {Number(item.balanceBefore).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</p>
            <p>Balance after: THB {Number(item.balanceAfter).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</p>
          </section>
        ))}
        {items.length === 0 && <p>ยังไม่มีรายการ</p>}
      </div>
    </main>
  );
}

const toolbarStyle = { display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', border: '1px solid #ddd', borderRadius: 16, padding: 16, marginBottom: 18 } as const;
const cardStyle = { border: '1px solid #ddd', borderRadius: 18, padding: 18, background: '#fff' } as const;
const inputStyle = { display: 'block', minWidth: 180, padding: 10, borderRadius: 10, border: '1px solid #ccc', boxSizing: 'border-box' } as const;
const buttonStyle = { padding: '10px 14px', borderRadius: 10, cursor: 'pointer' } as const;
