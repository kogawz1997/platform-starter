'use client';

import { FormEvent, useEffect, useState } from 'react';
import { AdminBadge, AdminButton, AdminCard, AdminEmpty, AdminLinkButton, AdminNotice, AdminPage, AdminRow, AdminStack, AdminToolbar, formatMoney } from '../_components/admin-ui';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

type WalletItem = { id: string; userId: string; shortUserId?: string | null; currency: string; balance: string; lockedBalance: string; availableBalance: string; status: string; updatedAt: string; user?: { id: string; username: string; shortId?: string | null; phone?: string | null; email?: string | null; status: string } };

export default function AdminWalletsPage() {
  const [items, setItems] = useState<WalletItem[]>([]);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');
  const [adjustUserId, setAdjustUserId] = useState('');
  const [direction, setDirection] = useState<'CREDIT' | 'DEBIT'>('CREDIT');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { loadItems(); }, []);

  async function loadItems(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const token = window.localStorage.getItem('admin_access_token');
    if (!token) { setMessage('กรุณา login admin ก่อน'); return; }
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    params.set('limit', '200');
    setMessage('กำลังโหลด wallets...');
    const res = await fetch(`${API_URL}/admin/wallets?${params.toString()}`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json().catch(() => null);
    if (!res.ok) { setMessage(data?.message ?? 'โหลด wallets ไม่สำเร็จ'); return; }
    setItems(data.items ?? []); setMessage('');
  }

  async function adjustWallet(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const token = window.localStorage.getItem('admin_access_token');
    if (!token) { setMessage('กรุณา login admin ก่อน'); return; }
    if (!adjustUserId) { setMessage('เลือก member ก่อน'); return; }
    const parsedAmount = Number(amount.replace(/,/g, '').trim());
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) { setMessage('จำนวนเงินต้องมากกว่า 0'); return; }
    if (!reason.trim()) { setMessage('ต้องใส่เหตุผล'); return; }
    const idempotencyKey = `wallet-adjust-${adjustUserId}-${direction}-${parsedAmount}-${Date.now()}`;
    setBusy(true); setMessage('กำลังปรับยอด...');
    const res = await fetch(`${API_URL}/admin/wallets/${adjustUserId}/adjust`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ direction, amount: parsedAmount, reason, idempotencyKey }) });
    const data = await res.json().catch(() => null); setBusy(false);
    if (!res.ok) { setMessage(data?.message ?? 'ปรับยอดไม่สำเร็จ'); return; }
    setItems((current) => current.map((item) => (item.userId === adjustUserId ? { ...item, ...data.wallet } : item)));
    setAmount(''); setReason(''); setMessage('ปรับยอดสำเร็จ และเขียน ledger แล้ว');
  }

  function startAdjust(item: WalletItem, nextDirection: 'CREDIT' | 'DEBIT') { setAdjustUserId(item.userId); setDirection(nextDirection); setMessage(`กำลังปรับยอดให้ ${item.user?.username ?? item.shortUserId}`); setTimeout(() => document.getElementById('adjust-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50); }

  return (
    <AdminPage eyebrow="Wallet Operations" title="Member Wallets" description="ค้นหา member และปรับยอด manual พร้อมบันทึก ledger">
      <form onSubmit={loadItems}><AdminToolbar><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="username / short ID / user ID" /><AdminButton type="submit">Search</AdminButton></AdminToolbar></form>
      <form id="adjust-form" onSubmit={adjustWallet}><AdminToolbar><strong style={{ fontSize: 20 }}>Manual Wallet Adjustment</strong><input value={adjustUserId} onChange={(event) => setAdjustUserId(event.target.value)} placeholder="full userId" /><select value={direction} onChange={(event) => setDirection(event.target.value as 'CREDIT' | 'DEBIT')}><option value="CREDIT">เพิ่มยอด / CREDIT</option><option value="DEBIT">ลดยอด / DEBIT</option></select><input value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="amount" inputMode="decimal" /><input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="reason จำเป็น" /><AdminButton type="submit" disabled={busy}>{busy ? 'กำลังทำ...' : 'Confirm Adjustment'}</AdminButton></AdminToolbar></form>
      {message && <AdminNotice>{message}</AdminNotice>}
      <AdminStack>{items.map((item) => <AdminCard key={item.id}><AdminRow><div><AdminBadge tone={item.status === 'ACTIVE' ? 'success' : 'neutral'}>{item.status}</AdminBadge><h2 style={{ margin: '10px 0 4px' }}>{item.user?.username ?? item.userId}</h2><p>Short ID: <strong>{item.user?.shortId ?? item.shortUserId ?? '-'}</strong></p><p>User ID: <code>{item.userId}</code></p><p>Phone: {item.user?.phone ?? '-'}</p><p>Email: {item.user?.email ?? '-'}</p><p>Updated: {new Date(item.updatedAt).toLocaleString('th-TH')}</p></div><div style={{ textAlign: 'right' }}><h2 style={{ margin: '0 0 8px', fontSize: 'clamp(26px, 7vw, 40px)', lineHeight: 1 }}>{formatMoney(item.availableBalance)}</h2><p>Balance: {formatMoney(item.balance)}</p><p>Locked: {formatMoney(item.lockedBalance)}</p><div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12, justifyContent: 'flex-end' }}><AdminLinkButton href={`/member-detail?id=${item.userId}`}>Member Detail</AdminLinkButton><AdminLinkButton href={`/ledgers?identifier=${item.user?.shortId ?? item.shortUserId ?? item.userId}`}>Ledger</AdminLinkButton><AdminButton onClick={() => navigator.clipboard?.writeText(item.userId)} tone="secondary">Copy ID</AdminButton><AdminButton onClick={() => startAdjust(item, 'CREDIT')} tone="success">+ เพิ่มยอด</AdminButton><AdminButton onClick={() => startAdjust(item, 'DEBIT')} tone="danger">- ลดยอด</AdminButton></div></div></AdminRow></AdminCard>)}{items.length === 0 && <AdminEmpty>ยังไม่มีรายการ</AdminEmpty>}</AdminStack>
    </AdminPage>
  );
}
