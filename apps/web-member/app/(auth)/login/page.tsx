'use client';

import { FormEvent, useEffect, useState } from 'react';
import { API_URL, PublicSiteSettings, boolSetting, defaultSettings, textSetting } from '../../site-settings';

export default function MemberSignInPage() {
  const [settings, setSettings] = useState<PublicSiteSettings>(defaultSettings);
  const [identifier, setIdentifier] = useState('');
  const [secret, setSecret] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error' | 'info'>('idle');
  const [loading, setLoading] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/public/site-settings`)
      .then((res) => res.json())
      .then((data) => setSettings({ ...defaultSettings, ...data }))
      .catch(() => setSettings(defaultSettings));
  }, []);

  const siteName = textSetting(settings, 'website', 'site_name', 'Platform Starter');
  const description = textSetting(settings, 'website', 'site_description', 'เข้าสู่ระบบสมาชิก');
  const primaryColor = textSetting(settings, 'branding', 'primary_color', '#f5c542');
  const backgroundColor = textSetting(settings, 'branding', 'background_color', '#080808');
  const cardColor = textSetting(settings, 'branding', 'card_color', '#181818');
  const textColor = textSetting(settings, 'branding', 'text_color', '#ffffff');
  const loginEnabled =
    boolSetting(settings, 'features', 'login_enabled', true) &&
    boolSetting(settings, 'website', 'login_enabled', true);
  const maintenanceEnabled =
    boolSetting(settings, 'maintenance', 'enabled', false) ||
    boolSetting(settings, 'maintenance', 'member_enabled', false) ||
    boolSetting(settings, 'website', 'maintenance_mode', false);
  const disabled = !loginEnabled || maintenanceEnabled || loading;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (maintenanceEnabled) {
      setStatus('error');
      setMessage('ระบบกำลังปรับปรุง กรุณาลองใหม่ภายหลัง');
      return;
    }

    if (!loginEnabled) {
      setStatus('error');
      setMessage('ขณะนี้ปิดเข้าสู่ระบบ');
      return;
    }

    if (!identifier.trim() || !secret.trim()) {
      setStatus('error');
      setMessage('กรุณากรอก Username / Phone / Email และรหัสผ่าน');
      return;
    }

    setLoading(true);
    setStatus('info');
    setMessage('กำลังตรวจสอบข้อมูล...');

    const res = await fetch(`${API_URL}/member/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: identifier.trim(), secret, deviceId: 'web-member' }),
    });

    const data = await res.json().catch(() => null);
    setLoading(false);

    if (!res.ok) {
      setStatus('error');
      setMessage(data?.message ?? 'เข้าสู่ระบบไม่สำเร็จ กรุณาตรวจสอบข้อมูล');
      return;
    }

    window.localStorage.setItem('member_access_token', data.accessToken);
    window.localStorage.setItem('member_refresh_token', data.refreshToken);
    setStatus('success');
    setMessage('เข้าสู่ระบบสำเร็จ กำลังพาไปหน้าแรก...');
    window.location.href = '/';
  }

  return (
    <main style={{ ...pageStyle, background: backgroundColor, color: textColor }}>
      <section style={shellStyle}>
        <div style={heroStyle}>
          <div style={{ ...logoStyle, background: primaryColor, color: '#111' }}>{siteName.slice(0, 1).toUpperCase()}</div>
          <p style={{ opacity: 0.72, margin: 0 }}>Member Area</p>
          <h1 style={{ fontSize: 38, lineHeight: 1.1, margin: '12px 0' }}>ยินดีต้อนรับกลับ</h1>
          <p style={{ opacity: 0.78, maxWidth: 460 }}>{description}</p>
          <div style={featureStyle}>
            <span>กระเป๋าเงิน</span>
            <span>ประวัติธุรกรรม</span>
            <span>ฝาก/ถอน</span>
          </div>
        </div>

        <form onSubmit={onSubmit} style={{ ...cardStyle, background: cardColor }}>
          <div>
            <p style={{ margin: 0, opacity: 0.7 }}>เข้าสู่ระบบสมาชิก</p>
            <h2 style={{ margin: '6px 0 0' }}>{siteName}</h2>
          </div>

          {(maintenanceEnabled || !loginEnabled) && (
            <div style={alertStyle('error')}>{maintenanceEnabled ? 'ระบบกำลังปรับปรุง' : 'ขณะนี้ปิดเข้าสู่ระบบ'}</div>
          )}

          <label style={labelStyle}>
            Username / Phone / Email
            <input
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="เช่น Th11 หรือเบอร์โทร"
              disabled={disabled}
              autoComplete="username"
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            รหัสผ่าน
            <div style={passwordWrapStyle}>
              <input
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                placeholder="กรอกรหัสผ่าน"
                type={showSecret ? 'text' : 'password'}
                disabled={disabled}
                autoComplete="current-password"
                style={{ ...inputStyle, paddingRight: 84 }}
              />
              <button type="button" onClick={() => setShowSecret((v) => !v)} style={ghostButtonStyle} disabled={disabled}>
                {showSecret ? 'ซ่อน' : 'แสดง'}
              </button>
            </div>
          </label>

          <button type="submit" disabled={disabled} style={{ ...submitStyle, background: primaryColor, color: '#111' }}>
            {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>

          {message && <div style={alertStyle(status)}>{message}</div>}

          <p style={{ textAlign: 'center', margin: 0 }}>
            ยังไม่มีบัญชี? <a href="/register" style={{ color: primaryColor }}>สมัครสมาชิก</a>
          </p>
        </form>
      </section>
    </main>
  );
}

const pageStyle = { minHeight: '100vh', padding: 24, display: 'grid', placeItems: 'center' } as const;
const shellStyle = { width: '100%', maxWidth: 1040, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, alignItems: 'center' } as const;
const heroStyle = { padding: 24 } as const;
const logoStyle = { width: 58, height: 58, borderRadius: 18, display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 24 } as const;
const featureStyle = { display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 20 } as const;
const cardStyle = { border: '1px solid rgba(255,255,255,0.12)', borderRadius: 28, padding: 24, display: 'grid', gap: 16, boxShadow: '0 24px 80px rgba(0,0,0,0.28)' } as const;
const labelStyle = { display: 'grid', gap: 8, fontWeight: 700 } as const;
const inputStyle = { width: '100%', padding: '13px 14px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.18)', background: 'rgba(255,255,255,0.08)', color: 'inherit', boxSizing: 'border-box', outline: 'none' } as const;
const passwordWrapStyle = { position: 'relative' } as const;
const ghostButtonStyle = { position: 'absolute', right: 8, top: 7, padding: '7px 10px', borderRadius: 10, border: 0, cursor: 'pointer' } as const;
const submitStyle = { border: 0, borderRadius: 14, padding: '14px 16px', fontWeight: 800, cursor: 'pointer' } as const;
function alertStyle(status: 'idle' | 'success' | 'error' | 'info') {
  return { border: '1px solid rgba(255,255,255,0.14)', borderRadius: 14, padding: 12, background: status === 'error' ? 'rgba(255,80,80,0.14)' : status === 'success' ? 'rgba(80,255,140,0.14)' : 'rgba(255,255,255,0.08)' } as const;
}
