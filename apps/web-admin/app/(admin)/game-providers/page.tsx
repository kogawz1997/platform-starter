import { AdminBadge, AdminCard, AdminGrid, AdminLinkButton, AdminMetric, AdminMetricGrid, AdminPage, AdminRow, AdminStack } from '../_components/admin-ui';

const providerFields = [
  'Provider name / code / logo',
  'Game type: slot / casino / sport / fishing / other',
  'Status: active / inactive / maintenance',
  'Wallet mode: seamless / transfer / hybrid',
  'Currency / timezone / sort order',
  'Feature flags: launch, sync games, bet history, transfer wallet',
];

const providerActions = [
  ['Test Connection', 'ตรวจสอบ base URL และ credential ก่อนเปิดใช้งาน'],
  ['Sync Games', 'ดึงรายชื่อเกมและ metadata จากค่ายเกม'],
  ['Refresh Images', 'ดึงรูปเกมใหม่หรือซ่อมรูปที่เสีย'],
  ['Maintenance Mode', 'ปิด provider เฉพาะค่ายโดยไม่ปิดทั้งเว็บ'],
];

const sampleProviders = [
  ['PG Soft', 'pgsoft', 'Slot', 'Transfer wallet'],
  ['Pragmatic Play', 'pragmatic', 'Slot / Casino', 'Seamless or transfer'],
  ['Evolution', 'evolution', 'Live casino', 'Seamless wallet'],
  ['SBO', 'sbo', 'Sport', 'Transfer wallet'],
];

export default function GameProvidersPage() {
  return (
    <AdminPage eyebrow="Game Platform" title="Game Providers" description="โครงจัดการค่ายเกม สถานะ โลโก้ ประเภทเกม wallet mode และ operation ก่อนต่อ API จริง">
      <AdminMetricGrid>
        <AdminMetric title="Provider states" value="4" helper="active, inactive, maintenance, degraded" />
        <AdminMetric title="Wallet modes" value="3" helper="seamless, transfer, hybrid" />
        <AdminMetric title="Core actions" value={String(providerActions.length)} helper="test, sync, image, maintenance" />
      </AdminMetricGrid>

      <AdminCard title="Provider configuration model" description="ข้อมูลขั้นต่ำที่หลังบ้านต้องมีสำหรับค่ายเกมแต่ละเจ้า">
        <AdminStack>{providerFields.map((item) => <AdminRow key={item}><strong>{item}</strong><AdminBadge>Required</AdminBadge></AdminRow>)}</AdminStack>
      </AdminCard>

      <h2 style={sectionTitleStyle}>Provider operation actions</h2>
      <AdminGrid>{providerActions.map(([title, description]) => <AdminCard key={title}><div style={cardStackStyle}><AdminBadge tone="warning">Action</AdminBadge><h2 style={{ margin: 0 }}>{title}</h2><p style={mutedStyle}>{description}</p></div></AdminCard>)}</AdminGrid>

      <AdminCard title="Provider examples" description="รายการตัวอย่างสำหรับวาง UI ก่อนเชื่อมต่อฐานข้อมูลจริง" action={<AdminLinkButton href="/game-api-settings">API settings</AdminLinkButton>}>
        <AdminStack>{sampleProviders.map(([name, code, type, walletMode]) => <AdminRow key={code}><div><strong>{name}</strong><p>{code} · {type}</p></div><div style={rightStyle}><AdminBadge tone="neutral">Draft</AdminBadge><p>{walletMode}</p></div></AdminRow>)}</AdminStack>
      </AdminCard>
    </AdminPage>
  );
}

const sectionTitleStyle = { margin: '24px 0 12px', fontSize: 'clamp(24px, 7vw, 34px)', lineHeight: 1 } as const;
const cardStackStyle = { display: 'grid', gap: 10 } as const;
const mutedStyle = { margin: 0, color: '#94a3b8', lineHeight: 1.55 } as const;
const rightStyle = { display: 'grid', gap: 6, justifyItems: 'end' as const, textAlign: 'right' as const };
