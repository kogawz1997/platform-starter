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

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
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
    if (!selected) { setMessage('กรุณาเลือกบัญชีถอนเงินที่แอดมินอนุมัติแล้ว'); return; }
    setIsSubmitting(true); setMessage('กำลังส่งคำขอถอน...');
    const res = await memberApiFetch('/member/withdrawals', { method: 'POST', body: JSON.stringify({ amount: parsedAmount, method, accountName: selected.accountName, accountNumber: selected.accountNumber, bankName: selected.bankName, note }) });
    const data = await res.json().catch(() => null); setIsSubmitting(false);
    if (!res.ok) { setMessage(data?.message ?? 'ส่งคำขอถอนไม่สำเร็จ'); return; }
    setAmount(''); setNote(''); setItems((current) => [data, ...current]); setMessage('ส่งคำขอถอนสำเร็จ รอแอดมินดำเนินการ'); await loadAll();
  }

  const activeBanks = banks.filter((item) => item.status === 'ACTIVE');

  return (
    <main style={pageStyle}>
      <a href="/" style={backStyle}>← หน้าแรก</a><p style={eyebrowStyle}>Wallet</p><h1 style={titleStyle}>ถอนเงิน</h1><p style={mutedStyle}>ถอนเข้าบัญชีที่บันทึกไว้และผ่านการอนุมัติแล้วเท่านั้น</p>
      <section style={heroCardStyle}><p style={mutedStyle}>ยอดที่ถอนได้</p><h1 style={amountTitleStyle}>{wallet ? `${wallet.currency} ${Number(wallet.availableBalance).toLocaleString('th-TH', { minimumFractionDigits: 2 })}` : 'THB 0.00'}</h1>{wallet && <p style={mutedStyle}>Locked: {wallet.lockedBalance} / Status: {wallet.status}</p>}</section>
      <form onSubmit={submit} style={cardStyle}>
        <label style={labelStyle}>จำนวนเงิน<input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" placeholder="เช่น 100" style={inputStyle} /></label>
        <label style={labelStyle}>ช่องทาง<select value={method} onChange={(e) => setMethod(e.target.value)} style={inputStyle}><option value="bank_transfer">โอนธนาคาร</option></select></label>
        <label style={labelStyle}>บัญชีถอนที่อนุมัติแล้ว<select value={bankAccountId} onChange={(e) => chooseBank(e.target.value)} style={inputStyle}><option value="">เลือกบัญชีถอน</option>{banks.map((item) => <option key={item.id} value={item.id} disabled={item.status !== 'ACTIVE'}>{item.bankName} / {item.accountNumber} {item.isPrimary ? '(หลัก)' : ''} {item.status !== 'ACTIVE' ? `- ${item.status}` : ''}</option>)}</select></label>
        {activeBanks.length === 0 && <div style={noticeStyle}>ยังไม่มีบัญชีถอนที่อนุมัติแล้ว ไปเพิ่มบัญชีและรอแอดมินตรวจสอบก่อน</div>}
        <a href="/bank-accounts" style={bankLinkStyle}>จัดการบัญชีถอนเงิน</a>
        <label style={labelStyle}>ชื่อบัญชี<input value={accountName} readOnly placeholder="เลือกจากบัญชีที่บันทึกไว้" style={inputStyle} /></label>
        <label style={labelStyle}>เลขบัญชี<input value={accountNumber} readOnly placeholder="เลือกจากบัญชีที่บันทึกไว้" style={inputStyle} /></label>
        <label style={labelStyle}>ธนาคาร<input value={bankName} readOnly placeholder="เลือกจากบัญชีที่บันทึกไว้" style={inputStyle} /></label>
        <label style={labelStyle}>หมายเหตุ<textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="รายละเอียดเพิ่มเติม ถ้ามี" style={{ ...inputStyle, minHeight: 92 }} /></label>
        <button type="submit" disabled={isSubmitting || activeBanks.length === 0} style={buttonStyle}>{isSubmitting ? 'กำลังส่ง...' : 'ส่งคำขอถอน'}</button>{message && <div style={noticeStyle}>{message}</div>}
      </form>
      <h2 style={sectionTitleStyle}>ประวัติถอนเงิน</h2><div style={{ display: 'grid', gap: 12 }}>{items.map((item) => <section key={item.id} style={cardStyle}><strong>{item.currency} {Number(item.amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</strong><p style={mutedStyle}>Status: {item.status}</p><p style={mutedStyle}>บัญชี: {item.bankName || '-'} / {item.accountNumber || '-'}</p>{item.adminNote && <p style={mutedStyle}>Admin note: {item.adminNote}</p>}</section>)}{items.length === 0 && <div style={noticeStyle}>ยังไม่มีรายการ</div>}</div>
    </main>
  );
}

const pageStyle = { minHeight: '100vh', background: '#080808', color: '#fff', padding: '22px 16px 44px', display: 'grid', gap: 14 } as const;
const backStyle = { color: '#f5c542', textDecoration: 'none', fontWeight: 900 } as const;
const eyebrowStyle = { margin: 0, opacity: 0.66, fontSize: 14 } as const;
const titleStyle = { margin: 0, fontSize: 'clamp(42px, 13vw, 64px)', lineHeight: 0.96, letterSpacing: -1.2 } as const;
const mutedStyle = { margin: 0, opacity: 0.76, lineHeight: 1.55 } as const;
const heroCardStyle = { border: '1px solid rgba(255,255,255,0.12)', borderRadius: 28, padding: 18, background: '#181818', display: 'grid', gap: 8 } as const;
const cardStyle = { border: '1px solid rgba(255,255,255,0.12)', borderRadius: 24, padding: 18, background: '#181818', display: 'grid', gap: 12 } as const;
const amountTitleStyle = { margin: '4px 0', fontSize: 'clamp(34px, 10vw, 54px)', lineHeight: 1 } as const;
const sectionTitleStyle = { margin: '14px 0 0', fontSize: 'clamp(24px, 7vw, 34px)' } as const;
const labelStyle = { display: 'grid', gap: 8, fontWeight: 800 } as const;
const inputStyle = { display: 'block', width: '100%', padding: '13px 14px', marginTop: 6, borderRadius: 14, border: '1px solid rgba(255,255,255,0.16)', background: '#242424', color: '#fff', boxSizing: 'border-box' } as const;
const buttonStyle = { padding: 14, borderRadius: 16, cursor: 'pointer', background: '#f5c542', color: '#111', border: 0, fontWeight: 900 } as const;
const noticeStyle = { border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16, padding: 12, background: 'rgba(255,255,255,0.07)' } as const;
const bankLinkStyle = { color: '#f5c542', textDecoration: 'none', fontWeight: 900 } as const;
