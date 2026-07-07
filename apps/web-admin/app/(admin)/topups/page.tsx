'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminEmpty, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminRow, AdminStack, AdminToolbar, formatMoney } from '../_components/admin-ui';

type TopUpItem = { id: string; userId: string; amount: string; currency: string; status: string; method?: string | null; note?: string | null; adminNote?: string | null; reviewedAt?: string | null; claimedBy?: string | null; claimedAt?: string | null; createdAt: string; user?: { id: string; username: string; phone?: string | null; email?: string | null } };
type Proof = { userNote: string; slipImageData: string; slipImageName: string; slipFileId: string; receivingBank?: { bankName?: string; accountName?: string; accountNumber?: string }; receivingBankAccountId?: string };

export default function AdminTopUpsPage() {
  const [items, setItems] = useState<TopUpItem[]>([]);
  const [status, setStatus] = useState('PENDING');
  const [message, setMessage] = useState('');
  const [reviewNote, setReviewNote] = useState('');
  const [busyId, setBusyId] = useState('');
  const [slips, setSlips] = useState<Record<string, { dataUrl: string; name: string }>>({});

  useEffect(() => { loadItems(status); }, [status]);
  useEffect(() => { loadPrivateSlips(items); }, [items]);
  const counts = useMemo(() => ({ pending: items.filter((item) => item.status === 'PENDING').length, claimed: items.filter((item) => item.claimedBy).length, total: items.length }), [items]);

  async function loadItems(nextStatus = status) {
    setMessage('กำลังโหลดรายการ...');
    const query = nextStatus === 'ALL' ? '' : `?status=${nextStatus}`;
    const res = await adminApiFetch(`/admin/topups${query}`);
    const data = await res.json().catch(() => null);
    if (!res.ok) { setMessage(data?.message ?? 'โหลดรายการไม่สำเร็จ'); return; }
    setItems(data.items ?? []); setMessage('');
  }

  async function loadPrivateSlips(nextItems: TopUpItem[]) {
    const targets = nextItems.filter((item) => parseProofNote(item.note).slipFileId && !slips[item.id]);
    await Promise.all(targets.map(async (item) => { const res = await adminApiFetch(`/admin/topups/${item.id}/slip`); const data = await res.json().catch(() => null); if (res.ok && data?.dataUrl) setSlips((current) => ({ ...current, [item.id]: { dataUrl: data.dataUrl, name: data.slipImageName ?? 'proof' } })); }));
  }

  async function queueAction(id: string, action: 'claim' | 'release') {
    setBusyId(id); setMessage(action === 'claim' ? 'กำลังรับงาน...' : 'กำลังปล่อยงาน...');
    const res = await adminApiFetch(`/admin/topups/${id}/${action}`, { method: 'POST' });
    const data = await res.json().catch(() => null); setBusyId('');
    if (!res.ok) { setMessage(data?.message ?? 'ทำรายการไม่สำเร็จ'); return; }
    setItems((current) => current.map((item) => item.id === id ? { ...item, ...data } : item));
    setMessage(action === 'claim' ? 'รับงานแล้ว' : 'ปล่อยงานแล้ว');
  }

  async function reviewItem(id: string, action: 'confirm' | 'decline') {
    const current = items.find((item) => item.id === id);
    if (!current?.claimedBy) { setMessage('ต้องกดรับงานก่อนตรวจรายการ'); return; }
    const nextStatus = action === 'confirm' ? 'APPROVED' : 'REJECTED';
    const ok = window.confirm(action === 'confirm' ? `ยืนยันอนุมัติ topup ${formatMoney(current.amount)} ให้ ${current.user?.username ?? current.userId}?` : `ยืนยันปฏิเสธ topup ${formatMoney(current.amount)} ของ ${current.user?.username ?? current.userId}?`);
    if (!ok) return;
    setBusyId(id); setMessage(action === 'confirm' ? 'กำลังอนุมัติ...' : 'กำลังปฏิเสธ...');
    const res = await adminApiFetch(`/admin/topups/${id}/${action}`, { method: 'POST', body: JSON.stringify({ adminNote: reviewNote }) });
    const data = await res.json().catch(() => null); setBusyId('');
    if (!res.ok) { setMessage(data?.message ?? 'ทำรายการไม่สำเร็จ'); return; }
    const updated = data?.item ?? data?.topup ?? data;
    setItems((currentItems) => { const patched = currentItems.map((item) => (item.id === id ? { ...item, ...updated, status: updated?.status ?? nextStatus, adminNote: updated?.adminNote ?? reviewNote } : item)); return status === 'PENDING' ? patched.filter((item) => item.id !== id) : patched; });
    setReviewNote(''); setMessage(action === 'confirm' ? 'อนุมัติสำเร็จ' : 'ปฏิเสธรายการแล้ว');
  }

  return <AdminPage eyebrow="Queue" title="Top-up Review" description="รับงาน ตรวจหลักฐาน และอนุมัติรายการเติมเงิน" actions={<AdminButton onClick={() => loadItems()}>Refresh</AdminButton>}><AdminMetricGrid><AdminMetric title="Pending" value={`${counts.pending}`} /><AdminMetric title="Claimed" value={`${counts.claimed}`} /><AdminMetric title="Loaded" value={`${counts.total}`} /></AdminMetricGrid><AdminToolbar><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="PENDING">Pending</option><option value="APPROVED">Approved</option><option value="REJECTED">Rejected</option><option value="ALL">All</option></select></AdminToolbar>{message && <AdminNotice>{message}</AdminNotice>}<AdminStack>{items.map((item) => { const proof = parseProofNote(item.note); const proofImage = proof.slipImageData ? { dataUrl: proof.slipImageData, name: proof.slipImageName } : slips[item.id]; const pending = item.status === 'PENDING'; return <AdminCard key={item.id}><AdminRow><div><AdminBadge tone={item.status === 'APPROVED' ? 'success' : item.status === 'REJECTED' ? 'danger' : 'warning'}>{item.status}</AdminBadge>{item.claimedBy && <AdminBadge>CLAIMED</AdminBadge>}<h2 style={{ margin: '10px 0 4px', fontSize: 32 }}>{formatMoney(item.amount)}</h2><p>Member: {item.user?.username ?? item.userId}</p><p>Method: {item.method ?? '-'}</p><p>Receiving: {proof.receivingBank?.bankName ?? '-'} / {proof.receivingBank?.accountNumber ?? '-'}</p><p>{new Date(item.createdAt).toLocaleString('th-TH')}</p></div><div style={{ minWidth: 260 }}>{pending ? <><div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}><AdminButton disabled={busyId === item.id} onClick={() => queueAction(item.id, 'claim')}>Claim</AdminButton><AdminButton tone="secondary" disabled={busyId === item.id || !item.claimedBy} onClick={() => queueAction(item.id, 'release')}>Release</AdminButton></div><label style={{ display: 'grid', gap: 6, fontWeight: 800 }}>Note<textarea value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} style={{ minHeight: 88 }} /></label><div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 10 }}><AdminButton disabled={busyId === item.id || !item.claimedBy} onClick={() => reviewItem(item.id, 'confirm')} tone="success">Approve</AdminButton><AdminButton disabled={busyId === item.id || !item.claimedBy} onClick={() => reviewItem(item.id, 'decline')} tone="danger">Reject</AdminButton></div></> : <AdminNotice>Reviewed: {item.status}</AdminNotice>}</div></AdminRow><div style={{ borderTop: '1px solid rgba(148,163,184,.18)', paddingTop: 14 }}>{proofImage?.dataUrl ? <img src={proofImage.dataUrl} alt="proof" style={proofStyle} /> : <p>{proof.slipFileId ? 'กำลังโหลดหลักฐาน...' : 'ไม่มีหลักฐาน'}</p>}{proof.userNote && <p>Member note: {proof.userNote}</p>}{item.adminNote && <p>Admin note: {item.adminNote}</p>}</div></AdminCard>; })}{items.length === 0 && <AdminEmpty>ไม่มีรายการ</AdminEmpty>}</AdminStack></AdminPage>;
}

function parseProofNote(value?: string | null): Proof { if (!value) return { userNote: '', slipImageData: '', slipImageName: '', slipFileId: '' }; try { const data = JSON.parse(value); return { userNote: typeof data.userNote === 'string' ? data.userNote : '', slipImageData: typeof data.slipImageData === 'string' ? data.slipImageData : '', slipImageName: typeof data.slipImageName === 'string' ? data.slipImageName : '', slipFileId: typeof data.slipFileId === 'string' ? data.slipFileId : '', receivingBank: data.receivingBank, receivingBankAccountId: data.receivingBankAccountId }; } catch { return { userNote: value, slipImageData: '', slipImageName: '', slipFileId: '' }; } }
const proofStyle = { width: '100%', maxWidth: 420, borderRadius: 14, border: '1px solid rgba(148,163,184,.22)' } as const;
