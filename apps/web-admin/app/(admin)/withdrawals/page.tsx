'use client';

import { useEffect, useMemo, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

type WithdrawalItem = { id: string; userId: string; amount: string; currency: string; status: string; method?: string | null; accountName?: string | null; accountNumber?: string | null; bankName?: string | null; note?: string | null; adminNote?: string | null; createdAt: string; user?: { id: string; username: string; phone?: string | null; email?: string | null } };

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
    setItems(data.items ?? []); setMessage('');
  }

  async function reviewItem(id: string, action: 'complete' | 'reject') {
    const token = window.localStorage.getItem('admin_access_token');
    if (!token) { setMessage('กรุณา login admin ก่อน'); return; }
    const nextStatus = action === 'complete' ? 'COMPLETED' : 'REJECTED';
    setBusyId(id); setMessage(action === 'complete' ? 'กำลังปิดรายการถอน...' : 'กำลังปฏิเสธรายการ...');
    const res = await fetch(`${API_URL}/admin/withdrawals/${id}/${action}`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ adminNote: reviewNote }) });
    const data = await res.json().catch(() => null); setBusyId('');
    if (!res.ok) { setMessage(data?.message ?? 'ทำรายการไม่สำเร็จ'); return; }

    const updated = data?.item ?? data?.withdrawal ?? data;
    setItems((current) => {
      const patched = current.map((item) => (item.id === id ? { ...item, ...updated, status: updated?.status ?? nextStatus, adminNote: updated?.adminNote ?? reviewNote } : item));
      return status === 'PENDING' ? patched.filter((item) => item.id !== id) : patched;
    });
    setReviewNote('');
    setMessage(action === 'complete' ? 'ทำรายการสำเร็จ รายการถูกย้ายออกจากคิว PENDING แล้ว' : 'ปฏิเสธรายการแล้ว และคืนยอดล็อกแล้ว');
    window.setTimeout(() => loadItems(status), 400);
  }

  return (
    <main style={pageStyle}>
      <a href="/settings" style={backStyle}>← Settings</a>
      <p style={eyebrowStyle}>Finance Queue</p>
      <h1 style={titleStyle}>Withdrawal Review</h1>
      <p style={mutedStyle}>ตรวจคำขอถอนเงิน ปิดรายการ หรือคืนยอดล็อกให้สมาชิก</p>

      <section style={toolbarStyle}>
        <strong>Pending ในหน้านี้: {pendingCount}</strong>
        <select value={status} onChange={(event) => setStatus(event.target.value)} style={inputStyle}><option value="PENDING">PENDING</option><option value="COMPLETED">COMPLETED</option><option value="REJECTED">REJECTED</option><option value="ALL">ALL</option></select>
        <button type="button" onClick={() => loadItems()} style={buttonStyle}>Refresh</button>
      </section>
      {message && <div style={noticeStyle}>{message}</div>}
      <div style={{ display: 'grid', gap: 14 }}>
        {items.map((item) => {
          const isPending = item.status === 'PENDING';
          return <section key={item.id} style={cardStyle}><div style={topRowStyle}><div><span style={badgeStyle}>{item.status}</span><h2 style={amountStyle}>{item.currency} {Number(item.amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</h2><p style={mutedStyle}>Member: {item.user?.username ?? item.userId}</p><p style={mutedStyle}>Method: {item.method ?? '-'}</p><p style={mutedStyle}>Created: {new Date(item.createdAt).toLocaleString('th-TH')}</p></div><div style={accountBoxStyle}><strong>Account</strong><p style={mutedStyle}>{item.accountName || '-'}</p><p style={mutedStyle}>{item.bankName || '-'} / {item.accountNumber || '-'}</p><p style={mutedStyle}>Note: {item.note || '-'}</p></div></div>{isPending ? <><label style={labelStyle}>Admin note<textarea value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} placeholder="หมายเหตุสำหรับรายการนี้" style={{ ...inputStyle, minHeight: 92 }} /></label><div style={actionRowStyle}><button type="button" disabled={busyId === item.id} onClick={() => reviewItem(item.id, 'complete')} style={confirmButtonStyle}>{busyId === item.id ? 'กำลังทำ...' : 'จ่ายแล้ว / สำเร็จ'}</button><button type="button" disabled={busyId === item.id} onClick={() => reviewItem(item.id, 'reject')} style={declineButtonStyle}>ไม่อนุมัติ / คืนยอด</button></div></> : <div style={doneBoxStyle}>รายการนี้ตรวจสอบแล้ว ไม่ต้องกดซ้ำ</div>}</section>;
        })}
        {items.length === 0 && <div style={noticeStyle}>ยังไม่มีรายการ</div>}
      </div>
    </main>
  );
}

const pageStyle = { maxWidth: 1160, margin: '0 auto', padding: '22px 16px 44px', color: '#fff' } as const;
const backStyle = { color: '#f5c542', textDecoration: 'none', fontWeight: 900 } as const;
const eyebrowStyle = { margin: '18px 0 0', opacity: 0.66, fontSize: 14 } as const;
const titleStyle = { margin: '6px 0 8px', fontSize: 'clamp(36px, 10vw, 68px)', lineHeight: 0.96, letterSpacing: -1.4 } as const;
const mutedStyle = { margin: 0, opacity: 0.76, lineHeight: 1.55 } as const;
const toolbarStyle = { display: 'grid', gridTemplateColumns: '1fr minmax(180px, 260px) auto', gap: 10, alignItems: 'center', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 24, padding: 16, margin: '18px 0', background: '#181818' } as const;
const cardStyle = { border: '1px solid rgba(255,255,255,0.12)', borderRadius: 24, padding: 16, background: '#181818', display: 'grid', gap: 14 } as const;
const inputStyle = { display: 'block', width: '100%', padding: '13px 14px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.16)', background: '#242424', color: '#fff', marginTop: 6, boxSizing: 'border-box' } as const;
const buttonStyle = { padding: '13px 14px', borderRadius: 14, cursor: 'pointer', background: '#f5c542', color: '#111', border: 0, fontWeight: 900 } as const;
const confirmButtonStyle = { padding: '13px 14px', borderRadius: 14, border: 0, cursor: 'pointer', background: '#16a34a', color: '#fff', fontWeight: 900 } as const;
const declineButtonStyle = { padding: '13px 14px', borderRadius: 14, border: 0, cursor: 'pointer', background: '#dc2626', color: '#fff', fontWeight: 900 } as const;
const noticeStyle = { border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16, padding: 12, background: 'rgba(255,255,255,0.07)', marginBottom: 12 } as const;
const topRowStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 } as const;
const badgeStyle = { display: 'inline-block', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 999, padding: '6px 10px', fontSize: 12, fontWeight: 900, background: 'rgba(255,255,255,0.06)' } as const;
const amountStyle = { margin: '10px 0 4px', fontSize: 'clamp(28px, 8vw, 42px)', lineHeight: 1 } as const;
const accountBoxStyle = { border: '1px solid rgba(255,255,255,0.10)', borderRadius: 18, padding: 14, background: 'rgba(255,255,255,0.04)' } as const;
const labelStyle = { display: 'grid', gap: 6, fontWeight: 800 } as const;
const actionRowStyle = { display: 'flex', gap: 10, flexWrap: 'wrap' } as const;
const doneBoxStyle = { border: '1px solid rgba(255,255,255,0.10)', borderRadius: 16, padding: 12, background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.72)', fontWeight: 800 } as const;
