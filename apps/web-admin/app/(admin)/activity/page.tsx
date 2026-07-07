'use client';

import { FormEvent, useEffect, useState } from 'react';

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
    <main style={pageStyle}>
      <a href="/dashboard" style={backStyle}>← Dashboard</a>
      <p style={eyebrowStyle}>Operations History</p>
      <h1 style={titleStyle}>Activity</h1>
      <p style={mutedStyle}>ตรวจย้อนหลังว่าแอดมินทำอะไรกับระบบการเงินและการตั้งค่า</p>
      <form onSubmit={loadItems} style={toolbarStyle}><input value={moduleName} onChange={(e) => setModuleName(e.target.value)} placeholder="module เช่น topups / withdrawals / wallets" style={inputStyle} /><input value={action} onChange={(e) => setAction(e.target.value)} placeholder="action เช่น APPROVE_TOP_UP" style={inputStyle} /><button type="submit" style={buttonStyle}>Filter</button></form>
      {message && <div style={noticeStyle}>{message}</div>}
      <div style={{ display: 'grid', gap: 12 }}>
        {items.map((item) => <section key={item.id} style={cardStyle}><div style={rowStyle}><div><span style={badgeStyle}>{item.module}</span><h2 style={actionTitleStyle}>{item.action}</h2><p style={mutedStyle}>Admin: {item.adminUser?.username ?? item.adminUser?.email ?? '-'}</p><p style={mutedStyle}>Target: {item.targetId ?? '-'}</p></div><div style={{ textAlign: 'right' }}><strong>{new Date(item.createdAt).toLocaleString('th-TH')}</strong><p style={mutedStyle}>IP: {item.ipAddress ?? '-'}</p></div></div><details style={detailsStyle}><summary>ดูข้อมูลเปลี่ยนแปลง</summary><pre style={preStyle}>{JSON.stringify({ oldData: item.oldData, newData: item.newData }, null, 2)}</pre></details></section>)}
        {items.length === 0 && <div style={noticeStyle}>ยังไม่มีรายการ</div>}
      </div>
    </main>
  );
}

const pageStyle = { maxWidth: 1180, margin: '0 auto', padding: '22px 16px 44px', color: '#fff' } as const;
const backStyle = { color: '#f5c542', textDecoration: 'none', fontWeight: 900 } as const;
const eyebrowStyle = { margin: '18px 0 0', opacity: 0.66, fontSize: 14 } as const;
const titleStyle = { margin: '6px 0 8px', fontSize: 'clamp(40px, 10vw, 72px)', lineHeight: 0.94, letterSpacing: -1.5 } as const;
const mutedStyle = { margin: 0, opacity: 0.76, lineHeight: 1.55 } as const;
const toolbarStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10, border: '1px solid rgba(255,255,255,0.14)', borderRadius: 24, padding: 16, margin: '18px 0', background: '#181818' } as const;
const inputStyle = { display: 'block', width: '100%', minWidth: 0, padding: '13px 14px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.16)', background: '#242424', color: '#fff', boxSizing: 'border-box' } as const;
const buttonStyle = { padding: '13px 14px', borderRadius: 14, cursor: 'pointer', background: '#f5c542', color: '#111', border: 0, fontWeight: 900 } as const;
const noticeStyle = { border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16, padding: 12, background: 'rgba(255,255,255,0.07)', marginBottom: 12 } as const;
const cardStyle = { border: '1px solid rgba(255,255,255,0.12)', borderRadius: 24, padding: 16, background: '#181818' } as const;
const rowStyle = { display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' } as const;
const badgeStyle = { display: 'inline-block', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 999, padding: '6px 10px', fontSize: 12, fontWeight: 900, background: 'rgba(255,255,255,0.06)' } as const;
const actionTitleStyle = { margin: '10px 0 4px', fontSize: 'clamp(22px, 6vw, 34px)', lineHeight: 1 } as const;
const detailsStyle = { marginTop: 12 } as const;
const preStyle = { whiteSpace: 'pre-wrap' as const, overflowWrap: 'anywhere' as const, border: '1px solid rgba(255,255,255,0.10)', borderRadius: 16, padding: 12, background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.82)' } as const;
