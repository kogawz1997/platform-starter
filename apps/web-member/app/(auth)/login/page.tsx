'use client';

import { FormEvent, useEffect, useState } from 'react';
import { API_URL, PublicSiteSettings, boolSetting, defaultSettings, textSetting } from '../../site-settings';

export default function MemberSignInPage() {
  const [settings, setSettings] = useState<PublicSiteSettings>(defaultSettings);
  const [identifier, setIdentifier] = useState('');
  const [secret, setSecret] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch(`${API_URL}/public/site-settings`)
      .then((res) => res.json())
      .then((data) => setSettings({ ...defaultSettings, ...data }))
      .catch(() => setSettings(defaultSettings));
  }, []);

  const siteName = textSetting(settings, 'website', 'site_name', 'Platform Starter');
  const loginEnabled =
    boolSetting(settings, 'features', 'login_enabled', true) &&
    boolSetting(settings, 'website', 'login_enabled', true);
  const maintenanceEnabled =
    boolSetting(settings, 'maintenance', 'enabled', false) ||
    boolSetting(settings, 'maintenance', 'member_enabled', false) ||
    boolSetting(settings, 'website', 'maintenance_mode', false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (maintenanceEnabled) {
      setMessage('ระบบกำลังปรับปรุง');
      return;
    }

    if (!loginEnabled) {
      setMessage('ขณะนี้ปิดเข้าสู่ระบบ');
      return;
    }

    setMessage('กำลังตรวจสอบ...');

    const res = await fetch(`${API_URL}/member/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, secret, deviceId: 'web-member' }),
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setMessage(data?.message ?? 'ไม่สำเร็จ');
      return;
    }

    window.localStorage.setItem('member_access_token', data.accessToken);
    window.localStorage.setItem('member_refresh_token', data.refreshToken);
    setMessage('สำเร็จ');
  }

  return (
    <main style={{ maxWidth: 420, margin: '48px auto', padding: 24 }}>
      <h1>Member Sign In</h1>
      <p>{siteName}</p>
      {!loginEnabled && <p>ขณะนี้ปิดเข้าสู่ระบบ</p>}
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
        <input value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="Username / Phone / Email" disabled={!loginEnabled || maintenanceEnabled} />
        <input value={secret} onChange={(e) => setSecret(e.target.value)} placeholder="Secret" type="password" disabled={!loginEnabled || maintenanceEnabled} />
        <button type="submit" disabled={!loginEnabled || maintenanceEnabled}>Sign In</button>
      </form>
      {message && <p>{message}</p>}
    </main>
  );
}
