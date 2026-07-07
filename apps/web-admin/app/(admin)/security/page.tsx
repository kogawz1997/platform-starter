'use client';

import { useEffect, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminStack } from '../_components/admin-ui';

type AdminMe = { id: string; username: string; permissions?: string[] };
type SetupResponse = { secret: string; otpAuthUrl: string };

export default function AdminSecurityPage() {
  const [me, setMe] = useState<AdminMe | null>(null);
  const [setup, setSetup] = useState<SetupResponse | null>(null);
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadMe(); }, []);

  async function loadMe() {
    const res = await adminApiFetch('/admin/auth/me');
    const data = await res.json().catch(() => null);
    if (!res.ok) { setMessage(data?.message ?? 'โหลดข้อมูลแอดมินไม่สำเร็จ'); return; }
    setMe(data);
  }

  async function startSetup() {
    setLoading(true); setMessage('กำลังสร้าง 2FA secret...');
    const res = await adminApiFetch('/admin/auth/2fa/setup', { method: 'POST' });
    const data = await res.json().catch(() => null);
    setLoading(false);
    if (!res.ok) { setMessage(data?.message ?? 'เริ่มตั้งค่า 2FA ไม่สำเร็จ'); return; }
    setSetup(data);
    setMessage('สร้าง 2FA secret แล้ว ให้บันทึก secret นี้ไว้ในแอป Authenticator');
  }

  async function enable2FA() {
    if (!code.trim()) { setMessage('กรุณาใส่รหัสยืนยัน'); return; }
    setLoading(true); setMessage('กำลังเปิดใช้งาน 2FA...');
    const res = await adminApiFetch('/admin/auth/2fa/enable', { method: 'POST', body: JSON.stringify({ code: code.trim() }) });
    const data = await res.json().catch(() => null);
    setLoading(false);
    if (!res.ok) { setMessage(data?.message ?? 'เปิดใช้งาน 2FA ไม่สำเร็จ'); return; }
    setCode('');
    setMessage('เปิดใช้งาน 2FA แล้ว');
    await loadMe();
  }

  async function copy(value: string, label: string) {
    try { await navigator.clipboard.writeText(value); setMessage(`คัดลอก${label}แล้ว`); }
    catch { setMessage(`คัดลอก${label}ไม่สำเร็จ`); }
  }

  return <AdminPage eyebrow="Security" title="Admin 2FA" description="ตั้งค่า two-factor authentication สำหรับบัญชีแอดมิน" actions={<AdminButton onClick={loadMe}>Reload</AdminButton>}>
    {message && <AdminNotice>{message}</AdminNotice>}

    <AdminMetricGrid>
      <AdminMetric title="Admin" value={me?.username ?? '-'} helper={me?.id ?? ''} />
      <AdminMetric title="Permissions" value={String(me?.permissions?.length ?? 0)} helper="from current session" />
      <AdminMetric title="Mode" value="TOTP" helper="Authenticator app" />
    </AdminMetricGrid>

    <AdminCard title="2FA Setup" description="สร้าง secret แล้วเปิดในแอป Authenticator เช่น Google Authenticator, 1Password หรือ Authy">
      <AdminStack>
        <div style={infoStyle}>
          <AdminBadge tone="success">TOTP READY</AdminBadge>
          <p>Backend ตรวจรหัส TOTP จาก secret จริงแล้ว สแกนหรือคัดลอก OTP Auth URL เข้าแอป Authenticator แล้วใส่รหัส 6 หลักเพื่อเปิดใช้งาน</p>
        </div>

        {!setup && <AdminButton disabled={loading} onClick={startSetup}>Generate 2FA Secret</AdminButton>}

        {setup && <section style={setupBoxStyle}>
          <label style={labelStyle}>Manual secret
            <div style={copyRowStyle}><input value={setup.secret} readOnly style={inputStyle} /><button type="button" onClick={() => copy(setup.secret, ' secret')} style={copyButtonStyle}>Copy</button></div>
          </label>
          <label style={labelStyle}>OTP Auth URL
            <div style={copyRowStyle}><input value={setup.otpAuthUrl} readOnly style={inputStyle} /><button type="button" onClick={() => copy(setup.otpAuthUrl, ' OTP URL')} style={copyButtonStyle}>Copy</button></div>
          </label>
          <label style={labelStyle}>Verification code
            <input value={code} onChange={(event) => setCode(event.target.value)} inputMode="numeric" placeholder="ใส่รหัส 6 หลักจาก Authenticator" style={inputStyle} />
          </label>
          <AdminButton disabled={loading} onClick={enable2FA}>Enable 2FA</AdminButton>
        </section>}
      </AdminStack>
    </AdminCard>
  </AdminPage>;
}

const infoStyle = { border: '1px solid rgba(34,197,94,.28)', borderRadius: 16, padding: 12, background: 'rgba(34,197,94,.08)', display: 'grid', gap: 8 } as const;
const setupBoxStyle = { display: 'grid', gap: 12, minWidth: 0 } as const;
const labelStyle = { display: 'grid', gap: 7, fontWeight: 850, minWidth: 0 } as const;
const copyRowStyle = { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 8, minWidth: 0 } as const;
const inputStyle = { minHeight: 44, borderRadius: 12, border: '1px solid rgba(148,163,184,.22)', background: '#0b1220', color: '#f8fafc', padding: '0 12px', minWidth: 0, width: '100%', boxSizing: 'border-box' as const };
const copyButtonStyle = { border: '1px solid rgba(245,197,66,.35)', borderRadius: 12, padding: '0 12px', background: 'rgba(245,197,66,.14)', color: '#f5c542', fontWeight: 900, cursor: 'pointer' } as const;
