'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminEmpty, AdminLinkButton, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminRow, AdminStack, AdminToolbar } from '../_components/admin-ui';

type RiskAlert = {
  id: string;
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'REVIEWING' | 'RESOLVED' | 'DISMISSED';
  memberId?: string | null;
  shortMemberId?: string | null;
  refType?: string | null;
  refId?: string | null;
  title: string;
  description?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
};

type RiskResponse = { items?: RiskAlert[]; summary?: { openCount?: number; criticalCount?: number } };

const statusOptions = ['', 'OPEN', 'REVIEWING', 'RESOLVED', 'DISMISSED'];
const severityOptions = ['', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const typeOptions = ['', 'REPEATED_TOPUPS', 'RAPID_DEPOSIT_WITHDRAWAL', 'HIGH_WITHDRAWAL', 'BANK_CHANGE_WITHDRAWAL', 'MULTIPLE_PENDING_TOPUPS', 'WALLET_LEDGER_MISMATCH'];

export default function RiskAlertsPage() {
  const [items, setItems] = useState<RiskAlert[]>([]);
  const [summary, setSummary] = useState({ openCount: 0, criticalCount: 0 });
  const [status, setStatus] = useState('OPEN');
  const [severity, setSeverity] = useState('');
  const [type, setType] = useState('');
  const [createdFrom, setCreatedFrom] = useState('');
  const [createdTo, setCreatedTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    load();
  }, [status, severity, type]);

  async function load() {
    setLoading(true);
    const query = new URLSearchParams();
    if (status) query.set('status', status);
    if (severity) query.set('severity', severity);
    if (type) query.set('type', type);
    if (createdFrom) query.set('createdFrom', createdFrom);
    if (createdTo) query.set('createdTo', createdTo);

    const res = await adminApiFetch(`/admin/risk-alerts?${query.toString()}`);
    const data = (await res.json().catch(() => null)) as RiskResponse | { message?: string; retryAfter?: number } | null;
    if (res.ok && data) {
      const payload = data as RiskResponse;
      setItems(payload.items ?? []);
      setSummary({ openCount: Number(payload.summary?.openCount ?? 0), criticalCount: Number(payload.summary?.criticalCount ?? 0) });
      setMessage('');
    } else {
      setMessage((data as { message?: string } | null)?.message ?? 'โหลด Risk Alerts ไม่สำเร็จ');
    }
    setLoading(false);
  }

  async function scan() {
    if (scanning) return;
    setScanning(true);
    setMessage('กำลังสแกนความเสี่ยง...');
    const res = await adminApiFetch('/admin/risk-alerts/scan', { method: 'POST' });
    const data = await res.json().catch(() => null);
    if (res.ok) setMessage(`สแกนเสร็จ สร้าง alert ใหม่ ${Number(data?.created ?? 0)} รายการ`);
    else setMessage(data?.retryAfter ? `สแกนถี่เกินไป ลองใหม่ใน ${data.retryAfter} วินาที` : data?.message ?? 'สแกนความเสี่ยงไม่สำเร็จ');
    setScanning(false);
    await load();
  }

  async function updateStatus(id: string, nextStatus: RiskAlert['status']) {
    const res = await adminApiFetch(`/admin/risk-alerts/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status: nextStatus }) });
    const data = await res.json().catch(() => null);
    if (!res.ok) setMessage(data?.message ?? 'อัปเดตสถานะไม่สำเร็จ');
    else setMessage('อัปเดตสถานะแล้ว');
    await load();
  }

  function clearFilters() {
    setStatus('OPEN');
    setSeverity('');
    setType('');
    setCreatedFrom('');
    setCreatedTo('');
  }

  const activeShowing = useMemo(() => items.filter((item) => item.status === 'OPEN' || item.status === 'REVIEWING').length, [items]);

  return <AdminPage eyebrow="Money Operation" title="Risk Alerts" description="ตรวจพฤติกรรมเสี่ยงจาก topup, withdrawal, bank account และ wallet ledger แบบไม่ปล่อยให้แอดมินเดาเองเหมือนเล่นหวย" actions={<AdminButton onClick={scan} disabled={scanning}>{scanning ? 'Scanning...' : 'Scan now'}</AdminButton>}>
    <AdminMetricGrid>
      <AdminMetric title="Active alerts" value={String(summary.openCount)} helper="OPEN + REVIEWING ทั้งระบบ" />
      <AdminMetric title="High risk" value={String(summary.criticalCount)} helper="HIGH + CRITICAL" />
      <AdminMetric title="Showing" value={String(items.length)} helper={`${activeShowing} active ใน filter นี้`} />
    </AdminMetricGrid>

    <AdminToolbar>
      <label style={fieldStyle}>Status<select value={status} onChange={(event) => setStatus(event.target.value)} style={inputStyle}>{statusOptions.map((value) => <option key={value} value={value}>{value || 'ALL'}</option>)}</select></label>
      <label style={fieldStyle}>Severity<select value={severity} onChange={(event) => setSeverity(event.target.value)} style={inputStyle}>{severityOptions.map((value) => <option key={value} value={value}>{value || 'ALL'}</option>)}</select></label>
      <label style={fieldStyle}>Type<select value={type} onChange={(event) => setType(event.target.value)} style={inputStyle}>{typeOptions.map((value) => <option key={value} value={value}>{value || 'ALL'}</option>)}</select></label>
      <label style={fieldStyle}>From<input type="date" value={createdFrom} onChange={(event) => setCreatedFrom(event.target.value)} style={inputStyle} /></label>
      <label style={fieldStyle}>To<input type="date" value={createdTo} onChange={(event) => setCreatedTo(event.target.value)} style={inputStyle} /></label>
      <div style={{ display: 'flex', alignItems: 'end', gap: 8, flexWrap: 'wrap' }}><AdminButton tone="secondary" onClick={load}>Apply</AdminButton><AdminButton tone="secondary" onClick={clearFilters}>Reset</AdminButton></div>
    </AdminToolbar>

    {message && <AdminNotice>{message}</AdminNotice>}

    <AdminCard title="Alert queue" description="รายการความเสี่ยงล่าสุดจากกฎ Risk Alerts v2">
      {loading ? <AdminEmpty>กำลังโหลด...</AdminEmpty> : items.length === 0 ? <AdminEmpty>ไม่มี alert ตาม filter นี้</AdminEmpty> : <AdminStack>{items.map((item) => <AdminRow key={item.id}>
        <div style={{ display: 'grid', gap: 8, flex: 1, minWidth: 240 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <AdminBadge tone={severityTone(item.severity)}>{item.severity}</AdminBadge>
            <AdminBadge tone={statusTone(item.status)}>{item.status}</AdminBadge>
            <AdminBadge>{item.type}</AdminBadge>
          </div>
          <strong>{item.title}</strong>
          {item.description && <span style={mutedStyle}>{item.description}</span>}
          <div style={detailGridStyle}>
            <span>Member: {item.memberId ? <a href={`/members/${item.memberId}`} style={linkStyle}>{item.shortMemberId ?? item.memberId.slice(0, 8)}</a> : '-'}</span>
            <span>Ref: {item.refType ?? '-'} / {item.refId ? item.refId.slice(0, 8) : '-'}</span>
            <span>Created: {new Date(item.createdAt).toLocaleString('th-TH')}</span>
          </div>
          {item.metadata && <details style={detailsStyle}><summary>Metadata</summary><pre style={preStyle}>{JSON.stringify(item.metadata, null, 2)}</pre></details>}
        </div>
        <div style={actionStyle}>
          <AdminLinkButton href={`/risk-alerts/${item.id}`}>Detail</AdminLinkButton>
          <AdminButton tone="secondary" disabled={item.status === 'REVIEWING'} onClick={() => updateStatus(item.id, 'REVIEWING')}>Reviewing</AdminButton>
          <AdminButton tone="success" disabled={item.status === 'RESOLVED'} onClick={() => updateStatus(item.id, 'RESOLVED')}>Resolve</AdminButton>
          <AdminButton tone="danger" disabled={item.status === 'DISMISSED'} onClick={() => updateStatus(item.id, 'DISMISSED')}>Dismiss</AdminButton>
        </div>
      </AdminRow>)}</AdminStack>}
    </AdminCard>
  </AdminPage>;
}

function severityTone(value: RiskAlert['severity']) {
  if (value === 'CRITICAL' || value === 'HIGH') return 'danger';
  if (value === 'MEDIUM') return 'warning';
  return 'neutral';
}

function statusTone(value: RiskAlert['status']) {
  if (value === 'RESOLVED') return 'success';
  if (value === 'REVIEWING') return 'warning';
  if (value === 'DISMISSED') return 'neutral';
  return 'danger';
}

const fieldStyle = { display: 'grid', gap: 6, color: '#94a3b8', fontSize: 12, fontWeight: 900 } as const;
const inputStyle = { minHeight: 44, borderRadius: 12, border: '1px solid rgba(148,163,184,.22)', background: '#0b1220', color: '#f8fafc', padding: '0 12px', width: '100%' } as const;
const mutedStyle = { color: '#94a3b8', fontSize: 13, lineHeight: 1.45 } as const;
const actionStyle = { display: 'flex', gap: 8, flexWrap: 'wrap' as const, alignItems: 'start', justifyContent: 'flex-end' as const };
const detailGridStyle = { display: 'grid', gap: 5, color: '#94a3b8', fontSize: 13 } as const;
const linkStyle = { color: '#f5c542', fontWeight: 900 } as const;
const detailsStyle = { border: '1px solid rgba(148,163,184,.18)', borderRadius: 12, padding: 10, background: 'rgba(15,23,42,.45)' } as const;
const preStyle = { margin: '10px 0 0', whiteSpace: 'pre-wrap' as const, color: '#cbd5e1', fontSize: 12, overflowX: 'auto' as const };
