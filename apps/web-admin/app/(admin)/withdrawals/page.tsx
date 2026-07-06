'use client';

import { useEffect, useMemo, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

type WithdrawalItem = {
  id: string;
  userId: string;
  amount: string;
  currency: string;
  status: string;
  method?: string | null;
  accountName?: string | null;
  accountNumber?: string | null;
  bankName?: string | null;
  note?: string | null;
  adminNote?: string | null;
  createdAt: string;
  user?: { id: string; username: string; phone?: string | null; email?: string | null };
};

export default function AdminWithdrawalsPage() {
  const [items, setItems] = useState<WithdrawalItem[]>([]);
  const [status, setStatus] = useState('PENDING');
  const [message, setMessage] = useState('');
  const [reviewNote, setReviewNote] = useState('');
  const [busyId, setBusyId] = useState('');

  useEffect(() => { loadItems(status); }, [status]);

  const pendingCount = useMemo(() => items.filter((item) => item.status === 'PENDING').length, [items]);

  async function loadItems(nextStatus = status) {
    const token = window.localStorage.getItem('admin_access_token');
    if (!token) { setMessage('กรุณา login admin ก่อน'); return; }
    setMessage('กำลังโหลดรายการ...');
    const query = nextStatus === 'ALL' ? '' : `?status=${nextStatus}`;
    const res = await fetch(`${API_URL}/admin/withdrawals${query}`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json().catch(() => null);
    if (!res.ok) { setMessage(data?.message ?? 'โหลดรายการไม่สำเร็จ'); return; }
    setItems(data.items ?? []);
    setMessage('');
  }

  async function reviewItem(id: string, action: 'complete' | 'reject') {
    const token = window.localStorage.getItem('admin_access_token');
    if (!token) { setMessage('กรุณา login admin ก่อน'); return; }
    setBusyId(id);
    setMessage(action === 'complete' ? 'กำลังปิดรายการถอน...' : 'กำลังปฏิเสธรายการ...');
    const res = await fetch(`${API_URL}/admin/withdrawals/${id}/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ adminNote: reviewNote }),
    });
    const data = await res.json().catch(() => null);
    setBusyId('');
    if (!res.ok) { setMessage(data?.message ?? 'ทำรายการไม่สำเร็จ'); return; }
    setItems((current) => current.map((item) => (item.id === data.id ? { ...item, ...data } : item)));
    setReviewNote('');
    setMessage(action === 'complete' ? 'ทำรายการสำเร็จ ยอดถูกหักจาก wallet แล้ว' : 'ปฏิเสธรายการแล้ว และคืนยอดล็อกแล้ว');
  }

  return (
    <main style={{ maxWidth: 1160, margin: '32px auto', padding: 24 }}>
      <a href="/settings">← Settings</a>
      <h1>Withdrawal Review</h1>
      <p>ตรวจคำขอถอนเงินและดำเนินการรายการสมาชิก</p>

      <section style={toolbarStyle}>
        <strong>Pending ในหน้านี้: {pendingCount}</strong>
        <select value={status} onChange={(event) => setStatus(event.target.value)} style={inputStyle}>
          <option value="PENDING">PENDING</option>
          <option value="COMPLETED">COMPLETED</option>
          <option value="REJECTED">REJECTED</option>
          <option value="ALL">ALL</option>
        </select>
        <button type="button" onClick={() => loadItems()} style={buttonStyle}>Refresh</button>
      </section>

      {message && <p>{message}</p>}

      <div style={{ display: 'grid', gap: 16 }}>
        {items.map((item) => {
          const isPending = item.status === 'PENDING';
          return (
            <section key={item.id} style={cardStyle}>
              <h2>{item.currency} {Number(item.amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</h2>
              <p>Status: <strong>{item.status}</strong></p>
              <p>Member: {item.user?.username ?? item.userId}</p>
              <p>Method: {item.method ?? '-'}</p>
              <p>Account: {item.accountName || '-'} / {item.accountNumber || '-'}</p>
              <p>Bank: {item.bankName || '-'}</p>
              <p>Member note: {item.note || '-'}</p>
              <p>Created: {new Date(item.createdAt).toLocaleString('th-TH')}</p>
              <label>Admin note<textarea value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} placeholder="หมายเหตุสำหรับรายการนี้" style={inputStyle} /></label>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button type="button" disabled={!isPending || busyId === item.id} onClick={() => reviewItem(item.id, 'complete')} style={confirmButtonStyle}>{busyId === item.id ? 'กำลังทำ...' : 'จ่ายแล้ว / สำเร็จ'}</button>
                <button type="button" disabled={!isPending || busyId === item.id} onClick={() => reviewItem(item.id, 'reject')} style={declineButtonStyle}>ไม่อนุมัติ / คืนยอด</button>
              </div>
            </section>
          );
        })}
        {items.length === 0 && <p>ยังไม่มีรายการ</p>}
      </div>
    </main>
  );
}

const toolbarStyle = { display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', border: '1px solid #ddd', borderRadius: 16, padding: 16, marginBottom: 18 } as const;
const cardStyle = { border: '1px solid #ddd', borderRadius: 18, padding: 18, background: '#fff', display: 'grid', gap: 8 } as const;
const inputStyle = { display: 'block', width: '100%', padding: 10, borderRadius: 10, border: '1px solid #ccc', marginTop: 6, boxSizing: 'border-box' } as const;
const buttonStyle = { padding: '10px 14px', borderRadius: 10, cursor: 'pointer' } as const;
const confirmButtonStyle = { padding: '10px 14px', borderRadius: 10, border: 0, cursor: 'pointer', background: '#16a34a', color: '#fff' } as const;
const declineButtonStyle = { padding: '10px 14px', borderRadius: 10, border: 0, cursor: 'pointer', background: '#dc2626', color: '#fff' } as const;
