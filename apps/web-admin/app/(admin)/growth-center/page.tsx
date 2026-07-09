import { AdminBadge, AdminCard, AdminGrid, AdminLinkButton, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminRow, AdminStack } from '../_components/admin-ui';

const modules = [
  { title: 'Promotion / Bonus', href: '/promotion-center', status: 'ยังไม่เปิดเงินจริง', tone: 'warning' as const, items: ['โปรโมชัน', 'โบนัส', 'turnover', 'ประวัติเคลม'] },
  { title: 'Affiliate / Agent', href: '/affiliate-center', status: 'รอโครงสร้างตัวแทน', tone: 'warning' as const, items: ['referral link', 'commission', 'downline', 'settlement'] },
  { title: 'CMS', href: '/content-center', status: 'พร้อมเริ่มจาก banner/popup', tone: 'success' as const, items: ['banner', 'popup', 'announcement', 'FAQ'] },
  { title: 'KYC / Bank Verify', href: '/kyc-center', status: 'ต้องใช้หลักฐานและกฎอนุมัติ', tone: 'danger' as const, items: ['ยืนยันเบอร์', 'ตรวจบัญชี', 'duplicate bank', 'blacklist'] },
  { title: 'Support', href: '/support-center', status: 'เริ่มจาก ticket ได้', tone: 'success' as const, items: ['ticket', 'LINE config', 'FAQ', 'ผูกฝากถอน'] },
];

export default function GrowthCenterPage() {
  return <AdminPage eyebrow="Product" title="ศูนย์ฟีเจอร์สินค้า" description="รวมงาน Promotion, Affiliate, CMS, KYC และ Support ไว้จุดเดียว ก่อนแตกเป็นระบบจริงแบบไม่ทำให้ repo กลายเป็นกองฟางติดไฟ">
    <AdminNotice>หน้านี้เป็น command center สำหรับวางระบบสินค้า/การตลาด ยังไม่ทำให้เกิดรายการเงินจริงหรือโบนัสจริงจนกว่าจะสร้าง backend rules ครบ</AdminNotice>
    <AdminMetricGrid><AdminMetric title="Promotion" value="Scaffold" helper="ยังไม่ settle โบนัส" tone="warning" /><AdminMetric title="Affiliate" value="Scaffold" helper="ยังไม่คำนวณ commission" tone="warning" /><AdminMetric title="CMS" value="Ready" helper="เริ่ม banner/popup ได้" tone="success" /><AdminMetric title="KYC" value="Guarded" helper="ต้องมี rule ชัด" tone="danger" /></AdminMetricGrid>
    <AdminGrid>{modules.map((item) => <AdminCard key={item.href} title={item.title} description={item.status} tone={item.tone}><AdminStack>{item.items.map((label) => <AdminRow key={label}><strong>{label}</strong><AdminBadge tone={item.tone}>{item.status}</AdminBadge></AdminRow>)}<AdminLinkButton href={item.href} tone="primary">เปิด</AdminLinkButton></AdminStack></AdminCard>)}</AdminGrid>
  </AdminPage>;
}
