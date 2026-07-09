import { AdminBadge, AdminCard, AdminGrid, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminRow, AdminStack } from '../_components/admin-ui';

const parts = [
  ['Agent profile', 'รหัสตัวแทน, ระดับ, สถานะ'],
  ['Referral link', 'ลิงก์สมัครและ tracking code'],
  ['Commission rule', 'เปอร์เซ็นต์, เงื่อนไขยอดเสีย/ยอดฝาก'],
  ['Downline view', 'สมาชิกใต้สายและ performance'],
  ['Settlement', 'รอบจ่าย commission พร้อม audit'],
];

export default function AffiliateCenterPage() {
  return <AdminPage eyebrow="Growth" title="Affiliate / Agent" description="โครงระบบตัวแทนและ referral ก่อนเริ่มคิด commission จริง ค่อย ๆ ทำ ไม่ใช่โยนเปอร์เซ็นต์ใส่ DB แล้วหวังว่าบัญชีจะรักเรา">
    <AdminNotice>ยังไม่คำนวณ commission จริง หน้านี้เป็นแผนงานและจุดรวมเมนูสำหรับระบบตัวแทน</AdminNotice>
    <AdminMetricGrid><AdminMetric tone="warning" title="Agents" value="0" helper="ยังไม่เปิดระบบ" /><AdminMetric tone="warning" title="Commission" value="Off" helper="ยังไม่ settle" /><AdminMetric tone="neutral" title="Tracking" value="Pending" helper="รอ referral code" /></AdminMetricGrid>
    <AdminGrid><AdminCard title="Module ที่ต้องมี" tone="warning"><AdminStack>{parts.map(([title, desc]) => <AdminRow key={title}><strong>{title}</strong><span>{desc}</span></AdminRow>)}</AdminStack></AdminCard><AdminCard title="Guard ก่อนเงินจริง"><AdminStack><AdminRow><strong>กัน duplicate referral</strong><AdminBadge tone="danger">ต้องมี</AdminBadge></AdminRow><AdminRow><strong>audit ตอนปรับ commission</strong><AdminBadge tone="danger">ต้องมี</AdminBadge></AdminRow><AdminRow><strong>รอบจ่ายแยกจาก wallet หลัก</strong><AdminBadge tone="warning">ควรมี</AdminBadge></AdminRow></AdminStack></AdminCard></AdminGrid>
  </AdminPage>;
}
