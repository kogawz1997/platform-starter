'use client';

import { useEffect, useMemo, useState } from 'react';
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
  const [message, setMessage] = useState('กำลังโหลด...');

  useEffect(() => {
    memberApiFetch('/member/wallet/ledger?limit=100')
      .then(async (res) => {
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.message ?? 'โหลดข้อมูลไม่สำเร็จ');
        return data;
      })
      .then((data) => { setItems(data.items ?? []); setMessage(''); })
      .catch((error) => setMessage(error.message));
  }, []);

  const summary = useMemo(() => {
    const income = items.filter((item) => item.direction === 'CREDIT').reduce((sum, item) => sum + Number(item.amount), 0);
    const outcome = items.filter((item) => item.direction === 'DEBIT').reduce((sum, item) => sum + Number(item.amount), 0);
    return { income, outcome, net: income - outcome, count: items.length };
  }, [items]);

  return (
    <main style={pageStyle}>
      <section style={containerStyle}>
        <a href="/" style={backStyle}>← หน้าแรก</a>
        <h1 style={titleStyle}>ประวัติ</h1>
        {message && <div style={noticeStyle}>{message}</div>}

        <section style={summaryGridStyle}>
          <SummaryCard label="เข้า" value={summary.income} tone="credit" />
          <SummaryCard label="ออก" value={summary.outcome} tone="debit" />
          <SummaryCard label="สุทธิ" value={summary.net} tone={summary.net >= 0 ? 'credit' : 'debit'} />
          <div style={summaryCardStyle}><span>รายการ</span><strong>{summary.count.toLocaleString('th-TH')}</strong></div>
        </section>

        <section style={listHeadStyle}><h2>รายการ</h2><span>{items.length.toLocaleString('th-TH')}</span></section>
        <div style={listStyle}>
          {items.map((item) => (
            <section key={item.id} style={cardStyle}>
              <div style={topGridStyle}>
                <div style={infoStyle}>
                  <span style={badgeStyle(item.direction)}>{directionLabel(item.direction)}</span>
                  <strong>{typeLabel(item.type)}</strong>
                  <p style={mutedStyle}>{new Date(item.createdAt).toLocaleString('th-TH')}</p>
                </div>
                <h2 style={amountStyle(item.direction)}>{item.direction === 'CREDIT' ? '+' : '-'} {formatMoney(item.amount)}</h2>
              </div>
              <div style={balanceStyle}>
                <div style={balanceItemStyle}><span>ก่อน</span><strong>{formatMoney(item.balanceBefore)}</strong></div>
                <div style={balanceItemStyle}><span>หลัง</span><strong>{formatMoney(item.balanceAfter)}</strong></div>
              </div>
            </section>
          ))}
          {items.length === 0 && !message && <div style={noticeStyle}>ยังไม่มีรายการ</div>}
        </div>
      </section>
    </main>
  );
}

function SummaryCard({ label, value, tone }: { label: string; value: number; tone: 'credit' | 'debit' }) {
  return <div style={summaryCardStyle}><span>{label}</span><strong style={{ color: tone === 'credit' ? '#86efac' : '#fca5a5' }}>{formatMoney(value)}</strong></div>;
}

function typeLabel(type: string) {
  const upper = type.toUpperCase();
  if (upper.includes('DEPOSIT') || upper.includes('TOPUP')) return 'ฝาก';
  if (upper.includes('WITHDRAW')) return 'ถอนเงิน';
  if (upper.includes('ADJUST')) return 'ปรับยอด';
  return 'รายการ';
}

function directionLabel(direction: string) {
  return direction === 'CREDIT' ? 'เข้า' : 'ออก';
}

function formatMoney(value: string | number) {
  return `THB ${Number(value).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`;
}

const pageStyle = { minHeight: '100vh', background: '#080808', color: '#fff', overflowX: 'hidden' as const };
const containerStyle = { width: '100%', maxWidth: 920, margin: '0 auto', padding: '18px 12px calc(44px + env(safe-area-inset-bottom))', boxSizing: 'border-box' as const, display: 'grid', gap: 16, overflowX: 'hidden' as const };
const backStyle = { color: '#f5c542', textDecoration: 'none', fontWeight: 800 } as const;
const titleStyle = { margin: '6px 0 0', fontSize: 'clamp(34px, 10vw, 54px)', lineHeight: 1, overflowWrap: 'anywhere' as const };
const mutedStyle = { margin: 0, opacity: 0.76, lineHeight: 1.55, overflowWrap: 'anywhere' as const };
const summaryGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(150px, 100%), 1fr))', gap: 10, minWidth: 0 } as const;
const summaryCardStyle = { border: '1px solid rgba(255,255,255,0.10)', borderRadius: 20, padding: 14, background: 'linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.025))', display: 'grid', gap: 8, minWidth: 0, overflow: 'hidden' as const };
const listHeadStyle = { display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'end', flexWrap: 'wrap' as const };
const listStyle = { display: 'grid', gap: 12, minWidth: 0 } as const;
const cardStyle = { border: '1px solid rgba(255,255,255,0.10)', borderRadius: 24, padding: 16, background: '#181818', display: 'grid', gap: 12, minWidth: 0, overflow: 'hidden' as const };
const topGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(230px, 100%), 1fr))', gap: 12, minWidth: 0 } as const;
const infoStyle = { display: 'grid', gap: 7, minWidth: 0 };
function amountStyle(direction: string) { return { margin: 0, fontSize: 'clamp(22px, 7vw, 30px)', lineHeight: 1.1, overflowWrap: 'anywhere' as const, color: direction === 'CREDIT' ? '#86efac' : '#fca5a5' }; }
const balanceStyle = { borderTop: '1px solid rgba(255,255,255,0.10)', paddingTop: 10, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(180px, 100%), 1fr))', gap: 8, minWidth: 0 } as const;
const balanceItemStyle = { border: '1px solid rgba(255,255,255,.08)', borderRadius: 14, padding: 10, background: 'rgba(255,255,255,.04)', display: 'grid', gap: 4, minWidth: 0, overflowWrap: 'anywhere' as const };
const noticeStyle = { border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16, padding: 12, background: 'rgba(255,255,255,0.07)', overflowWrap: 'anywhere' as const };
function badgeStyle(direction: string) { return { width: 'fit-content', border: '1px solid rgba(255,255,255,.12)', borderRadius: 999, padding: '6px 10px', background: direction === 'CREDIT' ? 'rgba(34,197,94,.14)' : 'rgba(239,68,68,.14)', color: direction === 'CREDIT' ? '#bbf7d0' : '#fecaca', fontSize: 12, fontWeight: 900 }; }
