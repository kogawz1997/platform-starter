'use client';

import { useEffect, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminEmpty, AdminLinkButton, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminRow, AdminStack, formatMoney } from '../_components/admin-ui';

type ActivityType = 'ALL' | 'AUDIT' | 'LEDGER' | 'TOPUP' | 'WITHDRAWAL';
type ActivityItem = {
  id: string;
  type: Exclude<ActivityType, 'ALL'>;
  title: string;
  description?: string | null;
  actor?: string | null;
  memberId?: string | null;
  refType?: string | null;
  refId?: string | null;
  amount?: string | null;
  status?: string | null;
  createdAt: string;
};
type TimelineResponse = {
  items: ActivityItem[];
  page: number;
  take: number;
  total: number;
  pageCount: number;
  summary: { audit: number; ledger: number; topup: number; withdrawal: number };
  generatedAt: string;
};

const PAGE_SIZE = 30;
const filters: ActivityType[] = ['ALL', 'AUDIT', 'LEDGER', 'TOPUP', 'WITHDRAWAL'];

export default function ActivityPage() {
  const [data, setData] = useState<TimelineResponse | null>(null);
  const [page, setPage] = useState(1);
  const [type, setType] = useState<ActivityType>('ALL');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => { loadTimeline(1, type); }, []);

  async function loadTimeline(nextPage = page, nextType = type) {
    setLoading(true);
    setMessage('กำลังโหลด activity timeline...');
    const res = await adminApiFetch(`/admin/activity/timeline?page=${nextPage}&take=${PAGE_SIZE}&type=${nextType}`);
    const json = await res.json().catch(() => null);
    setLoading(false);
    if (!res.ok) { setMessage(json?.message ?? 'โหลด activity ไม่สำเร็จ'); return; }
    setData(json);
    setPage(json.page ?? nextPage);
    setMessage('');
  }

  function changeType(nextType: ActivityType) {
    setType(nextType);
    setPage(1);
    loadTimeline(1, nextType);
  }

  function go(nextPage: number) {
    setPage(nextPage);
    loadTimeline(nextPage, type);
  }

  return <AdminPage eyebrow="Operations" title="Activity Timeline" description="รวมเหตุการณ์จาก audit logs, wallet ledgers, topups และ withdrawals" actions={<AdminButton disabled={loading} onClick={() => loadTimeline(page, type)}>Refresh</AdminButton>}>
    {message && <AdminNotice>{message}</AdminNotice>}

    {data && <AdminMetricGrid>
      <AdminMetric title="Loaded" value={data.items.length.toLocaleString('th-TH')} helper={`${data.total.toLocaleString('th-TH')} fetched`} />
      <AdminMetric title="Page" value={`${data.page}/${data.pageCount}`} helper={`${data.take} per page`} />
      <AdminMetric title="Audit" value={data.summary.audit.toLocaleString('th-TH')} helper="admin events" />
      <AdminMetric title="Ledger" value={data.summary.ledger.toLocaleString('th-TH')} helper="money movements" />
      <AdminMetric title="Requests" value={(data.summary.topup + data.summary.withdrawal).toLocaleString('th-TH')} helper={`${data.summary.topup} topups · ${data.summary.withdrawal} withdrawals`} />
    </AdminMetricGrid>}

    <AdminCard title="Filters" description="เลือกชนิด event ที่อยากดู">
      <div style={toolbarStyle}>{filters.map((item) => <AdminButton key={item} disabled={loading} tone={type === item ? 'primary' : 'secondary'} onClick={() => changeType(item)}>{item}</AdminButton>)}</div>
    </AdminCard>

    <AdminCard title="Timeline" description={data ? `Generated ${new Date(data.generatedAt).toLocaleString('th-TH')}` : 'recent activity'}>
      <AdminStack>
        {data?.items.map((item) => <AdminRow key={`${item.type}-${item.id}`}>
          <div style={leftStyle}>
            <div style={badgeRowStyle}><AdminBadge tone={typeTone(item.type)}>{item.type}</AdminBadge>{item.status && <AdminBadge tone={statusTone(item.status)}>{item.status}</AdminBadge>}</div>
            <strong>{item.title}</strong>
            <p>{item.description ?? '-'} · {new Date(item.createdAt).toLocaleString('th-TH')}</p>
            {item.actor && <p>Actor: {item.actor}</p>}
          </div>
          <div style={rightStyle}>
            {item.amount && <strong>{formatMoney(item.amount)}</strong>}
            <div style={actionRowStyle}>
              {item.memberId && <AdminLinkButton href={`/members/${item.memberId}`}>Member</AdminLinkButton>}
              {item.type === 'TOPUP' && <AdminLinkButton href="/topups">Top-ups</AdminLinkButton>}
              {item.type === 'WITHDRAWAL' && <AdminLinkButton href="/withdrawals">Withdrawals</AdminLinkButton>}
              {item.type === 'LEDGER' && <AdminLinkButton href="/ledgers">Ledgers</AdminLinkButton>}
              {item.type === 'AUDIT' && <AdminLinkButton href="/audit">Audit</AdminLinkButton>}
            </div>
          </div>
        </AdminRow>)}
        {data && data.items.length === 0 && <AdminEmpty>ยังไม่มี activity ใน filter นี้</AdminEmpty>}
        {!data && !loading && <AdminEmpty>ยังไม่มีข้อมูล</AdminEmpty>}
      </AdminStack>
      {data && <div style={pagerStyle}>
        <AdminButton disabled={loading || page <= 1} onClick={() => go(page - 1)}>Previous</AdminButton>
        <AdminButton disabled={loading || page >= data.pageCount} onClick={() => go(page + 1)}>Next</AdminButton>
      </div>}
    </AdminCard>
  </AdminPage>;
}

function typeTone(type: ActivityItem['type']) {
  if (type === 'AUDIT') return 'neutral';
  if (type === 'LEDGER') return 'success';
  if (type === 'TOPUP') return 'warning';
  return 'danger';
}

function statusTone(status: string) {
  const upper = status.toUpperCase();
  if (['APPROVED', 'COMPLETED', 'CREDIT', 'OK'].includes(upper)) return 'success';
  if (['PENDING', 'REVIEWING', 'DEBIT'].includes(upper)) return 'warning';
  if (['REJECTED', 'CANCELLED', 'MISMATCH', 'FAILED'].includes(upper)) return 'danger';
  return 'neutral';
}

const toolbarStyle = { display: 'flex', gap: 8, flexWrap: 'wrap' as const };
const badgeRowStyle = { display: 'flex', gap: 8, flexWrap: 'wrap' as const };
const leftStyle = { display: 'grid', gap: 6, minWidth: 0 };
const rightStyle = { display: 'grid', gap: 8, textAlign: 'right' as const, justifyItems: 'end' };
const actionRowStyle = { display: 'flex', gap: 8, flexWrap: 'wrap' as const, justifyContent: 'flex-end' };
const pagerStyle = { display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16, flexWrap: 'wrap' as const };
