'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { memberApiFetch } from '../member-api';

type WalletResponse = { currency: string; availableBalance: string; lockedBalance: string; status: string };
type WithdrawalItem = { id: string; amount: string; currency: string; status: string; method?: string | null; accountName?: string | null; accountNumber?: string | null; bankName?: string | null; note?: string | null; adminNote?: string | null; createdAt: string };
type BankItem = { id: string; bankName: string; accountName: string; accountNumber: string; isPrimary: boolean; status: string };
type WithdrawStep = 'account' | 'amount' | 'confirm' | 'waiting';

const STEP_ITEMS: { key: WithdrawStep; title: string; caption: string }[] = [
  { key: 'account', title: 'เลือกบัญชี', caption: 'บัญชีปลายทาง' },
  { key: 'amount', title: 'ใส่ยอด', caption: 'ยอดที่ต้องการถอน' },
  { key: 'confirm', title: 'ยืนยัน', caption: 'ตรวจสอบข้อมูล' },
  { key: 'waiting', title: 'รอดำเนินการ', caption: 'ติดตามสถานะ' },
];

export default function WithdrawPage() {
  const [step, setStep] = useState<WithdrawStep>('account');
  const [wallet, setWallet] = useState<WalletResponse | null>(null);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('bank_transfer');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccountId, setBankAccountId] = useState('');
  const [banks, setBanks] = useState<BankItem[]>([]);
  const [note, setNote] = useState('');
  const [items, setItems] = useState<WithdrawalItem[]>([]);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setIsLoading(true);
    const [walletRes, listRes, bankRes] = await Promise.all([memberApiFetch('/member/wallet'), memberApiFetch('/member/withdrawals'), memberApiFetch('/member/bank-accounts')]);
    const walletData = await walletRes.json().catch(() => null);
    const listData = await listRes.json().catch(() => null);
    const bankData = await bankRes.json().catch(() => null);
    if (walletRes.ok) setWallet(walletData);
    if (listRes.ok) setItems(listData.items ?? []);
    if (bankRes.ok) {
      const nextBanks = bankData.items ?? [];
      setBanks(nextBanks);
      const primary = nextBanks.find((item: BankItem) => item.isPrimary && item.status === 'ACTIVE') ?? nextBanks.find((item: BankItem) => item.status === 'ACTIVE');
      if (primary && !bankAccountId) chooseBank(primary.id, nextBanks);
    }
    if (!walletRes.ok || !listRes.ok || !bankRes.ok) setMessage(walletData?.message ?? listData?.message ?? bankData?.message ?? 'โหลดข้อมูลไม่สำเร็จ');
    setIsLoading(false);
  }

  async function copyText(value: string, label: string) {
    try { await navigator.clipboard.writeText(value); setMessage(`คัดลอก${label}แล้ว`); }
    catch { setMessage(`คัดลอก${label}ไม่สำเร็จ`); }
  }

  function chooseBank(id: string, source = banks) {
    setBankAccountId(id);
    const selected = source.find((item) => item.id === id);
    if (!selected) { setBankName(''); setAccountName(''); setAccountNumber(''); return; }
    setBankName(selected.bankName);
    setAccountName(selected.accountName);
    setAccountNumber(selected.accountNumber);
  }

  function goAmount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const selected = banks.find((item) => item.id === bankAccountId && item.status === 'ACTIVE');
    if (!selected) { setMessage('กรุณาเลือกบัญชีธนาคารที่อนุมัติแล้ว'); return; }
    setMessage('');
    setStep('amount');
  }

  function goConfirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsedAmount = Number(amount.replace(/,/g, '').trim());
    const available = wallet ? Number(wallet.availableBalance) : 0;
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) { setMessage('กรุณาใส่จำนวนเงินมากกว่า 0'); return; }
    if (wallet && parsedAmount > available) { setMessage('ยอดถอนมากกว่ายอดที่ถอนได้'); return; }
    setMessage('');
    setStep('confirm');
  }

  function openConfirmModal() {
    const selected = banks.find((item) => item.id === bankAccountId && item.status === 'ACTIVE');
    if (!selected) { setMessage('กรุณาเลือกบัญชีธนาคารที่อนุมัติแล้ว'); return; }
    setConfirmOpen(true);
  }

  async function submit() {
    const parsedAmount = Number(amount.replace(/,/g, '').trim());
    const selected = banks.find((item) => item.id === bankAccountId && item.status === 'ACTIVE');
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) { setMessage('กรุณาใส่จำนวนเงินมากกว่า 0'); return; }
    if (!selected) { setMessage('กรุณาเลือกบัญชีธนาคารที่อนุมัติแล้ว'); return; }
    setConfirmOpen(false);
    setIsSubmitting(true); setMessage('กำลังส่งคำขอถอน...');
    const res = await memberApiFetch('/member/withdrawals', { method: 'POST', body: JSON.stringify({ amount: parsedAmount, method, accountName: selected.accountName, accountNumber: selected.accountNumber, bankName: selected.bankName, note }) });
    const data = await res.json().catch(() => null); setIsSubmitting(false);
    if (!res.ok) { setMessage(data?.message ?? 'ส่งคำขอถอนไม่สำเร็จ'); return; }
    setAmount(''); setNote(''); setItems((current) => [data, ...current]); setMessage('ส่งคำขอถอนสำเร็จ'); setStep('waiting'); await loadAll();
  }

  const activeBanks = useMemo(() => banks.filter((item) => item.status === 'ACTIVE'), [banks]);
  const hasSelectedBank = Boolean(bankName && accountName && accountNumber);
  const parsedAmount = Number(amount.replace(/,/g, '').trim());
  const availableText = wallet ? `${wallet.currency} ${Number(wallet.availableBalance).toLocaleString('th-TH', { minimumFractionDigits: 2 })}` : 'THB 0.00';

  return (
    <main style={pageStyle}>
      <a href="/" style={backStyle}>← หน้าแรก</a>
      <section style={heroCardStyle}><p style={mutedStyle}>ยอดที่ถอนได้</p><h1 style={amountTitleStyle}>{availableText}</h1>{wallet && <div style={walletMetaStyle}><span>รอดำเนินการ: {Number(wallet.lockedBalance).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span><span>{wallet.status === 'ACTIVE' ? 'ใช้งานได้' : wallet.status}</span></div>}</section>
      <h1 style={titleStyle}>ถอนเงิน</h1>
      <StepProgress current={step} />
      {isLoading && <div style={noticeStyle}>กำลังโหลด...</div>}
      {message && <div style={noticeStyle}>{message}</div>}

      {step === 'account' && (
        <form onSubmit={goAmount} style={cardStyle}>
          <div style={cardHeaderStyle}><span>ขั้นตอนที่ 1</span><h2 style={sectionTitleStyle}>เลือกบัญชี</h2><p style={mutedStyle}>เลือกบัญชีธนาคารปลายทางที่อนุมัติแล้วสำหรับรับเงินถอน</p></div>
          <label style={labelStyle}>ช่องทาง<select value={method} onChange={(e) => setMethod(e.target.value)} style={inputStyle}><option value="bank_transfer">โอนธนาคาร</option></select></label>
          <label style={labelStyle}>บัญชีธนาคาร<select value={bankAccountId} onChange={(e) => chooseBank(e.target.value)} style={inputStyle}><option value="">เลือกบัญชี</option>{banks.map((item) => <option key={item.id} value={item.id} disabled={item.status !== 'ACTIVE'}>{item.bankName} / {item.accountNumber} {item.isPrimary ? '(หลัก)' : ''} {item.status !== 'ACTIVE' ? `- ${item.status}` : ''}</option>)}</select></label>
          {!isLoading && activeBanks.length === 0 && <EmptyAction title="ยังไม่มีบัญชีธนาคารที่ใช้ถอนได้" description="เพิ่มบัญชีธนาคารแล้วรออนุมัติก่อนส่งคำขอถอน" actionHref="/bank-accounts" actionLabel="การจัดการบัญชีธนาคาร" />}
          {activeBanks.length > 0 && <a href="/bank-accounts" style={bankLinkStyle}>การจัดการบัญชีธนาคาร</a>}
          {hasSelectedBank && <BankPreview bankName={bankName} accountName={accountName} accountNumber={accountNumber} onCopy={copyText} />}
          <WarningBox text="ตรวจสอบชื่อบัญชี เลขบัญชี และธนาคารให้ถูกต้องก่อนถอน เพราะแอดมินจะใช้ข้อมูลนี้เป็นปลายทางการโอน" />
          <button type="submit" disabled={activeBanks.length === 0} style={buttonStyle}>ถัดไป</button>
        </form>
      )}

      {step === 'amount' && (
        <form onSubmit={goConfirm} style={cardStyle}>
          <div style={cardHeaderStyle}><span>ขั้นตอนที่ 2</span><h2 style={sectionTitleStyle}>ใส่ยอดถอน</h2><p style={mutedStyle}>ยอดถอนต้องไม่เกินยอดที่ถอนได้</p></div>
          {hasSelectedBank && <BankPreview bankName={bankName} accountName={accountName} accountNumber={accountNumber} onCopy={copyText} compact />}
          <label style={labelStyle}>จำนวนเงิน<input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" placeholder="เช่น 100" style={inputStyle} /></label>
          <label style={labelStyle}>หมายเหตุ<textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="รายละเอียดเพิ่มเติม ถ้ามี" style={textareaStyle} /></label>
          <WarningBox text="ยอดถอนจะถูกส่งเป็นคำขอให้แอดมินดำเนินการ ไม่ใช่โอนออกทันที" />
          <div style={actionRowStyle}><button type="button" onClick={() => setStep('account')} style={secondaryButtonStyle}>ย้อนกลับ</button><button type="submit" style={buttonStyle}>ถัดไป</button></div>
        </form>
      )}

      {step === 'confirm' && (
        <section style={cardStyle}>
          <div style={cardHeaderStyle}><span>ขั้นตอนที่ 3</span><h2 style={sectionTitleStyle}>ยืนยันคำขอถอน</h2><p style={mutedStyle}>ตรวจสอบข้อมูลให้ถูกต้องก่อนส่งคำขอ</p></div>
          <section style={confirmBoxStyle}><span>ยอดถอน</span><strong>THB {Number.isFinite(parsedAmount) ? parsedAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 }) : '0.00'}</strong></section>
          {hasSelectedBank && <BankPreview bankName={bankName} accountName={accountName} accountNumber={accountNumber} onCopy={copyText} compact />}
          {note && <div style={noticeStyle}>หมายเหตุ: {note}</div>}
          <WarningBox text="กดยืนยันเฉพาะเมื่อข้อมูลบัญชีปลายทางถูกต้องแล้ว รายการนี้จะเข้าสู่คิวตรวจสอบของแอดมิน" />
          <div style={actionRowStyle}><button type="button" onClick={() => setStep('amount')} style={secondaryButtonStyle}>แก้ไข</button><button type="button" onClick={openConfirmModal} disabled={isSubmitting} style={buttonStyle}>{isSubmitting ? 'กำลังส่ง...' : 'ตรวจสอบก่อนส่ง'}</button></div>
        </section>
      )}

      {step === 'waiting' && (
        <section style={cardStyle}>
          <div style={cardHeaderStyle}><span>ขั้นตอนที่ 4</span><h2 style={sectionTitleStyle}>รอดำเนินการ</h2><p style={mutedStyle}>ระบบรับคำขอถอนแล้ว รอแอดมินตรวจสอบและดำเนินการ</p></div>
          <div style={successBoxStyle}>คำขอถอนถูกส่งแล้ว</div>
          <div style={actionRowStyle}><a href="/transactions" style={secondaryLinkStyle}>ดูประวัติ</a><button type="button" onClick={() => setStep('account')} style={buttonStyle}>ถอนอีกครั้ง</button></div>
        </section>
      )}

      {confirmOpen && <SummaryModal title="ตรวจสอบคำขอถอน" onClose={() => setConfirmOpen(false)} onConfirm={submit} loading={isSubmitting} confirmLabel="ยืนยันถอนเงิน">
        <InfoRow label="ยอดถอน" value={`THB ${Number.isFinite(parsedAmount) ? parsedAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 }) : '0.00'}`} />
        <InfoRow label="ช่องทาง" value="โอนธนาคาร" />
        <InfoRow label="บัญชีธนาคาร" value={`${bankName} / ${accountName} / ${accountNumber}`} />
        {note && <InfoRow label="หมายเหตุ" value={note} />}
        <WarningBox text="หลังยืนยัน ระบบจะส่งคำขอถอนให้แอดมิน กรุณาตรวจบัญชีปลายทางให้ถูกต้องก่อนส่ง" />
      </SummaryModal>}

      <section style={historySectionStyle}>
        <h2 style={sectionTitleStyle}>ประวัติถอนเงิน</h2>
        <div style={listStyle}>{items.map((item) => <section key={item.id} style={historyCardStyle}><div style={historyTopStyle}><strong>{item.currency} {Number(item.amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</strong><span style={statusBadgeStyle(item.status)}>{statusLabel(item.status)}</span></div><p style={mutedStyle}>บัญชี: {item.bankName || '-'} / {item.accountNumber || '-'}</p><p style={mutedStyle}>{new Date(item.createdAt).toLocaleString('th-TH')}</p>{item.adminNote && <p style={mutedStyle}>หมายเหตุ: {item.adminNote}</p>}</section>)}{items.length === 0 && <EmptyAction title="ยังไม่มีรายการถอน" description="เมื่อส่งคำขอถอน รายการจะแสดงตรงนี้" actionHref="/withdraw" actionLabel="ถอนเงิน" />}</div>
      </section>
    </main>
  );
}

function StepProgress({ current }: { current: WithdrawStep }) {
  const currentIndex = STEP_ITEMS.findIndex((item) => item.key === current);
  return <section style={stepperStyle}>{STEP_ITEMS.map((item, index) => <div key={item.key} style={stepItemStyle(index <= currentIndex)}><strong>{index + 1}</strong><div><span>{item.title}</span><small>{item.caption}</small></div></div>)}</section>;
}
function BankPreview({ bankName, accountName, accountNumber, onCopy, compact = false }: { bankName: string; accountName: string; accountNumber: string; onCopy: (value: string, label: string) => void; compact?: boolean }) {
  return <section style={compact ? compactAccountBoxStyle : accountBoxStyle}><InfoRow label="ชื่อบัญชี" value={accountName} /><InfoRow label="เลขบัญชี" value={accountNumber} action={<button type="button" onClick={() => onCopy(accountNumber, 'เลขบัญชี')} style={copyButtonStyle}>คัดลอก</button>} /><InfoRow label="ธนาคาร" value={bankName} action={<button type="button" onClick={() => onCopy(bankName, 'ชื่อธนาคาร')} style={copyButtonStyle}>คัดลอก</button>} /></section>;
}
function InfoRow({ label, value, action }: { label: string; value: string; action?: React.ReactNode }) { return <div style={infoRowStyle}><div style={{ minWidth: 0 }}><span>{label}</span><strong>{value}</strong></div>{action}</div>; }
function WarningBox({ text }: { text: string }) { return <div style={warningStyle}>⚠️ {text}</div>; }
function EmptyAction({ title, description, actionHref, actionLabel }: { title: string; description: string; actionHref: string; actionLabel: string }) { return <div style={emptyStyle}><div><strong>{title}</strong><span>{description}</span></div><a href={actionHref}>{actionLabel}</a></div>; }
function SummaryModal({ title, children, onClose, onConfirm, loading, confirmLabel }: { title: string; children: React.ReactNode; onClose: () => void; onConfirm: () => void; loading: boolean; confirmLabel: string }) { return <div style={modalBackdropStyle}><section style={modalStyle}><div style={modalHeadStyle}><h2 style={sectionTitleStyle}>{title}</h2><button type="button" onClick={onClose} style={closeButtonStyle}>×</button></div>{children}<div style={actionRowStyle}><button type="button" onClick={onClose} style={secondaryButtonStyle}>แก้ไข</button><button type="button" onClick={onConfirm} disabled={loading} style={buttonStyle}>{loading ? 'กำลังส่ง...' : confirmLabel}</button></div></section></div>; }
function statusLabel(status: string) { if (status === 'PENDING') return 'รอดำเนินการ'; if (status === 'APPROVED' || status === 'COMPLETED') return 'สำเร็จ'; if (status === 'REJECTED') return 'ไม่อนุมัติ'; return status; }

const pageStyle = { minHeight: '100vh', background: '#080808', color: '#fff', padding: '18px 12px calc(120px + env(safe-area-inset-bottom))', display: 'grid', gap: 14, width: '100%', maxWidth: 920, margin: '0 auto', overflowX: 'hidden' as const } as const;
const backStyle = { color: '#f5c542', textDecoration: 'none', fontWeight: 900 } as const;
const titleStyle = { margin: 0, fontSize: 'clamp(34px, 11vw, 58px)', lineHeight: 0.98, letterSpacing: -1.2, overflowWrap: 'anywhere' as const };
const mutedStyle = { margin: 0, opacity: 0.76, lineHeight: 1.55, overflowWrap: 'anywhere' as const };
const heroCardStyle = { border: '1px solid rgba(255,255,255,0.12)', borderRadius: 24, padding: 14, background: '#181818', display: 'grid', gap: 8, minWidth: 0, overflow: 'hidden' as const };
const walletMetaStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(150px, 100%), 1fr))', gap: 8, color: 'rgba(255,255,255,.72)' } as const;
const cardStyle = { border: '1px solid rgba(255,255,255,0.12)', borderRadius: 24, padding: 16, background: '#181818', display: 'grid', gap: 12, minWidth: 0, overflow: 'hidden' as const };
const cardHeaderStyle = { display: 'grid', gap: 5, minWidth: 0 } as const;
const amountTitleStyle = { margin: '4px 0', fontSize: 'clamp(30px, 9vw, 50px)', lineHeight: 1, overflowWrap: 'anywhere' as const, color: '#f5c542' };
const sectionTitleStyle = { margin: 0, fontSize: 'clamp(24px, 7vw, 34px)' } as const;
const labelStyle = { display: 'grid', gap: 8, fontWeight: 800, minWidth: 0 } as const;
const inputStyle = { display: 'block', width: '100%', padding: '13px 14px', marginTop: 6, borderRadius: 14, border: '1px solid rgba(255,255,255,0.16)', background: '#242424', color: '#fff', boxSizing: 'border-box' as const, fontSize: 16 };
const textareaStyle = { ...inputStyle, minHeight: 96, resize: 'vertical' as const };
const buttonStyle = { padding: 14, minHeight: 48, borderRadius: 16, cursor: 'pointer', background: '#f5c542', color: '#111', border: 0, fontWeight: 900, width: '100%', textDecoration: 'none', display: 'grid', placeItems: 'center' } as const;
const secondaryButtonStyle = { padding: 14, minHeight: 48, borderRadius: 16, cursor: 'pointer', background: 'rgba(255,255,255,.08)', color: '#fff', border: '1px solid rgba(255,255,255,.14)', fontWeight: 900, width: '100%' } as const;
const secondaryLinkStyle = { ...secondaryButtonStyle, textDecoration: 'none', display: 'grid', placeItems: 'center' } as const;
const actionRowStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(150px, 100%), 1fr))', gap: 10 } as const;
const noticeStyle = { border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16, padding: 12, background: 'rgba(255,255,255,0.07)', overflowWrap: 'anywhere' as const };
const warningStyle = { border: '1px solid rgba(245,197,66,.30)', borderRadius: 16, padding: 12, background: 'rgba(245,197,66,.10)', color: '#fde68a', fontWeight: 850, lineHeight: 1.5 } as const;
const emptyStyle = { border: '1px dashed rgba(255,255,255,.18)', borderRadius: 18, padding: 14, background: 'rgba(255,255,255,.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' as const, color: 'rgba(255,255,255,.82)' };
const bankLinkStyle = { color: '#f5c542', textDecoration: 'none', fontWeight: 900 } as const;
const accountBoxStyle = { border: '1px solid rgba(245,197,66,.22)', borderRadius: 18, padding: 12, background: 'rgba(245,197,66,.06)', display: 'grid', gap: 10, minWidth: 0 };
const compactAccountBoxStyle = { ...accountBoxStyle, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.10)' } as const;
const confirmBoxStyle = { border: '1px solid rgba(245,197,66,.24)', borderRadius: 22, padding: 14, background: 'rgba(245,197,66,.10)', display: 'grid', gap: 5, minWidth: 0 } as const;
const successBoxStyle = { border: '1px solid rgba(101,217,139,.30)', borderRadius: 18, padding: 14, background: 'rgba(101,217,139,.10)', color: '#a9ffc4', fontWeight: 950 } as const;
const infoRowStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(180px, 100%), 1fr))', gap: 10, alignItems: 'center', border: '1px solid rgba(255,255,255,.10)', borderRadius: 14, padding: 10, background: 'rgba(255,255,255,.04)', overflowWrap: 'anywhere' as const };
const copyButtonStyle = { minHeight: 40, border: '1px solid rgba(245,197,66,.35)', borderRadius: 999, padding: '8px 10px', background: 'rgba(245,197,66,.14)', color: '#f5c542', fontWeight: 900, cursor: 'pointer' } as const;
const listStyle = { display: 'grid', gap: 12, minWidth: 0 } as const;
const historySectionStyle = { display: 'grid', gap: 10, minWidth: 0 } as const;
const historyCardStyle = { border: '1px solid rgba(255,255,255,0.10)', borderRadius: 20, padding: 14, background: '#151515', display: 'grid', gap: 8, minWidth: 0, overflow: 'hidden' as const };
const historyTopStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(160px, 100%), 1fr))', gap: 8, alignItems: 'center' } as const;
const stepperStyle = { border: '1px solid rgba(255,255,255,.10)', borderRadius: 22, padding: 8, background: 'rgba(255,255,255,.045)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(120px,100%),1fr))', gap: 6, minWidth: 0 } as const;
const modalBackdropStyle = { position: 'fixed' as const, inset: 0, zIndex: 90, background: 'rgba(0,0,0,.68)', display: 'grid', placeItems: 'end center', padding: 12 };
const modalStyle = { width: '100%', maxWidth: 560, maxHeight: '90dvh', overflowY: 'auto' as const, border: '1px solid rgba(255,255,255,.14)', borderRadius: 26, padding: 16, background: '#151515', color: '#fff', display: 'grid', gap: 12, boxShadow: '0 24px 90px rgba(0,0,0,.55)' };
const modalHeadStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 } as const;
const closeButtonStyle = { width: 42, height: 42, borderRadius: 14, border: '1px solid rgba(255,255,255,.14)', background: 'rgba(255,255,255,.08)', color: '#fff', fontSize: 24, cursor: 'pointer' } as const;
function stepItemStyle(active: boolean) { return { border: '1px solid rgba(255,255,255,.10)', borderRadius: 16, padding: 10, background: active ? 'rgba(245,197,66,.16)' : 'rgba(255,255,255,.04)', display: 'grid', gap: 5, color: active ? '#f5c542' : 'rgba(255,255,255,.68)', minWidth: 0 }; }
function statusBadgeStyle(status: string) { return { width: 'fit-content', border: '1px solid rgba(255,255,255,.12)', borderRadius: 999, padding: '6px 10px', background: status === 'COMPLETED' || status === 'APPROVED' ? 'rgba(34,197,94,.14)' : status === 'REJECTED' ? 'rgba(239,68,68,.14)' : 'rgba(245,197,66,.14)', color: status === 'COMPLETED' || status === 'APPROVED' ? '#bbf7d0' : status === 'REJECTED' ? '#fecaca' : '#fde68a', fontSize: 12, fontWeight: 900 }; }
