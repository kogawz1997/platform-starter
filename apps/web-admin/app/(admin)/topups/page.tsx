'use client';

import { useEffect, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

type TopUpItem = {
  id: string;
  amount: string;
  currency: string;
  status: string;
  method?: string | null;
  referenceCode?: string | null;
  note?: string | null;
  adminNote?: string | null;
  createdAt: string;
  user?: { username: string; phone?: string | null; email?: string | null };
};

export default function AdminTopUpsPage() {
  const [items, setItems] = useState<TopUpItem[]>([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = window.localStorage.getItem('admin_access_token');
    if (!token) {
      setMessage('กรุณา login admin ก่อน');
      return;
    }

    fetch(`${API_URL}/admin/topups`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.message ?? 'โหลดรายการไม่สำเร็จ');
        return data;
      })
      .then((data) => setItems(data.items ?? []))
      .catch((error) => setMessage(error.message));
  }, []);

  return (
    <main style={{ maxWidth: 1100, margin: '32px auto', padding: 24 }}>
      <h1>Top Up Requests</h1>
      <p>รายการคำขอเพิ่มยอดจากสมาชิก</p>
      {message && <p>{message}</p>}
      <div style={{ display: 'grid', gap: 12 }}>
        {items.map((item) => (
          <section key={item.id} style={{ border: '1px solid #ddd', borderRadius: 14, padding: 16 }}>
            <strong>{item.currency} {Number(item.amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</strong>
            <p>Status: {item.status}</p>
            <p>User: {item.user?.username ?? item.userId}</p>
            <p>Ref: {item.referenceCode || '-'}</p>
            <p>Note: {item.note || '-'}</p>
          </section>
        ))}
        {items.length === 0 && <p>ยังไม่มีรายการ</p>}
      </div>
    </main>
  );
}
