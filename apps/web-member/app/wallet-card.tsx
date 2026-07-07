'use client';

import { useEffect, useState } from 'react';
import { memberApiFetch } from './member-api';

type WalletResponse = {
  currency: string;
  balance: string;
  lockedBalance: string;
  availableBalance: string;
  status: string;
};

export default function WalletCard({ primaryColor, cardColor, showButtons }: { primaryColor: string; cardColor: string; showButtons: boolean }) {
  const [wallet, setWallet] = useState<WalletResponse | null>(null);
  const [message, setMessage] = useState('กำลังโหลดกระเป๋าเงิน...');

  useEffect(() => {
    memberApiFetch('/member/wallet')
      .then(async (res) => {
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.message ?? 'โหลดกระเป๋าเงินไม่สำเร็จ');
        return data;
      })
      .then((data) => { setWallet(data); setMessage(''); })
      .catch((error) => setMessage(error.message));
  }, []);

  const currency = wallet?.currency ?? 'THB';
  const available = wallet ? Number(wallet.availableBalance) : 0;
  const locked = wallet ? Number(wallet.lockedBalance) : 0;
  const balance = wallet ? Number(wallet.balance) : 0;

  return (
    <section style={{ ...cardStyle, background: `linear-gradient(150deg, ${cardColor}, rgba(255,255,255,.045))` }}>
      <div style={topRowStyle}>
        <div style={{ minWidth: 0 }}>
          <p style={mutedStyle}>ยอดเงินที่ใช้ได้</p>
          <h2 style={amountStyle}>{currency} {available.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</h2>
        </div>
        <span style={{ ...statusStyle, background: wallet?.status === 'ACTIVE' ? 'rgba(80,255,140,0.14)' : 'rgba(255,255,255,0.1)' }}>{wallet?.status ?? 'GUEST'}</span>
      </div>

      <div style={miniGridStyle}>
        <div style={miniBoxStyle}><span>Balance</span><strong>{balance.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</strong></div>
        <div style={miniBoxStyle}><span>Locked</span><strong>{locked.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</strong></div>
      </div>

      {message && <div style={noticeStyle}>{message}</div>}

      {showButtons && (
        <div style={actionRowStyle}>
          <a href="/deposit" style={{ ...actionStyle, background: primaryColor, color: '#111', borderColor: primaryColor }}>ฝากเงิน</a>
          <a href="/withdraw" style={actionStyle}>ถอนเงิน</a>
          <a href="/transactions" style={actionStyle}>ประวัติ</a>
          <a href="/bank-accounts" style={actionStyle}>บัญชีถอน</a>
        </div>
      )}
    </section>
  );
}

const cardStyle = { border: '1px solid rgba(255,255,255,0.10)', borderRadius: 24, padding: 16, display: 'grid', gap: 12, boxShadow: '0 16px 45px rgba(0,0,0,0.20)', overflow: 'hidden', minWidth: 0 } as const;
const topRowStyle = { display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start', flexWrap: 'wrap' as const, minWidth: 0 };
const mutedStyle = { margin: 0, opacity: 0.72, fontSize: 13, fontWeight: 800 } as const;
const amountStyle = { margin: '4px 0 0', fontSize: 'clamp(28px, 8vw, 42px)', lineHeight: 1, letterSpacing: -0.8, overflowWrap: 'anywhere' as const };
const statusStyle = { border: '1px solid rgba(255,255,255,0.12)', borderRadius: 999, padding: '6px 9px', fontSize: 11, fontWeight: 900, flex: '0 0 auto' } as const;
const miniGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 } as const;
const miniBoxStyle = { border: '1px solid rgba(255,255,255,0.10)', borderRadius: 16, padding: '10px 11px', display: 'grid', gap: 3, background: 'rgba(255,255,255,0.05)', minWidth: 0, overflow: 'hidden' as const };
const noticeStyle = { border: '1px solid rgba(255,255,255,0.12)', borderRadius: 14, padding: 10, background: 'rgba(255,255,255,0.06)', fontSize: 13 } as const;
const actionRowStyle = { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 } as const;
const actionStyle = { border: '1px solid rgba(255,255,255,0.12)', borderRadius: 14, minHeight: 44, padding: '11px 8px', textAlign: 'center' as const, textDecoration: 'none', color: 'inherit', fontWeight: 950, background: 'rgba(255,255,255,0.10)', display: 'grid', placeItems: 'center', fontSize: 15, lineHeight: 1.15 };
