'use client';

import { useEffect, useMemo, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

type TopUpItem = {
  id: string;
  userId: string;
  amount: string;
  currency: string;
  status: string;
  method?: string | null;
  note?: string | null;
  adminNote?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  user?: {
    id: string;
    username: string;
    phone?: string | null;
    email?: string | null;
  };
};

type Proof = {
  userNote: string;
  slipImageData: string;
  slipImageName: string;
};

export default function AdminTopUpsPage() {
  const [items, setItems] = useState<TopUpItem[]>([]);
  const [status, setStatus] = useState('PENDING');
  const [message, setMessage] = useState('');
  const [reviewNote, setReviewNote] = useState('');
  const [busyId, setBusyId] = useState('');

  useEffect(() => {
    loadItems(status);
  }, [status]);

  const counts = useMemo(() => {
    const pending = items.filter((item) => item.status === 'PENDING').length;
    return { pending, total: items.length };
  }, [items]);

  async function loadItems(nextStatus = status) {
    const token = window.localStorage.getItem('admin_access_token');
    if (!token) {
      setMessage('กรุณา login admin ก่อน');
      return;
    }

    setMessage('กำลังโหลดรายการ...');
    const query = nextStatus === 'ALL' ? '' : `?status=${nextStatus}`;
    const res = await fetch(`${API_URL}/admin/topups${query}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      setMessage(data?.message ?? 'โหลดรายการไม่สำเร็จ');
      return;
    }

    setItems(data.items ?? []);
    setMessage('');
  }

  async function reviewItem(id: string, action: 'confirm' | 'decline') {
    const token = window.localStorage.getItem('admin_access_token');
    if (!token) {
      setMessage('กรุณา login admin ก่อน');
      return;
    }

    setBusyId(id);
    setMessage(action === 'confirm' ? 'กำลังอนุมัติรายการ...' : 'กำลังปฏิเสธรายการ...');

    const res = await fetch(`${API_URL}/admin/topups/${id}/${action}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ adminNote: reviewNote }),
    });
    const data = await res.json().catch(() => null);
    setBusyId('');

    if (!res.ok) {
      setMessage(data?.message ?? 'ทำรายการไม่สำเร็จ');
      return;
    }

    setItems((current) => current.map((item) => (item.id === data.id ? { ...item, ...data } : item)));
    setReviewNote('');
    setMessage(action === 'confirm' ? 'อนุมัติสำเร็จ ยอดถูกเพิ่มเข้า wallet แล้ว' : 'ปฏิเสธรายการแล้ว');
  }

  return (
    <main style={{ maxWidth: 1160, margin: '32px auto', padding: 24 }}>
      <a href="/settings">← Settings</a>
      <h1>Top Up Review</h1>
      <p>ตรวจสลิป เติมยอด และจัดการคำขอเติมเงินของสมาชิก</p>

      <section style={toolbarStyle}>
        <strong>Pending ในหน้านี้: {counts.pending}</strong>
        <select value={status} onChange={(event) => setStatus(event.target.value)} style={inputStyle}>
          <option value="PENDING">PENDING</option>
          <option value="APPROVED">APPROVED</option>
          <option value="REJECTED">REJECTED</option>
          <option value="ALL">ALL</option>
        </select>
        <button type="button" onClick={() => loadItems()} style={buttonStyle}>Refresh</button>
      </section>

      {message && <p>{message}</p>}

      <div style={{ display: 'grid', gap: 16 }}>
        {items.map((item) => {
          const proof = parseProofNote(item.note);
          const isPending = item.status === 'PENDING';
          return (
            <section key={item.id} style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                <div>
                  <h2>{item.currency} {Number(item.amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</h2>
                  <p>Status: <strong>{item.status}</strong></p>
                  <p>Member: {item.user?.username ?? item.userId}</p>
                  <p>Method: {item.method ?? '-'}</p>
                  <p>Created: {new Date(item.createdAt).toLocaleString('th-TH')}</p>
                </div>
                <div style={{ minWidth: 260 }}>
                  <label>
                    Admin note
                    <textarea value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} placeholder="หมายเหตุสำหรับรายการนี้" style={inputStyle} />
                  </label>
                  <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
                    <button type="button" disabled={!isPending || busyId === item.id} onClick={() => reviewItem(item.id, 'confirm')} style={confirmButtonStyle}>
                      {busyId === item.id ? 'กำลังทำ...' : 'อนุมัติ'}
                    </button>
                    <button type="button" disabled={!isPending || busyId === item.id} onClick={() => reviewItem(item.id, 'decline')} style={declineButtonStyle}>
                      ไม่อนุมัติ
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 16 }}>
                <strong>สลิปที่แนบ</strong>
                {proof.slipImageData ? (
                  <div style={{ marginTop: 10 }}>
                    <img src={proof.slipImageData} alt="top up slip" style={{ width: '100%', maxWidth: 420, borderRadius: 14, border: '1px solid #ddd' }} />
                    <p>{proof.slipImageName || 'slip image'}</p>
                  </div>
                ) : (
                  <p>ไม่มีสลิป</p>
                )}
                <p>Member note: {proof.userNote || '-'}</p>
                {item.adminNote && <p>Previous admin note: {item.adminNote}</p>}
              </div>
            </section>
          );
        })}
        {items.length === 0 && <p>ยังไม่มีรายการ</p>}
      </div>
    </main>
  );
}

function parseProofNote(value?: string | null): Proof {
  if (!value) return { userNote: '', slipImageData: '', slipImageName: '' };
  try {
    const data = JSON.parse(value);
    return {
      userNote: typeof data.userNote === 'string' ? data.userNote : '',
      slipImageData: typeof data.slipImageData === 'string' ? data.slipImageData : '',
      slipImageName: typeof data.slipImageName === 'string' ? data.slipImageName : '',
    };
  } catch {
    return { userNote: value, slipImageData: '', slipImageName: '' };
  }
}

const toolbarStyle = {
  display: 'flex',
  gap: 12,
  alignItems: 'center',
  flexWrap: 'wrap',
  border: '1px solid #ddd',
  borderRadius: 16,
  padding: 16,
  marginBottom: 18,
} as const;

const cardStyle = {
  border: '1px solid #ddd',
  borderRadius: 18,
  padding: 18,
  background: '#fff',
} as const;

const inputStyle = {
  display: 'block',
  width: '100%',
  padding: 10,
  borderRadius: 10,
  border: '1px solid #ccc',
  marginTop: 6,
  boxSizing: 'border-box',
} as const;

const buttonStyle = {
  padding: '10px 14px',
  borderRadius: 10,
  cursor: 'pointer',
} as const;

const confirmButtonStyle = {
  padding: '10px 14px',
  borderRadius: 10,
  border: 0,
  cursor: 'pointer',
  background: '#16a34a',
  color: '#fff',
} as const;

const declineButtonStyle = {
  padding: '10px 14px',
  borderRadius: 10,
  border: 0,
  cursor: 'pointer',
  background: '#dc2626',
  color: '#fff',
} as const;
