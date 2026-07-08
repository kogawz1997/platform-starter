'use client';

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import { memberApiFetch } from '../member-api';

type TopUpItem = { id: string; amount: string; currency: string; status: string; method?: string | null; note?: string | null; adminNote?: string | null; createdAt: string };
type ReceivingAccount = { id: string; bankName: string; accountName: string; accountNumber: string; promptPay?: string | null; qrImageUrl?: string | null; minAmount?: string | null; maxAmount?: string | null; sortOrder?: number };
type MethodCode = 'bank_transfer' | 'promptpay' | 'wallet' | 'other';

type DepositStep = 'select' | 'transfer' | 'waiting';

const AMOUNTS = [100, 300, 500, 1000, 3000, 5000];
const METHODS: Record<MethodCode, { label: string; numberLabel: string }> = {
  bank_transfer: { label: 'บัญชีธนาคาร', numberLabel: 'เลขบัญชี' },
  promptpay: { label: 'พร้อมเพย์', numberLabel: 'เบอร์พร้อมเพย์' },
  wallet: { label: 'วอเลต', numberLabel: 'วอเลต' },
  other: { label: 'อื่น ๆ', numberLabel: 'รายละเอียด' },
};
const STEP_ITEMS: { key: DepositStep; title: string; caption: string }[] = [
  { key: 'select', title: 'เลือกยอด', caption: 'ยอดและช่องทาง' },
  { key: 'transfer', title: 'โอนเงิน', caption: 'แนบสลิป' },
  { key: 'waiting', title: 'รอตรวจสอบ', caption: 'ติดตามสถานะ' },
];

export default function DepositClient() {
  const [step, setStep] = useState<DepositStep>('select');
  const [amount, setAmount] = useState('500');
  const [method, setMethod] = useState<MethodCode>('bank_transfer');
  const [accounts, setAccounts] = useState<ReceivingAccount[]>([]);
  const [history, setHistory] = useState<TopUpItem[]>([]);
  const [selected, setSelected] = useState<ReceivingAccount | null>(null);
  const [slipImageData, setSlipImageData] = useState('');
  const [slipImageName, setSlipImageName] = useState('');
  const [note, setNote] = useState('');
  const [message, setMessage] = useState('กำลังโหลด...');
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
    if (!historyRes.ok || !accountRes.ok) setMessage(historyData?.message ?? accountData?.message ?? 'โหลดข้อมูลไม่สำเร็จ'); else setMessage('');
  }

  async function copyText(value: string, label: string) {
    try { await navigator.clipboard.writeText(value); setMessage(`คัดลอก${label}แล้ว`); }
    catch { setMessage(`คัดลอก${label}ไม่สำเร็จ`); }
  }

  async function nextStep(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) { setMessage('กรุณาใส่จำนวนเงินมากกว่า 0'); return; }
    setLoading(true); setMessage('กำลังเตรียมข้อมูล...');
    const res = await memberApiFetch(`/member/receiving-bank-account?paymentType=${encodeURIComponent(method)}&amount=${encodeURIComponent(String(parsedAmount))}`);
    const data = await res.json().catch(() => null); setLoading(false);
    if (!res.ok || !data?.item) { setMessage(data?.message ?? 'ยังไม่มีบัญชีธนาคารสำหรับช่องทางนี้'); return; }
    setSelected(data.item); setMessage(''); setStep('transfer');
  }

  async function uploadSlip(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; if (!file) return;
    if (!file.type.startsWith('image/')) { setMessage('กรุณาเลือกไฟล์รูปภาพ'); return; }
    setMessage('กำลังเตรียมรูปสลิป...');
    const imageData = await resizeImage(file, 900, 0.72); setSlipImageName(file.name); setSlipImageData(imageData); setMessage('แนบสลิปแล้ว');
  }

  async function submit() {
    if (!selected) { setMessage('ไม่พบบัญชีธนาคาร'); return; }
    if (!slipImageData) { setMessage('กรุณาแนบสลิปก่อน'); return; }
    setLoading(true); setMessage('กำลังอัปโหลดสลิป...');
    const slipRes = await memberApiFetch('/member/topups/slip', { method: 'POST', body: JSON.stringify({ slipImageData, slipImageName }) });
    const slipData = await slipRes.json().catch(() => null);
    if (!slipRes.ok) { setLoading(false); setMessage(slipData?.message ?? 'อัปโหลดสลิปไม่สำเร็จ'); return; }
    setMessage('กำลังส่งรายการ...');
    const proofNote = JSON.stringify({ userNote: note, slipImageName: slipData.slipImageName ?? slipImageName, slipFileId: slipData.slipFileId, storage: 'private', paymentType: method, receivingBankAccountId: selected.id, receivingBank: selected });
    const res = await memberApiFetch('/member/topups', { method: 'POST', body: JSON.stringify({ amount: parsedAmount, method, note: proofNote }) });
    const data = await res.json().catch(() => null); setLoading(false);
    if (!res.ok) { setMessage(data?.message ?? 'ส่งรายการไม่สำเร็จ'); return; }
    setHistory((current) => [data, ...current]); setSlipImageData(''); setSlipImageName(''); setNote(''); setMessage('ส่งรายการแล้ว'); setStep('waiting');
  }

  return (
    <main style={pageStyle}>
      <a href="/" style={backStyle}>← หน้าแรก</a>
      <section style={heroStyle}>
        <div>
          <p style={mutedStyle}>ฝากเงินเข้ากระเป๋า</p>
          <h1 style={titleStyle}>ฝาก</h1>
        </div>
        <span style={heroBadgeStyle}>รอตรวจสอบโดยแอดมิน</span>
      </section>
      <StepProgress current={step} />
      {message && <div style={noticeStyle}>{message}</div>}

      {step === 'select' && (
        <form onSubmit={nextStep} style={cardStyle}>
          <div style={cardHeaderStyle}><span>ขั้นตอนที่ 1</span><h2 style={sectionHeadingStyle}>เลือกยอดและช่องทาง</h2><p style={mutedStyle}>เลือกยอดที่ต้องการฝาก แล้วระบบจะแสดงบัญชีธนาคารที่รองรับยอดนี้</p></div>
          <div style={amountGridStyle}>{AMOUNTS.map((value) => <button key={value} type="button" onClick={() => setAmount(String(value))} style={amountButtonStyle(Number(amount) === value)}>฿{value.toLocaleString('th-TH')}</button>)}</div>
          <label style={labelStyle}>จำนวนเงิน<input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" style={inputStyle} /></label>
          <div style={methodGridStyle}>{(['bank_transfer', 'promptpay', 'wallet', 'other'] as MethodCode[]).map((code) => { const enabled = usable.some((account) => accountType(account) === code); return <button key={code} type="button" disabled={!enabled} onClick={() => enabled && setMethod(code)} style={methodStyle(method === code, enabled)}><strong>{METHODS[code].label}</strong><span>{enabled ? 'พร้อมใช้งาน' : 'ยังไม่เปิดใช้งาน'}</span></button>; })}</div>
          <button type="submit" disabled={loading} style={primaryButtonStyle}>{loading ? 'กำลังเตรียม...' : 'ถัดไป'}</button>
        </form>
      )}

      {step === 'transfer' && selected && (
        <section style={cardStyle}>
          <div style={cardHeaderStyle}><span>ขั้นตอนที่ 2</span><h2 style={sectionHeadingStyle}>โอนเงินและแนบสลิป</h2><p style={mutedStyle}>โอนยอดให้ตรงกับรายการ แล้วแนบสลิปก่อนส่งตรวจสอบ</p></div>
          <section style={transferSummaryStyle}><span>ยอดฝาก</span><strong>฿{parsedAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</strong><em>{METHODS[method].label}</em></section>
          <section style={boxStyle}>
            <InfoRow label="ชื่อบัญชี" value={selected.accountName} />
            <InfoRow label={METHODS[method].numberLabel} value={selected.accountNumber} action={<button type="button" onClick={() => copyText(selected.accountNumber, METHODS[method].numberLabel)} style={copyButtonStyle}>คัดลอก</button>} />
            {selected.promptPay && <InfoRow label="PromptPay" value={selected.promptPay} action={<button type="button" onClick={() => copyText(selected.promptPay ?? '', 'พร้อมเพย์')} style={copyButtonStyle}>คัดลอก</button>} />}
            {selected.qrImageUrl && <img src={selected.qrImageUrl} alt="QR" style={qrStyle} />}
          </section>
          <label style={labelStyle}>แนบสลิป<input type="file" accept="image/*" onChange={uploadSlip} style={inputStyle} /></label>
          {slipImageData && <section style={previewBoxStyle}><strong>สลิป</strong><img src={slipImageData} alt="slip" style={slipStyle} /></section>}
          <label style={labelStyle}>หมายเหตุ<textarea value={note} onChange={(e) => setNote(e.target.value)} style={textareaStyle} placeholder="รายละเอียดเพิ่มเติม ถ้ามี" /></label>
          <div style={actionRowStyle}><button type="button" onClick={() => setStep('select')} style={secondaryButtonStyle}>ย้อนกลับ</button><button type="button" onClick={submit} disabled={loading || !slipImageData} style={primaryButtonStyle}>{loading ? 'กำลังส่ง...' : 'ส่งรายการ'}</button></div>
        </section>
      )}

      {step === 'waiting' && (
        <section style={cardStyle}>
          <div style={cardHeaderStyle}><span>ขั้นตอนที่ 3</span><h2 style={sectionHeadingStyle}>รอตรวจสอบ</h2><p style={mutedStyle}>ระบบรับรายการแล้ว รอแอดมินตรวจสอบสลิปและปรับยอดเข้ากระเป๋า</p></div>
          <div style={successBoxStyle}>รายการฝากถูกส่งแล้ว</div>
          <div style={actionRowStyle}><a href="/transactions" style={secondaryLinkStyle}>ดูประวัติ</a><button type="button" onClick={() => setStep('select')} style={primaryButtonStyle}>ฝากอีกครั้ง</button></div>
        </section>
      )}

      <section style={historySectionStyle}>
        <div style={historyHeadStyle}><h2 style={sectionHeadingStyle}>ประวัติ</h2><a href="/transactions" style={backStyle}>ทั้งหมด</a></div>
        {history.map((item) => <section key={item.id} style={historyCardStyle}><div style={historyTopStyle}><strong>{item.currency} {Number(item.amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</strong><span style={statusBadgeStyle(item.status)}>{statusLabel(item.status)}</span></div><p style={mutedStyle}>ช่องทาง: {methodLabel(item.method)}</p><p style={mutedStyle}>{new Date(item.createdAt).toLocaleString('th-TH')}</p>{item.adminNote && <p style={mutedStyle}>หมายเหตุ: {item.adminNote}</p>}</section>)}
        {history.length === 0 && <div style={noticeStyle}>ยังไม่มีรายการ</div>}
      </section>
    </main>
  );
}

function StepProgress({ current }: { current: DepositStep }) {
  const currentIndex = STEP_ITEMS.findIndex((item) => item.key === current);
  return <section style={stepperStyle}>{STEP_ITEMS.map((item, index) => <div key={item.key} style={stepItemStyle(index <= currentIndex)}><strong>{index + 1}</strong><div><span>{item.title}</span><small>{item.caption}</small></div></div>)}</section>;
}
function InfoRow({ label, value, action }: { label: string; value: string; action?: React.ReactNode }) { return <div style={infoRowStyle}><div style={{ minWidth: 0 }}><span>{label}</span><strong>{value}</strong></div>{action}</div>; }
function accountType(account: ReceivingAccount): MethodCode { if (account.bankName === 'พร้อมเพย์') return 'promptpay'; if (account.bankName === 'วอเลต') return 'wallet'; if (account.bankName === 'อื่น ๆ') return 'other'; return 'bank_transfer'; }
function matchAmount(account: ReceivingAccount, amount: number) { const min = account.minAmount ? Number(account.minAmount) : 0; const max = account.maxAmount ? Number(account.maxAmount) : Infinity; if (!Number.isFinite(amount) || amount <= 0) return true; return amount >= min && amount <= max; }
function methodLabel(value?: string | null) { if (value === 'bank_transfer') return 'บัญชีธนาคาร'; if (value === 'promptpay') return 'พร้อมเพย์'; if (value === 'wallet') return 'วอเลต'; return value || '-'; }
function statusLabel(status: string) { if (status === 'PENDING') return 'รอตรวจสอบ'; if (status === 'APPROVED' || status === 'COMPLETED') return 'สำเร็จ'; if (status === 'REJECTED') return 'ไม่อนุมัติ'; return status; }
function resizeImage(file: File, maxSize: number, quality: number) { return new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => { const img = new Image(); img.onload = () => { const scale = Math.min(1, maxSize / Math.max(img.width, img.height)); const canvas = document.createElement('canvas'); canvas.width = Math.round(img.width * scale); canvas.height = Math.round(img.height * scale); const ctx = canvas.getContext('2d'); if (!ctx) return reject(new Error('อ่านรูปไม่ได้')); ctx.drawImage(img, 0, 0, canvas.width, canvas.height); resolve(canvas.toDataURL('image/jpeg', quality)); }; img.onerror = () => reject(new Error('อ่านรูปไม่ได้')); img.src = String(reader.result); }; reader.onerror = () => reject(new Error('อ่านรูปไม่ได้')); reader.readAsDataURL(file); }); }

const pageStyle = { minHeight: '100vh', background: '#080808', color: '#fff', padding: '18px 12px calc(120px + env(safe-area-inset-bottom))', display: 'grid', gap: 14, width: '100%', maxWidth: 920, margin: '0 auto', overflowX: 'hidden' as const } as const;
const backStyle = { color: '#f5c542', textDecoration: 'none', fontWeight: 900 } as const;
const titleStyle = { margin: 0, fontSize: 'clamp(34px,11vw,58px)', lineHeight: 0.98, overflowWrap: 'anywhere' as const };
const mutedStyle = { margin: 0, opacity: 0.76, lineHeight: 1.55, overflowWrap: 'anywhere' as const } as const;
const heroStyle = { border: '1px solid rgba(255,255,255,.12)', borderRadius: 28, padding: 16, background: 'radial-gradient(circle at top right, rgba(245,197,66,.18), transparent 34%), #181818', display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', minWidth: 0, overflow: 'hidden' as const } as const;
const heroBadgeStyle = { border: '1px solid rgba(245,197,66,.32)', borderRadius: 999, padding: '8px 10px', background: 'rgba(245,197,66,.12)', color: '#f5c542', fontSize: 12, fontWeight: 950, whiteSpace: 'nowrap' as const };
const cardStyle = { border: '1px solid rgba(255,255,255,.12)', borderRadius: 24, padding: 16, background: '#181818', display: 'grid', gap: 12, minWidth: 0, overflow: 'hidden' as const };
const cardHeaderStyle = { display: 'grid', gap: 5, minWidth: 0 } as const;
const sectionHeadingStyle = { margin: 0, fontSize: 'clamp(22px,7vw,30px)', lineHeight: 1.1 } as const;
const labelStyle = { display: 'grid', gap: 8, fontWeight: 800, minWidth: 0 } as const;
const inputStyle = { width: '100%', padding: '13px 14px', borderRadius: 14, border: '1px solid rgba(255,255,255,.16)', background: '#242424', color: '#fff', boxSizing: 'border-box' as const, fontSize: 16 };
const textareaStyle = { ...inputStyle, minHeight: 96, resize: 'vertical' as const };
const amountGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 10 } as const;
const methodGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(180px,100%),1fr))', gap: 10 } as const;
const primaryButtonStyle = { padding: 14, minHeight: 48, borderRadius: 16, cursor: 'pointer', background: '#f5c542', color: '#111', border: 0, fontWeight: 900, width: '100%', textDecoration: 'none', display: 'grid', placeItems: 'center' } as const;
const secondaryButtonStyle = { padding: 14, minHeight: 48, borderRadius: 16, cursor: 'pointer', background: 'rgba(255,255,255,.08)', color: '#fff', border: '1px solid rgba(255,255,255,.14)', fontWeight: 900, width: '100%' } as const;
const secondaryLinkStyle = { ...secondaryButtonStyle, textDecoration: 'none', display: 'grid', placeItems: 'center' } as const;
const actionRowStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(150px, 100%), 1fr))', gap: 10 } as const;
const noticeStyle = { border: '1px solid rgba(255,255,255,.12)', borderRadius: 16, padding: 12, background: 'rgba(255,255,255,.07)', overflowWrap: 'anywhere' as const };
const boxStyle = { border: '1px solid rgba(255,255,255,.10)', borderRadius: 20, padding: 14, background: 'rgba(255,255,255,.04)', overflow: 'hidden' as const, display: 'grid', gap: 10 };
const transferSummaryStyle = { border: '1px solid rgba(245,197,66,.24)', borderRadius: 22, padding: 14, background: 'rgba(245,197,66,.10)', display: 'grid', gap: 5, minWidth: 0 } as const;
const qrStyle = { width: 220, maxWidth: '100%', borderRadius: 18, border: '1px solid rgba(255,255,255,.14)' } as const;
const previewBoxStyle = { border: '1px solid rgba(255,255,255,.10)', borderRadius: 18, padding: 12, background: 'rgba(255,255,255,.04)', display: 'grid', gap: 10, minWidth: 0 } as const;
const slipStyle = { width: '100%', maxWidth: 520, maxHeight: 560, objectFit: 'contain' as const, borderRadius: 16, border: '1px solid rgba(255,255,255,.12)', background: '#050505' } as const;
const infoRowStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(180px, 100%), 1fr))', gap: 10, alignItems: 'center', border: '1px solid rgba(255,255,255,.10)', borderRadius: 14, padding: 10, background: 'rgba(255,255,255,.04)', overflowWrap: 'anywhere' as const };
const copyButtonStyle = { minHeight: 40, border: '1px solid rgba(245,197,66,.35)', borderRadius: 999, padding: '8px 10px', background: 'rgba(245,197,66,.14)', color: '#f5c542', fontWeight: 900, cursor: 'pointer' } as const;
const historySectionStyle = { display: 'grid', gap: 10, minWidth: 0 } as const;
const historyHeadStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 } as const;
const historyCardStyle = { border: '1px solid rgba(255,255,255,.10)', borderRadius: 20, padding: 14, background: '#151515', display: 'grid', gap: 8, minWidth: 0, overflow: 'hidden' as const };
const historyTopStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(160px, 100%), 1fr))', gap: 8, alignItems: 'center' } as const;
const stepperStyle = { border: '1px solid rgba(255,255,255,.10)', borderRadius: 22, padding: 8, background: 'rgba(255,255,255,.045)', display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 6, minWidth: 0 } as const;
const successBoxStyle = { border: '1px solid rgba(101,217,139,.30)', borderRadius: 18, padding: 14, background: 'rgba(101,217,139,.10)', color: '#a9ffc4', fontWeight: 950 } as const;
function stepItemStyle(active: boolean) { return { border: '1px solid rgba(255,255,255,.10)', borderRadius: 16, padding: 10, background: active ? 'rgba(245,197,66,.16)' : 'rgba(255,255,255,.04)', display: 'grid', gap: 5, color: active ? '#f5c542' : 'rgba(255,255,255,.68)', minWidth: 0 }; }
function amountButtonStyle(active: boolean) { return { padding: 14, minHeight: 52, borderRadius: 18, border: active ? '2px solid #f5c542' : '1px solid rgba(255,255,255,.14)', background: active ? 'rgba(245,197,66,.18)' : 'rgba(255,255,255,.08)', color: active ? '#f5c542' : '#fff', fontWeight: 900, width: '100%' }; }
function methodStyle(active: boolean, enabled: boolean) { return { display: 'grid', gap: 4, textAlign: 'left' as const, padding: 14, minHeight: 58, borderRadius: 18, border: active ? '2px solid #f5c542' : '1px solid rgba(255,255,255,.14)', background: active ? 'rgba(245,197,66,.18)' : 'rgba(255,255,255,.08)', color: active ? '#f5c542' : '#fff', opacity: enabled ? 1 : 0.45, width: '100%' }; }
function statusBadgeStyle(status: string) { return { width: 'fit-content', borderRadius: 999, padding: '6px 10px', background: status === 'APPROVED' || status === 'COMPLETED' ? 'rgba(80,255,140,.14)' : status === 'REJECTED' ? 'rgba(255,80,80,.14)' : 'rgba(245,197,66,.14)', border: '1px solid rgba(255,255,255,.12)', fontSize: 12, fontWeight: 900 }; }
