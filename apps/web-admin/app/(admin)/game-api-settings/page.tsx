import { AdminBadge, AdminCard, AdminGrid, AdminMetric, AdminMetricGrid, AdminPage, AdminRow, AdminStack } from '../_components/admin-ui';

const credentialSettings = [
  ['API Base URL', 'ปลายทางหลักของ provider API'],
  ['API Key / Secret Key', 'ต้องเข้ารหัสและแสดงแบบ masked เท่านั้น'],
  ['Merchant ID / Agent ID', 'รหัสร้านหรือ agent ที่ค่ายเกมออกให้'],
  ['Webhook Secret', 'ใช้ตรวจ signature จาก callback'],
  ['IP Whitelist', 'จำกัด source ที่เรียก callback ได้'],
];

const endpointSettings = [
  'Launch game endpoint',
  'Balance check endpoint',
  'Transfer in endpoint',
  'Transfer out endpoint',
  'Game list endpoint',
  'Bet history endpoint',
  'Webhook / callback endpoint',
];

const runtimeSettings = [
  ['Timeout', 'ตัด connection เมื่อ provider ตอบช้าเกินกำหนด'],
  ['Retry count', 'จำนวน retry สำหรับ request ที่ retry ได้อย่างปลอดภัย'],
  ['Retry backoff', 'หน่วงเวลาระหว่าง retry กันยิงซ้ำเป็นปืนกล'],
  ['Circuit breaker', 'พัก provider ชั่วคราวเมื่อ error ถี่ผิดปกติ'],
  ['Health check', 'ตรวจสถานะ online / offline / invalid key / maintenance'],
];

export default function GameApiSettingsPage() {
  return (
    <AdminPage eyebrow="Game Platform" title="Game API Settings" description="โครงตั้งค่า credential, endpoint, webhook, timeout, retry และ health status ของ API ค่ายเกม">
      <AdminMetricGrid>
        <AdminMetric title="Credential groups" value={String(credentialSettings.length)} helper="base URL, keys, merchant, webhook, IP" />
        <AdminMetric title="Endpoint mapping" value={String(endpointSettings.length)} helper="launch, balance, transfer, sync, webhook" />
        <AdminMetric title="Runtime controls" value={String(runtimeSettings.length)} helper="timeout, retry, circuit breaker" />
      </AdminMetricGrid>

      <AdminGrid>
        <AdminCard title="Credential settings" description="ข้อมูลลับต้องเข้ารหัสใน backend และ audit ทุกครั้งที่แก้">
          <AdminStack>{credentialSettings.map(([title, description]) => <AdminRow key={title}><div><strong>{title}</strong><p>{description}</p></div><AdminBadge tone="danger">Secret-safe</AdminBadge></AdminRow>)}</AdminStack>
        </AdminCard>

        <AdminCard title="Endpoint mapping" description="รองรับ provider แต่ละเจ้าที่ตั้งชื่อ endpoint ไม่เหมือนกัน เพราะโลกนี้ยังไม่รู้จักมาตรฐานร่วมกัน apparently">
          <AdminStack>{endpointSettings.map((item) => <AdminRow key={item}><strong>{item}</strong><AdminBadge>Mapping</AdminBadge></AdminRow>)}</AdminStack>
        </AdminCard>
      </AdminGrid>

      <h2 style={sectionTitleStyle}>Runtime / reliability</h2>
      <AdminGrid>{runtimeSettings.map(([title, description]) => <AdminCard key={title}><div style={cardStackStyle}><AdminBadge tone="warning">Runtime</AdminBadge><h2 style={{ margin: 0 }}>{title}</h2><p style={mutedStyle}>{description}</p></div></AdminCard>)}</AdminGrid>
    </AdminPage>
  );
}

const sectionTitleStyle = { margin: '24px 0 12px', fontSize: 'clamp(24px, 7vw, 34px)', lineHeight: 1 } as const;
const cardStackStyle = { display: 'grid', gap: 10 } as const;
const mutedStyle = { margin: 0, color: '#94a3b8', lineHeight: 1.55 } as const;
