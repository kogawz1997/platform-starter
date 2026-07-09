import { AdminBadge, AdminCard, AdminGrid, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminRow, AdminStack } from '../_components/admin-ui';

const checks = [
  ['Phone verification', 'ยืนยันเบอร์ก่อนฝาก/ถอนบางเงื่อนไข'],
  ['Bank verification', 'ตรวจชื่อบัญชีตรงกับสมาชิก'],
  ['Duplicate bank', 'กันหลายบัญชีใช้เลขบัญชีเดียวกัน'],
  ['Blacklist', 'กันสมาชิก/บัญชีเสี่ยง'],
  ['Risk status', 'สถานะความเสี่ยงรายสมาชิก'],
];

export default function KycCenterPage() {
  return <AdminPage eyebrow="Risk" title="KYC / Bank Verification" description="ศูนย์ยืนยันตัวตนและตรวจบัญชีธนาคาร ก่อนเปิดกฎจริงต้องกำหนดขั้นตอนให้ชัด ไม่งั้นแอดมินจะได้เล่นเกมทายชื่อบัญชีทุกวัน">
    <AdminNotice>ยังไม่บล็อกสมาชิกจริง หน้านี้เป็น scaffold สำหรับวางกฎ KYC และ bank verification</AdminNotice>
    <AdminMetricGrid><AdminMetric tone="danger" title="Bank verify" value="Required" helper="สำคัญก่อนระบบถอนโต" /><AdminMetric tone="warning" title="Phone verify" value="Pending" helper="รอ OTP provider" /><AdminMetric tone="danger" title="Blacklist" value="Pending" helper="ต้อง audit ทุก action" /></AdminMetricGrid>
    <AdminGrid><AdminCard title="Checks" tone="danger"><AdminStack>{checks.map(([title, desc]) => <AdminRow key={title}><strong>{title}</strong><span>{desc}</span></AdminRow>)}</AdminStack></AdminCard><AdminCard title="Guard rails"><AdminStack><AdminRow><strong>ไม่ลบข้อมูล KYC ดื้อ ๆ</strong><AdminBadge tone="danger">จำเป็น</AdminBadge></AdminRow><AdminRow><strong>ทุกการอนุมัติต้องมี audit</strong><AdminBadge tone="danger">จำเป็น</AdminBadge></AdminRow><AdminRow><strong>แยก soft block / hard blacklist</strong><AdminBadge tone="warning">ควรมี</AdminBadge></AdminRow></AdminStack></AdminCard></AdminGrid>
  </AdminPage>;
}
