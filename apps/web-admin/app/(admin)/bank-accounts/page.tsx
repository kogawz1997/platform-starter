'use client';

import { FormEvent, useEffect, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminEmpty, AdminGrid, AdminNotice, AdminPage, AdminRow, AdminStack, AdminToolbar } from '../_components/admin-ui';

type ReceivingAccount = { id: string; bankName: string; accountName: string; accountNumber: string; promptPay?: string | null; qrImageUrl?: string | null; minAmount?: string | null; maxAmount?: string | null; status: string; sortOrder: number };
type MemberBank = { id: string; userId: string; bankName: string; accountName: string; accountNumber: string; isPrimary: boolean; status: string; adminNote?: string | null; user?: { username: string; phone?: string | null; email?: string | null; status: string } };

const blankReceiving = { bankName: '', accountName: '', accountNumber: '', promptPay: '', qrImageUrl: '', minAmount: '', maxAmount: '', status: 'ACTIVE', sortOrder: 100 };

export default function BankAccountsPage() {
  const [receiving, setReceiving] = useState<ReceivingAccount[]>([]);
  const [memberBanks, setMemberBanks] = useState<MemberBank[]>([]);
  const [form, setForm] = useState(blankReceiving);
  const [message, setMessage] = useState('');
  const [busyId, setBusyId] = useState('');

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setMessage('กำลังโหลดบัญชีธนาคาร...');
    const [receivingRes, memberRes] = await Promise.all([adminApiFetch('/admin/receiving-bank-accounts'), adminApiFetch('/admin/member-bank-accounts')]);
    const receivingData = await receivingRes.json().catch(() => null);
    const memberData = await memberRes.json().catch(() => null);
    if (!receivingRes.ok || !memberRes.ok) { setMessage(receivingData?.message ?? memberData?.message ?? 'โหลดข้อมูลไม่สำเร็จ'); return; }
    setReceiving(receivingData.items ?? []);
    setMemberBanks(memberData.items ?? []);
    setMessage('');
  }

  async function saveReceiving(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('กำลังบันทึกบัญชีรับเงิน...');
    const res = await adminApiFetch('/admin/receiving-bank-accounts', { method: 'POST', body: JSON.stringify({ ...form, sortOrder: Number(form.sortOrder), minAmount: form.minAmount || null, maxAmount: form.maxAmount || null }) });
    const data = await res.json().catch(() => null);
    if (!res.ok) { setMessage(data?.message ?? 'บันทึกไม่สำเร็จ'); return; }
    setReceiving((current) => [data.item, ...current]);
    setForm(blankReceiving);
    setMessage('เพิ่มบัญชีรับเงินแล้ว');
  }

  async function setReceivingStatus(item: ReceivingAccount, status: string) {
    setBusyId(item.id);
    const res = await adminApiFetch(`/admin/receiving-bank-accounts/${item.id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
    const data = await res.json().catch(() => null);
    setBusyId('');
    if (!res.ok) { setMessage(data?.message ?? 'อัปเดตไม่สำเร็จ'); return; }
    setReceiving((current) => current.map((row) => row.id === item.id ? data.item : row));
  }

  async function reviewMemberBank(item: MemberBank, status: string) {
    setBusyId(item.id);
    const res = await adminApiFetch(`/admin/member-bank-accounts/${item.id}/review`, { method: 'PATCH', body: JSON.stringify({ status }) });
    const data = await res.json().catch(() => null);
    setBusyId('');
    if (!res.ok) { setMessage(data?.message ?? 'ตรวจบัญชีไม่สำเร็จ'); return; }
    setMemberBanks((current) => current.map((row) => row.id === item.id ? { ...row, ...data.item } : row));
  }

  return (
    <AdminPage eyebrow="Bank Operations" title="Bank Accounts" description="จัดการบัญชีรับเงิน และตรวจบัญชีถอนเงินของสมาชิก" actions={<AdminButton onClick={loadAll}>Refresh</AdminButton>}>
      {message && <AdminNotice>{message}</AdminNotice>}
      <AdminGrid>
        <AdminCard title="Add Receiving Bank" description="บัญชีที่ member จะเห็นในหน้าฝากเงิน"><form onSubmit={saveReceiving}><AdminToolbar><input value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} placeholder="Bank name" /><input value={form.accountName} onChange={(e) => setForm({ ...form, accountName: e.target.value })} placeholder="Account name" /><input value={form.accountNumber} onChange={(e) => setForm({ ...form, accountNumber: e.target.value })} placeholder="Account number" /><input value={form.promptPay} onChange={(e) => setForm({ ...form, promptPay: e.target.value })} placeholder="PromptPay / optional" /><input value={form.qrImageUrl} onChange={(e) => setForm({ ...form, qrImageUrl: e.target.value })} placeholder="QR image URL" /><input value={form.minAmount} onChange={(e) => setForm({ ...form, minAmount: e.target.value })} placeholder="min amount" /><input value={form.maxAmount} onChange={(e) => setForm({ ...form, maxAmount: e.target.value })} placeholder="max amount" /><AdminButton type="submit">Add Bank</AdminButton></AdminToolbar></form></AdminCard>
        <AdminCard title="Receiving Banks"><AdminStack>{receiving.map((item) => <AdminRow key={item.id}><div><AdminBadge tone={item.status === 'ACTIVE' ? 'success' : 'danger'}>{item.status}</AdminBadge><h2 style={{ margin: '10px 0 4px' }}>{item.bankName}</h2><p>{item.accountName} / {item.accountNumber}</p><p>PromptPay: {item.promptPay ?? '-'}</p><p>Limit: {item.minAmount ?? '-'} - {item.maxAmount ?? '-'}</p></div><div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}><AdminButton tone="success" disabled={busyId === item.id} onClick={() => setReceivingStatus(item, 'ACTIVE')}>Enable</AdminButton><AdminButton tone="danger" disabled={busyId === item.id} onClick={() => setReceivingStatus(item, 'DISABLED')}>Disable</AdminButton></div></AdminRow>)}{receiving.length === 0 && <AdminEmpty>ยังไม่มีบัญชีรับเงิน</AdminEmpty>}</AdminStack></AdminCard>
      </AdminGrid>
      <AdminCard title="Member Withdrawal Bank Review" description="ตรวจบัญชีธนาคารที่สมาชิกเพิ่มสำหรับถอนเงิน"><AdminStack>{memberBanks.map((item) => <AdminRow key={item.id}><div><AdminBadge tone={item.status === 'ACTIVE' ? 'success' : item.status === 'REJECTED' ? 'danger' : 'warning'}>{item.status}</AdminBadge><h2 style={{ margin: '10px 0 4px' }}>{item.bankName}</h2><p>{item.accountName} / {item.accountNumber}</p><p>Member: {item.user?.username ?? item.userId}</p><p>Primary: {item.isPrimary ? 'YES' : 'NO'}</p></div><div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}><AdminButton tone="success" disabled={busyId === item.id} onClick={() => reviewMemberBank(item, 'ACTIVE')}>Approve</AdminButton><AdminButton tone="danger" disabled={busyId === item.id} onClick={() => reviewMemberBank(item, 'REJECTED')}>Reject</AdminButton></div></AdminRow>)}{memberBanks.length === 0 && <AdminEmpty>ยังไม่มีบัญชีถอนของสมาชิก</AdminEmpty>}</AdminStack></AdminCard>
    </AdminPage>
  );
}
