'use client';

import { useEffect, useState } from 'react';
import { memberApiFetch } from '../member-api';

type LedgerItem = {
  id: string;
  type: string;
  direction: string;
  amount: string;
  balanceBefore: string;
  balanceAfter: string;
  referenceType?: string | null;
  referenceId?: string | null;
  createdAt: string;
};

export default function TransactionsPage() {
  const [items, setItems] = useState<LedgerItem[]>([]);
  const [message, setMessage] = useState('กำลังโหลดประวัติ...');

  useEffect(() => {
    memberApiFetch('/member/wallet/ledger?limit=100')
      .then(async (res) => {
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.message ?? 'โหลดประวัติไม่สำเร็จ');
        return data;
      })
      .then((data) => { setItems(data.items ?? []); setMessage(''); })
      .catch((error) => setMessage(error.message));
  }, []);

  return (
    <main style={pageStyle}>
      <section style={containerStyle}>
        <a href="/" style={backStyle}>← หน้าแรก</a>
        <h1 style={titleStyle}>ประวัติธุรกรรม</h1>
        <p style={mutedStyle}>รายการเคลื่อนไหวของกระเป๋าเงิน ฝาก ถอน และการปรับยอด</p>
        {message && <div style={noticeStyle}>{message}</div>}
        <div style={listStyle}>
          {items.map((item) => (
            <section key={item.id} style={cardStyle}>
              <div style={topGridStyle}>
                <div style={infoStyle}>
                  <span style={badgeStyle(item.direction)}>{item.direction}</span>
                  <strong>{item.type}</strong>
                  <p style={mutedStyle}>{new Date(item.createdAt).toLocaleString('th-TH')}</p>
                  <p style={mutedStyle}>Ref: {item.referenceType || '-'} {item.referenceId ? `#${item.referenceId.slice(0, 8)}` : ''}</p>
                </div>
                <h2 style={amountStyle(item.direction)}>{item.direction === 'CREDIT' ? '+' : '-'} THB {Number(item.amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</h2>
              </div>
              <div style={balanceStyle}>
                <div style={balanceItemStyle}><span>ก่อน</span><strong>THB {Number(item.balanceBefore).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</strong></div>
                <div style={balanceItemStyle}><span>หลัง</span><strong>THB {Number(item.balanceAfter).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</strong></div>
              </div>
            </section>
          ))}
          {items.length === 0 && !message && <div style={noticeStyle}>ยังไม่มีรายการ</div>}
        </div>
      </section>
    </main>
  );
}

const pageStyle = { minHeight: '100vh', background: '#080808', color: '#fff', overflowX: 'hidden' as const };
const containerStyle = { width: '100%', maxWidth: 920, margin: '0 auto', padding: '18px 12px calc(44px + env(safe-area-inset-bottom))', boxSizing: 'border-box' as const, display: 'grid', gap: 16, overflowX: 'hidden' as const };
const backStyle = { color: '#f5c542', textDecoration: 'none', fontWeight: 800 } as const;
const titleStyle = { margin: '6px 0 0', fontSize: 'clamp(34px, 10vw, 54px)', lineHeight: 1, overflowWrap: 'anywhere' as const };
const mutedStyle = { margin: 0, opacity: 0.76, lineHeight: 1.55, overflowWrap: 'anywhere' as const };
const listStyle = { display: 'grid', gap: 12, minWidth: 0 } as const;
const cardStyle = { border: '1px solid rgba(255,255,255,0.10)', borderRadius: 24, padding: 16, background: '#181818', display: 'grid', gap: 12, minWidth: 0, overflow: 'hidden' as const };
const topGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(230px, 100%), 1fr))', gap: 12, minWidth: 0 } as const;
const infoStyle = { display: 'grid', gap: 7, minWidth: 0 };
function amountStyle(direction: string) { return { margin: 0, fontSize: 'clamp(22px, 7vw, 30px)', lineHeight: 1.1, overflowWrap: 'anywhere' as const, color: direction === 'CREDIT' ? '#86efac' : '#fca5a5' }; }
const balanceStyle = { borderTop: '1px solid rgba(255,255,255,0.10)', paddingTop: 10, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(180px, 100%), 1fr))', gap: 8, minWidth: 0 } as const;
const balanceItemStyle = { border: '1px solid rgba(255,255,255,.08)', borderRadius: 14, padding: 10, background: 'rgba(255,255,255,.04)', display: 'grid', gap: 4, minWidth: 0, overflowWrap: 'anywhere' as const };
const noticeStyle = { border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16, padding: 12, background: 'rgba(255,255,255,0.07)', overflowWrap: 'anywhere' as const };
function badgeStyle(direction: string) { return { width: 'fit-content', border: '1px solid rgba(255,255,255,.12)', borderRadius: 999, padding: '6px 10px', background: direction === 'CREDIT' ? 'rgba(34,197,94,.14)' : 'rgba(239,68,68,.14)', color: direction === 'CREDIT' ? '#bbf7d0' : '#fecaca', fontSize: 12, fontWeight: 900 }; }
