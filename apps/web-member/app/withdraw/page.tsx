'use client';

import { FormEvent, useEffect, useState } from 'react';
import { memberApiFetch } from '../member-api';

type WalletResponse = { currency: string; availableBalance: string; lockedBalance: string; status: string };
type WithdrawalItem = { id: string; amount: string; currency: string; status: string; method?: string | null; accountName?: string | null; accountNumber?: string | null; bankName?: string | null; note?: string | null; adminNote?: string | null; createdAt: string };
type BankItem = { id: string; bankName: string; accountName: string; accountNumber: string; isPrimary: boolean; status: string };

export default function WithdrawPage() {
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

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsedAmount = Number(amount.replace(/,/g, '').trim());
    const selected = banks.find((item) => item.id === bankAccountId && item.status === 'ACTIVE');
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) { setMessage('กรุณาใส่จำนวนเงินมากกว่า 0'); return; }
    if (!selected) { setMessage('กรุณาเลือกบัญชีถอนเงินที่อนุมัติแล้ว'); return; }
    setIsSubmitting(true); setMessage('กำลังส่งคำขอถอน...');
    const res = await memberApiFetch('/member/withdrawals', { method: 'POST', body: JSON.stringify({ amount: parsedAmount, method, accountName: selected.accountName, accountNumber: selected.accountNumber, bankName: selected.bankName, note }) });
    const data = await res.json().catch(() => null); setIsSubmitting(false);
    if (!res.ok) { setMessage(data?.message ?? 'ส่งคำขอถอนไม่สำเร็จ'); return; }
    setAmount(''); setNote(''); setItems((current) => [data, ...current]); setMessage('ส่งคำขอถอนสำเร็จ'); await loadAll();
  }

  const activeBanks = banks.filter((item) => item.status === 'ACTIVE');
  const hasSelectedBank = Boolean(bankName && accountName && accountNumber);

  return (
    <main style={pageStyle}>
      <a href="/" style={backStyle}>← หน้าแรก</a><h1 style={titleStyle}>ถอนเงิน</h1>
      {isLoading && <div style={noticeStyle}>กำลังโหลด...</div>}
      {message && <div style={noticeStyle}>{message}</div>}
      <section style={heroCardStyle}><p style={mutedStyle}>ยอดที่ถอนได้</p><h1 style={amountTitleStyle}>{wallet ? `${wallet.currency} ${Number(wallet.availableBalance).toLocaleString('th-TH', { minimumFractionDigits: 2 })}` : 'THB 0.00'}</h1>{wallet && <div style={walletMetaStyle}><span>รอดำเนินการ: {Number(wallet.lockedBalance).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span><span>{wallet.status === 'ACTIVE' ? 'ใช้งานได้' : wallet.status}</span></div>}</section>
      <form onSubmit={submit} style={cardStyle}>
        <label style={labelStyle}>จำนวนเงิน<input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" placeholder="เช่น 100" style={inputStyle} /></label>
        <label style={labelStyle}>ช่องทาง<select value={method} onChange={(e) => setMethod(e.target.value)} style={inputStyle}><option value="bank_transfer">โอนธนาคาร</option></select></label>
        <label style={labelStyle}>บัญชีธนาคาร<select value={bankAccountId} onChange={(e) => chooseBank(e.target.value)} style={inputStyle}><option value="">เลือกบัญชี</option>{banks.map((item) => <option key={item.id} value={item.id} disabled={item.status !== 'ACTIVE'}>{item.bankName} / {item.accountNumber} {item.isPrimary ? '(หลัก)' : ''} {item.status !== 'ACTIVE' ? `- ${item.status}` : ''}</option>)}</select></label>
        {activeBanks.length === 0 && <div style={noticeStyle}>ยังไม่มีบัญชีที่อนุมัติแล้ว</div>}
        <a href="/bank-accounts" style={bankLinkStyle}>การจัดการบัญชีธนาคาร</a>
        {hasSelectedBank && <section style={accountBoxStyle}>
          <InfoRow label="ชื่อบัญชี" value={accountName} />
          <InfoRow label="เลขบัญชี" value={accountNumber} action={<button type="button" onClick={() => copyText(accountNumber, 'เลขบัญชี')} style={copyButtonStyle}>คัดลอก</button>} />
          <InfoRow label="ธนาคาร" value={bankName} action={<button type="button" onClick={() => copyText(bankName, 'ชื่อธนาคาร')} style={copyButtonStyle}>คัดลอก</button>} />
        </section>}
        <label style={labelStyle}>หมายเหตุ<textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="รายละเอียดเพิ่มเติม ถ้ามี" style={textareaStyle} /></label>
        <button type="submit" disabled={isSubmitting || activeBanks.length === 0} style={buttonStyle}>{isSubmitting ? 'กำลังส่ง...' : 'ส่งคำขอถอน'}</button>
      </form>
      <h2 style={sectionTitleStyle}>ประวัติถอนเงิน</h2><div style={listStyle}>{items.map((item) => <section key={item.id} style={historyCardStyle}><div style={historyTopStyle}><strong>{item.currency} {Number(item.amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</strong><span style={statusBadgeStyle(item.status)}>{item.status}</span></div><p style={mutedStyle}>บัญชี: {item.bankName || '-'} / {item.accountNumber || '-'}</p><p style={mutedStyle}>{new Date(item.createdAt).toLocaleString('th-TH')}</p>{item.adminNote && <p style={mutedStyle}>Admin note: {item.adminNote}</p>}</section>)}{items.length === 0 && <div style={noticeStyle}>ยังไม่มีรายการ</div>}</div>
    </main>
  );
}

function InfoRow({ label, value, action }: { label: string; value: string; action?: React.ReactNode }) { return <div style={infoRowStyle}><div style={{ minWidth: 0 }}><span>{label}</span><strong>{value}</strong></div>{action}</div>; }
const pageStyle = { minHeight: '100vh', background: '#080808', color: '#fff', padding: '18px 12px calc(44px + env(safe-area-inset-bottom))', display: 'grid', gap: 14, width: '100%', maxWidth: 920, margin: '0 auto', overflowX: 'hidden' as const } as const;
const backStyle = { color: '#f5c542', textDecoration: 'none', fontWeight: 900 } as const;
const titleStyle = { margin: 0, fontSize: 'clamp(34px, 11vw, 58px)', lineHeight: 0.98, letterSpacing: -1.2, overflowWrap: 'anywhere' as const };
const mutedStyle = { margin: 0, opacity: 0.76, lineHeight: 1.55, overflowWrap: 'anywhere' as const };
const heroCardStyle = { border: '1px solid rgba(255,255,255,0.12)', borderRadius: 24, padding: 14, background: '#181818', display: 'grid', gap: 8, minWidth: 0, overflow: 'hidden' as const };
const walletMetaStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(150px, 100%), 1fr))', gap: 8, color: 'rgba(255,255,255,.72)' } as const;
const cardStyle = { border: '1px solid rgba(255,255,255,0.12)', borderRadius: 24, padding: 16, background: '#181818', display: 'grid', gap: 12, minWidth: 0, overflow: 'hidden' as const };
const amountTitleStyle = { margin: '4px 0', fontSize: 'clamp(30px, 9vw, 50px)', lineHeight: 1, overflowWrap: 'anywhere' as const, color: '#f5c542' };
const sectionTitleStyle = { margin: '14px 0 0', fontSize: 'clamp(24px, 7vw, 34px)' } as const;
const labelStyle = { display: 'grid', gap: 8, fontWeight: 800, minWidth: 0 } as const;
const inputStyle = { display: 'block', width: '100%', padding: '13px 14px', marginTop: 6, borderRadius: 14, border: '1px solid rgba(255,255,255,0.16)', background: '#242424', color: '#fff', boxSizing: 'border-box' as const, fontSize: 16 };
const textareaStyle = { ...inputStyle, minHeight: 96, resize: 'vertical' as const };
const buttonStyle = { padding: 14, minHeight: 48, borderRadius: 16, cursor: 'pointer', background: '#f5c542', color: '#111', border: 0, fontWeight: 900, width: '100%' } as const;
const noticeStyle = { border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16, padding: 12, background: 'rgba(255,255,255,0.07)', overflowWrap: 'anywhere' as const };
const bankLinkStyle = { color: '#f5c542', textDecoration: 'none', fontWeight: 900 } as const;
const accountBoxStyle = { border: '1px solid rgba(245,197,66,.22)', borderRadius: 18, padding: 12, background: 'rgba(245,197,66,.06)', display: 'grid', gap: 10, minWidth: 0 } as const;
const infoRowStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(180px, 100%), 1fr))', gap: 10, alignItems: 'center', border: '1px solid rgba(255,255,255,.10)', borderRadius: 14, padding: 10, background: 'rgba(255,255,255,.04)', overflowWrap: 'anywhere' as const };
const copyButtonStyle = { minHeight: 40, border: '1px solid rgba(245,197,66,.35)', borderRadius: 999, padding: '8px 10px', background: 'rgba(245,197,66,.14)', color: '#f5c542', fontWeight: 900, cursor: 'pointer' } as const;
const listStyle = { display: 'grid', gap: 12, minWidth: 0 } as const;
const historyCardStyle = { border: '1px solid rgba(255,255,255,0.10)', borderRadius: 20, padding: 14, background: '#151515', display: 'grid', gap: 8, minWidth: 0, overflow: 'hidden' as const };
const historyTopStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(160px, 100%), 1fr))', gap: 8, alignItems: 'center' } as const;
function statusBadgeStyle(status: string) { return { width: 'fit-content', border: '1px solid rgba(255,255,255,.12)', borderRadius: 999, padding: '6px 10px', background: status === 'COMPLETED' ? 'rgba(34,197,94,.14)' : status === 'REJECTED' ? 'rgba(239,68,68,.14)' : 'rgba(245,197,66,.14)', color: status === 'COMPLETED' ? '#bbf7d0' : status === 'REJECTED' ? '#fecaca' : '#fde68a', fontSize: 12, fontWeight: 900 }; }
