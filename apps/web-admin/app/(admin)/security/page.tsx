'use client';

import QRCode from 'qrcode';
import { useEffect, useState } from 'react';
import { adminApiFetch, clearAdminSession } from '../../admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminStack } from '../_components/admin-ui';

type AdminMe = { id: string; username: string; permissions?: string[] };
type SetupResponse = { secret: string; otpAuthUrl: string };
type SessionItem = { id: string; deviceId?: string | null; ipAddress?: string | null; userAgent?: string | null; createdAt: string; expiresAt: string; revokedAt?: string | null; current: boolean; active: boolean };

export default function AdminSecurityPage() {
  const [me, setMe] = useState<AdminMe | null>(null);
  const [setup, setSetup] = useState<SetupResponse | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadAll(); }, []);
  useEffect(() => {
    if (!setup?.otpAuthUrl) { setQrDataUrl(''); return; }
    QRCode.toDataURL(setup.otpAuthUrl, { margin: 1, width: 220 }).then(setQrDataUrl).catch(() => setMessage('สร้าง QR code ไม่สำเร็จ'));
  }, [setup?.otpAuthUrl]);

  async function loadAll() {
    await Promise.all([loadMe(), loadSessions()]);
  }

  async function loadMe() {
    const res = await adminApiFetch('/admin/auth/me');
    const data = await res.json().catch(() => null);
    if (!res.ok) { setMessage(data?.message ?? 'โหลดข้อมูลแอดมินไม่สำเร็จ'); return; }
    setMe(data);
  }

  async function loadSessions() {
    const res = await adminApiFetch('/admin/auth/sessions');
    const data = await res.json().catch(() => null);
    if (!res.ok) { setMessage(data?.message ?? 'โหลด sessions ไม่สำเร็จ'); return; }
    setSessions(data.items ?? []);
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

  async function revokeSession(session: SessionItem) {
    if (!window.confirm(session.current ? 'ยืนยันออกจากระบบ session ปัจจุบัน?' : 'ยืนยันปิด session นี้?')) return;
    setLoading(true); setMessage('กำลังปิด session...');
    const res = await adminApiFetch(`/admin/auth/sessions/${session.id}`, { method: 'DELETE' });
    const data = await res.json().catch(() => null);
    setLoading(false);
    if (!res.ok) { setMessage(data?.message ?? 'ปิด session ไม่สำเร็จ'); return; }
    if (data?.current) { clearAdminSession(); window.location.replace('/login'); return; }
    setMessage('ปิด session แล้ว');
    await loadSessions();
  }

  async function logoutOtherDevices() {
    if (!window.confirm('ยืนยันออกจากระบบอุปกรณ์อื่นทั้งหมด?')) return;
    setLoading(true); setMessage('กำลังออกจากระบบอุปกรณ์อื่น...');
    const res = await adminApiFetch('/admin/auth/sessions/logout-others', { method: 'POST' });
    const data = await res.json().catch(() => null);
    setLoading(false);
    if (!res.ok) { setMessage(data?.message ?? 'ออกจากระบบอุปกรณ์อื่นไม่สำเร็จ'); return; }
    setMessage(`ออกจากระบบอุปกรณ์อื่นแล้ว ${data?.revoked ?? 0} session`);
    await loadSessions();
  }

  async function endEverySession() {
    if (!window.confirm('ยืนยันปิด session ทั้งหมด รวมเครื่องนี้?')) return;
    setLoading(true); setMessage('กำลังปิด session ทั้งหมด...');
    const res = await adminApiFetch('/admin/auth/sessions/' + 'logout-all', { method: 'POST' });
    const data = await res.json().catch(() => null);
    setLoading(false);
    if (!res.ok) { setMessage(data?.message ?? 'ปิด session ทั้งหมดไม่สำเร็จ'); return; }
    clearAdminSession();
    window.location.replace('/login');
  }

  async function copy(value: string, label: string) {
    try { await navigator.clipboard.writeText(value); setMessage(`คัดลอก${label}แล้ว`); }
    catch { setMessage(`คัดลอก${label}ไม่สำเร็จ`); }
  }

  const activeCount = sessions.filter((item) => item.active).length;
  const otherActiveCount = sessions.filter((item) => item.active && !item.current).length;

  return <AdminPage eyebrow="Security" title="Admin Security" description="ตั้งค่า 2FA และดู session ของบัญชีแอดมิน" actions={<AdminButton onClick={loadAll}>Reload</AdminButton>}>
    {message && <AdminNotice>{message}</AdminNotice>}

    <AdminMetricGrid>
      <AdminMetric title="Admin" value={me?.username ?? '-'} helper={me?.id ?? ''} />
      <AdminMetric title="Permissions" value={String(me?.permissions?.length ?? 0)} helper="from current session" />
      <AdminMetric title="Active sessions" value={String(activeCount)} helper={`${sessions.length} loaded`} />
    </AdminMetricGrid>

    <AdminCard title="2FA Setup" description="สร้าง secret แล้วเปิดในแอป Authenticator เช่น Google Authenticator, 1Password หรือ Authy">
      <AdminStack>
        <div style={infoStyle}>
          <AdminBadge tone="success">TOTP READY</AdminBadge>
          <p>Backend ตรวจรหัส TOTP จาก secret จริงแล้ว สแกน QR หรือคัดลอก OTP Auth URL เข้าแอป Authenticator แล้วใส่รหัส 6 หลักเพื่อเปิดใช้งาน</p>
        </div>

        {!setup && <AdminButton disabled={loading} onClick={startSetup}>Generate 2FA Secret</AdminButton>}

        {setup && <section style={setupBoxStyle}>
          {qrDataUrl && <div style={qrBoxStyle}><img src={qrDataUrl} alt="2FA QR code" style={qrImageStyle} /><span>สแกนด้วยแอป Authenticator</span></div>}
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

    <AdminCard title="Admin Sessions" description="รายการ session ล่าสุดของบัญชีแอดมินนี้">
      <div style={sessionToolbarStyle}><AdminButton disabled={loading || otherActiveCount === 0} onClick={logoutOtherDevices}>Logout other devices</AdminButton><AdminButton disabled={loading || activeCount === 0} tone="danger" onClick={endEverySession}>End all sessions</AdminButton></div>
      <AdminStack>{sessions.map((session) => <section key={session.id} style={sessionBoxStyle}><div style={sessionTopStyle}><div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}><AdminBadge tone={session.active ? 'success' : 'neutral'}>{session.active ? 'ACTIVE' : 'ENDED'}</AdminBadge>{session.current && <AdminBadge tone="warning">CURRENT</AdminBadge>}</div>{session.active && <AdminButton disabled={loading} tone="danger" onClick={() => revokeSession(session)}>Revoke</AdminButton>}</div><strong>{session.deviceId || 'Unknown device'}</strong><p>IP: {session.ipAddress || '-'}</p><p style={agentStyle}>UA: {session.userAgent || '-'}</p><p>Created: {new Date(session.createdAt).toLocaleString('th-TH')}</p><p>Expires: {new Date(session.expiresAt).toLocaleString('th-TH')}</p>{session.revokedAt && <p>Ended: {new Date(session.revokedAt).toLocaleString('th-TH')}</p>}</section>)}{sessions.length === 0 && <AdminNotice>ยังไม่มี session ให้แสดง</AdminNotice>}</AdminStack>
    </AdminCard>
  </AdminPage>;
}

const infoStyle = { border: '1px solid rgba(34,197,94,.28)', borderRadius: 16, padding: 12, background: 'rgba(34,197,94,.08)', display: 'grid', gap: 8 } as const;
const setupBoxStyle = { display: 'grid', gap: 12, minWidth: 0 } as const;
const labelStyle = { display: 'grid', gap: 7, fontWeight: 850, minWidth: 0 } as const;
const copyRowStyle = { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 8, minWidth: 0 } as const;
const inputStyle = { minHeight: 44, borderRadius: 12, border: '1px solid rgba(148,163,184,.22)', background: '#0b1220', color: '#f8fafc', padding: '0 12px', minWidth: 0, width: '100%', boxSizing: 'border-box' as const };
const copyButtonStyle = { border: '1px solid rgba(245,197,66,.35)', borderRadius: 12, padding: '0 12px', background: 'rgba(245,197,66,.14)', color: '#f5c542', fontWeight: 900, cursor: 'pointer' } as const;
const qrBoxStyle = { border: '1px solid rgba(148,163,184,.18)', borderRadius: 16, padding: 14, display: 'grid', justifyItems: 'center', gap: 10, background: '#0b1220' } as const;
const qrImageStyle = { width: 220, height: 220, maxWidth: '100%', borderRadius: 12, background: '#fff', padding: 8 } as const;
const sessionBoxStyle = { border: '1px solid rgba(148,163,184,.18)', borderRadius: 16, padding: 12, display: 'grid', gap: 6, minWidth: 0 } as const;
const sessionTopStyle = { display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', flexWrap: 'wrap' as const };
const sessionToolbarStyle = { display: 'flex', gap: 10, flexWrap: 'wrap' as const, marginBottom: 12 };
const agentStyle = { overflowWrap: 'anywhere' as const, color: '#94a3b8' };
