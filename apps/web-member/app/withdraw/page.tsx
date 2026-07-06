'use client';

import { FormEvent, useEffect, useState } from 'react';
import { API_URL } from '../site-settings';

type WalletResponse = { currency: string; availableBalance: string; lockedBalance: string; status: string };
type WithdrawalItem = { id: string; amount: string; currency: string; status: string; method?: string | null; accountName?: string | null; accountNumber?: string | null; bankName?: string | null; note?: string | null; adminNote?: string | null; createdAt: string };

export default function WithdrawPage() {
  const [wallet, setWallet] = useState<WalletResponse | null>(null);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('bank_transfer');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [note, setNote] = useState('');
  const [items, setItems] = useState<WithdrawalItem[]>([]);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    const token = window.localStorage.getItem('member_access_token');
    if (!token) { setMessage('กรุณาเข้าสู่ระบบก่อนทำรายการ'); return; }
    const [walletRes, listRes] = await Promise.all([
      fetch(`${API_URL}/member/wallet`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${API_URL}/member/withdrawals`, { headers: { Authorization: `Bearer ${token}` } }),
    ]);
    const walletData = await walletRes.json().catch(() => null);
    const listData = await listRes.json().catch(() => null);
    if (walletRes.ok) setWallet(walletData);
    if (listRes.ok) setItems(listData.items ?? []);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsedAmount = Number(amount.replace(/,/g, '').trim());
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) { setMessage('กรุณาใส่จำนวนเงินมากกว่า 0'); return; }
    if (!accountName || !accountNumber || !bankName) { setMessage('กรุณากรอกข้อมูลบัญชีรับเงินให้ครบ'); return; }

    const token = window.localStorage.getItem('member_access_token');
    if (!token) { setMessage('กรุณาเข้าสู่ระบบก่อนทำรายการ'); return; }

    setIsSubmitting(true);
    setMessage('กำลังส่งคำขอถอน...');
    const res = await fetch(`${API_URL}/member/withdrawals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ amount: parsedAmount, method, accountName, accountNumber, bankName, note }),
    });
    const data = await res.json().catch(() => null);
    setIsSubmitting(false);

    if (!res.ok) { setMessage(data?.message ?? 'ส่งคำขอถอนไม่สำเร็จ'); return; }
    setAmount(''); setNote(''); setItems((current) => [data, ...current]); setMessage('ส่งคำขอถอนสำเร็จ รอแอดมินดำเนินการ');
    await loadAll();
  }

  return (
    <main style={{ maxWidth: 980, margin: '32px auto', padding: 24 }}>
      <a href="/">← หน้าแรก</a>
      <h1>ถอนเงิน</h1>
      <p>สร้างคำขอถอน ระบบจะล็อกยอดไว้ก่อนจนกว่าแอดมินจะดำเนินการ</p>

      <section style={cardStyle}>
        <p>ยอดที่ถอนได้</p>
        <h1>{wallet ? `${wallet.currency} ${Number(wallet.availableBalance).toLocaleString('th-TH', { minimumFractionDigits: 2 })}` : 'THB 0.00'}</h1>
        {wallet && <p>Locked: {wallet.lockedBalance} / Status: {wallet.status}</p>}
      </section>

      <form onSubmit={submit} style={cardStyle}>
        <label>จำนวนเงิน<input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" placeholder="เช่น 100" style={inputStyle} /></label>
        <label>ช่องทาง<select value={method} onChange={(e) => setMethod(e.target.value)} style={inputStyle}><option value="bank_transfer">โอนธนาคาร</option><option value="manual">Manual</option></select></label>
        <label>ชื่อบัญชี<input value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder="ชื่อบัญชีรับเงิน" style={inputStyle} /></label>
        <label>เลขบัญชี<input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="เลขบัญชี" style={inputStyle} /></label>
        <label>ธนาคาร<input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="ชื่อธนาคาร" style={inputStyle} /></label>
        <label>หมายเหตุ<textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="รายละเอียดเพิ่มเติม ถ้ามี" style={inputStyle} /></label>
        <button type="submit" disabled={isSubmitting} style={buttonStyle}>{isSubmitting ? 'กำลังส่ง...' : 'ส่งคำขอถอน'}</button>
        {message && <p>{message}</p>}
      </form>

      <h2>ประวัติถอนเงิน</h2>
      <div style={{ display: 'grid', gap: 12 }}>
        {items.map((item) => <section key={item.id} style={cardStyle}><strong>{item.currency} {Number(item.amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</strong><p>Status: {item.status}</p><p>บัญชี: {item.bankName || '-'} / {item.accountNumber || '-'}</p>{item.adminNote && <p>Admin note: {item.adminNote}</p>}</section>)}
        {items.length === 0 && <p>ยังไม่มีรายการ</p>}
      </div>
    </main>
  );
}

const cardStyle = { border: '1px solid #ddd', borderRadius: 16, padding: 18, marginBottom: 18, display: 'grid', gap: 12 } as const;
const inputStyle = { display: 'block', width: '100%', padding: 10, marginTop: 6, borderRadius: 10, border: '1px solid #ccc', boxSizing: 'border-box' } as const;
const buttonStyle = { padding: 12, borderRadius: 10, cursor: 'pointer', background: '#0a84ff', color: '#fff', border: 0 } as const;
