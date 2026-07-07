'use client';

import { useEffect, useMemo, useState } from 'react';
import { AdminBadge, AdminButton, AdminCard, AdminEmpty, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminRow, AdminStack, AdminToolbar, formatMoney } from '../_components/admin-ui';

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
    setItems((current) => { const patched = current.map((item) => (item.id === id ? { ...item, ...updated, status: updated?.status ?? nextStatus, adminNote: updated?.adminNote ?? reviewNote } : item)); return status === 'PENDING' ? patched.filter((item) => item.id !== id) : patched; });
    setReviewNote(''); setMessage(action === 'complete' ? 'ทำรายการสำเร็จ รายการถูกย้ายออกจากคิว PENDING แล้ว' : 'ปฏิเสธรายการแล้ว และคืนยอดล็อกแล้ว');
    window.setTimeout(() => loadItems(status), 400);
  }

  return (
    <AdminPage eyebrow="Finance Queue" title="Withdrawal Review" description="ตรวจคำขอถอนเงิน ปิดรายการ หรือคืนยอดล็อกให้สมาชิก" actions={<AdminButton onClick={() => loadItems()}>Refresh</AdminButton>}>
      <AdminMetricGrid><AdminMetric title="Pending ในหน้านี้" value={`${pendingCount}`} /><AdminMetric title="Total loaded" value={`${items.length}`} /><AdminMetric title="Status filter" value={status} /></AdminMetricGrid>
      <AdminToolbar><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="PENDING">PENDING</option><option value="COMPLETED">COMPLETED</option><option value="REJECTED">REJECTED</option><option value="ALL">ALL</option></select></AdminToolbar>
      {message && <AdminNotice>{message}</AdminNotice>}
      <AdminStack>{items.map((item) => { const isPending = item.status === 'PENDING'; return <AdminCard key={item.id}><AdminRow><div><AdminBadge tone={item.status === 'COMPLETED' ? 'success' : item.status === 'REJECTED' ? 'danger' : 'warning'}>{item.status}</AdminBadge><h2 style={{ margin: '10px 0 4px', fontSize: 34 }}>{formatMoney(item.amount)}</h2><p>Member: {item.user?.username ?? item.userId}</p><p>Method: {item.method ?? '-'}</p><p>Created: {new Date(item.createdAt).toLocaleString('th-TH')}</p></div><div><strong>Account</strong><p>{item.accountName || '-'}</p><p>{item.bankName || '-'} / {item.accountNumber || '-'}</p><p>Note: {item.note || '-'}</p></div></AdminRow>{isPending ? <><label style={{ display: 'grid', gap: 6, fontWeight: 800 }}>Admin note<textarea value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} placeholder="หมายเหตุสำหรับรายการนี้" style={{ minHeight: 92 }} /></label><div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}><AdminButton disabled={busyId === item.id} onClick={() => reviewItem(item.id, 'complete')} tone="success">{busyId === item.id ? 'กำลังทำ...' : 'จ่ายแล้ว / สำเร็จ'}</AdminButton><AdminButton disabled={busyId === item.id} onClick={() => reviewItem(item.id, 'reject')} tone="danger">ไม่อนุมัติ / คืนยอด</AdminButton></div></> : <AdminNotice>รายการนี้ตรวจสอบแล้ว ไม่ต้องกดซ้ำ</AdminNotice>}</AdminCard>; })}{items.length === 0 && <AdminEmpty>ยังไม่มีรายการ</AdminEmpty>}</AdminStack>
    </AdminPage>
  );
}
