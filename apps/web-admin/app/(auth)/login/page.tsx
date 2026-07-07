'use client';

import { FormEvent, useEffect, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export default function AdminLoginPage() {
  const [username, setUsername] = useState('');
  const [secret, setSecret] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error' | 'info'>('idle');
  const [loading, setLoading] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  useEffect(() => {
    if (window.localStorage.getItem('admin_access_token')) {
      const next = new URLSearchParams(window.location.search).get('next') || '/dashboard';
      window.location.replace(next.startsWith('/') ? next : '/dashboard');
    }
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!username.trim() || !secret.trim()) {
      setStatus('error');
      setMessage('กรุณากรอก username และรหัสผ่านแอดมิน');
      return;
    }

    setLoading(true);
    setStatus('info');
    setMessage('กำลังตรวจสอบแอดมิน...');

    const res = await fetch(`${API_URL}/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username.trim(), secret, twoFactorCode: twoFactorCode.trim() || undefined, deviceId: 'web-admin' }),
    });

    const data = await res.json().catch(() => null);
    setLoading(false);

    if (!res.ok) {
      setStatus('error');
      setMessage(data?.message ?? 'เข้าสู่ระบบแอดมินไม่สำเร็จ');
      return;
    }

    if (data.requiresTwoFactor) {
      setStatus('info');
      setMessage('ต้องกรอก 2FA Code แล้วกด Login อีกครั้ง');
      return;
    }

    window.localStorage.setItem('admin_access_token', data.accessToken);
    window.localStorage.setItem('admin_refresh_token', data.refreshToken);
    setStatus('success');
    setMessage('เข้าสู่ระบบแอดมินสำเร็จ กำลังพาไปหน้า Dashboard...');
    const next = new URLSearchParams(window.location.search).get('next') || '/dashboard';
    window.location.href = next.startsWith('/') ? next : '/dashboard';
  }

  return (
    <main style={pageStyle}>
      <section style={shellStyle}>
        <div style={heroStyle}>
          <div style={logoStyle}>A</div>
          <p style={{ opacity: 0.72, margin: 0 }}>Admin Console</p>
          <h1 style={{ fontSize: 38, lineHeight: 1.1, margin: '12px 0' }}>จัดการระบบหลังบ้าน</h1>
          <p style={{ opacity: 0.78, maxWidth: 460 }}>เข้าสู่ระบบเพื่อจัดการ Finance, Wallet, Settings และรายการที่ต้องตรวจสอบ</p>
          <div style={featureStyle}>
            <span>Finance</span>
            <span>Wallet</span>
            <span>Settings</span>
            <span>Audit</span>
          </div>
        </div>

        <form onSubmit={onSubmit} style={cardStyle}>
          <div>
            <p style={{ margin: 0, opacity: 0.7 }}>สำหรับผู้ดูแลระบบ</p>
            <h2 style={{ margin: '6px 0 0' }}>Admin Login</h2>
          </div>

          <label style={labelStyle}>
            Admin username
            <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="admin username" autoComplete="username" disabled={loading} style={inputStyle} />
          </label>

          <label style={labelStyle}>
            รหัสผ่าน
            <div style={passwordWrapStyle}>
              <input value={secret} onChange={(e) => setSecret(e.target.value)} placeholder="admin password" type={showSecret ? 'text' : 'password'} autoComplete="current-password" disabled={loading} style={{ ...inputStyle, paddingRight: 84 }} />
              <button type="button" onClick={() => setShowSecret((v) => !v)} style={ghostButtonStyle} disabled={loading}>{showSecret ? 'ซ่อน' : 'แสดง'}</button>
            </div>
          </label>

          <label style={labelStyle}>
            2FA Code <span style={{ opacity: 0.6, fontWeight: 400 }}>(ถ้ามี)</span>
            <input value={twoFactorCode} onChange={(e) => setTwoFactorCode(e.target.value)} placeholder="เช่น 123456" inputMode="numeric" autoComplete="one-time-code" disabled={loading} style={inputStyle} />
          </label>

          <button type="submit" disabled={loading} style={submitStyle}>{loading ? 'กำลังเข้าสู่ระบบ...' : 'Login'}</button>

          {message && <div style={alertStyle(status)}>{message}</div>}
        </form>
      </section>
    </main>
  );
}

const pageStyle = { minHeight: '100vh', padding: 24, display: 'grid', placeItems: 'center', background: '#080808', color: '#fff' } as const;
const shellStyle = { width: '100%', maxWidth: 1040, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, alignItems: 'center' } as const;
const heroStyle = { padding: 24 } as const;
const logoStyle = { width: 58, height: 58, borderRadius: 18, display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 24, background: '#f5c542', color: '#111' } as const;
const featureStyle = { display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 20 } as const;
const cardStyle = { display: 'grid', gap: 16, border: '1px solid rgba(255,255,255,0.12)', borderRadius: 24, padding: 22, background: '#181818', boxShadow: '0 20px 80px rgba(0,0,0,0.32)' } as const;
const labelStyle = { display: 'grid', gap: 8, fontWeight: 700 } as const;
const inputStyle = { width: '100%', padding: 13, borderRadius: 14, border: '1px solid rgba(255,255,255,0.14)', background: '#242424', color: '#fff', boxSizing: 'border-box' } as const;
const passwordWrapStyle = { position: 'relative' } as const;
const ghostButtonStyle = { position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', border: 0, borderRadius: 10, padding: '7px 10px', background: 'rgba(255,255,255,0.08)', color: '#fff', cursor: 'pointer' } as const;
const submitStyle = { padding: 14, borderRadius: 14, border: 0, background: '#f5c542', color: '#111', fontWeight: 900, cursor: 'pointer' } as const;
function alertStyle(type: 'idle' | 'success' | 'error' | 'info') { return { border: '1px solid rgba(255,255,255,0.12)', borderRadius: 14, padding: 12, background: type === 'error' ? 'rgba(255,70,70,0.12)' : type === 'success' ? 'rgba(80,255,140,0.12)' : 'rgba(255,255,255,0.06)', color: '#fff' } as const; }
