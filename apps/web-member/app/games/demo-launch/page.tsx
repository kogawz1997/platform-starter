'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { memberApiFetch } from '../../member-api';

type Transfer = { id: string; type: string; status: string; amount: string; currency: string; providerTransactionId?: string | null; createdAt: string };

export default function DemoLaunchPage() {
  const params = useSearchParams();
  const game = params.get('game') ?? 'demo-game';
  const session = params.get('session') ?? '-';
  const [amount, setAmount] = useState('100');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState('');
  const [transfers, setTransfers] = useState<Transfer[]>([]);

  useEffect(() => { loadTransfers(); }, [session]);

  async function loadTransfers() {
    if (!session || session === '-') return;
    const res = await memberApiFetch(`/member/game-sessions/${session}/transfers`);
    const data = await res.json().catch(() => null);
    if (res.ok) setTransfers(data?.items ?? []);
  }

  async function transfer(type: 'transfer-in' | 'transfer-out') {
    if (!session || session === '-') { setMessage('ไม่พบ session สำหรับ transfer'); return; }
    setBusy(type);
    setMessage(type === 'transfer-in' ? 'กำลังโอนเข้าแบบ dry-run...' : 'กำลังโอนออกแบบ dry-run...');
    const res = await memberApiFetch(`/member/game-sessions/${session}/${type}`, { method: 'POST', body: JSON.stringify({ amount }) });
    const data = await res.json().catch(() => null);
    setBusy('');
    if (!res.ok || !data?.ok) { setMessage(data?.message ?? data?.errorMessage ?? 'transfer dry-run ไม่สำเร็จ'); return; }
    setMessage(`${type === 'transfer-in' ? 'Transfer In' : 'Transfer Out'} สำเร็จ: ${data.transfer.amount} ${data.transfer.currency}`);
    await loadTransfers();
  }

  return <main style={pageStyle}>
    <section style={cardStyle}>
      <span style={eyebrowStyle}>Demo Launch</span>
      <h1 style={titleStyle}>เปิดเกมสำเร็จ</h1>
      <p style={mutedStyle}>นี่คือหน้า demo launch สำหรับทดสอบ flow เท่านั้น ยังไม่มีการตัดเงินจริงหรือเรียก provider จริง</p>
      <div style={screenStyle}><strong>{game}</strong><span>Session</span><code style={codeStyle}>{session}</code></div>
      <section style={panelStyle}>
        <strong>Transfer dry-run</strong>
        <p style={mutedStyle}>ทดสอบ transfer in/out โดยบันทึก log เท่านั้น ยังไม่ตัดยอด wallet จริง</p>
        <input value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="decimal" style={inputStyle} />
        <div style={actionRowStyle}>
          <button type="button" style={buttonStyle} disabled={Boolean(busy)} onClick={() => transfer('transfer-in')}>{busy === 'transfer-in' ? 'กำลังโอน...' : 'Transfer In'}</button>
          <button type="button" style={secondaryButtonStyle} disabled={Boolean(busy)} onClick={() => transfer('transfer-out')}>{busy === 'transfer-out' ? 'กำลังโอน...' : 'Transfer Out'}</button>
        </div>
        {message && <div style={noticeStyle}>{message}</div>}
      </section>
      <section style={panelStyle}>
        <strong>ประวัติ transfer ของ session</strong>
        {transfers.map((item) => <div key={item.id} style={historyRowStyle}><div><strong>{item.type}</strong><p style={mutedStyle}>{item.amount} {item.currency} · {item.providerTransactionId ?? '-'}</p></div><em style={statusStyle}>{item.status}</em></div>)}
        {transfers.length === 0 && <p style={mutedStyle}>ยังไม่มี transfer ใน session นี้</p>}
      </section>
      <a href="/games" style={linkButtonStyle}>กลับไปหน้าเกม</a>
    </section>
  </main>;
}

const pageStyle = { minHeight: '100dvh', background: 'radial-gradient(circle at top,#1f2937,#050505 58%)', color: '#fff', display: 'grid', placeItems: 'center', padding: 18 } as const;
const cardStyle = { width: '100%', maxWidth: 560, border: '1px solid rgba(245,197,66,.24)', borderRadius: 28, padding: 22, background: 'rgba(15,23,42,.86)', boxShadow: '0 28px 80px rgba(0,0,0,.45)', display: 'grid', gap: 16 } as const;
const eyebrowStyle = { color: '#facc15', fontWeight: 950, letterSpacing: '.1em', textTransform: 'uppercase' as const, fontSize: 12 };
const titleStyle = { margin: 0, fontSize: 36, lineHeight: 1.05 } as const;
const mutedStyle = { margin: 0, color: '#cbd5e1', lineHeight: 1.6 } as const;
const screenStyle = { minHeight: 180, borderRadius: 22, border: '1px solid rgba(148,163,184,.2)', background: 'linear-gradient(135deg,rgba(245,197,66,.16),rgba(59,130,246,.12))', display: 'grid', placeItems: 'center', textAlign: 'center' as const, gap: 8, padding: 18 };
const panelStyle = { border: '1px solid rgba(148,163,184,.2)', borderRadius: 20, padding: 14, background: 'rgba(2,6,23,.52)', display: 'grid', gap: 12 } as const;
const inputStyle = { minHeight: 46, borderRadius: 14, border: '1px solid rgba(148,163,184,.24)', background: '#0f172a', color: '#fff', padding: '0 12px', fontWeight: 900, fontSize: 18 };
const actionRowStyle = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 } as const;
const codeStyle = { maxWidth: '100%', overflowWrap: 'anywhere' as const, color: '#fef3c7', background: 'rgba(0,0,0,.24)', borderRadius: 12, padding: '8px 10px' };
const buttonStyle = { minHeight: 48, borderRadius: 16, display: 'grid', placeItems: 'center', background: '#f5c542', color: '#111827', fontWeight: 950, textDecoration: 'none', border: 0 } as const;
const secondaryButtonStyle = { ...buttonStyle, background: '#334155', color: '#e2e8f0' } as const;
const linkButtonStyle = { minHeight: 48, borderRadius: 16, display: 'grid', placeItems: 'center', background: '#f5c542', color: '#111827', fontWeight: 950, textDecoration: 'none' } as const;
const noticeStyle = { padding: 12, borderRadius: 14, border: '1px solid rgba(148,163,184,.18)', background: 'rgba(15,23,42,.75)', color: '#e2e8f0' } as const;
const historyRowStyle = { display: 'flex', justifyContent: 'space-between', gap: 10, border: '1px solid rgba(148,163,184,.18)', borderRadius: 14, padding: 12, background: 'rgba(15,23,42,.55)' } as const;
const statusStyle = { color: '#facc15', fontStyle: 'normal', fontWeight: 950 } as const;
