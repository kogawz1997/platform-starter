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
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadItems(); }, []);

  async function loadItems() {
    setLoading(true);
    setMessage('กำลังโหลด...');
    const res = await memberApiFetch('/member/bank-accounts');
    const data = await res.json().catch(() => null);
    setLoading(false);
    if (!res.ok) { setMessage(data?.message ?? 'โหลดบัญชีไม่สำเร็จ'); return; }
    setItems(data.items ?? []); setMessage('');
  }

  async function addBank(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (items.length > 0) { setMessage('เพิ่มได้ 1 บัญชีเท่านั้น'); return; }
    if (!bankName.trim() || !accountName.trim() || !accountNumber.trim()) { setMessage('กรอกข้อมูลบัญชีให้ครบก่อน'); return; }
    setBusy(true); setMessage('กำลังเพิ่มบัญชี...');
    const res = await memberApiFetch('/member/bank-accounts', { method: 'POST', body: JSON.stringify({ bankName, accountName, accountNumber }) });
    const data = await res.json().catch(() => null); setBusy(false);
    if (!res.ok) { setMessage(data?.message ?? 'เพิ่มบัญชีไม่สำเร็จ'); return; }
    setItems((current) => [data.item, ...current]); setBankName(THAI_BANKS[0]); setAccountName(''); setAccountNumber(''); setMessage('เพิ่มบัญชีแล้ว รอตรวจสอบ');
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
      <h1 style={titleStyle}>การจัดการบัญชีธนาคาร</h1>

      {loading && <div style={noticeStyle}>กำลังโหลด...</div>}
      {items.length === 0 && !loading && <form onSubmit={addBank} style={cardStyle}>
        <h2 style={sectionTitleStyle}>เพิ่มบัญชี</h2>
        <label style={labelStyle}>ธนาคาร<select value={bankName} onChange={(e) => setBankName(e.target.value)} style={inputStyle}>{THAI_BANKS.map((bank) => <option key={bank} value={bank}>{bank}</option>)}</select></label>
        <label style={labelStyle}>ชื่อบัญชี<input value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder="ชื่อบัญชี" style={inputStyle} /></label>
        <label style={labelStyle}>เลขบัญชี<input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="เลขบัญชี" inputMode="numeric" style={inputStyle} /></label>
        <button type="submit" disabled={busy} style={primaryButtonStyle}>{busy ? 'กำลังเพิ่ม...' : 'เพิ่มบัญชี'}</button>
      </form>}

      {items.length > 0 && <div style={noticeStyle}>เพิ่มบัญชีแล้ว หากต้องการเปลี่ยนให้ติดต่อแอดมิน</div>}
      {message && <div style={noticeStyle}>{message}</div>}

      <section style={listStyle}>
        {items.map((item) => <div key={item.id} style={cardStyle}><div style={rowStyle}><div style={infoStyle}><div style={badgeRowStyle}><span style={badgeStyle(item.status)}>{item.status}</span>{item.isPrimary && <span style={primaryBadgeStyle}>บัญชีหลัก</span>}</div><h2 style={bankTitleStyle}>{item.bankName}</h2><InfoText label="ชื่อบัญชี" value={item.accountName} /><InfoText label="เลขบัญชี" value={item.accountNumber} />{item.adminNote && <InfoText label="หมายเหตุ" value={item.adminNote} />}</div><div style={actionStyle}>{!item.isPrimary && <button type="button" onClick={() => setPrimary(item.id)} style={secondaryButtonStyle}>ตั้งเป็นหลัก</button>}</div></div></div>)}
        {items.length === 0 && !loading && <div style={noticeStyle}>ยังไม่มีบัญชีธนาคาร</div>}
      </section>
    </main>
  );
}

function InfoText({ label, value }: { label: string; value: string }) { return <p style={mutedStyle}><strong style={infoLabelStyle}>{label}:</strong> {value}</p>; }

const pageStyle = { width: '100%', maxWidth: 900, margin: '0 auto', padding: '18px 12px calc(44px + env(safe-area-inset-bottom))', color: '#fff', overflowX: 'hidden' as const } as const;
const backStyle = { color: '#f5c542', textDecoration: 'none', fontWeight: 900 } as const;
const titleStyle = { margin: '6px 0 8px', fontSize: 'clamp(34px, 11vw, 58px)', lineHeight: 0.98, letterSpacing: -1.2, overflowWrap: 'anywhere' as const };
const mutedStyle = { margin: 0, opacity: 0.76, lineHeight: 1.55, overflowWrap: 'anywhere' as const };
const cardStyle = { border: '1px solid rgba(255,255,255,0.12)', borderRadius: 24, padding: 16, background: '#181818', display: 'grid', gap: 12, minWidth: 0, overflow: 'hidden' as const };
const sectionTitleStyle = { margin: 0, fontSize: 'clamp(22px, 7vw, 30px)' } as const;
const labelStyle = { display: 'grid', gap: 8, fontWeight: 800, minWidth: 0 } as const;
const inputStyle = { width: '100%', padding: '13px 14px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.16)', background: '#242424', color: '#fff', boxSizing: 'border-box' as const, fontSize: 16 };
const primaryButtonStyle = { padding: '13px 14px', minHeight: 48, borderRadius: 14, border: 0, background: '#f5c542', color: '#111', fontWeight: 900, cursor: 'pointer', width: '100%' } as const;
const secondaryButtonStyle = { padding: '12px 14px', minHeight: 44, borderRadius: 999, border: '1px solid rgba(255,255,255,0.16)', background: 'rgba(255,255,255,0.08)', color: '#fff', fontWeight: 900, cursor: 'pointer', width: '100%' } as const;
const noticeStyle = { border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16, padding: 12, background: 'rgba(255,255,255,0.07)', margin: '14px 0', overflowWrap: 'anywhere' as const };
const listStyle = { display: 'grid', gap: 12, marginTop: 16, minWidth: 0 } as const;
const rowStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))', gap: 12, minWidth: 0 } as const;
const infoStyle = { display: 'grid', gap: 8, minWidth: 0 };
const actionStyle = { display: 'grid', alignContent: 'start', minWidth: 0 } as const;
const badgeRowStyle = { display: 'flex', gap: 8, flexWrap: 'wrap' as const };
const bankTitleStyle = { margin: '2px 0', overflowWrap: 'anywhere' as const };
const primaryBadgeStyle = { display: 'inline-block', borderRadius: 999, padding: '6px 10px', fontSize: 12, fontWeight: 900, background: 'rgba(245,197,66,0.14)', color: '#f5c542', border: '1px solid rgba(245,197,66,.28)' } as const;
const infoLabelStyle = { color: '#f5c542' } as const;
function badgeStyle(status: string) { return { display: 'inline-block', borderRadius: 999, padding: '6px 10px', fontSize: 12, fontWeight: 900, background: status === 'ACTIVE' ? 'rgba(80,255,140,0.14)' : status === 'REJECTED' ? 'rgba(255,80,80,0.14)' : 'rgba(245,197,66,0.14)', border: '1px solid rgba(255,255,255,0.12)' } as const; }
