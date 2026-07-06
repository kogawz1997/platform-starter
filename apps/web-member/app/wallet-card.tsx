'use client';

import { useEffect, useState } from 'react';
import { API_URL } from './site-settings';

type WalletResponse = {
  currency: string;
  balance: string;
  lockedBalance: string;
  availableBalance: string;
  status: string;
};

export default function WalletCard({ primaryColor, cardColor, showButtons }: { primaryColor: string; cardColor: string; showButtons: boolean }) {
  const [wallet, setWallet] = useState<WalletResponse | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = window.localStorage.getItem('member_access_token');
    if (!token) {
      setMessage('ยังไม่ได้เข้าสู่ระบบ');
      return;
    }

    fetch(`${API_URL}/member/wallet`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.message ?? 'โหลดกระเป๋าเงินไม่สำเร็จ');
        return data;
      })
      .then((data) => setWallet(data))
      .catch((error) => setMessage(error.message));
  }, []);

  return (
    <section style={{ background: cardColor, borderRadius: 22, padding: 20 }}>
      <p style={{ margin: 0 }}>ยอดเงิน</p>
      <h2 style={{ marginTop: 8 }}>
        {wallet ? `${wallet.currency} ${Number(wallet.availableBalance).toLocaleString('th-TH', { minimumFractionDigits: 2 })}` : '฿0.00'}
      </h2>
      {wallet && <p>Locked: {wallet.lockedBalance} / Status: {wallet.status}</p>}
      {!wallet && message && <p>{message}</p>}
      {showButtons && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <a href="/deposit" style={{ background: primaryColor, color: '#111', borderRadius: 12, padding: '10px 18px', textDecoration: 'none' }}>ฝากเงิน</a>
          <a href="/withdraw" style={{ borderRadius: 12, padding: '10px 18px', textDecoration: 'none', background: '#eee' }}>ถอนเงิน</a>
        </div>
      )}
    </section>
  );
}
