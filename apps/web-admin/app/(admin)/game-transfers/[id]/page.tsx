'use client';

import { useEffect, useState } from 'react';
import { adminApiFetch } from '../../../admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminEmpty, AdminLinkButton, AdminNotice, AdminPage, AdminRow, AdminStack } from '../../_components/admin-ui';

type Props = { params: { id: string } };

type Transfer = { id: string; type: string; status: string; amount: string; currency: string; idempotencyKey: string; providerTransactionId?: string | null; errorCode?: string | null; errorMessage?: string | null; requestPayload?: any; responsePayload?: any; createdAt: string; resolvedAt?: string | null; user?: { username?: string | null; phone?: string | null } | null; provider?: { name?: string | null; code?: string | null } | null; session?: { id: string; providerSessionId?: string | null; game?: { name?: string | null; providerGameCode?: string | null } | null } | null };

export default function GameTransferDetailPage({ params }: Props) {
  const [item, setItem] = useState<Transfer | null>(null);
  const [message, setMessage] = useState('กำลังโหลด transfer...');
  const [loading, setLoading] = useState(false);
  useEffect(() => { load(); }, [params.id]);
  async function load() { setLoading(true); const res = await adminApiFetch(`/admin/game-transfers/${params.id}`); const data = await res.json().catch(() => null); setLoading(false); if (!res.ok) { setMessage(data?.message ?? 'โหลด transfer ไม่สำเร็จ'); return; } setItem(data); setMessage(''); }
  if (!item && !message) return <AdminPage eyebrow="Game" title="Transfer Detail"><AdminEmpty>ไม่พบ transfer</AdminEmpty></AdminPage>;
  return <AdminPage eyebrow="Game" title="Transfer Detail" description="ดูรายละเอียด transfer, provider response, wallet ledger และ rollback ที่เกี่ยวข้อง" actions={<><AdminButton onClick={load} disabled={loading}>Refresh</AdminButton><AdminLinkButton href="/game-transfers">กลับรายการ</AdminLinkButton></>}>
    {message && <AdminNotice>{message}</AdminNotice>}
    {item && <AdminStack>
      <AdminCard title="Summary" description="ข้อมูลหลักของรายการโยกเงิน"><AdminRow><div><strong>{transferLabel(item.type)} · {formatMoney(item.amount, item.currency)}</strong><p style={mutedStyle}>{item.user?.username ?? item.user?.phone ?? '-'} · {item.provider?.name ?? item.provider?.code ?? '-'}</p></div><AdminBadge tone={statusTone(item.status)}>{item.status}</AdminBadge></AdminRow><AdminRow><strong>Game</strong><span>{item.session?.game?.name ?? item.session?.game?.providerGameCode ?? '-'}</span></AdminRow><AdminRow><strong>Session</strong><span style={monoStyle}>{item.session?.providerSessionId ?? item.session?.id ?? '-'}</span></AdminRow><AdminRow><strong>Provider TX</strong><span style={monoStyle}>{item.providerTransactionId ?? '-'}</span></AdminRow><AdminRow><strong>Idempotency</strong><span style={monoStyle}>{item.idempotencyKey}</span></AdminRow></AdminCard>
      {(item.errorCode || item.errorMessage) && <AdminCard title="Error"><AdminNotice>{item.errorCode ?? '-'} · {item.errorMessage ?? '-'}</AdminNotice></AdminCard>}
      <AdminCard title="Wallet Sync" description="ledger id จะอยู่ใน responsePayload หลัง sync wallet สำเร็จหรือ rollback"><AdminRow><strong>Wallet ledger</strong><span style={monoStyle}>{item.responsePayload?.walletLedgerId ?? '-'}</span></AdminRow><AdminRow><strong>Debit ledger</strong><span style={monoStyle}>{item.responsePayload?.walletDebitLedgerId ?? '-'}</span></AdminRow><AdminRow><strong>Rollback ledger</strong><span style={monoStyle}>{item.responsePayload?.walletRollbackLedgerId ?? '-'}</span></AdminRow><AdminRow><strong>Balance after</strong><span>{item.responsePayload?.walletBalanceAfter ?? item.responsePayload?.walletBalanceAfterRollback ?? '-'}</span></AdminRow></AdminCard>
      <JsonCard title="Request Payload" payload={item.requestPayload} />
      <JsonCard title="Response Payload" payload={item.responsePayload} />
    </AdminStack>}
  </AdminPage>;
}
function JsonCard({ title, payload }: { title: string; payload: unknown }) { return <AdminCard title={title}><pre style={preStyle}>{JSON.stringify(payload ?? {}, null, 2)}</pre></AdminCard>; }
function transferLabel(type: string) { return type === 'TRANSFER_IN' ? 'โยกเข้าเกม' : type === 'TRANSFER_OUT' ? 'โยกกลับวอเลต' : type; }
function statusTone(status: string) { if (status === 'SUCCESS') return 'success'; if (status === 'FAILED') return 'danger'; if (status === 'PENDING') return 'warning'; return 'neutral'; }
function formatMoney(value: string | number, currency: string) { return `${currency} ${Number(value).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`; }
const mutedStyle = { margin: 0, color: '#94a3b8', lineHeight: 1.55 } as const;
const monoStyle = { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace', overflowWrap: 'anywhere' as const, color: '#cbd5e1' } as const;
const preStyle = { overflowX: 'auto' as const, whiteSpace: 'pre-wrap' as const, background: '#020617', borderRadius: 12, padding: 12, color: '#cbd5e1', maxHeight: 460 } as const;
