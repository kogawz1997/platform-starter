'use client';

import { FormEvent, useEffect, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminEmpty, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminRow, AdminStack, AdminToolbar, formatMoney } from '../_components/admin-ui';

type MemberItem = { id: string; shortId: string; username: string; phone?: string | null; email?: string | null; status: string; displayName?: string | null; balance: string; lockedBalance: string; availableBalance: string; createdAt: string; lastLoginAt?: string | null };
const STATUSES = ['ALL', 'ACTIVE', 'SUSPENDED', 'LOCKED', 'CLOSED'];

export default function MembersPage() {
  const [items, setItems] = useState<MemberItem[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [message, setMessage] = useState('');
  const [busyId, setBusyId] = useState('');

  useEffect(() => { loadItems(); }, []);

  async function loadItems(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setMessage('กำลังโหลดสมาชิก...');
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    if (status !== 'ALL') params.set('status', status);
    const res = await adminApiFetch(`/admin/members?${params.toString()}`);
    const data = await res.json().catch(() => null);
    if (!res.ok) { setMessage(data?.message ?? 'โหลดสมาชิกไม่สำเร็จ'); return; }
    setItems(data.items ?? []); setMessage('');
  }

  async function updateStatus(id: string, nextStatus: string) {
    setBusyId(id); setMessage('กำลังอัปเดตสถานะ...');
    const res = await adminApiFetch(`/admin/members/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status: nextStatus, reason: 'quick action from members page' }) });
    const data = await res.json().catch(() => null); setBusyId('');
    if (!res.ok) { setMessage(data?.message ?? 'อัปเดตสถานะไม่สำเร็จ'); return; }
    setItems((current) => current.map((item) => item.id === id ? { ...item, status: data.user.status } : item));
    setMessage('อัปเดตสถานะแล้ว');
  }

  const activeCount = items.filter((item) => item.status === 'ACTIVE').length;
  const restrictedCount = items.filter((item) => item.status !== 'ACTIVE').length;

  return <AdminPage eyebrow="Operations" title="Members" description="ค้นหา ตรวจสถานะ และจัดการสมาชิกจากหน้าเดียว" actions={<AdminButton onClick={() => loadItems()}>Refresh</AdminButton>}><form onSubmit={loadItems}><AdminToolbar><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="username / phone / email / shortId" /><select value={status} onChange={(e) => setStatus(e.target.value)}>{STATUSES.map((item) => <option key={item} value={item}>{item}</option>)}</select><AdminButton type="submit">Search</AdminButton></AdminToolbar></form>{message && <AdminNotice>{message}</AdminNotice>}<AdminMetricGrid><AdminMetric title="Loaded" value={`${items.length}`} /><AdminMetric title="Active" value={`${activeCount}`} /><AdminMetric title="Restricted" value={`${restrictedCount}`} /></AdminMetricGrid><AdminStack>{items.map((item) => <AdminCard key={item.id}><AdminRow><div><AdminBadge tone={item.status === 'ACTIVE' ? 'success' : 'danger'}>{item.status}</AdminBadge><h2 style={{ margin: '10px 0 4px', fontSize: 28 }}>{item.username}</h2><p>{item.displayName || 'No display name'} · {item.shortId}</p><p>{item.phone || '-'} · {item.email || '-'}</p><p>Joined {new Date(item.createdAt).toLocaleDateString('th-TH')}</p></div><div style={{ textAlign: 'right', display: 'grid', gap: 10, minWidth: 220 }}><div><span style={{ opacity: 0.66 }}>Available</span><strong style={{ display: 'block', fontSize: 22 }}>{formatMoney(item.availableBalance)}</strong></div><a href={`/member-detail?id=${item.id}`} style={linkStyle}>View profile</a><div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}><AdminButton disabled={busyId === item.id || item.status === 'ACTIVE'} tone="success" onClick={() => updateStatus(item.id, 'ACTIVE')}>Active</AdminButton><AdminButton disabled={busyId === item.id || item.status === 'SUSPENDED'} tone="danger" onClick={() => updateStatus(item.id, 'SUSPENDED')}>Suspend</AdminButton><AdminButton disabled={busyId === item.id || item.status === 'LOCKED'} tone="danger" onClick={() => updateStatus(item.id, 'LOCKED')}>Lock</AdminButton></div></div></AdminRow></AdminCard>)}{items.length === 0 && <AdminEmpty>ไม่พบสมาชิก</AdminEmpty>}</AdminStack></AdminPage>;
}

const linkStyle = { color: '#f5c542', fontWeight: 900, textDecoration: 'none' } as const;
