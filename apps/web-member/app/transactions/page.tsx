'use client';

import { useEffect, useState } from 'react';
import { API_URL } from '../site-settings';

type LedgerItem = {
  id: string;
  type: string;
  direction: string;
  amount: string;
  balanceBefore: string;
  balanceAfter: string;
  referenceType?: string | null;
  referenceId?: string | null;
  createdAt: string;
};

export default function TransactionsPage() {
  const [items, setItems] = useState<LedgerItem[]>([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = window.localStorage.getItem('member_access_token');
    if (!token) {
      setMessage('กรุณาเข้าสู่ระบบก่อนดูรายการ');
      return;
    }

    fetch(`${API_URL}/member/wallet/ledger?limit=100`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.message ?? 'โหลดประวัติไม่สำเร็จ');
        return data;
      })
      .then((data) => setItems(data.items ?? []))
      .catch((error) => setMessage(error.message));
  }, []);

  return (
    <main style={{ maxWidth: 980, margin: '32px auto', padding: 24 }}>
      <a href="/">← หน้าแรก</a>
      <h1>ประวัติธุรกรรม</h1>
      <p>รายการเคลื่อนไหวของกระเป๋าเงิน ฝาก ถอน และการปรับยอด</p>
      {message && <p>{message}</p>}
      <div style={{ display: 'grid', gap: 12 }}>
        {items.map((item) => (
          <section key={item.id} style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div>
                <strong>{item.type} / {item.direction}</strong>
                <p>{new Date(item.createdAt).toLocaleString('th-TH')}</p>
                <p>Ref: {item.referenceType || '-'} {item.referenceId ? `#${item.referenceId.slice(0, 8)}` : ''}</p>
              </div>
              <h2>{item.direction === 'CREDIT' ? '+' : '-'} THB {Number(item.amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</h2>
            </div>
            <p>ก่อน: THB {Number(item.balanceBefore).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</p>
            <p>หลัง: THB {Number(item.balanceAfter).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</p>
          </section>
        ))}
        {items.length === 0 && <p>ยังไม่มีรายการ</p>}
      </div>
    </main>
  );
}

const cardStyle = {
  border: '1px solid #ddd',
  borderRadius: 16,
  padding: 18,
} as const;
