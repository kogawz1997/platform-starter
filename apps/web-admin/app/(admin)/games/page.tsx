import { AdminBadge, AdminCard, AdminGrid, AdminLinkButton, AdminMetric, AdminMetricGrid, AdminPage, AdminRow, AdminStack } from '../_components/admin-ui';

const syncPipeline = [
  ['Pull game list', 'ดึงรายชื่อเกม รหัสเกม provider code และสถานะจาก API'],
  ['Pull game images', 'ดึง cover, icon, thumbnail, banner จาก provider payload'],
  ['Normalize metadata', 'แปลง payload แต่ละค่ายให้เป็น schema กลาง'],
  ['Cache media', 'เก็บรูปเข้า storage/CDN เมื่อเงื่อนไข provider อนุญาต'],
  ['Preserve overrides', 'ไม่ทับชื่อ รูป หมวด และ sort order ที่แอดมินแก้เอง'],
  ['Detect changes', 'แยกเกมใหม่ เกมถูกลบ เกมเปลี่ยนรูป หรือ provider ปิดเกม'],
];

const mediaChecks = [
  'Broken URL check',
  'Content type check',
  'Image size check',
  'Fallback cover/icon/banner',
  'Manual image override',
  'Mobile lazy loading / skeleton',
];

const catalogControls = [
  'Filter by provider / category / status / tag',
  'Search by game name / game code / provider code',
  'Enable / disable selected game',
  'Featured / new / popular / recommended flags',
  'Bulk category / tag assignment',
  'Member visibility and maintenance status',
];

export default function GameCatalogPage() {
  return (
    <AdminPage eyebrow="Game Platform" title="Game Catalog" description="โครง sync รายชื่อเกม รูปเกม หมวดหมู่ tag และการแสดงผลฝั่ง member">
      <AdminMetricGrid>
        <AdminMetric title="Sync pipeline" value={String(syncPipeline.length)} helper="list, images, metadata, cache, override" />
        <AdminMetric title="Media checks" value={String(mediaChecks.length)} helper="broken image, fallback, validation" />
        <AdminMetric title="Admin controls" value={String(catalogControls.length)} helper="filter, search, flags, visibility" />
      </AdminMetricGrid>

      <AdminCard title="Catalog sync pipeline" description="ลำดับงานที่ต้องทำเมื่อ sync เกมจากค่ายเกม">
        <AdminStack>{syncPipeline.map(([title, description]) => <AdminRow key={title}><div><strong>{title}</strong><p>{description}</p></div><AdminBadge tone="warning">Sync</AdminBadge></AdminRow>)}</AdminStack>
      </AdminCard>

      <AdminGrid>
        <AdminCard title="Image / media handling" description="กันรูปเกมหาย รูปแตก หรือ provider ส่ง URL แปลก ๆ มาให้ frontend ร้องไห้">
          <AdminStack>{mediaChecks.map((item) => <AdminRow key={item}><strong>{item}</strong><AdminBadge>Media</AdminBadge></AdminRow>)}</AdminStack>
        </AdminCard>

        <AdminCard title="Catalog management" description="เครื่องมือที่แอดมินต้องใช้จัดหน้าเกมจริง">
          <AdminStack>{catalogControls.map((item) => <AdminRow key={item}><strong>{item}</strong><AdminBadge tone="neutral">Admin</AdminBadge></AdminRow>)}</AdminStack>
        </AdminCard>
      </AdminGrid>

      <AdminCard title="Next dependency" description="ต้องมี provider + adapter ก่อน sync จริง" action={<AdminLinkButton href="/provider-adapters">Provider adapters</AdminLinkButton>}>
        <p style={mutedStyle}>หน้านี้เป็นโครง UI และ checklist ก่อนต่อ API จริง รอบถัดไปค่อยผูกกับ backend service/queue/cron ไม่ใช่เอาทุกอย่างยัดใน client component เหมือนประกอบเรือด้วยเทปใส</p>
      </AdminCard>
    </AdminPage>
  );
}

const mutedStyle = { margin: 0, color: '#94a3b8', lineHeight: 1.55 } as const;
