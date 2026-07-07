'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminConfirmDialog, ConfirmDetailRow } from '../_components/admin-confirm-dialog';
import { AdminBadge, AdminButton, AdminCard, AdminEmpty, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminRow, AdminStack, AdminToolbar, formatMoney } from '../_components/admin-ui';

type WithdrawalItem = { id: string; userId: string; amount: string; currency: string; status: string; method?: string | null; accountName?: string | null; accountNumber?: string | null; bankName?: string | null; note?: string | null; adminNote?: string | null; claimedBy?: string | null; claimedAt?: string | null; createdAt: string; user?: { id: string; username: string; phone?: string | null; email?: string | null } };
type PendingAction = { id: string; action: 'complete' | 'reject' } | null;

export default function AdminWithdrawalsPage() {
  const [items, setItems] = useState<WithdrawalItem[]>([]);
  const [status, setStatus] = useState('PENDING');
  const [message, setMessage] = useState('');
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState('');
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

  useEffect(() => { loadItems(status); }, [status]);
  const counts = useMemo(() => ({ pending: items.filter((item) => item.status === 'PENDING').length, claimed: items.filter((item) => item.claimedBy).length }), [items]);
  const pendingItem = pendingAction ? items.find((item) => item.id === pendingAction.id) ?? null : null;
  const pendingNote = pendingAction ? (reviewNotes[pendingAction.id] ?? '').trim() : '';

  async function loadItems(nextStatus = status) {
    setMessage('กำลังโหลดรายการ...');
    const query = nextStatus === 'ALL' ? '' : `?status=${nextStatus}`;
    const res = await adminApiFetch(`/admin/withdrawals${query}`);
    const data = await res.json().catch(() => null);
    if (!res.ok) { setMessage(data?.message ?? 'โหลดรายการไม่สำเร็จ'); return; }
    setItems(data.items ?? []); setMessage('');
  }

  async function queueAction(id: string, action: 'claim' | 'release') {
    setBusyId(id); setMessage(action === 'claim' ? 'กำลัง claim รายการ...' : 'กำลังปล่อยรายการ...');
    const res = await adminApiFetch(`/admin/withdrawals/${id}/${action}`, { method: 'POST' });
    const data = await res.json().catch(() => null); setBusyId('');
    if (!res.ok) { setMessage(data?.message ?? 'ทำรายการไม่สำเร็จ'); return; }
    setItems((current) => current.map((item) => item.id === id ? { ...item, ...data } : item));
    setMessage(action === 'claim' ? 'Claim รายการแล้ว' : 'ปล่อยรายการแล้ว');
  }

  function setItemNote(id: string, value: string) {
    setReviewNotes((current) => ({ ...current, [id]: value }));
  }

  function requestReview(id: string, action: 'complete' | 'reject') {
    const current = items.find((item) => item.id === id);
    if (!current?.claimedBy) { setMessage('ต้องกด Claim ก่อนตรวจรายการ'); return; }
    if (action === 'reject' && !(reviewNotes[id] ?? '').trim()) { setMessage('กรุณาใส่เหตุผลก่อนปฏิเสธรายการถอน'); return; }
    setPendingAction({ id, action });
  }

  async function reviewItem(id: string, action: 'complete' | 'reject') {
    const current = items.find((item) => item.id === id);
    const note = (reviewNotes[id] ?? '').trim();
    if (!current?.claimedBy) { setMessage('ต้องกด Claim ก่อนตรวจรายการ'); return; }
    if (action === 'reject' && !note) { setMessage('กรุณาใส่เหตุผลก่อนปฏิเสธรายการถอน'); return; }
    const nextStatus = action === 'complete' ? 'COMPLETED' : 'REJECTED';
    setBusyId(id); setMessage(action === 'complete' ? 'กำลังปิดรายการถอน...' : 'กำลังปฏิเสธรายการ...');
    const res = await adminApiFetch(`/admin/withdrawals/${id}/${action}`, { method: 'POST', body: JSON.stringify({ adminNote: note }) });
    const data = await res.json().catch(() => null); setBusyId('');
    if (!res.ok) { setMessage(data?.message ?? 'ทำรายการไม่สำเร็จ'); return; }
    const updated = data?.item ?? data?.withdrawal ?? data;
    setItems((current) => { const patched = current.map((item) => (item.id === id ? { ...item, ...updated, status: updated?.status ?? nextStatus, adminNote: updated?.adminNote ?? note } : item)); return status === 'PENDING' ? patched.filter((item) => item.id !== id) : patched; });
    setReviewNotes((current) => { const next = { ...current }; delete next[id]; return next; });
    setPendingAction(null); setMessage(action === 'complete' ? 'ทำรายการสำเร็จ รายการถูกย้ายออกจากคิว PENDING แล้ว' : 'ปฏิเสธรายการแล้ว และคืนยอดล็อกแล้ว');
    window.setTimeout(() => loadItems(status), 400);
  }

  return (
    <AdminPage eyebrow="Finance Queue" title="Withdrawal Review" description="ตรวจคำขอถอนเงิน ปิดรายการ หรือคืนยอดล็อกให้สมาชิก" actions={<AdminButton onClick={() => loadItems()}>Refresh</AdminButton>}>
      <AdminMetricGrid><AdminMetric title="Pending ในหน้านี้" value={`${counts.pending}`} /><AdminMetric title="Claimed" value={`${counts.claimed}`} /><AdminMetric title="Total loaded" value={`${items.length}`} /><AdminMetric title="Status filter" value={status} /></AdminMetricGrid>
      <AdminToolbar><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="PENDING">PENDING</option><option value="COMPLETED">COMPLETED</option><option value="REJECTED">REJECTED</option><option value="ALL">ALL</option></select></AdminToolbar>
      {message && <AdminNotice>{message}</AdminNotice>}
      <AdminStack>{items.map((item) => { const isPending = item.status === 'PENDING'; const itemNote = reviewNotes[item.id] ?? ''; return <AdminCard key={item.id}><AdminRow><div><AdminBadge tone={item.status === 'COMPLETED' ? 'success' : item.status === 'REJECTED' ? 'danger' : 'warning'}>{item.status}</AdminBadge>{item.claimedBy && <AdminBadge tone="neutral">CLAIMED</AdminBadge>}<h2 style={{ margin: '10px 0 4px', fontSize: 34 }}>{formatMoney(item.amount)}</h2><p>Member: {item.user?.username ?? item.userId}</p><p>Method: {item.method ?? '-'}</p><p>Created: {new Date(item.createdAt).toLocaleString('th-TH')}</p>{item.claimedAt && <p>Claimed: {new Date(item.claimedAt).toLocaleString('th-TH')}</p>}</div><div><strong>Account</strong><p>{item.accountName || '-'}</p><p>{item.bankName || '-'} / {item.accountNumber || '-'}</p><p>Note: {item.note || '-'}</p></div></AdminRow>{isPending ? <><div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}><AdminButton disabled={busyId === item.id} onClick={() => queueAction(item.id, 'claim')}>Claim</AdminButton><AdminButton disabled={busyId === item.id || !item.claimedBy} onClick={() => queueAction(item.id, 'release')}>Release</AdminButton></div><label style={{ display: 'grid', gap: 6, fontWeight: 800 }}>Admin note<textarea value={itemNote} onChange={(event) => setItemNote(item.id, event.target.value)} placeholder="จำเป็นเมื่อไม่อนุมัติ / คืนยอด" style={{ minHeight: 92 }} /></label><div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}><AdminButton disabled={busyId === item.id || !item.claimedBy} onClick={() => requestReview(item.id, 'complete')} tone="success">จ่ายแล้ว / สำเร็จ</AdminButton><AdminButton disabled={busyId === item.id || !item.claimedBy} onClick={() => requestReview(item.id, 'reject')} tone="danger">ไม่อนุมัติ / คืนยอด</AdminButton></div></> : <AdminNotice>รายการนี้ตรวจสอบแล้ว ไม่ต้องกดซ้ำ</AdminNotice>}</AdminCard>; })}{items.length === 0 && <AdminEmpty>ยังไม่มีรายการ</AdminEmpty>}</AdminStack>
      <AdminConfirmDialog open={Boolean(pendingAction && pendingItem)} tone={pendingAction?.action === 'complete' ? 'success' : 'danger'} title={pendingAction?.action === 'complete' ? 'ยืนยันปิดรายการถอน' : 'ยืนยันปฏิเสธรายการถอน'} description={pendingAction?.action === 'complete' ? 'ยืนยันเฉพาะเมื่อจ่ายเงินจริงให้สมาชิกแล้วเท่านั้น' : 'รายการนี้จะถูกปฏิเสธและคืนยอด locked balance ให้สมาชิก'} confirmLabel={pendingAction?.action === 'complete' ? 'ยืนยันว่าจ่ายแล้ว' : 'ยืนยันคืนยอด'} loading={Boolean(busyId)} onCancel={() => setPendingAction(null)} onConfirm={() => pendingAction && reviewItem(pendingAction.id, pendingAction.action)} details={pendingItem && <><ConfirmDetailRow label="Member" value={pendingItem.user?.username ?? pendingItem.userId} /><ConfirmDetailRow label="Amount" value={formatMoney(pendingItem.amount)} /><ConfirmDetailRow label="Bank" value={`${pendingItem.bankName ?? '-'} / ${pendingItem.accountNumber ?? '-'}`} /><ConfirmDetailRow label="Note" value={pendingNote || '-'} />{pendingAction?.action === 'reject' && <ConfirmDetailRow label="Required" value="Reject ต้องมีเหตุผล" />}</>} />
    </AdminPage>
  );
}
