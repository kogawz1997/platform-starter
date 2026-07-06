'use client';

import { FormEvent, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export default function MemberSignInPage() {
  const [identifier, setIdentifier] = useState('');
  const [secret, setSecret] = useState('');
  const [message, setMessage] = useState('');

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
        <input value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="Username / Phone / Email" />
        <input value={secret} onChange={(e) => setSecret(e.target.value)} placeholder="Secret" type="password" />
        <button type="submit">Sign In</button>
      </form>
      {message && <p>{message}</p>}
    </main>
  );
}
