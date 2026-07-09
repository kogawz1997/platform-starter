'use client';

import { useMemo, useState } from 'react';
import { AdminBadge, AdminCard, AdminGrid, AdminLinkButton, AdminNotice, AdminPage, AdminRow, AdminStack } from '../_components/admin-ui';

const steps = [
  { title: 'เลือก Preset', description: 'เริ่มจาก Demo, Simulator, Generic Transfer หรือ Seamless ไม่ต้องตั้งจากศูนย์เหมือนยุคหิน', action: '/provider-presets' },
  { title: 'สร้าง Provider', description: 'ใส่ชื่อ, code, wallet mode, currency และสถานะเริ่มต้น', action: '/game-providers' },
  { title: 'กรอก Credential', description: 'เพิ่ม API key, secret, merchant/agent id และ webhook secret แบบ masked', action: '/game-providers' },
  { title: 'Auto Map Endpoint', description: 'ใช้ preset เป็น checklist แล้วเพิ่ม LAUNCH, BALANCE, TRANSFER_IN, TRANSFER_OUT, WEBHOOK', action: '/game-providers' },
  { title: 'ตรวจ Preflight', description: 'เช็ก adapter, endpoint, credential, wallet sync gate และ blocker ก่อนเปิดให้สมาชิกใช้', action: '/provider-risk' },
  { title: 'เปิดใช้งานแบบค่อยเป็นค่อยไป', description: 'เปิด launch ก่อน, เปิด transfer/wallet sync ทีหลัง, real money เป็นขั้นสุดท้ายเท่านั้น', action: '/provider-risk' },
];

const rollout = [
  ['Stage 1', 'Catalog / Launch', 'ให้สมาชิกเห็นเกมและเปิดเกมได้ แต่ยังไม่โยกเงินจริง'],
  ['Stage 2', 'Transfer Wallet Sync', 'โยกเข้า/ออกเกม sync กับ WalletLedger แล้วตรวจ game transfers'],
  ['Stage 3', 'Reconciliation', 'เทียบยอด systemBalance/providerBalance และสร้าง alert เมื่อ mismatch'],
  ['Stage 4', 'Webhook Settlement', 'เปิดเฉพาะหลัง signature/dedup/reconcile ผ่านจริง'],
  ['Stage 5', 'Real Money', 'เปิดเงินจริงหลัง preflight ไม่มี blocker เท่านั้น'],
];

export default function ProviderSetupWizardPage() {
  const [active, setActive] = useState(0);
  const progress = useMemo(() => `${active + 1}/${steps.length}`, [active]);
  return <AdminPage eyebrow="Game Platform" title="Provider Setup Wizard" description="ทางตั้งค่าค่ายเกมแบบตลาดจริง: เริ่มจาก preset แล้วค่อยเปิด gate ทีละขั้น ไม่ต้องโยน endpoint ทั้งโลกใส่หน้าเดียว">
    <AdminNotice>แนวทางปลอดภัย: ห้ามเปิด Real Money ก่อน Provider Risk / Preflight ผ่านครบ เพราะฐานข้อมูลไม่ใช่สนามเด็กเล่นถึงแม้มนุษย์จะชอบลองของก็ตาม</AdminNotice>
    <AdminGrid>
      <AdminCard title={`ขั้นตอน ${progress}`} description={steps[active].title} action={<AdminLinkButton href={steps[active].action}>เปิดหน้าที่เกี่ยวข้อง</AdminLinkButton>}>
        <p style={mutedStyle}>{steps[active].description}</p>
        <div style={stepNavStyle}>{steps.map((step, index) => <button key={step.title} onClick={() => setActive(index)} style={index === active ? activeStepStyle : stepStyle}>{index + 1}</button>)}</div>
      </AdminCard>
      <AdminCard title="สถานะที่ควรเปิดตามลำดับ" description="ใช้ลำดับนี้ลดโอกาสเงินเพี้ยนและ debug นรกแตก"><AdminStack>{rollout.map(([stage, title, description]) => <AdminRow key={stage}><div><strong>{stage} · {title}</strong><p style={mutedStyle}>{description}</p></div><AdminBadge tone={stage === 'Stage 5' ? 'danger' : stage === 'Stage 4' ? 'warning' : 'success'}>{stage}</AdminBadge></AdminRow>)}</AdminStack></AdminCard>
    </AdminGrid>
    <h2 style={sectionTitleStyle}>Checklist ก่อนบอกว่าพร้อม</h2>
    <AdminGrid>{['Provider ACTIVE', 'Adapter registered', 'Endpoint ครบ', 'Credential ครบ', 'Wallet Sync enabled', 'Preflight ผ่าน', 'Reconcile ไม่มี mismatch', 'Webhook dedup/signature ผ่าน'].map((item, index) => <AdminCard key={item}><AdminRow><strong>{item}</strong><AdminBadge tone={index < 5 ? 'warning' : 'danger'}>{index < 5 ? 'Required' : 'Safety'}</AdminBadge></AdminRow></AdminCard>)}</AdminGrid>
  </AdminPage>;
}

const mutedStyle = { margin: 0, color: '#94a3b8', lineHeight: 1.55 } as const;
const sectionTitleStyle = { margin: '24px 0 12px', fontSize: 'clamp(24px, 7vw, 34px)', lineHeight: 1 } as const;
const stepNavStyle = { display: 'flex', gap: 8, flexWrap: 'wrap' as const };
const stepStyle = { width: 38, height: 38, borderRadius: 12, border: '1px solid rgba(148,163,184,.22)', background: '#0b1220', color: '#cbd5e1', fontWeight: 950 } as const;
const activeStepStyle = { ...stepStyle, background: '#f5c542', color: '#111827', borderColor: '#f5c542' } as const;
