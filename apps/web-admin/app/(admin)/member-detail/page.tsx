'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { AdminButton, AdminCard, AdminEmpty, AdminGrid, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminRow, AdminStack, AdminToolbar, formatMoney } from '../_components/admin-ui';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

type MemberDetail = {
  user: { id: string; shortId: string; username: string; phone?: string | null; email?: string | null; status: string; createdAt: string; lastLoginAt?: string | null };
  wallet: { currency: string; balance: string; lockedBalance: string; availableBalance: string; status: string; updatedAt: string } | null;
  topUps: MoneyItem[];
  withdrawals: MoneyItem[];
  ledgers: { id: string; type: string; direction: string; amount: string; balanceBefore: string; balanceAfter: string; referenceType?: string | null; referenceId?: string | null; createdAt: string }[];
  activity: { id: string; action: string; module: string; targetId?: string | null; createdAt: string; adminUser?: { username: string; email: string } | null }[];
};
type MoneyItem = { id: string; amount: string; currency: string; status: string; method?: string | null; createdAt: string; adminNote?: string | null };

export default function MemberDetailPage() {
  const initialId = useMemo(() => (typeof window === 'undefined' ? '' : new URLSearchParams(window.location.search).get('id') ?? ''), []);
  const [memberId, setMemberId] = useState(initialId);
  const [detail, setDetail] = useState<MemberDetail | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => { if (initialId) loadDetail(initialId); }, [initialId]);

  async function loadDetail(nextId = memberId) {
    const id = nextId.trim();
    if (!id) { setMessage('ใส่ member ID ก่อน'); return; }
    const token = window.localStorage.getItem('admin_access_token');
    if (!token) { setMessage('กรุณา login admin ก่อน'); return; }
    setMessage('กำลังโหลด member detail...');
    const res = await fetch(`${API_URL}/admin/members/${id}`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json().catch(() => null);
    if (!res.ok) { setMessage(data?.message ?? 'โหลด member ไม่สำเร็จ'); return; }
    setDetail(data); setMessage('');
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) { event.preventDefault(); loadDetail(); }

  return (
    <AdminPage eyebrow="Member Detail" title={detail?.user.username ?? 'Member'} description={detail?.user.id ?? 'ค้นหา member ด้วย full ID'} actions={<AdminButton onClick={() => loadDetail()}>Refresh</AdminButton>}>
      <form onSubmit={submitSearch}><AdminToolbar><input value={memberId} onChange={(event) => setMemberId(event.target.value)} placeholder="full member ID" /><AdminButton type="submit">Load Member</AdminButton></AdminToolbar></form>
      {message && <AdminNotice>{message}</AdminNotice>}
      {detail && <AdminMetricGrid><AdminMetric title="Status" value={detail.user.status} /><AdminMetric title="Available" value={detail.wallet ? formatMoney(detail.wallet.availableBalance) : '-'} /><AdminMetric title="Balance" value={detail.wallet ? formatMoney(detail.wallet.balance) : '-'} /><AdminMetric title="Locked" value={detail.wallet ? formatMoney(detail.wallet.lockedBalance) : '-'} /></AdminMetricGrid>}
      {detail && <AdminCard title="Profile"><AdminRow><div><strong>{detail.user.username}</strong><p>Short ID: {detail.user.shortId}</p><p>Phone: {detail.user.phone ?? '-'}</p><p>Email: {detail.user.email ?? '-'}</p></div><div style={{ textAlign: 'right' }}><p>Created: {new Date(detail.user.createdAt).toLocaleString('th-TH')}</p><p>Last login: {detail.user.lastLoginAt ? new Date(detail.user.lastLoginAt).toLocaleString('th-TH') : '-'}</p></div></AdminRow></AdminCard>}
      {detail && <AdminGrid><MoneyCard title="Top-ups" items={detail.topUps} /><MoneyCard title="Withdrawals" items={detail.withdrawals} /></AdminGrid>}
      {detail && <AdminCard title="Ledgers" action={<a href={`/ledgers?identifier=${detail.user.id}`}>เปิด Ledger</a>}><AdminStack>{detail.ledgers.slice(0, 20).map((item) => <AdminRow key={item.id}><div><strong>{item.type} / {item.direction}</strong><p>{item.referenceType ?? '-'} · {item.referenceId ?? '-'}</p></div><div style={{ textAlign: 'right' }}><strong>{formatMoney(item.amount)}</strong><p>{formatMoney(item.balanceBefore)} → {formatMoney(item.balanceAfter)}</p></div></AdminRow>)}</AdminStack></AdminCard>}
      {detail && <AdminCard title="Admin Activity"><AdminStack>{detail.activity.map((item) => <AdminRow key={item.id}><div><strong>{item.module} / {item.action}</strong><p>By: {item.adminUser?.username ?? item.adminUser?.email ?? '-'}</p></div><p>{new Date(item.createdAt).toLocaleString('th-TH')}</p></AdminRow>)}{detail.activity.length === 0 && <AdminEmpty>ยังไม่มี activity ที่ผูกกับ member นี้</AdminEmpty>}</AdminStack></AdminCard>}
    </AdminPage>
  );
}

function MoneyCard({ title, items }: { title: string; items: MoneyItem[] }) {
  return <AdminCard title={title}><AdminStack>{items.map((item) => <AdminRow key={item.id}><div><strong>{item.status}</strong><p>{item.method ?? '-'} · {new Date(item.createdAt).toLocaleString('th-TH')}</p>{item.adminNote && <p>Admin note: {item.adminNote}</p>}</div><strong>{formatMoney(item.amount)}</strong></AdminRow>)}{items.length === 0 && <AdminEmpty>ยังไม่มีรายการ</AdminEmpty>}</AdminStack></AdminCard>;
}
