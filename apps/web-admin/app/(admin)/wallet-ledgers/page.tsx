'use client';

import { useEffect, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminEmpty, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminRow, AdminStack, AdminToolbar } from '../_components/admin-ui';

type Ledger = { id: string; type: string; direction: string; amount: string; balanceBefore: string; balanceAfter: string; referenceType?: string | null; referenceId?: string | null; idempotencyKey?: string | null; metadata?: any; createdAt: string; user?: { username?: string | null; phone?: string | null } | null; wallet?: { currency?: string | null } | null };

export default function WalletLedgersPage() {
  const [items, setItems] = useState<Ledger[]>([]);
  const [message, setMessage] = useState('กำลังโหลด wallet ledger...');
  const [loading, setLoading] = useState(false);
  useEffect(() => { load(); }, []);
  async function load() {
    setLoading(true); setMessage('กำลังโหลด wallet ledger...');
    const res = await adminApiFetch('/admin/money-ops/ledger?take=100');
    const data = await res.json().catch(() => null);
    setLoading(false);
    if (!res.ok) { setMessage(data?.message ?? 'โหลด wallet ledger ไม่สำเร็จ'); return; }
    setItems(data.items ?? []); setMessage('');
  }
  const credit = items.filter((item) => item.direction === 'CREDIT').length;
  const debit = items.filter((item) => item.direction === 'DEBIT').length;
  return <AdminPage eyebrow="Money" title="Wallet Ledgers" description="ดูรายการเดินเงินจริงของวอเลต: ฝาก ถอน โยกเงิน เกม rollback และ idempotency" actions={<AdminButton onClick={load} disabled={loading}>Refresh</AdminButton>}>
    {message && <AdminNotice>{message}</AdminNotice>}
    <AdminMetricGrid><AdminMetric title="Total" value={String(items.length)} helper="latest 100" /><AdminMetric title="Credit" value={String(credit)} helper="เงินเข้า wallet" /><AdminMetric title="Debit" value={String(debit)} helper="เงินออก wallet" /><AdminMetric title="Game refs" value={String(items.filter((item) => item.referenceType?.includes('GAME')).length)} helper="โยกเงินเกม" /></AdminMetricGrid>
    <AdminToolbar><strong>Ledger list</strong><span style={mutedStyle}>ยอดก่อน / จำนวน / ยอดหลัง ต้องต่อกันได้ ไม่ใช่แต่งตัวเลขสวย ๆ แล้วหวังว่าบัญชีจะให้อภัย</span></AdminToolbar>
    <AdminStack>{items.map((item) => <AdminCard key={item.id}><AdminRow><div><strong>{ledgerTitle(item)}</strong><p style={mutedStyle}>{item.user?.username ?? item.user?.phone ?? '-'} · {new Date(item.createdAt).toLocaleString('th-TH')}</p><p style={smallStyle}>{item.referenceType ?? '-'} · {item.referenceId ?? '-'}</p></div><div style={rightStyle}><AdminBadge tone={item.direction === 'CREDIT' ? 'success' : 'warning'}>{item.direction}</AdminBadge><strong>{formatMoney(item.amount, item.wallet?.currency ?? 'THB')}</strong></div></AdminRow><div style={balanceGridStyle}><span>ก่อน: {formatMoney(item.balanceBefore, item.wallet?.currency ?? 'THB')}</span><span>หลัง: {formatMoney(item.balanceAfter, item.wallet?.currency ?? 'THB')}</span><span>Key: {item.idempotencyKey ?? '-'}</span></div>{item.metadata && <details style={detailsStyle}><summary>metadata</summary><pre style={preStyle}>{JSON.stringify(item.metadata, null, 2)}</pre></details>}</AdminCard>)}{!loading && items.length === 0 && <AdminEmpty>ยังไม่มี wallet ledger</AdminEmpty>}</AdminStack>
  </AdminPage>;
}
function ledgerTitle(item: Ledger) { if (item.referenceType?.includes('GAME')) return item.direction === 'DEBIT' ? 'โยกเข้าเกม' : item.type === 'REVERSAL' ? 'Rollback คืนวอเลต' : 'โยกกลับวอเลต'; if (item.type === 'DEPOSIT') return 'ฝาก'; if (item.type === 'WITHDRAWAL') return 'ถอนเงิน'; if (item.type === 'ADJUSTMENT') return 'ปรับยอด'; return item.type; }
function formatMoney(value: string | number, currency: string) { return `${currency} ${Number(value).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`; }
const mutedStyle = { margin: 0, color: '#94a3b8', lineHeight: 1.55 } as const;
const smallStyle = { margin: 0, color: '#64748b', fontSize: 12 } as const;
const rightStyle = { display: 'grid', gap: 8, justifyItems: 'end' as const };
const balanceGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(180px,100%),1fr))', gap: 8, color: '#cbd5e1', fontSize: 13 } as const;
const detailsStyle = { marginTop: 6, color: '#cbd5e1' } as const;
const preStyle = { overflowX: 'auto' as const, whiteSpace: 'pre-wrap' as const, background: '#020617', borderRadius: 12, padding: 12 } as const;
