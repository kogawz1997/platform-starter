'use client';

import { useEffect, useMemo, useState } from 'react';
import { AdminBadge, AdminButton, AdminCard, AdminEmpty, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminRow, AdminStack, AdminToolbar, formatMoney } from '../_components/admin-ui';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

type TopUpItem = { id: string; userId: string; amount: string; currency: string; status: string; method?: string | null; note?: string | null; adminNote?: string | null; reviewedAt?: string | null; createdAt: string; user?: { id: string; username: string; phone?: string | null; email?: string | null } };
type Proof = { userNote: string; slipImageData: string; slipImageName: string; slipFileId: string };

export default function AdminTopUpsPage() {
  const [items, setItems] = useState<TopUpItem[]>([]);
  const [status, setStatus] = useState('PENDING');
  const [message, setMessage] = useState('');
  const [reviewNote, setReviewNote] = useState('');
  const [busyId, setBusyId] = useState('');
  const [slips, setSlips] = useState<Record<string, { dataUrl: string; name: string }>>({});

  useEffect(() => { loadItems(status); }, [status]);
  useEffect(() => { loadPrivateSlips(items); }, [items]);
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

  async function loadPrivateSlips(nextItems: TopUpItem[]) {
    const token = window.localStorage.getItem('admin_access_token');
    if (!token) return;
    const targets = nextItems.filter((item) => parseProofNote(item.note).slipFileId && !slips[item.id]);
    await Promise.all(targets.map(async (item) => {
      const res = await fetch(`${API_URL}/admin/topups/${item.id}/slip`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.dataUrl) setSlips((current) => ({ ...current, [item.id]: { dataUrl: data.dataUrl, name: data.slipImageName ?? 'slip' } }));
    }));
  }

  async function reviewItem(id: string, action: 'confirm' | 'decline') {
    const token = window.localStorage.getItem('admin_access_token');
    if (!token) { setMessage('กรุณา login admin ก่อน'); return; }
    const nextStatus = action === 'confirm' ? 'APPROVED' : 'REJECTED';
    setBusyId(id); setMessage(action === 'confirm' ? 'กำลังอนุมัติรายการ...' : 'กำลังปฏิเสธรายการ...');
    const res = await fetch(`${API_URL}/admin/topups/${id}/${action}`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ adminNote: reviewNote }) });
    const data = await res.json().catch(() => null); setBusyId('');
    if (!res.ok) { setMessage(data?.message ?? 'ทำรายการไม่สำเร็จ'); return; }
    const updated = data?.item ?? data?.topup ?? data;
    setItems((current) => { const patched = current.map((item) => (item.id === id ? { ...item, ...updated, status: updated?.status ?? nextStatus, adminNote: updated?.adminNote ?? reviewNote } : item)); return status === 'PENDING' ? patched.filter((item) => item.id !== id) : patched; });
    setReviewNote(''); setMessage(action === 'confirm' ? 'อนุมัติสำเร็จ ย้ายรายการออกจากคิว pending แล้ว' : 'ปฏิเสธรายการแล้ว ย้ายออกจากคิว pending แล้ว');
    window.setTimeout(() => loadItems(status), 400);
  }

  return (
    <AdminPage eyebrow="Finance Queue" title="Top Up Review" description="ตรวจสลิป เติมยอด และจัดการคำขอเติมเงินของสมาชิก" actions={<AdminButton onClick={() => loadItems()}>Refresh</AdminButton>}>
      <AdminMetricGrid><AdminMetric title="Pending ในหน้านี้" value={`${counts.pending}`} /><AdminMetric title="Total loaded" value={`${counts.total}`} /><AdminMetric title="Status filter" value={status} /></AdminMetricGrid>
      <AdminToolbar><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="PENDING">PENDING</option><option value="APPROVED">APPROVED</option><option value="REJECTED">REJECTED</option><option value="ALL">ALL</option></select></AdminToolbar>
      {message && <AdminNotice>{message}</AdminNotice>}
      <AdminStack>{items.map((item) => { const proof = parseProofNote(item.note); const slip = proof.slipImageData ? { dataUrl: proof.slipImageData, name: proof.slipImageName } : slips[item.id]; const isPending = item.status === 'PENDING'; return <AdminCard key={item.id}><AdminRow><div><AdminBadge tone={item.status === 'APPROVED' ? 'success' : item.status === 'REJECTED' ? 'danger' : 'warning'}>{item.status}</AdminBadge><h2 style={{ margin: '10px 0 4px', fontSize: 34 }}>{formatMoney(item.amount)}</h2><p>Member: {item.user?.username ?? item.userId}</p><p>Method: {item.method ?? '-'}</p><p>Created: {new Date(item.createdAt).toLocaleString('th-TH')}</p></div><div style={{ minWidth: 260 }}>{isPending ? <><label style={{ display: 'grid', gap: 6, fontWeight: 800 }}>Admin note<textarea value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} placeholder="หมายเหตุสำหรับรายการนี้" style={{ minHeight: 92 }} /></label><div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 10 }}><AdminButton disabled={busyId === item.id} onClick={() => reviewItem(item.id, 'confirm')} tone="success">{busyId === item.id ? 'กำลังทำ...' : 'อนุมัติ'}</AdminButton><AdminButton disabled={busyId === item.id} onClick={() => reviewItem(item.id, 'decline')} tone="danger">ไม่อนุมัติ</AdminButton></div></> : <AdminNotice>รายการนี้ตรวจแล้ว: {item.status}</AdminNotice>}</div></AdminRow><div style={{ borderTop: '1px solid rgba(148,163,184,.18)', paddingTop: 14 }}><strong>สลิปที่แนบ</strong>{slip?.dataUrl ? <div style={{ marginTop: 10 }}><img src={slip.dataUrl} alt="top up slip" style={slipStyle} /><p>{slip.name || 'slip image'} {proof.slipFileId ? '(private)' : ''}</p></div> : <p>{proof.slipFileId ? 'กำลังโหลดสลิปส่วนตัว...' : 'ไม่มีสลิป'}</p>}<p>Member note: {proof.userNote || '-'}</p>{item.adminNote && <p>Previous admin note: {item.adminNote}</p>}</div></AdminCard>; })}{items.length === 0 && <AdminEmpty>ยังไม่มีรายการ</AdminEmpty>}</AdminStack>
    </AdminPage>
  );
}

function parseProofNote(value?: string | null): Proof { if (!value) return { userNote: '', slipImageData: '', slipImageName: '', slipFileId: '' }; try { const data = JSON.parse(value); return { userNote: typeof data.userNote === 'string' ? data.userNote : '', slipImageData: typeof data.slipImageData === 'string' ? data.slipImageData : '', slipImageName: typeof data.slipImageName === 'string' ? data.slipImageName : '', slipFileId: typeof data.slipFileId === 'string' ? data.slipFileId : '' }; } catch { return { userNote: value, slipImageData: '', slipImageName: '', slipFileId: '' }; } }
const slipStyle = { width: '100%', maxWidth: 420, borderRadius: 14, border: '1px solid rgba(148,163,184,.22)' } as const;
