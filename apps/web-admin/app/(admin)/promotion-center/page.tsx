import { AdminBadge, AdminCard, AdminGrid, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminRow, AdminStack } from '../_components/admin-ui';

const campaignSteps = [
  ['Campaign config', 'ชื่อโปร, ช่วงเวลา, กลุ่มสมาชิก, สถานะ'],
  ['Bonus rule', 'ยอดโบนัส, เงื่อนไขฝากขั้นต่ำ, จำกัดครั้งต่อวัน'],
  ['Turnover rule', 'ยอดเทิร์น, เกมที่นับ, ระยะเวลา'],
  ['Claim workflow', 'สมาชิกกดรับหรือแอดมินอนุมัติ'],
  ['Settlement guard', 'ห้ามเพิ่มยอดจริงจนกว่า ledger/bonus wallet พร้อม'],
];

export default function PromotionCenterPage() {
  return <AdminPage eyebrow="Growth" title="Promotion / Bonus" description="โครงสำหรับระบบโปรโมชันและโบนัส ก่อนเปิดใช้จริงต้องมี rule, ledger และ audit ครบ ไม่ใช่แจกเงินฟรีแล้วค่อยภาวนา">
    <AdminNotice>สถานะตอนนี้เป็น scaffold เท่านั้น ยังไม่เขียนยอดโบนัสเข้ากระเป๋าจริง</AdminNotice>
    <AdminMetricGrid><AdminMetric tone="warning" title="Campaigns" value="0" helper="ยังไม่เปิดใช้งานจริง" /><AdminMetric tone="warning" title="Bonus wallet" value="Pending" helper="ต้องออกแบบ ledger" /><AdminMetric tone="danger" title="Real settlement" value="Off" helper="ปลอดภัยไว้ก่อน" /></AdminMetricGrid>
    <AdminGrid><AdminCard title="Flow ที่ต้องทำ" tone="warning"><AdminStack>{campaignSteps.map(([title, desc]) => <AdminRow key={title}><strong>{title}</strong><span>{desc}</span></AdminRow>)}</AdminStack></AdminCard><AdminCard title="Definition of Done"><AdminStack><AdminRow><strong>Admin สร้างโปรได้</strong><AdminBadge tone="warning">รอทำ</AdminBadge></AdminRow><AdminRow><strong>สมาชิกเห็นโปรได้</strong><AdminBadge tone="warning">รอทำ</AdminBadge></AdminRow><AdminRow><strong>โบนัสมี audit/ledger</strong><AdminBadge tone="danger">จำเป็น</AdminBadge></AdminRow></AdminStack></AdminCard></AdminGrid>
  </AdminPage>;
}
