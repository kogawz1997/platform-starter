'use client';

import { FormEvent, useEffect, useState } from 'react';
import { AdminBadge, AdminButton, AdminCard, AdminEmpty, AdminNotice, AdminPage, AdminRow, AdminStack, AdminToolbar } from '../_components/admin-ui';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

type ActivityItem = { id: string; action: string; module: string; targetId?: string | null; oldData?: unknown; newData?: unknown; ipAddress?: string | null; userAgent?: string | null; createdAt: string; adminUser?: { username: string; email: string } | null };

export default function ActivityPage() {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [moduleName, setModuleName] = useState('');
  const [action, setAction] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => { loadItems(); }, []);

  async function loadItems(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const token = window.localStorage.getItem('admin_access_token');
    if (!token) { setMessage('กรุณา login admin ก่อน'); return; }
    const params = new URLSearchParams();
    params.set('limit', '120');
    if (moduleName.trim()) params.set('module', moduleName.trim());
    if (action.trim()) params.set('action', action.trim());
    setMessage('กำลังโหลด activity...');
    const res = await fetch(`${API_URL}/admin/operations/history?${params.toString()}`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json().catch(() => null);
    if (!res.ok) { setMessage(data?.message ?? 'โหลด activity ไม่สำเร็จ'); return; }
    setItems(data.items ?? []); setMessage('');
  }

  return (
    <AdminPage eyebrow="Operations History" title="Activity" description="ตรวจย้อนหลังว่าแอดมินทำอะไรกับระบบการเงินและการตั้งค่า">
      <form onSubmit={loadItems}><AdminToolbar><input value={moduleName} onChange={(e) => setModuleName(e.target.value)} placeholder="module เช่น topups / withdrawals / wallets" /><input value={action} onChange={(e) => setAction(e.target.value)} placeholder="action เช่น APPROVE_TOP_UP" /><AdminButton type="submit">Filter</AdminButton></AdminToolbar></form>
      {message && <AdminNotice>{message}</AdminNotice>}
      <AdminStack>{items.map((item) => <AdminCard key={item.id}><AdminRow><div><AdminBadge>{item.module}</AdminBadge><h2 style={{ margin: '10px 0 4px', fontSize: 26 }}>{item.action}</h2><p>Admin: {item.adminUser?.username ?? item.adminUser?.email ?? '-'}</p><p>Target: {item.targetId ?? '-'}</p></div><div style={{ textAlign: 'right' }}><strong>{new Date(item.createdAt).toLocaleString('th-TH')}</strong><p>IP: {item.ipAddress ?? '-'}</p></div></AdminRow><details style={{ marginTop: 12 }}><summary>ดูข้อมูลเปลี่ยนแปลง</summary><pre style={preStyle}>{JSON.stringify({ oldData: item.oldData, newData: item.newData }, null, 2)}</pre></details></AdminCard>)}{items.length === 0 && <AdminEmpty>ยังไม่มีรายการ</AdminEmpty>}</AdminStack>
    </AdminPage>
  );
}

const preStyle = { whiteSpace: 'pre-wrap' as const, overflowWrap: 'anywhere' as const, border: '1px solid rgba(148,163,184,.18)', borderRadius: 14, padding: 12, background: 'rgba(148,163,184,.06)', color: '#cbd5e1' } as const;
