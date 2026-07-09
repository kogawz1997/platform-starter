'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../../admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminEmpty, AdminLinkButton, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminRow, AdminStack } from '../../_components/admin-ui';

type Props = { params: { id: string } };

type Snapshot = { id: string; status: string; systemBalance: string; providerBalance: string; difference: string; checkedAt: string; rawPayload?: any; user?: { id?: string; username?: string | null; phone?: string | null } | null; provider?: { id?: string; name?: string | null; code?: string | null } | null };

export default function ProviderWalletSnapshotDetailPage({ params }: Props) {
  const [item, setItem] = useState<Snapshot | null>(null);
  const [message, setMessage] = useState('กำลังโหลด snapshot...');
  const [loading, setLoading] = useState(false);
  useEffect(() => { load(); }, [params.id]);
  const meta = useMemo(() => item?.rawPayload ?? {}, [item]);
  async function load() { setLoading(true); const res = await adminApiFetch(`/admin/provider-wallet-snapshots/${params.id}`); const data = await res.json().catch(() => null); setLoading(false); if (!res.ok) { setMessage(data?.message ?? 'โหลด snapshot ไม่สำเร็จ'); return; } setItem(data); setMessage(''); }
  async function review(status: 'REVIEWING' | 'RESOLVED') { const note = window.prompt(status === 'RESOLVED' ? 'Resolve note' : 'Review note') ?? ''; if (!note) return; setLoading(true); const res = await adminApiFetch(`/admin/provider-wallet-snapshots/${params.id}/review`, { method: 'PATCH', body: JSON.stringify({ note, status }) }); const data = await res.json().catch(() => null); setLoading(false); if (!res.ok) { setMessage(data?.message ?? 'อัปเดต snapshot ไม่สำเร็จ'); return; } setMessage(status === 'RESOLVED' ? 'resolve snapshot แล้ว' : 'บันทึก review แล้ว'); setItem(data.item ?? data); }
  if (!item && !message) return <AdminPage eyebrow="Reconciliation" title="Snapshot Detail"><AdminEmpty>ไม่พบ snapshot</AdminEmpty></AdminPage>;
  return <AdminPage eyebrow="Reconciliation" title="Snapshot Detail" description="ตรวจยอด system/provider, raw payload, related session และปิดเคส reconciliation" actions={<><AdminButton onClick={load} disabled={loading}>Refresh</AdminButton><AdminLinkButton href="/reconciliation-center">กลับศูนย์ reconcile</AdminLinkButton></>}>
    {message && <AdminNotice>{message}</AdminNotice>}
    {item && <AdminStack>
      <AdminMetricGrid><AdminMetric title="System" value={formatMoney(item.systemBalance, 'THB')} helper="ยอดในระบบ" /><AdminMetric title="Provider" value={formatMoney(item.providerBalance, 'THB')} helper="ยอดค่าย" /><AdminMetric title="Diff" value={formatMoney(item.difference, 'THB')} helper="ส่วนต่าง" /><AdminMetric title="Status" value={snapshotLabel(item.status)} helper="snapshot" /></AdminMetricGrid>
      <AdminCard title="Traffic-light" description="อ่านผลแบบไม่ต้องเปิดเครื่องคิดเลขแล้วหวังว่าตัวเลขจะเมตตา"><div style={trafficStyle(item.status)}><strong>{snapshotLabel(item.status)}</strong><p style={mutedStyle}>{snapshotDescription(item)}</p></div></AdminCard>
      <AdminCard title="Summary" description="ถ้า diff ไม่เป็น 0 ต้องตาม related transfer/webhook/ledger"><AdminRow><strong>Provider</strong><span>{item.provider?.name ?? item.provider?.code ?? '-'}</span></AdminRow><AdminRow><strong>User</strong><span>{item.user?.username ?? item.user?.phone ?? '-'}</span></AdminRow><AdminRow><strong>Status</strong><AdminBadge tone={statusTone(item.status)}>{item.status}</AdminBadge></AdminRow><AdminRow><strong>Checked</strong><span>{new Date(item.checkedAt).toLocaleString('th-TH')}</span></AdminRow><div style={actionRowStyle}>{item.status !== 'MATCHED' && <AdminButton tone="secondary" onClick={() => review('REVIEWING')} disabled={loading}>Mark Reviewing</AdminButton>}{item.status !== 'MATCHED' && <AdminButton onClick={() => review('RESOLVED')} disabled={loading}>Resolve</AdminButton>}</div></AdminCard>
      <AdminCard title="Related Links" description="เปิดจุดที่เกี่ยวข้องเพื่อสืบยอด"><div style={actionRowStyle}>{meta.sessionId && <AdminLinkButton href={`/game-sessions/${meta.sessionId}`}>Game Session</AdminLinkButton>}{meta.snapshotId && <AdminLinkButton href={`/provider-wallet-snapshots/${meta.snapshotId}`}>Snapshot</AdminLinkButton>}{meta.adapterResult?.payload?.providerTransactionId && <AdminLinkButton href="/game-transfers">Game Transfers</AdminLinkButton>}{meta.walletLedgerId && <AdminLinkButton href={`/wallet-ledgers/${meta.walletLedgerId}`}>Wallet Ledger</AdminLinkButton>}<AdminLinkButton href="/risk-alerts">Risk Alerts</AdminLinkButton></div></AdminCard>
      <JsonCard title="Raw Payload" payload={item.rawPayload} />
    </AdminStack>}
  </AdminPage>;
}
function JsonCard({ title, payload }: { title: string; payload: unknown }) { return <AdminCard title={title}><pre style={preStyle}>{JSON.stringify(payload ?? {}, null, 2)}</pre></AdminCard>; }
function statusTone(status: string) { if (status === 'MATCHED') return 'success'; if (status === 'MISMATCH') return 'danger'; if (status === 'UNKNOWN') return 'warning'; return 'neutral'; }
function snapshotLabel(status: string) { if (status === 'MATCHED') return 'MATCHED'; if (status === 'MISMATCH') return 'NEEDS_REVIEW'; if (status === 'UNKNOWN') return 'UNKNOWN_PROVIDER_BALANCE'; return status; }
function snapshotDescription(item: Snapshot) { if (item.status === 'MATCHED') return 'ยอดระบบและ provider ตรงกัน'; if (item.status === 'MISMATCH') return `ยอดไม่ตรง diff ${formatMoney(item.difference, 'THB')} ต้องตรวจ transfer/webhook/ledger`; return 'provider ตอบไม่ชัดหรือดึง balance ไม่สำเร็จ ต้องตรวจ adapter/log'; }
function formatMoney(value: string | number, currency: string) { return `${currency} ${Number(value).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`; }
function trafficStyle(status: string) { const background = status === 'MATCHED' ? 'rgba(34,197,94,.14)' : status === 'MISMATCH' ? 'rgba(239,68,68,.14)' : 'rgba(245,197,66,.14)'; return { border: '1px solid rgba(148,163,184,.18)', borderRadius: 18, padding: 16, background, display: 'grid', gap: 6 } as const; }
const mutedStyle = { margin: 0, color: '#94a3b8', lineHeight: 1.55 } as const;
const actionRowStyle = { display: 'flex', gap: 10, flexWrap: 'wrap' as const };
const preStyle = { overflowX: 'auto' as const, whiteSpace: 'pre-wrap' as const, background: '#020617', borderRadius: 12, padding: 12, color: '#cbd5e1', maxHeight: 520 } as const;
