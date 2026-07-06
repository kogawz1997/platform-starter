'use client';

import { FormEvent, useEffect, useState } from 'react';
import { API_URL, PublicSiteSettings, boolSetting, defaultSettings, textSetting } from '../../site-settings';

export default function MemberRegisterPage() {
  const [settings, setSettings] = useState<PublicSiteSettings>(defaultSettings);
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [secret, setSecret] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch(`${API_URL}/public/site-settings`)
      .then((res) => res.json())
      .then((data) => setSettings({ ...defaultSettings, ...data }))
      .catch(() => setSettings(defaultSettings));
  }, []);

  const siteName = textSetting(settings, 'website', 'site_name', 'Platform Starter');
  const registrationEnabled =
    boolSetting(settings, 'features', 'registration_enabled', true) &&
    boolSetting(settings, 'website', 'registration_enabled', true);
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

    if (!registrationEnabled) {
      setMessage('ขณะนี้ปิดรับสมัครสมาชิก');
      return;
    }

    setMessage('กำลังสมัครสมาชิก...');

    const res = await fetch(`${API_URL}/member/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, phone, email, secret, deviceId: 'web-member' }),
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setMessage(data?.message ?? 'สมัครไม่สำเร็จ');
      return;
    }

    window.localStorage.setItem('member_access_token', data.accessToken);
    window.localStorage.setItem('member_refresh_token', data.refreshToken);
    setMessage('สมัครสมาชิกสำเร็จ');
  }

  return (
    <main style={{ maxWidth: 420, margin: '48px auto', padding: 24 }}>
      <h1>สมัครสมาชิก</h1>
      <p>{siteName}</p>
      {!registrationEnabled && <p>ขณะนี้ปิดรับสมัครสมาชิก</p>}
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
        <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" disabled={!registrationEnabled || maintenanceEnabled} />
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" disabled={!registrationEnabled || maintenanceEnabled} />
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" disabled={!registrationEnabled || maintenanceEnabled} />
        <input value={secret} onChange={(e) => setSecret(e.target.value)} placeholder="Secret" type="password" disabled={!registrationEnabled || maintenanceEnabled} />
        <button type="submit" disabled={!registrationEnabled || maintenanceEnabled}>สมัครสมาชิก</button>
      </form>
      {message && <p>{message}</p>}
    </main>
  );
}
