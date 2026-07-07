'use client';

import { FormEvent, useEffect, useState } from 'react';
import { memberApiFetch } from '../member-api';

type BankItem = { id: string; bankName: string; accountName: string; accountNumber: string; isPrimary: boolean; status: string; adminNote?: string | null };

const THAI_BANKS = ['ธนาคารกสิกรไทย', 'ธนาคารไทยพาณิชย์', 'ธนาคารกรุงเทพ', 'ธนาคารกรุงไทย', 'ธนาคารกรุงศรีอยุธยา', 'ธนาคารทหารไทยธนชาต', 'ธนาคารออมสิน', 'ธนาคารอาคารสงเคราะห์', 'ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร', 'ธนาคารยูโอบี', 'ธนาคารซีไอเอ็มบีไทย', 'ธนาคารเกียรตินาคินภัทร', 'ธนาคารแลนด์ แอนด์ เฮ้าส์', 'ธนาคารไอซีบีซี ไทย', 'ธนาคารไทยเครดิต'];

export default function MemberBankAccountsPage() {
  const [items, setItems] = useState<BankItem[]>([]);
  const [bankName, setBankName] = useState(THAI_BANKS[0]);
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { loadItems(); }, []);

  async function loadItems() {
    setMessage('กำลังโหลดบัญชีถอนเงิน...');
    const res = await memberApiFetch('/member/bank-accounts');
    const data = await res.json().catch(() => null);
    if (!res.ok) { setMessage(data?.message ?? 'โหลดบัญชีไม่สำเร็จ'); return; }
    setItems(data.items ?? []); setMessage('');
  }

  async function addBank(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (items.length > 0) { setMessage('สมาชิก 1 คนเพิ่มบัญชีถอนได้ 1 บัญชีเท่านั้น'); return; }
    if (!bankName.trim() || !accountName.trim() || !accountNumber.trim()) { setMessage('กรอกข้อมูลบัญชีให้ครบก่อน'); return; }
    setBusy(true); setMessage('กำลังเพิ่มบัญชี...');
    const res = await memberApiFetch('/member/bank-accounts', { method: 'POST', body: JSON.stringify({ bankName, accountName, accountNumber }) });
    const data = await res.json().catch(() => null); setBusy(false);
    if (!res.ok) { setMessage(data?.message ?? 'เพิ่มบัญชีไม่สำเร็จ'); return; }
    setItems((current) => [data.item, ...current]); setBankName(THAI_BANKS[0]); setAccountName(''); setAccountNumber(''); setMessage('เพิ่มบัญชีแล้ว รอแอดมินตรวจสอบ');
  }

  async function setPrimary(id: string) {
    setMessage('กำลังตั้งบัญชีหลัก...');
    const res = await memberApiFetch(`/member/bank-accounts/${id}/primary`, { method: 'PATCH' });
    const data = await res.json().catch(() => null);
    if (!res.ok) { setMessage(data?.message ?? 'ตั้งบัญชีหลักไม่สำเร็จ'); return; }
    setItems((current) => current.map((item) => ({ ...item, isPrimary: item.id === id })));
    setMessage('ตั้งบัญชีหลักแล้ว');
  }

  return (
    <main style={pageStyle}>
      <a href="/" style={backStyle}>← หน้าแรก</a>
      <p style={eyebrowStyle}>Wallet</p>
      <h1 style={titleStyle}>บัญชีถอนเงิน</h1>
      <p style={mutedStyle}>สมาชิก 1 คนเพิ่มบัญชีถอนได้ 1 บัญชี และชื่อบัญชีต้องตรงกับชื่อบัญชีสมาชิก</p>

      {items.length === 0 && <form onSubmit={addBank} style={cardStyle}>
        <h2 style={{ margin: 0 }}>เพิ่มบัญชีใหม่</h2>
        <label style={labelStyle}>ธนาคาร<select value={bankName} onChange={(e) => setBankName(e.target.value)} style={inputStyle}>{THAI_BANKS.map((bank) => <option key={bank} value={bank}>{bank}</option>)}</select></label>
        <label style={labelStyle}>ชื่อบัญชี<input value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder="ต้องตรงกับชื่อบัญชีสมาชิก" style={inputStyle} /></label>
        <label style={labelStyle}>เลขบัญชี<input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="เลขบัญชี" inputMode="numeric" style={inputStyle} /></label>
        <button type="submit" disabled={busy} style={primaryButtonStyle}>{busy ? 'กำลังเพิ่ม...' : 'เพิ่มบัญชี'}</button>
      </form>}

      {items.length > 0 && <div style={noticeStyle}>เพิ่มบัญชีแล้ว หากต้องการเปลี่ยนบัญชีให้ติดต่อแอดมิน</div>}
      {message && <div style={noticeStyle}>{message}</div>}

      <section style={listStyle}>
        {items.map((item) => <div key={item.id} style={cardStyle}><div style={rowStyle}><div><span style={badgeStyle(item.status)}>{item.status}</span><h2 style={{ margin: '10px 0 4px' }}>{item.bankName}</h2><p style={mutedStyle}>{item.accountName}</p><p style={mutedStyle}>{item.accountNumber}</p>{item.adminNote && <p style={mutedStyle}>Admin note: {item.adminNote}</p>}</div><div style={{ textAlign: 'right' }}><strong>{item.isPrimary ? 'บัญชีหลัก' : ''}</strong>{!item.isPrimary && <button type="button" onClick={() => setPrimary(item.id)} style={secondaryButtonStyle}>ตั้งเป็นหลัก</button>}</div></div></div>)}
        {items.length === 0 && <div style={noticeStyle}>ยังไม่มีบัญชีถอนเงิน</div>}
      </section>
    </main>
  );
}

const pageStyle = { maxWidth: 900, margin: '0 auto', padding: '22px 16px 44px', color: '#fff' } as const;
const backStyle = { color: '#f5c542', textDecoration: 'none', fontWeight: 900 } as const;
const eyebrowStyle = { margin: '18px 0 0', opacity: 0.66, fontSize: 14 } as const;
const titleStyle = { margin: '6px 0 8px', fontSize: 'clamp(38px, 12vw, 64px)', lineHeight: 0.96, letterSpacing: -1.2 } as const;
const mutedStyle = { margin: 0, opacity: 0.76, lineHeight: 1.55 } as const;
const cardStyle = { border: '1px solid rgba(255,255,255,0.12)', borderRadius: 24, padding: 16, background: '#181818', display: 'grid', gap: 12 } as const;
const labelStyle = { display: 'grid', gap: 8, fontWeight: 800 } as const;
const inputStyle = { width: '100%', padding: '13px 14px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.16)', background: '#242424', color: '#fff', boxSizing: 'border-box' } as const;
const primaryButtonStyle = { padding: '13px 14px', borderRadius: 14, border: 0, background: '#f5c542', color: '#111', fontWeight: 900, cursor: 'pointer' } as const;
const secondaryButtonStyle = { marginTop: 10, padding: '10px 12px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.16)', background: 'rgba(255,255,255,0.08)', color: '#fff', fontWeight: 900, cursor: 'pointer' } as const;
const noticeStyle = { border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16, padding: 12, background: 'rgba(255,255,255,0.07)', margin: '14px 0' } as const;
const listStyle = { display: 'grid', gap: 12, marginTop: 16 } as const;
const rowStyle = { display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' } as const;
function badgeStyle(status: string) { return { display: 'inline-block', borderRadius: 999, padding: '6px 10px', fontSize: 12, fontWeight: 900, background: status === 'ACTIVE' ? 'rgba(80,255,140,0.14)' : status === 'REJECTED' ? 'rgba(255,80,80,0.14)' : 'rgba(245,197,66,0.14)', border: '1px solid rgba(255,255,255,0.12)' } as const; }
