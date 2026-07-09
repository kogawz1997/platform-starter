import { AdminBadge, AdminCard, AdminGrid, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminRow, AdminStack } from '../_components/admin-ui';

const supportModules = [
  ['Ticket inbox', 'รายการปัญหาจากสมาชิกและสถานะงาน'],
  ['Deposit issue', 'ผูก ticket กับรายการฝาก'],
  ['Withdraw issue', 'ผูก ticket กับรายการถอน'],
  ['LINE / Live chat', 'ตั้งค่าช่องทางติดต่อ'],
  ['FAQ templates', 'คำตอบมาตรฐาน ลดการพิมพ์ซ้ำเหมือนหุ่นยนต์มนุษย์'],
];

export default function SupportCenterPage() {
  return <AdminPage eyebrow="Support" title="Support Ticket / LINE" description="ศูนย์ช่วยเหลือสมาชิกและปัญหาฝากถอน ยังเป็น scaffold ก่อนต่อ ticket backend จริง">
    <AdminNotice>เริ่มจาก ticket ที่ผูก deposit/withdraw จะคุ้มสุด เพราะปัญหาการเงินคือที่ที่มนุษย์มักจะพิมพ์แชทด้วยความเร็วแสง</AdminNotice>
    <AdminMetricGrid><AdminMetric tone="success" title="Ticket flow" value="Ready to design" helper="เริ่ม backend ได้" /><AdminMetric tone="warning" title="LINE config" value="Pending" helper="รอ channel config" /><AdminMetric tone="neutral" title="FAQ" value="Pending" helper="ใช้ร่วม CMS ได้" /></AdminMetricGrid>
    <AdminGrid><AdminCard title="Support modules" tone="success"><AdminStack>{supportModules.map(([title, desc]) => <AdminRow key={title}><strong>{title}</strong><span>{desc}</span></AdminRow>)}</AdminStack></AdminCard><AdminCard title="Priority"><AdminStack><AdminRow><strong>ปัญหาฝากไม่เข้า</strong><AdminBadge tone="danger">สูงสุด</AdminBadge></AdminRow><AdminRow><strong>ถอนช้า/บัญชีผิด</strong><AdminBadge tone="danger">สูงสุด</AdminBadge></AdminRow><AdminRow><strong>เข้าเกมไม่ได้</strong><AdminBadge tone="warning">รองลงมา</AdminBadge></AdminRow></AdminStack></AdminCard></AdminGrid>
  </AdminPage>;
}
