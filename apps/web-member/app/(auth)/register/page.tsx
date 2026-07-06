'use client';

import { FormEvent, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export default function MemberRegisterPage() {
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [secret, setSecret] = useState('');
  const [message, setMessage] = useState('');

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
        <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" />
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" />
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
        <input value={secret} onChange={(e) => setSecret(e.target.value)} placeholder="Secret" type="password" />
        <button type="submit">สมัครสมาชิก</button>
      </form>
      {message && <p>{message}</p>}
    </main>
  );
}
