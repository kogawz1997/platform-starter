'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminConfirmDialog, ConfirmDetailRow } from '../_components/admin-confirm-dialog';
import { AdminBadge, AdminButton, AdminCard, AdminEmpty, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminSectionRow, AdminStack, AdminToolbar, formatMoney } from '../_components/admin-ui';

type TopUpItem = { id: string; userId: string; amount: string; currency: string; status: string; method?: string | null; note?: string | null; adminNote?: string | null; reviewedAt?: string | null; claimedBy?: string | null; claimedAt?: string | null; createdAt: string; user?: { id: string; username: string; phone?: string | null; email?: string | null } };
type Proof = { userNote: string; slipImageData: string; slipImageName: string; slipFileId: string; receivingBank?: { bankName?: string; accountName?: string; accountNumber?: string }; receivingBankAccountId?: string };
type PendingAction = { id: string; action: 'confirm' | 'decline' } | null;

const PAGE_SIZE = 20;

export default function AdminTopUpsPage() {
  const [items, setItems] = useState<TopUpItem[]>([]);
  const [status, setStatus] = useState('PENDING');
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [total, setTotal] = useState(0);
  const [message, setMessage] = useState('');
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState('');
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [slips, setSlips] = useState<Record<string, { dataUrl: string; name: string }>>({});

  useEffect(() => { loadItems(status, page); }, [status, page]);
  useEffect(() => { loadPrivateSlips(items); }, [items]);

  const counts = useMemo(() => ({ pending: items.filter((item) => item.status === 'PENDING').length, claimed: items.filter((item) => item.claimedBy).length, total: items.length }), [items]);
  const pendingItem = pendingAction ? items.find((item) => item.id === pendingAction.id) ?? null : null;
  const pendingProof = pendingItem ? parseProofNote(pendingItem.note) : null;
  const pendingSlip = pendingItem && pendingProof ? (pendingProof.slipImageData ? { dataUrl: pendingProof.slipImageData, name: pendingProof.slipImageName } : slips[pendingItem.id]) : null;
  const pendingNote = pendingAction ? (reviewNotes[pendingAction.id] ?? '').trim() : '';

  async function loadItems(nextStatus = status, nextPage = page) {
    setMessage('กำลังโหลดรายการ...');
    const params = new URLSearchParams();
    if (nextStatus !== 'ALL') params.set('status', nextStatus);
    params.set('page', String(nextPage));
    params.set('take', String(PAGE_SIZE));
    const res = await adminApiFetch(`/admin/topups?${params.toString()}`);
    const data = await res.json().catch(() => null);
    if (!res.ok) { setMessage(data?.message ?? 'โหลดรายการไม่สำเร็จ'); return; }
    setItems(data.items ?? []);
    setTotal(Number(data.total ?? data.items?.length ?? 0));
    setPageCount(Math.max(Number(data.pageCount ?? 1), 1));
    setMessage('');
  }

  function changeStatus(value: string) {
    setStatus(value);
    setPage(1);
  }

  async function loadPrivateSlips(nextItems: TopUpItem[]) {
    const targets = nextItems.filter((item) => parseProofNote(item.note).slipFileId && !slips[item.id]);
    await Promise.all(targets.map(async (item) => {
      const res = await adminApiFetch(`/admin/topups/${item.id}/slip`);
      const data = await res.json().catch(() => null);
      if (res.ok && data?.dataUrl) setSlips((current) => ({ ...current, [item.id]: { dataUrl: data.dataUrl, name: data.slipImageName ?? 'proof' } }));
    }));
  }

  async function queueAction(id: string, action: 'claim' | 'release') {
    setBusyId(id); setMessage(action === 'claim' ? 'กำลังรับงาน...' : 'กำลังปล่อยงาน...');
    const res = await adminApiFetch(`/admin/topups/${id}/${action}`, { method: 'POST' });
    const data = await res.json().catch(() => null); setBusyId('');
    if (!res.ok) { setMessage(data?.message ?? 'ทำรายการไม่สำเร็จ'); return; }
    setItems((current) => current.map((item) => item.id === id ? { ...item, ...data } : item));
    setMessage(action === 'claim' ? 'รับงานแล้ว' : 'ปล่อยงานแล้ว');
  }

  function setItemNote(id: string, value: string) {
    setReviewNotes((current) => ({ ...current, [id]: value }));
  }

  function requestReview(id: string, action: 'confirm' | 'decline') {
    const current = items.find((item) => item.id === id);
    if (!current?.claimedBy) { setMessage('ต้องกดรับงานก่อนตรวจรายการ'); return; }
    if (action === 'decline' && !(reviewNotes[id] ?? '').trim()) { setMessage('กรุณาใส่เหตุผลก่อนปฏิเสธรายการ'); return; }
    setPendingAction({ id, action });
  }

  async function reviewItem(id: string, action: 'confirm' | 'decline') {
    const current = items.find((item) => item.id === id);
    const note = (reviewNotes[id] ?? '').trim();
    if (!current?.claimedBy) { setMessage('ต้องกดรับงานก่อนตรวจรายการ'); return; }
    if (action === 'decline' && !note) { setMessage('กรุณาใส่เหตุผลก่อนปฏิเสธรายการ'); return; }
    const nextStatus = action === 'confirm' ? 'APPROVED' : 'REJECTED';
    setBusyId(id); setMessage(action === 'confirm' ? 'กำลังอนุมัติ...' : 'กำลังปฏิเสธ...');
    const res = await adminApiFetch(`/admin/topups/${id}/${action}`, { method: 'POST', body: JSON.stringify({ adminNote: note }) });
    const data = await res.json().catch(() => null); setBusyId('');
    if (!res.ok) { setMessage(data?.message ?? 'ทำรายการไม่สำเร็จ'); return; }
    const updated = data?.item ?? data?.topup ?? data;
    setItems((currentItems) => { const patched = currentItems.map((item) => (item.id === id ? { ...item, ...updated, status: updated?.status ?? nextStatus, adminNote: updated?.adminNote ?? note } : item)); return status === 'PENDING' ? patched.filter((item) => item.id !== id) : patched; });
    setReviewNotes((current) => { const next = { ...current }; delete next[id]; return next; });
    setPendingAction(null); setMessage(action === 'confirm' ? 'อนุมัติสำเร็จ' : 'ปฏิเสธรายการแล้ว');
  }

  return <AdminPage eyebrow="Queue" title="Top-up Review" description="รับงาน ตรวจหลักฐาน และอนุมัติรายการเติมเงิน" actions={<AdminButton onClick={() => loadItems()}>Refresh</AdminButton>}>
    <AdminMetricGrid><AdminMetric title="Pending" value={`${counts.pending}`} /><AdminMetric title="Claimed" value={`${counts.claimed}`} /><AdminMetric title="Loaded" value={`${counts.total}`} helper={`${total} total`} /></AdminMetricGrid>
    <AdminToolbar><select value={status} onChange={(event) => changeStatus(event.target.value)} style={selectStyle}><option value="PENDING">Pending</option><option value="APPROVED">Approved</option><option value="REJECTED">Rejected</option><option value="ALL">All</option></select><div style={pagerStyle}><AdminButton disabled={page <= 1} onClick={() => setPage((value) => Math.max(value - 1, 1))}>Prev</AdminButton><span style={pageLabelStyle}>Page {page} / {pageCount}</span><AdminButton disabled={page >= pageCount} onClick={() => setPage((value) => Math.min(value + 1, pageCount))}>Next</AdminButton></div></AdminToolbar>
    {message && <AdminNotice>{message}</AdminNotice>}
    <AdminStack>{items.map((item) => {
      const proof = parseProofNote(item.note);
      const proofImage = proof.slipImageData ? { dataUrl: proof.slipImageData, name: proof.slipImageName } : slips[item.id];
      const pending = item.status === 'PENDING';
      const itemNote = reviewNotes[item.id] ?? '';
      return <AdminCard key={item.id}>
        <AdminSectionRow>
          <div style={summaryStyle}>
            <div style={badgeRowStyle}><AdminBadge tone={item.status === 'APPROVED' ? 'success' : item.status === 'REJECTED' ? 'danger' : 'warning'}>{item.status}</AdminBadge>{item.claimedBy && <AdminBadge>CLAIMED</AdminBadge>}</div>
            <h2 style={amountStyle}>{formatMoney(item.amount)}</h2>
            <p>Member: {item.user?.username ?? item.userId}</p>
            <p>Method: {item.method ?? '-'}</p>
            <p>Created: {new Date(item.createdAt).toLocaleString('th-TH')}</p>
          </div>
          <div style={bankBoxStyle}>
            <strong>Receiving account</strong>
            <span>{proof.receivingBank?.accountName ?? '-'}</span>
            <span>{proof.receivingBank?.bankName ?? '-'}</span>
            <span style={accountNumberStyle}>{proof.receivingBank?.accountNumber ?? '-'}</span>
          </div>
        </AdminSectionRow>

        {pending ? <div style={operationBoxStyle}>
          <div style={actionGridStyle}><AdminButton disabled={busyId === item.id} onClick={() => queueAction(item.id, 'claim')}>Claim</AdminButton><AdminButton tone="secondary" disabled={busyId === item.id || !item.claimedBy} onClick={() => queueAction(item.id, 'release')}>Release</AdminButton></div>
          <label style={noteLabelStyle}>Review note<textarea value={itemNote} onChange={(event) => setItemNote(item.id, event.target.value)} placeholder="จำเป็นเมื่อ Reject" style={textareaStyle} /></label>
          <div style={actionGridStyle}><AdminButton disabled={busyId === item.id || !item.claimedBy} onClick={() => requestReview(item.id, 'confirm')} tone="success">Approve</AdminButton><AdminButton disabled={busyId === item.id || !item.claimedBy} onClick={() => requestReview(item.id, 'decline')} tone="danger">Reject</AdminButton></div>
        </div> : <AdminNotice>Reviewed: {item.status}</AdminNotice>}

        <div style={proofPanelStyle}>{proofImage?.dataUrl ? <img src={proofImage.dataUrl} alt="proof" style={proofStyle} /> : <p>{proof.slipFileId ? 'กำลังโหลดหลักฐาน...' : 'ไม่มีหลักฐาน'}</p>}{proof.userNote && <p>Member note: {proof.userNote}</p>}{item.adminNote && <p>Admin note: {item.adminNote}</p>}</div>
      </AdminCard>;
    })}{items.length === 0 && <AdminEmpty>ไม่มีรายการ</AdminEmpty>}</AdminStack>
    <AdminConfirmDialog open={Boolean(pendingAction && pendingItem)} tone={pendingAction?.action === 'confirm' ? 'success' : 'danger'} title={pendingAction?.action === 'confirm' ? 'ยืนยันอนุมัติ Top-up' : 'ยืนยันปฏิเสธ Top-up'} description={pendingAction?.action === 'confirm' ? 'รายการนี้จะเพิ่มยอดเข้า wallet สมาชิกหลังยืนยัน' : 'รายการนี้จะถูกปฏิเสธและไม่เพิ่มยอดเข้า wallet'} confirmLabel={pendingAction?.action === 'confirm' ? 'ยืนยันอนุมัติ' : 'ยืนยันปฏิเสธ'} loading={Boolean(busyId)} onCancel={() => setPendingAction(null)} onConfirm={() => pendingAction && reviewItem(pendingAction.id, pendingAction.action)} details={pendingItem && <div style={modalDetailsStyle}><ConfirmDetailRow label="Member" value={pendingItem.user?.username ?? pendingItem.userId} /><ConfirmDetailRow label="Amount" value={formatMoney(pendingItem.amount)} /><ConfirmDetailRow label="Method" value={pendingItem.method ?? '-'} /><ConfirmDetailRow label="Receiving" value={`${pendingProof?.receivingBank?.bankName ?? '-'} / ${pendingProof?.receivingBank?.accountNumber ?? '-'}`} /><ConfirmDetailRow label="Note" value={pendingNote || '-'} />{pendingSlip?.dataUrl ? <img src={pendingSlip.dataUrl} alt="slip preview" style={modalSlipStyle} /> : <AdminNotice>ยังไม่มี slip preview ให้ตรวจใน modal</AdminNotice>}{pendingAction?.action === 'decline' && <ConfirmDetailRow label="Required" value="Reject ต้องมีเหตุผล" />}</div>} />
  </AdminPage>;
}

function parseProofNote(value?: string | null): Proof { if (!value) return { userNote: '', slipImageData: '', slipImageName: '', slipFileId: '' }; try { const data = JSON.parse(value); return { userNote: typeof data.userNote === 'string' ? data.userNote : '', slipImageData: typeof data.slipImageData === 'string' ? data.slipImageData : '', slipImageName: typeof data.slipImageName === 'string' ? data.slipImageName : '', slipFileId: typeof data.slipFileId === 'string' ? data.slipFileId : '', receivingBank: data.receivingBank, receivingBankAccountId: data.receivingBankAccountId }; } catch { return { userNote: value, slipImageData: '', slipImageName: '', slipFileId: '' }; } }

const selectStyle = { minHeight: 44, borderRadius: 12, border: '1px solid rgba(148,163,184,.22)', background: '#0b1220', color: '#f8fafc', padding: '0 12px', minWidth: 0, width: '100%' } as const;
const pagerStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(120px, 100%), 1fr))', alignItems: 'center', gap: 10 } as const;
const pageLabelStyle = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontWeight: 850 } as const;
const badgeRowStyle = { display: 'flex', gap: 8, flexWrap: 'wrap' as const };
const summaryStyle = { display: 'grid', gap: 6, minWidth: 0 } as const;
const amountStyle = { margin: '4px 0', fontSize: 'clamp(28px, 7vw, 34px)', lineHeight: 1.05, overflowWrap: 'anywhere' as const };
const bankBoxStyle = { border: '1px solid rgba(245,197,66,.28)', borderRadius: 16, padding: 12, display: 'grid', gap: 5, background: 'rgba(245,197,66,.08)', overflowWrap: 'anywhere' as const, minWidth: 0 };
const accountNumberStyle = { fontSize: 'clamp(18px, 5vw, 22px)', fontWeight: 950, letterSpacing: '.02em', color: '#f5c542', overflowWrap: 'anywhere' as const };
const operationBoxStyle = { display: 'grid', gap: 12, marginTop: 14, minWidth: 0 } as const;
const actionGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(130px, 100%), 1fr))', gap: 10, minWidth: 0 } as const;
const noteLabelStyle = { display: 'grid', gap: 6, fontWeight: 850, minWidth: 0 } as const;
const textareaStyle = { minHeight: 96, borderRadius: 12, border: '1px solid rgba(148,163,184,.22)', background: '#0b1220', color: '#f8fafc', padding: 12, resize: 'vertical' as const, width: '100%', boxSizing: 'border-box' as const };
const proofPanelStyle = { borderTop: '1px solid rgba(148,163,184,.18)', paddingTop: 14, display: 'grid', gap: 10, minWidth: 0 } as const;
const proofStyle = { width: '100%', maxWidth: 520, maxHeight: 520, objectFit: 'contain' as const, borderRadius: 14, border: '1px solid rgba(148,163,184,.22)', background: '#05070a' } as const;
const modalDetailsStyle = { display: 'grid', gap: 10, minWidth: 0 } as const;
const modalSlipStyle = { width: '100%', maxHeight: 320, objectFit: 'contain' as const, borderRadius: 14, border: '1px solid rgba(148,163,184,.22)', background: '#05070a' } as const;
