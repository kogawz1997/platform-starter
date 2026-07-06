'use client';

import { FormEvent, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export default function AdminLoginPage() {
  const [username, setUsername] = useState('');
  const [secret, setSecret] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [message, setMessage] = useState('');

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('กำลังตรวจสอบแอดมิน...');

    const res = await fetch(`${API_URL}/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, secret, twoFactorCode, deviceId: 'web-admin' }),
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setMessage(data?.message ?? 'เข้าสู่ระบบไม่สำเร็จ');
      return;
    }

    if (data.requiresTwoFactor) {
      setMessage(`ต้องยืนยัน 2FA: ${data.challengeId}`);
      return;
    }

    window.localStorage.setItem('admin_access_token', data.accessToken);
    window.localStorage.setItem('admin_refresh_token', data.refreshToken);
    setMessage('เข้าสู่ระบบแอดมินสำเร็จ');
  }

  return (
    <main style={{ maxWidth: 420, margin: '48px auto', padding: 24 }}>
      <h1>Admin Login</h1>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
        <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Admin username" />
        <input value={secret} onChange={(e) => setSecret(e.target.value)} placeholder="Secret" type="password" />
        <input value={twoFactorCode} onChange={(e) => setTwoFactorCode(e.target.value)} placeholder="2FA Code" />
        <button type="submit">Login</button>
      </form>
      {message && <p>{message}</p>}
    </main>
  );
}
