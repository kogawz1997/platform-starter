'use client';

import { useEffect, useMemo, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

type TopUpItem = { id: string; userId: string; amount: string; currency: string; status: string; method?: string | null; note?: string | null; adminNote?: string | null; reviewedAt?: string | null; createdAt: string; user?: { id: string; username: string; phone?: string | null; email?: string | null } };
type Proof = { userNote: string; slipImageData: string; slipImageName: string };

export default function AdminTopUpsPage() {
  const [items, setItems] = useState<TopUpItem[]>([]);
  const [status, setStatus] = useState('PENDING');
  const [message, setMessage] = useState('');
  const [reviewNote, setReviewNote] = useState('');
  const [busyId, setBusyId] = useState('');

  useEffect(() => { loadItems(status); }, [status]);
  const counts = useMemo(() => ({ pending: items.filter((item) => item.status === 'PENDING').length, total: items.length }), [items]);

  async function loadItems(nextStatus = status) {
    const token = window.localStorage.getItem('admin_access_token');
    if (!token) { setMessage('กรุณา login admin ก่อน'); return; }
    setMessage('กำลังโหลดรายการ...');
    const query = nextStatus === 'ALL' ? '' : `?status=${nextStatus}`;
    const res = await fetch(`${API_URL}/admin/topups${query}`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json().catch(() => null);
    if (!res.ok) { setMessage(data?.message ?? 'โหลดรายการไม่สำเร็จ'); return; }
    setItems(data.items ?? []); setMessage('');
  }

  async function reviewItem(id: string, action: 'confirm' | 'decline') {
    const token = window.localStorage.getItem('admin_access_token');
    if (!token) { setMessage('กรุณา login admin ก่อน'); return; }
    setBusyId(id); setMessage(action === 'confirm' ? 'กำลังอนุมัติรายการ...' : 'กำลังปฏิเสธรายการ...');
    const res = await fetch(`${API_URL}/admin/topups/${id}/${action}`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ adminNote: reviewNote }) });
    const data = await res.json().catch(() => null); setBusyId('');
    if (!res.ok) { setMessage(data?.message ?? 'ทำรายการไม่สำเร็จ'); return; }
    setItems((current) => current.map((item) => (item.id === data.id ? { ...item, ...data } : item))); setReviewNote('');
    setMessage(action === 'confirm' ? 'อนุมัติสำเร็จ ยอดถูกเพิ่มเข้า wallet แล้ว' : 'ปฏิเสธรายการแล้ว');
  }

  return (
    <main style={pageStyle}>
      <a href="/settings" style={backStyle}>← Settings</a>
      <p style={eyebrowStyle}>Finance Queue</p>
      <h1 style={titleStyle}>Top Up Review</h1>
      <p style={mutedStyle}>ตรวจสลิป เติมยอด และจัดการคำขอเติมเงินของสมาชิก</p>

      <section style={toolbarStyle}>
        <strong>Pending ในหน้านี้: {counts.pending}</strong>
        <select value={status} onChange={(event) => setStatus(event.target.value)} style={inputStyle}><option value="PENDING">PENDING</option><option value="APPROVED">APPROVED</option><option value="REJECTED">REJECTED</option><option value="ALL">ALL</option></select>
        <button type="button" onClick={() => loadItems()} style={buttonStyle}>Refresh</button>
      </section>
      {message && <div style={noticeStyle}>{message}</div>}
      <div style={{ display: 'grid', gap: 14 }}>
        {items.map((item) => { const proof = parseProofNote(item.note); const isPending = item.status === 'PENDING'; return <section key={item.id} style={cardStyle}><div style={topRowStyle}><div><span style={badgeStyle}>{item.status}</span><h2 style={amountStyle}>{item.currency} {Number(item.amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</h2><p style={mutedStyle}>Member: {item.user?.username ?? item.userId}</p><p style={mutedStyle}>Method: {item.method ?? '-'}</p><p style={mutedStyle}>Created: {new Date(item.createdAt).toLocaleString('th-TH')}</p></div><div style={reviewBoxStyle}><label style={labelStyle}>Admin note<textarea value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} placeholder="หมายเหตุสำหรับรายการนี้" style={{ ...inputStyle, minHeight: 92 }} /></label><div style={actionRowStyle}><button type="button" disabled={!isPending || busyId === item.id} onClick={() => reviewItem(item.id, 'confirm')} style={confirmButtonStyle}>{busyId === item.id ? 'กำลังทำ...' : 'อนุมัติ'}</button><button type="button" disabled={!isPending || busyId === item.id} onClick={() => reviewItem(item.id, 'decline')} style={declineButtonStyle}>ไม่อนุมัติ</button></div></div></div><div style={proofBoxStyle}><strong>สลิปที่แนบ</strong>{proof.slipImageData ? <div style={{ marginTop: 10 }}><img src={proof.slipImageData} alt="top up slip" style={slipStyle} /><p style={mutedStyle}>{proof.slipImageName || 'slip image'}</p></div> : <p style={mutedStyle}>ไม่มีสลิป</p>}<p style={mutedStyle}>Member note: {proof.userNote || '-'}</p>{item.adminNote && <p style={mutedStyle}>Previous admin note: {item.adminNote}</p>}</div></section>; })}
        {items.length === 0 && <div style={noticeStyle}>ยังไม่มีรายการ</div>}
      </div>
    </main>
  );
}

function parseProofNote(value?: string | null): Proof { if (!value) return { userNote: '', slipImageData: '', slipImageName: '' }; try { const data = JSON.parse(value); return { userNote: typeof data.userNote === 'string' ? data.userNote : '', slipImageData: typeof data.slipImageData === 'string' ? data.slipImageData : '', slipImageName: typeof data.slipImageName === 'string' ? data.slipImageName : '' }; } catch { return { userNote: value, slipImageData: '', slipImageName: '' }; } }

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
const reviewBoxStyle = { border: '1px solid rgba(255,255,255,0.10)', borderRadius: 18, padding: 14, background: 'rgba(255,255,255,0.04)' } as const;
const proofBoxStyle = { borderTop: '1px solid rgba(255,255,255,0.10)', paddingTop: 14 } as const;
const labelStyle = { display: 'grid', gap: 6, fontWeight: 800 } as const;
const actionRowStyle = { display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 10 } as const;
const slipStyle = { width: '100%', maxWidth: 420, borderRadius: 18, border: '1px solid rgba(255,255,255,0.14)' } as const;
