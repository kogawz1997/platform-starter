'use client';

import { useEffect, useState } from 'react';
import { API_URL } from '../site-settings';

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
    const token = window.localStorage.getItem('member_access_token');
    if (!token) { setMessage('กรุณาเข้าสู่ระบบก่อนดูรายการ'); return; }

    fetch(`${API_URL}/member/wallet/ledger?limit=100`, { headers: { Authorization: `Bearer ${token}` } })
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
        <div style={{ display: 'grid', gap: 12 }}>
          {items.map((item) => (
            <section key={item.id} style={cardStyle}>
              <div style={rowStyle}>
                <div>
                  <strong>{item.type} / {item.direction}</strong>
                  <p style={mutedStyle}>{new Date(item.createdAt).toLocaleString('th-TH')}</p>
                  <p style={mutedStyle}>Ref: {item.referenceType || '-'} {item.referenceId ? `#${item.referenceId.slice(0, 8)}` : ''}</p>
                </div>
                <h2 style={{ margin: 0, fontSize: 22 }}>{item.direction === 'CREDIT' ? '+' : '-'} THB {Number(item.amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</h2>
              </div>
              <div style={balanceStyle}>
                <p>ก่อน: THB {Number(item.balanceBefore).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</p>
                <p>หลัง: THB {Number(item.balanceAfter).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</p>
              </div>
            </section>
          ))}
          {items.length === 0 && !message && <div style={noticeStyle}>ยังไม่มีรายการ</div>}
        </div>
      </section>
    </main>
  );
}

const pageStyle = { minHeight: '100vh', background: '#080808', color: '#fff', overflowX: 'hidden' } as const;
const containerStyle = { width: '100%', maxWidth: 920, margin: '0 auto', padding: '22px 16px 40px', boxSizing: 'border-box', display: 'grid', gap: 16 } as const;
const backStyle = { color: '#f5c542', textDecoration: 'none', fontWeight: 800 } as const;
const titleStyle = { margin: '6px 0 0', fontSize: 'clamp(34px, 10vw, 54px)', lineHeight: 1 } as const;
const mutedStyle = { margin: 0, opacity: 0.76, lineHeight: 1.55 } as const;
const cardStyle = { border: '1px solid rgba(255,255,255,0.10)', borderRadius: 24, padding: 16, background: '#181818', display: 'grid', gap: 12 } as const;
const rowStyle = { display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' } as const;
const balanceStyle = { borderTop: '1px solid rgba(255,255,255,0.10)', paddingTop: 10, display: 'grid', gap: 6 } as const;
const noticeStyle = { border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16, padding: 12, background: 'rgba(255,255,255,0.07)' } as const;
