'use client';

import { useEffect, useState } from 'react';
import { adminApiFetch } from '../../../admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminEmpty, AdminLinkButton, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminRow, AdminStack } from '../../_components/admin-ui';

type Props = { params: { id: string } };

export default function WalletLedgerDetailPage({ params }: Props) {
  const [payload, setPayload] = useState<any>(null);
  const [message, setMessage] = useState('กำลังโหลด ledger...');
  const [loading, setLoading] = useState(false);
  useEffect(() => { load(); }, [params.id]);
  async function load() { setLoading(true); const res = await adminApiFetch(`/admin/wallet-ledgers/${params.id}`); const data = await res.json().catch(() => null); setLoading(false); if (!res.ok) { setMessage(data?.message ?? 'โหลด ledger ไม่สำเร็จ'); return; } setPayload(data); setMessage(''); }
  const item = payload?.item;
  return <AdminPage eyebrow="Money" title="Wallet Ledger Detail" description="ดูรายการเดินเงินแบบเจาะลึก พร้อม related transfer และ audit logs" actions={<><AdminButton onClick={load} disabled={loading}>Refresh</AdminButton><AdminLinkButton href="/wallet-ledgers">กลับรายการ</AdminLinkButton></>}>
    {message && <AdminNotice>{message}</AdminNotice>}
    {!item && !message && <AdminEmpty>ไม่พบ ledger</AdminEmpty>}
    {item && <AdminStack>
      <AdminMetricGrid><AdminMetric title="Type" value={item.type} helper={item.direction} /><AdminMetric title="Amount" value={formatMoney(item.amount, item.wallet?.currency ?? 'THB')} helper="จำนวน" /><AdminMetric title="Before" value={formatMoney(item.balanceBefore, item.wallet?.currency ?? 'THB')} helper="ยอดก่อน" /><AdminMetric title="After" value={formatMoney(item.balanceAfter, item.wallet?.currency ?? 'THB')} helper="ยอดหลัง" /></AdminMetricGrid>
      <AdminCard title="Ledger" description="ข้อมูลหลักของรายการ"><AdminRow><strong>User</strong><span>{item.user?.username ?? item.user?.phone ?? item.user?.email ?? '-'}</span></AdminRow><AdminRow><strong>Direction</strong><AdminBadge tone={item.direction === 'CREDIT' ? 'success' : 'warning'}>{item.direction}</AdminBadge></AdminRow><AdminRow><strong>Reference</strong><span style={monoStyle}>{item.referenceType ?? '-'} / {item.referenceId ?? '-'}</span></AdminRow><AdminRow><strong>Idempotency</strong><span style={monoStyle}>{item.idempotencyKey ?? '-'}</span></AdminRow><AdminRow><strong>Created</strong><span>{new Date(item.createdAt).toLocaleString('th-TH')}</span></AdminRow></AdminCard>
      {payload?.relatedTransfer && <AdminCard title="Related Game Transfer" description="รายการโยกเงินเกมที่เชื่อมกับ ledger นี้"><AdminRow><strong>{payload.relatedTransfer.type}</strong><AdminBadge tone={payload.relatedTransfer.status === 'SUCCESS' ? 'success' : payload.relatedTransfer.status === 'FAILED' ? 'danger' : 'warning'}>{payload.relatedTransfer.status}</AdminBadge></AdminRow><AdminRow><strong>Provider</strong><span>{payload.relatedTransfer.provider?.name ?? payload.relatedTransfer.provider?.code ?? '-'}</span></AdminRow><AdminRow><strong>Session</strong><span style={monoStyle}>{payload.relatedTransfer.session?.providerSessionId ?? payload.relatedTransfer.session?.id ?? '-'}</span></AdminRow><AdminLinkButton href={`/game-transfers/${payload.relatedTransfer.id}`}>เปิด Game Transfer</AdminLinkButton></AdminCard>}
      <AdminCard title="Metadata"><pre style={preStyle}>{JSON.stringify(item.metadata ?? {}, null, 2)}</pre></AdminCard>
      <AdminCard title="Audit Logs" description="รายการ admin audit ที่เกี่ยวข้อง"><AdminStack>{(payload.auditLogs ?? []).map((log: any) => <AdminRow key={log.id}><div><strong>{log.action}</strong><p style={mutedStyle}>{new Date(log.createdAt).toLocaleString('th-TH')}</p></div><span style={monoStyle}>{log.targetId}</span></AdminRow>)}{(payload.auditLogs ?? []).length === 0 && <AdminEmpty>ยังไม่มี audit log ที่เกี่ยวข้อง</AdminEmpty>}</AdminStack></AdminCard>
    </AdminStack>}
  </AdminPage>;
}
function formatMoney(value: string | number, currency: string) { return `${currency} ${Number(value).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`; }
const monoStyle = { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace', overflowWrap: 'anywhere' as const, color: '#cbd5e1' } as const;
const mutedStyle = { margin: 0, color: '#94a3b8', lineHeight: 1.55 } as const;
const preStyle = { overflowX: 'auto' as const, whiteSpace: 'pre-wrap' as const, background: '#020617', borderRadius: 12, padding: 12, color: '#cbd5e1', maxHeight: 460 } as const;
