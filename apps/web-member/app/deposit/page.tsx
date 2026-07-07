'use client';

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import { memberApiFetch } from '../member-api';

type TopUpItem = { id: string; amount: string; currency: string; status: string; method?: string | null; note?: string | null; adminNote?: string | null; createdAt: string };
type ReceivingBank = { id: string; bankName: string; accountName: string; accountNumber: string; promptPay?: string | null; qrImageUrl?: string | null; minAmount?: string | null; maxAmount?: string | null; status: string };
type Step = 'select' | 'transfer' | 'waiting' | 'approved' | 'rejected';
const AMOUNTS = [100, 300, 500, 1000, 3000, 5000];
const METHODS = [
  { code: 'bank_transfer', label: 'โอนเข้าบัญชีธนาคาร', title: 'บัญชีรับเงิน', detail: 'โอนเข้าบัญชีธนาคารที่ระบบเปิดใช้งาน' },
  { code: 'qr_promptpay', label: 'สแกน QR / PromptPay', title: 'สแกน QR เพื่อโอนเงิน', detail: 'สแกน QR หรือโอนพร้อมเพย์ตามบัญชีที่ระบบกำหนด' },
];

export default function DepositPage() {
  const [step, setStep] = useState<Step>('select');
  const [amount, setAmount] = useState('500');
  const [selectedAmount, setSelectedAmount] = useState(500);
  const [method, setMethod] = useState('bank_transfer');
  const [receivingBanks, setReceivingBanks] = useState<ReceivingBank[]>([]);
  const [selectedBankId, setSelectedBankId] = useState('');
  const [note, setNote] = useState('');
  const [slipImageData, setSlipImageData] = useState('');
  const [slipImageName, setSlipImageName] = useState('');
  const [items, setItems] = useState<TopUpItem[]>([]);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingRequest, setPendingRequest] = useState<TopUpItem | null>(null);

  const selectedMethod = useMemo(() => METHODS.find((item) => item.code === method) ?? METHODS[0], [method]);
  const parsedAmount = useMemo(() => parseAmount(amount), [amount]);
  const transferAmount = selectedAmount > 0 ? selectedAmount : parsedAmount;
  const usableBanks = useMemo(() => receivingBanks.filter((bank) => matchAmountLimit(bank, transferAmount)), [receivingBanks, transferAmount]);
  const methodBanks = useMemo(() => method === 'qr_promptpay' ? usableBanks.filter((bank) => bank.qrImageUrl || bank.promptPay) : usableBanks, [method, usableBanks]);
  const selectedBank = useMemo(() => methodBanks.find((bank) => bank.id === selectedBankId) ?? methodBanks[0], [methodBanks, selectedBankId]);

  useEffect(() => { loadInitial(); }, []);
  useEffect(() => { if (methodBanks.length > 0 && !methodBanks.some((bank) => bank.id === selectedBankId)) setSelectedBankId(methodBanks[0].id); }, [methodBanks, selectedBankId]);
  useEffect(() => {
    if (!pendingRequest?.id || step !== 'waiting') return;
    const interval = window.setInterval(async () => {
      const res = await memberApiFetch(`/member/topups/${pendingRequest.id}`);
      const data = await res.json().catch(() => null);
      if (!res.ok || !data) return;
      setPendingRequest(data);
      setItems((current) => current.map((item) => (item.id === data.id ? data : item)));
      if (data.status === 'APPROVED') { setMessage('ทำรายการสำเร็จ ยอดถูกอนุมัติแล้ว'); setStep('approved'); window.clearInterval(interval); }
      if (data.status === 'REJECTED') { setMessage(data.adminNote ? `รายการไม่ผ่าน: ${data.adminNote}` : 'รายการไม่ผ่านการตรวจสอบ'); setStep('rejected'); window.clearInterval(interval); }
    }, 5000);
    return () => window.clearInterval(interval);
  }, [pendingRequest?.id, step]);

  async function loadInitial() {
    const [historyRes, bankRes] = await Promise.all([memberApiFetch('/member/topups'), memberApiFetch('/member/receiving-bank-accounts')]);
    const historyData = await historyRes.json().catch(() => null);
    const bankData = await bankRes.json().catch(() => null);
    if (historyRes.ok) setItems(historyData.items ?? []);
    if (bankRes.ok) {
      const banks = bankData.items ?? [];
      setReceivingBanks(banks);
      if (banks[0]?.id) setSelectedBankId(banks[0].id);
    }
    if (!historyRes.ok || !bankRes.ok) setMessage(historyData?.message ?? bankData?.message ?? 'โหลดข้อมูลไม่สำเร็จ');
  }

  function goToTransfer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextAmount = parseAmount(amount);
    if (!Number.isFinite(nextAmount) || nextAmount <= 0) { setMessage('กรุณาเลือกหรือใส่จำนวนเงินมากกว่า 0'); return; }
    setSelectedAmount(nextAmount);
    if (methodBanks.length === 0) { setMessage('ยังไม่มีบัญชีรับเงินที่ใช้ได้กับยอดนี้'); return; }
    setMessage(''); setStep('transfer');
  }

  async function handleSlipChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setMessage('กรุณาเลือกไฟล์รูปภาพสลิป'); return; }
    setMessage('กำลังบีบอัดรูปสลิป...');
    const imageData = await resizeImage(file, 900, 0.72);
    setSlipImageName(file.name); setSlipImageData(imageData); setMessage('แนบสลิปแล้ว');
  }

  async function submitAfterTransfer() {
    const finalAmount = Number(selectedAmount);
    if (!Number.isFinite(finalAmount) || finalAmount <= 0) { setMessage('จำนวนเงินหาย กรุณาย้อนกลับไปเลือกยอดใหม่'); setStep('select'); return; }
    if (!selectedBank) { setMessage('กรุณาเลือกบัญชีรับเงินก่อน'); return; }
    if (!slipImageData) { setMessage('กรุณาแนบรูปสลิปก่อนกดเสร็จ'); return; }
    setIsSubmitting(true); setMessage('กำลังอัปโหลดสลิปแบบส่วนตัว...');
    const slipRes = await memberApiFetch('/member/topups/slip', { method: 'POST', body: JSON.stringify({ slipImageData, slipImageName }) });
    const slipData = await slipRes.json().catch(() => null);
    if (!slipRes.ok) { setIsSubmitting(false); setMessage(slipData?.message ?? 'อัปโหลดสลิปไม่สำเร็จ'); return; }
    setMessage('กำลังส่งรายการให้แอดมินตรวจสอบ...');
    const proofNote = JSON.stringify({ userNote: note, slipImageName: slipData.slipImageName ?? slipImageName, slipFileId: slipData.slipFileId, storage: 'private', receivingBankAccountId: selectedBank.id, receivingBank: { bankName: selectedBank.bankName, accountName: selectedBank.accountName, accountNumber: selectedBank.accountNumber, promptPay: selectedBank.promptPay ?? null } });
    const res = await memberApiFetch('/member/topups', { method: 'POST', body: JSON.stringify({ amount: finalAmount, method, note: proofNote }) });
    const data = await res.json().catch(() => null);
    setIsSubmitting(false);
    if (!res.ok) { setMessage(data?.message ?? 'ส่งรายการไม่สำเร็จ'); return; }
    setNote(''); setSlipImageName(''); setSlipImageData(''); setPendingRequest(data); setItems((current) => [data, ...current]); setMessage('ส่งรายการแล้ว รอแอดมินตรวจสอบและอนุมัติ'); setStep('waiting');
  }

  return (
    <main style={pageStyle}>
      <a href="/" style={backStyle}>← หน้าแรก</a><p style={eyebrowStyle}>Wallet</p><h1 style={titleStyle}>ฝากเงิน</h1><p style={mutedStyle}>เลือกยอด เลือกวิธีโอน แนบสลิป แล้วรอแอดมินอนุมัติ</p>
      <section style={stepWrapStyle}><div style={stepItemStyle(step === 'select')}>1 เลือกยอด</div><div style={stepItemStyle(step === 'transfer')}>2 โอนเงิน</div><div style={stepItemStyle(step === 'waiting' || step === 'approved' || step === 'rejected')}>3 ผลรายการ</div></section>
      {step === 'select' && <form onSubmit={goToTransfer} style={panelStyle}><h2>เลือกจำนวนเงิน</h2><div style={amountGridStyle}>{AMOUNTS.map((value) => <button key={value} type="button" onClick={() => { setAmount(String(value)); setSelectedAmount(value); }} style={amountButtonStyle(parseAmount(amount) === value)}>฿{value.toLocaleString('th-TH')}</button>)}</div><label style={labelStyle}>หรือใส่จำนวนเอง<input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="เช่น 500" inputMode="decimal" style={inputStyle} /></label><h2>วิธีการโอน</h2><div style={{ display: 'grid', gap: 10 }}>{METHODS.map((item) => <button key={item.code} type="button" onClick={() => setMethod(item.code)} style={methodButtonStyle(method === item.code)}><strong>{item.label}</strong><span>{item.detail}</span></button>)}</div><label style={labelStyle}>บัญชีรับเงิน<select value={selectedBankId} onChange={(e) => setSelectedBankId(e.target.value)} style={inputStyle}>{methodBanks.map((bank) => <option key={bank.id} value={bank.id}>{bank.bankName} / {bank.accountNumber}</option>)}</select></label>{methodBanks.length === 0 && <div style={noticeStyle}>ยังไม่มีบัญชีรับเงินที่เปิดใช้งานสำหรับวิธีนี้</div>}<button type="submit" style={primaryButtonStyle}>ถัดไป</button>{message && <div style={noticeStyle}>{message}</div>}</form>}
      {step === 'transfer' && <section style={panelStyle}><h2>{selectedMethod.title}</h2><div style={summaryStyle}><p style={mutedStyle}>ยอดที่ต้องโอน</p><h1 style={amountTitleStyle}>฿{transferAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</h1><p style={mutedStyle}>ช่องทาง: {selectedMethod.label}</p></div>{selectedBank && <section style={paymentBoxStyle}><strong>ข้อมูลรับเงิน</strong><p>ธนาคาร: {selectedBank.bankName}</p><p>ชื่อบัญชี: {selectedBank.accountName}</p><p>เลขบัญชี: {selectedBank.accountNumber}</p>{selectedBank.promptPay && <p>PromptPay: {selectedBank.promptPay}</p>}{method === 'qr_promptpay' && selectedBank.qrImageUrl && <img src={selectedBank.qrImageUrl} alt="QR Code" style={qrImageStyle} />}<p>โอนเสร็จแล้วให้แนบรูปสลิป แล้วกด “เสร็จ”</p></section>}<label style={labelStyle}>แนบสลิปโอนเงิน<input type="file" accept="image/*" onChange={handleSlipChange} style={inputStyle} /></label>{slipImageData && <section style={previewBoxStyle}><strong>ตัวอย่างสลิป</strong><img src={slipImageData} alt="slip preview" style={slipStyle} /><p>{slipImageName}</p></section>}<label style={labelStyle}>หมายเหตุ<textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="รายละเอียดเพิ่มเติม ถ้ามี" style={inputStyle} /></label><div style={actionRowStyle}><button type="button" onClick={() => setStep('select')} style={secondaryButtonStyle}>ย้อนกลับ</button><button type="button" onClick={submitAfterTransfer} disabled={isSubmitting} style={primaryButtonStyle}>{isSubmitting ? 'กำลังส่ง...' : 'เสร็จ'}</button></div>{message && <div style={noticeStyle}>{message}</div>}</section>}
      {step === 'waiting' && <section style={panelStyle}><h2>รอแอดมินอนุมัติ</h2><p style={mutedStyle}>รายการของคุณถูกส่งแล้ว สถานะตอนนี้: {pendingRequest?.status ?? 'PENDING'}</p><p style={mutedStyle}>หน้านี้จะเช็กสถานะให้อัตโนมัติทุก 5 วินาที</p><div style={summaryStyle}><p style={mutedStyle}>ยอดรายการ</p><h1 style={amountTitleStyle}>฿{Number(pendingRequest?.amount ?? selectedAmount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</h1></div>{message && <div style={noticeStyle}>{message}</div>}</section>}
      {step === 'approved' && <section style={panelStyle}><h2>ทำรายการเสร็จสิ้น ✅</h2><p style={mutedStyle}>แอดมินอนุมัติแล้ว ยอดจะถูกเพิ่มเข้ากระเป๋าเงิน</p><a href="/" style={primaryLinkStyle}>กลับหน้าหลัก</a>{message && <div style={noticeStyle}>{message}</div>}</section>}
      {step === 'rejected' && <section style={panelStyle}><h2>รายการไม่ผ่าน</h2><p style={mutedStyle}>{message || 'กรุณาตรวจสอบข้อมูลแล้วทำรายการใหม่'}</p><button type="button" onClick={() => setStep('select')} style={primaryButtonStyle}>ทำรายการใหม่</button></section>}
      <h2>ประวัติคำขอ</h2><div style={{ display: 'grid', gap: 12 }}>{items.map((item) => { const proof = parseProofNote(item.note); return <section key={item.id} style={historyCardStyle}><strong>{item.currency} {Number(item.amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</strong><p>Status: {item.status}</p><p>สลิป: {proof.slipFileId || proof.slipImageData ? 'แนบแล้ว' : '-'}</p><p>หมายเหตุ: {proof.userNote || '-'}</p>{item.adminNote && <p>Admin note: {item.adminNote}</p>}</section>; })}{items.length === 0 && <div style={noticeStyle}>ยังไม่มีรายการ</div>}</div>
    </main>
  );
}

function matchAmountLimit(bank: ReceivingBank, amount: number) { const min = bank.minAmount ? Number(bank.minAmount) : 0; const max = bank.maxAmount ? Number(bank.maxAmount) : Infinity; if (!Number.isFinite(amount) || amount <= 0) return true; return amount >= min && amount <= max; }
function parseAmount(value: string) { const normalized = String(value).replace(/[０-９]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 65248)).replace(/,/g, '').trim(); return Number(normalized); }
function parseProofNote(value?: string | null) { if (!value) return { userNote: '', slipImageData: '', slipImageName: '', slipFileId: '' }; try { const data = JSON.parse(value); return { userNote: typeof data.userNote === 'string' ? data.userNote : '', slipImageData: typeof data.slipImageData === 'string' ? data.slipImageData : '', slipImageName: typeof data.slipImageName === 'string' ? data.slipImageName : '', slipFileId: typeof data.slipFileId === 'string' ? data.slipFileId : '' }; } catch { return { userNote: value, slipImageData: '', slipImageName: '', slipFileId: '' }; } }
function resizeImage(file: File, maxSize: number, quality: number) { return new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => { const img = new Image(); img.onload = () => { const scale = Math.min(1, maxSize / Math.max(img.width, img.height)); const canvas = document.createElement('canvas'); canvas.width = Math.round(img.width * scale); canvas.height = Math.round(img.height * scale); const ctx = canvas.getContext('2d'); if (!ctx) return reject(new Error('ไม่สามารถอ่านรูปสลิปได้')); ctx.drawImage(img, 0, 0, canvas.width, canvas.height); resolve(canvas.toDataURL('image/jpeg', quality)); }; img.onerror = () => reject(new Error('ไม่สามารถอ่านรูปสลิปได้')); img.src = String(reader.result); }; reader.onerror = () => reject(new Error('ไม่สามารถอ่านรูปสลิปได้')); reader.readAsDataURL(file); }); }

const pageStyle = { minHeight: '100vh', background: '#080808', color: '#fff', padding: '22px 16px 44px', display: 'grid', gap: 14 } as const;
const backStyle = { color: '#f5c542', textDecoration: 'none', fontWeight: 900 } as const;
const eyebrowStyle = { margin: 0, opacity: 0.66, fontSize: 14 } as const;
const titleStyle = { margin: 0, fontSize: 'clamp(42px, 13vw, 64px)', lineHeight: 0.96, letterSpacing: -1.2 } as const;
const mutedStyle = { margin: 0, opacity: 0.76, lineHeight: 1.55 } as const;
const panelStyle = { display: 'grid', gap: 14, border: '1px solid rgba(255,255,255,0.12)', borderRadius: 28, padding: 18, marginBottom: 10, background: '#181818' } as const;
const inputStyle = { display: 'block', width: '100%', padding: '13px 14px', marginTop: 6, borderRadius: 14, border: '1px solid rgba(255,255,255,0.16)', background: '#242424', color: '#fff', boxSizing: 'border-box' } as const;
const primaryButtonStyle = { padding: 14, borderRadius: 16, cursor: 'pointer', background: '#f5c542', color: '#111', border: 0, fontWeight: 900 } as const;
const primaryLinkStyle = { display: 'inline-block', textAlign: 'center' as const, padding: 14, borderRadius: 16, cursor: 'pointer', background: '#f5c542', color: '#111', border: 0, textDecoration: 'none', fontWeight: 900 } as const;
const secondaryButtonStyle = { padding: 14, borderRadius: 16, cursor: 'pointer', background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.14)', fontWeight: 900 } as const;
const stepWrapStyle = { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, margin: '10px 0' } as const;
const summaryStyle = { border: '1px solid rgba(255,255,255,0.10)', borderRadius: 20, padding: 16, background: 'rgba(255,255,255,0.04)' } as const;
const paymentBoxStyle = { border: '1px solid rgba(255,255,255,0.10)', borderRadius: 20, padding: 16, background: 'rgba(255,255,255,0.04)' } as const;
const previewBoxStyle = { border: '1px solid rgba(255,255,255,0.10)', borderRadius: 20, padding: 16 } as const;
const qrImageStyle = { width: 220, maxWidth: '100%', borderRadius: 18, border: '1px solid rgba(255,255,255,0.14)', marginTop: 12 } as const;
const amountGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 } as const;
const labelStyle = { display: 'grid', gap: 8, fontWeight: 800 } as const;
const actionRowStyle = { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 } as const;
const noticeStyle = { border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16, padding: 12, background: 'rgba(255,255,255,0.07)' } as const;
const slipStyle = { width: '100%', maxWidth: 320, borderRadius: 16, marginTop: 10, border: '1px solid rgba(255,255,255,0.12)' } as const;
const historyCardStyle = { border: '1px solid rgba(255,255,255,0.12)', borderRadius: 22, padding: 16, background: '#181818' } as const;
const amountTitleStyle = { margin: '8px 0', fontSize: 'clamp(34px, 10vw, 54px)', lineHeight: 1 } as const;
function stepItemStyle(active: boolean) { return { padding: 12, borderRadius: 999, textAlign: 'center' as const, border: '1px solid rgba(255,255,255,0.14)', background: active ? '#f5c542' : 'rgba(255,255,255,0.08)', color: active ? '#111' : '#fff', fontWeight: 900 }; }
function amountButtonStyle(active: boolean) { return { padding: 14, borderRadius: 18, border: active ? '2px solid #f5c542' : '1px solid rgba(255,255,255,0.14)', cursor: 'pointer', background: active ? 'rgba(245,197,66,0.18)' : 'rgba(255,255,255,0.08)', color: active ? '#f5c542' : '#fff', fontWeight: 900 }; }
function methodButtonStyle(active: boolean) { return { display: 'grid', gap: 4, textAlign: 'left' as const, padding: 14, borderRadius: 18, border: active ? '2px solid #f5c542' : '1px solid rgba(255,255,255,0.14)', cursor: 'pointer', background: active ? 'rgba(245,197,66,0.18)' : 'rgba(255,255,255,0.08)', color: active ? '#f5c542' : '#fff' }; }
