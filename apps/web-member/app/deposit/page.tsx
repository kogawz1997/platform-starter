'use client';

import { FormEvent, useEffect, useState } from 'react';
import { API_URL } from '../site-settings';

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
};

export default function DepositPage() {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('bank_transfer');
  const [referenceCode, setReferenceCode] = useState('');
  const [note, setNote] = useState('');
  const [items, setItems] = useState<TopUpItem[]>([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    const token = window.localStorage.getItem('member_access_token');
    if (!token) {
      setMessage('กรุณาเข้าสู่ระบบก่อนทำรายการ');
      return;
    }

    const res = await fetch(`${API_URL}/member/topups`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json().catch(() => null);
    if (res.ok) setItems(data.items ?? []);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('กำลังส่งคำขอ...');

    const token = window.localStorage.getItem('member_access_token');
    if (!token) {
      setMessage('กรุณาเข้าสู่ระบบก่อนทำรายการ');
      return;
    }

    const res = await fetch(`${API_URL}/member/topups`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ amount: Number(amount), method, referenceCode, note }),
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setMessage(data?.message ?? 'ส่งคำขอไม่สำเร็จ');
      return;
    }

    setAmount('');
    setReferenceCode('');
    setNote('');
    setMessage('ส่งคำขอสำเร็จ รอแอดมินตรวจสอบ');
    setItems((current) => [data, ...current]);
  }

  return (
    <main style={{ maxWidth: 980, margin: '32px auto', padding: 24 }}>
      <a href="/">← หน้าแรก</a>
      <h1>ฝากเงิน / เติมเงิน</h1>
      <p>ส่งคำขอเติมยอดเข้ากระเป๋า รอแอดมินตรวจสอบก่อนยอดเข้า wallet</p>

      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12, border: '1px solid #ddd', borderRadius: 16, padding: 20, marginBottom: 24 }}>
        <label>
          จำนวนเงิน
          <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="เช่น 500" type="number" min="1" style={inputStyle} />
        </label>
        <label>
          วิธีทำรายการ
          <select value={method} onChange={(e) => setMethod(e.target.value)} style={inputStyle}>
            <option value="bank_transfer">โอนธนาคาร</option>
            <option value="manual">Manual</option>
          </select>
        </label>
        <label>
          Reference / เลขอ้างอิง
          <input value={referenceCode} onChange={(e) => setReferenceCode(e.target.value)} placeholder="เช่น เลขสลิป" style={inputStyle} />
        </label>
        <label>
          หมายเหตุ
          <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="รายละเอียดเพิ่มเติม" style={inputStyle} />
        </label>
        <button type="submit" style={{ padding: 12, borderRadius: 10, cursor: 'pointer' }}>ส่งคำขอ</button>
        {message && <p>{message}</p>}
      </form>

      <h2>ประวัติคำขอ</h2>
      <div style={{ display: 'grid', gap: 12 }}>
        {items.map((item) => (
          <section key={item.id} style={{ border: '1px solid #ddd', borderRadius: 14, padding: 16 }}>
            <strong>{item.currency} {Number(item.amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</strong>
            <p>Status: {item.status}</p>
            <p>Ref: {item.referenceCode || '-'}</p>
            <p>Note: {item.note || '-'}</p>
            {item.adminNote && <p>Admin note: {item.adminNote}</p>}
          </section>
        ))}
        {items.length === 0 && <p>ยังไม่มีรายการ</p>}
      </div>
    </main>
  );
}

const inputStyle = {
  display: 'block',
  width: '100%',
  maxWidth: '100%',
  padding: 10,
  marginTop: 6,
  borderRadius: 10,
  border: '1px solid #ccc',
  boxSizing: 'border-box',
} as const;
