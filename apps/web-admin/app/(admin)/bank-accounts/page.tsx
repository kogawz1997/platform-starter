'use client';

import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminEmpty, AdminGrid, AdminNotice, AdminPage, AdminRow, AdminStack, AdminToolbar } from '../_components/admin-ui';

type ReceivingAccount = { id: string; bankName: string; accountName: string; accountNumber: string; promptPay?: string | null; qrImageUrl?: string | null; minAmount?: string | null; maxAmount?: string | null; status: string; sortOrder: number };
type MemberBank = { id: string; userId: string; bankName: string; accountName: string; accountNumber: string; isPrimary: boolean; status: string; adminNote?: string | null; user?: { username: string; phone?: string | null; email?: string | null; status: string } };
type PaymentType = 'bank' | 'promptpay' | 'wallet' | 'other';

const THAI_BANKS = ['ธนาคารกสิกรไทย', 'ธนาคารไทยพาณิชย์', 'ธนาคารกรุงเทพ', 'ธนาคารกรุงไทย', 'ธนาคารกรุงศรีอยุธยา', 'ธนาคารทหารไทยธนชาต', 'ธนาคารออมสิน', 'ธนาคารอาคารสงเคราะห์', 'ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร', 'ธนาคารยูโอบี', 'ธนาคารซีไอเอ็มบีไทย', 'ธนาคารเกียรตินาคินภัทร', 'ธนาคารแลนด์ แอนด์ เฮ้าส์', 'ธนาคารไอซีบีซี ไทย', 'ธนาคารไทยเครดิต'];
const PAYMENT_TYPES = [{ value: 'bank', label: 'บัญชีธนาคาร' }, { value: 'promptpay', label: 'พร้อมเพย์' }, { value: 'wallet', label: 'วอเลต' }, { value: 'other', label: 'อื่น ๆ' }] as const;
const blankReceiving = { bankName: THAI_BANKS[0], accountName: '', accountNumber: '', promptPay: '', qrImageUrl: '', minAmount: '', maxAmount: '', status: 'ACTIVE', sortOrder: 100 };

export default function BankAccountsPage() {
  const [receiving, setReceiving] = useState<ReceivingAccount[]>([]);
  const [memberBanks, setMemberBanks] = useState<MemberBank[]>([]);
  const [paymentType, setPaymentType] = useState<PaymentType>('bank');
  const [form, setForm] = useState(blankReceiving);
  const [message, setMessage] = useState('');
  const [busyId, setBusyId] = useState('');

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setMessage('กำลังโหลดบัญชีรับเงิน...');
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
    const payload = normalizeReceivingPayload();
    if (!payload.accountName.trim() || !payload.accountNumber.trim() || !payload.bankName.trim()) { setMessage('กรอกข้อมูลบัญชีรับเงินให้ครบก่อน'); return; }
    setMessage('กำลังบันทึกบัญชีรับเงิน...');
    const res = await adminApiFetch('/admin/receiving-bank-accounts', { method: 'POST', body: JSON.stringify(payload) });
    const data = await res.json().catch(() => null);
    if (!res.ok) { setMessage(data?.message ?? 'บันทึกไม่สำเร็จ'); return; }
    setReceiving((current) => [data.item, ...current]);
    setPaymentType('bank'); setForm(blankReceiving);
    setMessage('เพิ่มบัญชีรับเงินแล้ว ระบบจะนำไปสลับให้ลูกค้าอัตโนมัติ');
  }

  function normalizeReceivingPayload() {
    if (paymentType === 'promptpay') return { ...form, bankName: 'พร้อมเพย์', accountNumber: form.promptPay || form.accountNumber, promptPay: form.promptPay || form.accountNumber, sortOrder: Number(form.sortOrder), minAmount: form.minAmount || null, maxAmount: form.maxAmount || null };
    if (paymentType === 'wallet') return { ...form, bankName: 'วอเลต', promptPay: '', sortOrder: Number(form.sortOrder), minAmount: form.minAmount || null, maxAmount: form.maxAmount || null };
    if (paymentType === 'other') return { ...form, bankName: 'อื่น ๆ', promptPay: '', sortOrder: Number(form.sortOrder), minAmount: form.minAmount || null, maxAmount: form.maxAmount || null };
    return { ...form, promptPay: '', sortOrder: Number(form.sortOrder), minAmount: form.minAmount || null, maxAmount: form.maxAmount || null };
  }

  function changePaymentType(value: PaymentType) {
    setPaymentType(value);
    setForm((current) => ({ ...current, bankName: value === 'bank' ? THAI_BANKS[0] : value === 'promptpay' ? 'พร้อมเพย์' : value === 'wallet' ? 'วอเลต' : 'อื่น ๆ', accountNumber: '', promptPay: '' }));
  }

  async function handleQrUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setMessage('กรุณาเลือกไฟล์รูปภาพ QR Code'); return; }
    const dataUrl = await resizeImage(file, 720, 0.82);
    setForm((current) => ({ ...current, qrImageUrl: dataUrl }));
    setMessage('อัปโหลด QR Code แล้ว');
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
    <AdminPage eyebrow="Bank Operations" title="Bank Accounts" description="เพิ่มบัญชีรับเงินหลายช่องทาง และให้ระบบสลับบัญชีตอนลูกค้าเติมเงิน" actions={<AdminButton onClick={loadAll}>Refresh</AdminButton>}>
      {message && <AdminNotice>{message}</AdminNotice>}
      <AdminGrid>
        <AdminCard title="Add Receiving Account" description="เพิ่มได้หลายบัญชี ระบบจะสลับบัญชีตามช่องทางที่ลูกค้าเลือก">
          <form onSubmit={saveReceiving}><AdminToolbar>
            <label style={labelStyle}>ประเภทรับเงิน<select value={paymentType} onChange={(e) => changePaymentType(e.target.value as PaymentType)}>{PAYMENT_TYPES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
            {paymentType === 'bank' && <label style={labelStyle}>ธนาคาร<select value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })}>{THAI_BANKS.map((bank) => <option key={bank} value={bank}>{bank}</option>)}</select></label>}
            <label style={labelStyle}>ชื่อบัญชี / ชื่อวอเลต<input value={form.accountName} onChange={(e) => setForm({ ...form, accountName: e.target.value })} placeholder="เช่น บริษัท ตัวอย่าง จำกัด" /></label>
            {paymentType === 'bank' && <label style={labelStyle}>เลขบัญชี<input value={form.accountNumber} onChange={(e) => setForm({ ...form, accountNumber: e.target.value })} placeholder="เลขบัญชีธนาคาร" /></label>}
            {paymentType === 'promptpay' && <label style={labelStyle}>เบอร์พร้อมเพย์<input value={form.promptPay} onChange={(e) => setForm({ ...form, promptPay: e.target.value, accountNumber: e.target.value })} placeholder="เบอร์โทร / เลขพร้อมเพย์" /></label>}
            {(paymentType === 'wallet' || paymentType === 'other') && <label style={labelStyle}>{paymentType === 'wallet' ? 'เลขวอเลต / เบอร์วอเลต' : 'รหัสบัญชี / รายละเอียด'}<input value={form.accountNumber} onChange={(e) => setForm({ ...form, accountNumber: e.target.value })} placeholder="รายละเอียดบัญชี" /></label>}
            <label style={labelStyle}>Min amount<input value={form.minAmount} onChange={(e) => setForm({ ...form, minAmount: e.target.value })} placeholder="min amount" /></label>
            <label style={labelStyle}>Max amount<input value={form.maxAmount} onChange={(e) => setForm({ ...form, maxAmount: e.target.value })} placeholder="max amount" /></label>
            <label style={labelStyle}>ลำดับสลับบัญชี<input value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} placeholder="100" /></label>
            <label style={labelStyle}>อัปโหลด QR Code<input type="file" accept="image/*" onChange={handleQrUpload} /></label>
            {form.qrImageUrl && <img src={form.qrImageUrl} alt="QR preview" style={qrPreviewStyle} />}
            <AdminButton type="submit">Add Account</AdminButton>
          </AdminToolbar></form>
        </AdminCard>
        <AdminCard title="Receiving Accounts"><AdminStack>{receiving.map((item) => <AdminRow key={item.id}><div><AdminBadge tone={item.status === 'ACTIVE' ? 'success' : 'danger'}>{item.status}</AdminBadge><h2 style={{ margin: '10px 0 4px' }}>{labelForAccount(item)}</h2><p>{item.accountName} / {item.accountNumber}</p><p>PromptPay: {item.promptPay ?? '-'}</p><p>Limit: {item.minAmount ?? '-'} - {item.maxAmount ?? '-'}</p><p>Rotation order: {item.sortOrder}</p>{item.qrImageUrl && <img src={item.qrImageUrl} alt="QR" style={qrPreviewStyle} />}</div><div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}><AdminButton tone="success" disabled={busyId === item.id} onClick={() => setReceivingStatus(item, 'ACTIVE')}>Enable</AdminButton><AdminButton tone="danger" disabled={busyId === item.id} onClick={() => setReceivingStatus(item, 'DISABLED')}>Disable</AdminButton></div></AdminRow>)}{receiving.length === 0 && <AdminEmpty>ยังไม่มีบัญชีรับเงิน</AdminEmpty>}</AdminStack></AdminCard>
      </AdminGrid>
      <AdminCard title="Member Withdrawal Bank Review" description="สมาชิก 1 คนเพิ่มบัญชีถอนได้ 1 บัญชี และชื่อบัญชีต้องตรงกับชื่อสมาชิก"><AdminStack>{memberBanks.map((item) => <AdminRow key={item.id}><div><AdminBadge tone={item.status === 'ACTIVE' ? 'success' : item.status === 'REJECTED' ? 'danger' : 'warning'}>{item.status}</AdminBadge><h2 style={{ margin: '10px 0 4px' }}>{item.bankName}</h2><p>{item.accountName} / {item.accountNumber}</p><p>Member: {item.user?.username ?? item.userId}</p><p>Primary: {item.isPrimary ? 'YES' : 'NO'}</p></div><div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}><AdminButton tone="success" disabled={busyId === item.id} onClick={() => reviewMemberBank(item, 'ACTIVE')}>Approve</AdminButton><AdminButton tone="danger" disabled={busyId === item.id} onClick={() => reviewMemberBank(item, 'REJECTED')}>Reject</AdminButton></div></AdminRow>)}{memberBanks.length === 0 && <AdminEmpty>ยังไม่มีบัญชีถอนของสมาชิก</AdminEmpty>}</AdminStack></AdminCard>
    </AdminPage>
  );
}

function labelForAccount(item: ReceivingAccount) { if (item.bankName === 'พร้อมเพย์') return 'พร้อมเพย์'; if (item.bankName === 'วอเลต') return 'วอเลต'; if (item.bankName === 'อื่น ๆ') return 'อื่น ๆ'; return `บัญชีธนาคาร · ${item.bankName}`; }
function resizeImage(file: File, maxSize: number, quality: number) { return new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => { const img = new Image(); img.onload = () => { const scale = Math.min(1, maxSize / Math.max(img.width, img.height)); const canvas = document.createElement('canvas'); canvas.width = Math.round(img.width * scale); canvas.height = Math.round(img.height * scale); const ctx = canvas.getContext('2d'); if (!ctx) return reject(new Error('อ่านรูปไม่ได้')); ctx.drawImage(img, 0, 0, canvas.width, canvas.height); resolve(canvas.toDataURL('image/jpeg', quality)); }; img.onerror = () => reject(new Error('อ่านรูปไม่ได้')); img.src = String(reader.result); }; reader.onerror = () => reject(new Error('อ่านรูปไม่ได้')); reader.readAsDataURL(file); }); }
const labelStyle = { display: 'grid', gap: 6, fontWeight: 800 } as const;
const qrPreviewStyle = { width: 150, height: 150, objectFit: 'cover' as const, borderRadius: 14, border: '1px solid rgba(148,163,184,.18)' } as const;
