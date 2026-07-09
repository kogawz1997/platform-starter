import { AdminBadge, AdminCard, AdminGrid, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminRow, AdminStack } from '../_components/admin-ui';

const contentTypes = [
  ['Banner', 'หน้าแรก/member lobby, ลำดับ, รูปมือถือ'],
  ['Popup', 'ข้อความแจ้งเตือน, ช่วงเวลาแสดง, ปุ่ม CTA'],
  ['Announcement', 'ประกาศระบบ, แจ้งปิดปรับปรุง, ข่าวโปร'],
  ['FAQ', 'คำถามฝาก ถอน สมัคร เล่นเกม'],
  ['Game ordering', 'จัดเรียงหมวด/เกมแนะนำ'],
];

export default function ContentCenterPage() {
  return <AdminPage eyebrow="Content" title="CMS / Banner / Popup" description="ศูนย์จัดการคอนเทนต์สำหรับหน้าเว็บและประกาศ ยังเป็น scaffold ก่อนต่อ DB จริง">
    <AdminNotice>เริ่มจาก content config ที่ไม่แตะเงินก่อน ปลอดภัยและเห็นผลไวกว่าไปสร้างโบนัสซับซ้อนแบบมนุษย์ใจร้อน</AdminNotice>
    <AdminMetricGrid><AdminMetric tone="success" title="Banner" value="Ready" helper="เริ่มออกแบบได้" /><AdminMetric tone="warning" title="Popup" value="Pending" helper="ต้องมี scheduling" /><AdminMetric tone="neutral" title="FAQ" value="Pending" helper="รอ content model" /></AdminMetricGrid>
    <AdminGrid><AdminCard title="Content modules" tone="success"><AdminStack>{contentTypes.map(([title, desc]) => <AdminRow key={title}><strong>{title}</strong><span>{desc}</span></AdminRow>)}</AdminStack></AdminCard><AdminCard title="Next build"><AdminStack><AdminRow><strong>SiteSetting-backed content</strong><AdminBadge tone="success">เหมาะเริ่มก่อน</AdminBadge></AdminRow><AdminRow><strong>Image upload</strong><AdminBadge tone="warning">รอ storage policy</AdminBadge></AdminRow><AdminRow><strong>Preview บนมือถือ</strong><AdminBadge tone="warning">ควรทำ</AdminBadge></AdminRow></AdminStack></AdminCard></AdminGrid>
  </AdminPage>;
}
