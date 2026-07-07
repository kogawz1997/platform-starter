'use client';

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import { memberApiFetch } from '../member-api';

type TopUpItem = { id: string; amount: string; currency: string; status: string; method?: string | null; note?: string | null; adminNote?: string | null; createdAt: string };
type ReceivingAccount = { id: string; bankName: string; accountName: string; accountNumber: string; promptPay?: string | null; qrImageUrl?: string | null; minAmount?: string | null; maxAmount?: string | null; sortOrder?: number };
type MethodCode = 'bank_transfer' | 'promptpay' | 'wallet' | 'other';

const AMOUNTS = [100, 300, 500, 1000, 3000, 5000];
const METHODS: Record<MethodCode, { label: string; numberLabel: string }> = { bank_transfer: { label: 'บัญชีธนาคาร', numberLabel: 'เลขบัญชี' }, promptpay: { label: 'พร้อมเพย์', numberLabel: 'เบอร์พร้อมเพย์' }, wallet: { label: 'วอเลต', numberLabel: 'วอเลต' }, other: { label: 'อื่น ๆ', numberLabel: 'รายละเอียด' } };

export default function DepositClient() {
  const [step, setStep] = useState<'select' | 'transfer' | 'waiting'>('select');
  const [amount, setAmount] = useState('500');
  const [method, setMethod] = useState<MethodCode>('bank_transfer');
  const [accounts, setAccounts] = useState<ReceivingAccount[]>([]);
  const [history, setHistory] = useState<TopUpItem[]>([]);
  const [selected, setSelected] = useState<ReceivingAccount | null>(null);
  const [slipImageData, setSlipImageData] = useState('');
  const [slipImageName, setSlipImageName] = useState('');
  const [note, setNote] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const parsedAmount = useMemo(() => Number(amount.replace(/,/g, '').trim()), [amount]);
  const usable = useMemo(() => accounts.filter((account) => matchAmount(account, parsedAmount)), [accounts, parsedAmount]);
  const availableMethods = useMemo(() => Array.from(new Set(usable.map(accountType))) as MethodCode[], [usable]);

  useEffect(() => { loadInitial(); }, []);
  useEffect(() => { if (availableMethods.length > 0 && !availableMethods.includes(method)) setMethod(availableMethods[0]); }, [availableMethods, method]);

  async function loadInitial() {
    const [historyRes, accountRes] = await Promise.all([memberApiFetch('/member/topups'), memberApiFetch('/member/receiving-bank-accounts')]);
    const historyData = await historyRes.json().catch(() => null);
    const accountData = await accountRes.json().catch(() => null);
    if (historyRes.ok) setHistory(historyData.items ?? []);
    if (accountRes.ok) setAccounts(accountData.items ?? []);
    if (!historyRes.ok || !accountRes.ok) setMessage(historyData?.message ?? accountData?.message ?? 'โหลดข้อมูลไม่สำเร็จ');
  }

  async function copyText(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      setMessage(`คัดลอก${label}แล้ว`);
    } catch {
      setMessage(`คัดลอก${label}ไม่สำเร็จ`);
    }
  }

  async function nextStep(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) { setMessage('กรุณาใส่จำนวนเงินมากกว่า 0'); return; }
    setMessage('กำลังเตรียมข้อมูลรับเงิน...');
    const res = await memberApiFetch(`/member/receiving-bank-account?paymentType=${encodeURIComponent(method)}&amount=${encodeURIComponent(String(parsedAmount))}`);
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.item) { setMessage(data?.message ?? 'ยังไม่มีบัญชีรับเงินสำหรับช่องทางนี้'); return; }
    setSelected(data.item); setMessage(''); setStep('transfer');
  }

  async function uploadSlip(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; if (!file) return;
    if (!file.type.startsWith('image/')) { setMessage('กรุณาเลือกไฟล์รูปภาพ'); return; }
    const imageData = await resizeImage(file, 900, 0.72); setSlipImageName(file.name); setSlipImageData(imageData); setMessage('แนบสลิปแล้ว');
  }

  async function submit() {
    if (!selected) { setMessage('ไม่พบบัญชีรับเงิน'); return; }
    if (!slipImageData) { setMessage('กรุณาแนบสลิปก่อน'); return; }
    setLoading(true);
    const slipRes = await memberApiFetch('/member/topups/slip', { method: 'POST', body: JSON.stringify({ slipImageData, slipImageName }) });
    const slipData = await slipRes.json().catch(() => null);
    if (!slipRes.ok) { setLoading(false); setMessage(slipData?.message ?? 'อัปโหลดสลิปไม่สำเร็จ'); return; }
    const proofNote = JSON.stringify({ userNote: note, slipImageName: slipData.slipImageName ?? slipImageName, slipFileId: slipData.slipFileId, storage: 'private', paymentType: method, receivingBankAccountId: selected.id, receivingBank: selected });
    const res = await memberApiFetch('/member/topups', { method: 'POST', body: JSON.stringify({ amount: parsedAmount, method, note: proofNote }) });
    const data = await res.json().catch(() => null); setLoading(false);
    if (!res.ok) { setMessage(data?.message ?? 'ส่งรายการไม่สำเร็จ'); return; }
    setHistory((current) => [data, ...current]); setMessage('ส่งรายการแล้ว รอแอดมินตรวจสอบ'); setStep('waiting');
  }

  return <main style={pageStyle}><a href="/" style={backStyle}>← หน้าแรก</a><h1 style={titleStyle}>ฝากเงิน</h1><p style={mutedStyle}>เลือกยอดเงินและวิธีการโอน จากนั้นทำรายการตามข้อมูลที่ระบบแสดง</p>{step === 'select' && <form onSubmit={nextStep} style={cardStyle}><h2 style={sectionHeadingStyle}>เลือกยอดเงิน</h2><div style={amountGridStyle}>{AMOUNTS.map((value) => <button key={value} type="button" onClick={() => setAmount(String(value))} style={amountButtonStyle(Number(amount) === value)}>฿{value.toLocaleString('th-TH')}</button>)}</div><label style={labelStyle}>จำนวนเงิน<input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" style={inputStyle} /></label><h2 style={sectionHeadingStyle}>วิธีการโอน</h2>{(['bank_transfer', 'promptpay', 'wallet', 'other'] as MethodCode[]).map((code) => { const enabled = usable.some((account) => accountType(account) === code); return <button key={code} type="button" disabled={!enabled} onClick={() => enabled && setMethod(code)} style={methodStyle(method === code, enabled)}><strong>{METHODS[code].label}</strong><span>{enabled ? 'พร้อมใช้งาน' : 'ยังไม่เปิดใช้งาน'}</span></button>; })}<button type="submit" style={primaryButtonStyle}>ถัดไป</button></form>}{step === 'transfer' && selected && <section style={cardStyle}><h2 style={sectionHeadingStyle}>{METHODS[method].label}</h2><h1 style={amountTitleStyle}>฿{parsedAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</h1><section style={boxStyle}><InfoRow label="ชื่อบัญชี" value={selected.accountName} /><InfoRow label={METHODS[method].numberLabel} value={selected.accountNumber} action={<button type="button" onClick={() => copyText(selected.accountNumber, METHODS[method].numberLabel)} style={copyButtonStyle}>คัดลอก</button>} />{selected.promptPay && <InfoRow label="PromptPay" value={selected.promptPay} action={<button type="button" onClick={() => copyText(selected.promptPay ?? '', 'พร้อมเพย์')} style={copyButtonStyle}>คัดลอก</button>} />}{selected.qrImageUrl && <img src={selected.qrImageUrl} alt="QR" style={qrStyle} />}<p style={mutedStyle}>โอนเสร็จแล้วแนบสลิป แล้วกดเสร็จ</p></section><label style={labelStyle}>แนบสลิป<input type="file" accept="image/*" onChange={uploadSlip} style={inputStyle} /></label>{slipImageData && <img src={slipImageData} alt="slip" style={slipStyle} />}<label style={labelStyle}>หมายเหตุ<textarea value={note} onChange={(e) => setNote(e.target.value)} style={inputStyle} /></label><div style={actionRowStyle}><button type="button" onClick={() => setStep('select')} style={secondaryButtonStyle}>ย้อนกลับ</button><button type="button" onClick={submit} disabled={loading} style={primaryButtonStyle}>{loading ? 'กำลังส่ง...' : 'เสร็จ'}</button></div></section>}{step === 'waiting' && <section style={cardStyle}><h2 style={sectionHeadingStyle}>รอแอดมินอนุมัติ</h2><p style={mutedStyle}>ส่งรายการแล้ว กรุณารอตรวจสอบ</p></section>}{message && <div style={noticeStyle}>{message}</div>}<h2 style={sectionHeadingStyle}>ประวัติคำขอ</h2>{history.map((item) => <section key={item.id} style={cardStyle}><strong>{item.currency} {Number(item.amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</strong><p>Status: {item.status}</p><p>Method: {item.method ?? '-'}</p>{item.adminNote && <p>Admin note: {item.adminNote}</p>}</section>)}</main>;
}

function InfoRow({ label, value, action }: { label: string; value: string; action?: React.ReactNode }) { return <div style={infoRowStyle}><div><span>{label}</span><strong>{value}</strong></div>{action}</div>; }
function accountType(account: ReceivingAccount): MethodCode { if (account.bankName === 'พร้อมเพย์') return 'promptpay'; if (account.bankName === 'วอเลต') return 'wallet'; if (account.bankName === 'อื่น ๆ') return 'other'; return 'bank_transfer'; }
function matchAmount(account: ReceivingAccount, amount: number) { const min = account.minAmount ? Number(account.minAmount) : 0; const max = account.maxAmount ? Number(account.maxAmount) : Infinity; if (!Number.isFinite(amount) || amount <= 0) return true; return amount >= min && amount <= max; }
function resizeImage(file: File, maxSize: number, quality: number) { return new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => { const img = new Image(); img.onload = () => { const scale = Math.min(1, maxSize / Math.max(img.width, img.height)); const canvas = document.createElement('canvas'); canvas.width = Math.round(img.width * scale); canvas.height = Math.round(img.height * scale); const ctx = canvas.getContext('2d'); if (!ctx) return reject(new Error('อ่านรูปไม่ได้')); ctx.drawImage(img, 0, 0, canvas.width, canvas.height); resolve(canvas.toDataURL('image/jpeg', quality)); }; img.onerror = () => reject(new Error('อ่านรูปไม่ได้')); img.src = String(reader.result); }; reader.onerror = () => reject(new Error('อ่านรูปไม่ได้')); reader.readAsDataURL(file); }); }
const pageStyle = { minHeight: '100vh', background: '#080808', color: '#fff', padding: '18px 12px calc(44px + env(safe-area-inset-bottom))', display: 'grid', gap: 14, width: '100%', maxWidth: 920, margin: '0 auto', overflowX: 'hidden' as const } as const;
const backStyle = { color: '#f5c542', textDecoration: 'none', fontWeight: 900 } as const;
const titleStyle = { margin: 0, fontSize: 'clamp(34px,11vw,58px)', lineHeight: 0.98, overflowWrap: 'anywhere' as const };
const mutedStyle = { margin: 0, opacity: 0.76, lineHeight: 1.55 } as const;
const cardStyle = { border: '1px solid rgba(255,255,255,.12)', borderRadius: 24, padding: 16, background: '#181818', display: 'grid', gap: 12, minWidth: 0, overflow: 'hidden' as const };
const sectionHeadingStyle = { margin: 0, fontSize: 'clamp(22px,7vw,30px)', lineHeight: 1.1 } as const;
const labelStyle = { display: 'grid', gap: 8, fontWeight: 800, minWidth: 0 } as const;
const inputStyle = { width: '100%', padding: '13px 14px', borderRadius: 14, border: '1px solid rgba(255,255,255,.16)', background: '#242424', color: '#fff', boxSizing: 'border-box' as const, fontSize: 16 };
const amountGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 10 } as const;
const primaryButtonStyle = { padding: 14, minHeight: 48, borderRadius: 16, cursor: 'pointer', background: '#f5c542', color: '#111', border: 0, fontWeight: 900, width: '100%' } as const;
const secondaryButtonStyle = { padding: 14, minHeight: 48, borderRadius: 16, cursor: 'pointer', background: 'rgba(255,255,255,.08)', color: '#fff', border: '1px solid rgba(255,255,255,.14)', fontWeight: 900, width: '100%' } as const;
const actionRowStyle = { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 10 } as const;
const noticeStyle = { border: '1px solid rgba(255,255,255,.12)', borderRadius: 16, padding: 12, background: 'rgba(255,255,255,.07)', overflowWrap: 'anywhere' as const };
const boxStyle = { border: '1px solid rgba(255,255,255,.10)', borderRadius: 20, padding: 14, background: 'rgba(255,255,255,.04)', overflow: 'hidden' as const, display: 'grid', gap: 10 };
const amountTitleStyle = { margin: 0, fontSize: 'clamp(32px,10vw,52px)', lineHeight: 1, overflowWrap: 'anywhere' as const };
const qrStyle = { width: 220, maxWidth: '100%', borderRadius: 18, border: '1px solid rgba(255,255,255,.14)' } as const;
const slipStyle = { width: '100%', maxWidth: 320, borderRadius: 16, border: '1px solid rgba(255,255,255,.12)' } as const;
const infoRowStyle = { display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', flexWrap: 'wrap' as const, border: '1px solid rgba(255,255,255,.10)', borderRadius: 14, padding: 10, background: 'rgba(255,255,255,.04)', overflowWrap: 'anywhere' as const };
const copyButtonStyle = { border: '1px solid rgba(245,197,66,.35)', borderRadius: 999, padding: '8px 10px', background: 'rgba(245,197,66,.14)', color: '#f5c542', fontWeight: 900, cursor: 'pointer' } as const;
function amountButtonStyle(active: boolean) { return { padding: 14, minHeight: 52, borderRadius: 18, border: active ? '2px solid #f5c542' : '1px solid rgba(255,255,255,.14)', background: active ? 'rgba(245,197,66,.18)' : 'rgba(255,255,255,.08)', color: active ? '#f5c542' : '#fff', fontWeight: 900, width: '100%' }; }
function methodStyle(active: boolean, enabled: boolean) { return { display: 'grid', gap: 4, textAlign: 'left' as const, padding: 14, minHeight: 58, borderRadius: 18, border: active ? '2px solid #f5c542' : '1px solid rgba(255,255,255,.14)', background: active ? 'rgba(245,197,66,.18)' : 'rgba(255,255,255,.08)', color: active ? '#f5c542' : '#fff', opacity: enabled ? 1 : 0.45, width: '100%' }; }
