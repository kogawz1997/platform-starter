'use client';

import { useEffect, useState } from 'react';
import { AdminBadge, AdminButton, AdminCard, AdminEmpty, AdminNotice, AdminPage, AdminRow, AdminStack, AdminToolbar, formatMoney } from '../_components/admin-ui';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

type LedgerItem = { id: string; userId: string; shortUserId?: string | null; type: string; direction: string; amount: string; balanceBefore: string; balanceAfter: string; referenceType?: string | null; referenceId?: string | null; createdAt: string; user?: { id: string; username: string; shortId?: string | null; phone?: string | null; email?: string | null }; createdByAdmin?: { id: string; username: string; email?: string | null } | null };

export default function AdminLedgersPage() {
  const [items, setItems] = useState<LedgerItem[]>([]);
  const [type, setType] = useState('');
  const [direction, setDirection] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => { const params = new URLSearchParams(window.location.search); const nextIdentifier = params.get('identifier') ?? params.get('userId') ?? ''; setIdentifier(nextIdentifier); loadItems(nextIdentifier); }, []);

  async function loadItems(nextIdentifier = identifier) {
    const token = window.localStorage.getItem('admin_access_token');
    if (!token) { setMessage('กรุณา login admin ก่อน'); return; }
    const params = new URLSearchParams();
    if (type) params.set('type', type);
    if (direction) params.set('direction', direction);
    if (nextIdentifier) params.set('identifier', nextIdentifier);
    params.set('limit', '200');
    setMessage('กำลังโหลด ledger...');
    const res = await fetch(`${API_URL}/admin/ledgers?${params.toString()}`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json().catch(() => null);
    if (!res.ok) { setMessage(data?.message ?? 'โหลด ledger ไม่สำเร็จ'); return; }
    setItems(data.items ?? []); setMessage('');
  }

  return (
    <AdminPage eyebrow="Wallet Operations" title="Wallet Ledgers" description="ค้นหาด้วย username, Short ID หรือ userId และกรองประเภทรายการได้" actions={<AdminButton onClick={() => loadItems()}>Apply</AdminButton>}>
      <AdminToolbar><input value={identifier} onChange={(event) => setIdentifier(event.target.value)} placeholder="username / short ID / user ID" /><select value={type} onChange={(event) => setType(event.target.value)}><option value="">ทุกประเภท</option><option value="DEPOSIT">DEPOSIT</option><option value="WITHDRAWAL">WITHDRAWAL</option><option value="ADJUSTMENT">ADJUSTMENT</option><option value="BONUS">BONUS</option><option value="REVERSAL">REVERSAL</option></select><select value={direction} onChange={(event) => setDirection(event.target.value)}><option value="">ทุกทิศทาง</option><option value="CREDIT">CREDIT</option><option value="DEBIT">DEBIT</option></select></AdminToolbar>
      {message && <AdminNotice>{message}</AdminNotice>}
      <AdminStack>{items.map((item) => <AdminCard key={item.id}><AdminRow><div><AdminBadge tone={item.direction === 'CREDIT' ? 'success' : 'danger'}>{item.type}</AdminBadge><h2 style={{ margin: '10px 0 4px' }}>{item.direction}</h2><p>Member: {item.user?.username ?? item.userId}</p><p>Short ID: {item.user?.shortId ?? item.shortUserId ?? '-'}</p><p>Ref: {item.referenceType || '-'} {item.referenceId ? `#${item.referenceId.slice(0, 8)}` : ''}</p><p>Admin: {item.createdByAdmin?.username ?? '-'}</p><p>{new Date(item.createdAt).toLocaleString('th-TH')}</p></div><strong style={{ fontSize: 'clamp(22px, 6vw, 32px)', textAlign: 'right', color: item.direction === 'CREDIT' ? '#bbf7d0' : '#fecaca' }}>{item.direction === 'CREDIT' ? '+' : '-'} {formatMoney(item.amount)}</strong></AdminRow><div style={balanceGridStyle}><div><span>Before</span><strong>{formatMoney(item.balanceBefore)}</strong></div><div><span>After</span><strong>{formatMoney(item.balanceAfter)}</strong></div></div></AdminCard>)}{items.length === 0 && <AdminEmpty>ยังไม่มีรายการ</AdminEmpty>}</AdminStack>
    </AdminPage>
  );
}

const balanceGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, marginTop: 14, borderTop: '1px solid rgba(148,163,184,.18)', paddingTop: 12 } as const;
