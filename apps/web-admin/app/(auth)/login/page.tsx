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
    if (window.localStorage.getItem('admin_access_token')) window.location.replace('/dashboard');
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!username.trim() || !secret.trim()) { setStatus('error'); setMessage('กรอก username และรหัสผ่าน'); return; }
    setLoading(true); setStatus('info'); setMessage('กำลังเข้าสู่ระบบ...');
    const res = await fetch(`${API_URL}/admin/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: username.trim(), secret, twoFactorCode: twoFactorCode.trim() || undefined, deviceId: 'web-admin' }) });
    const data = await res.json().catch(() => null); setLoading(false);
    if (!res.ok) { setStatus('error'); setMessage(data?.message ?? 'เข้าสู่ระบบไม่สำเร็จ'); return; }
    if (data.requiresTwoFactor) { setStatus('info'); setMessage('กรอก 2FA แล้วกด Login อีกครั้ง'); return; }
    window.localStorage.setItem('admin_access_token', data.accessToken);
    window.localStorage.setItem('admin_refresh_token', data.refreshToken);
    setStatus('success'); setMessage('เข้าสู่ระบบสำเร็จ');
    window.location.replace('/dashboard');
  }

  return <main style={pageStyle}><form onSubmit={onSubmit} style={cardStyle}><div><p style={eyebrowStyle}>Admin Console</p><h1 style={titleStyle}>เข้าสู่ระบบ</h1></div><label style={labelStyle}>Username<input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" disabled={loading} style={inputStyle} /></label><label style={labelStyle}>Password<div style={passwordWrapStyle}><input value={secret} onChange={(e) => setSecret(e.target.value)} type={showSecret ? 'text' : 'password'} autoComplete="current-password" disabled={loading} style={{ ...inputStyle, paddingRight: 78 }} /><button type="button" onClick={() => setShowSecret((v) => !v)} style={ghostButtonStyle} disabled={loading}>{showSecret ? 'ซ่อน' : 'แสดง'}</button></div></label><label style={labelStyle}>2FA<input value={twoFactorCode} onChange={(e) => setTwoFactorCode(e.target.value)} inputMode="numeric" autoComplete="one-time-code" disabled={loading} style={inputStyle} /></label><button type="submit" disabled={loading} style={submitStyle}>{loading ? 'กำลังเข้าสู่ระบบ...' : 'Login'}</button>{message && <div style={alertStyle(status)}>{message}</div>}</form></main>;
}

const pageStyle = { minHeight: '100vh', padding: 24, display: 'grid', placeItems: 'center', background: '#080808', color: '#fff' } as const;
const cardStyle = { width: '100%', maxWidth: 440, display: 'grid', gap: 16, border: '1px solid rgba(255,255,255,0.12)', borderRadius: 24, padding: 24, background: '#111a24', boxShadow: '0 20px 80px rgba(0,0,0,0.32)' } as const;
const eyebrowStyle = { margin: 0, opacity: 0.68, fontSize: 13, fontWeight: 900 } as const;
const titleStyle = { margin: '6px 0 0', fontSize: 34, lineHeight: 1.05 } as const;
const labelStyle = { display: 'grid', gap: 8, fontWeight: 800 } as const;
const inputStyle = { width: '100%', padding: '13px 14px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.14)', background: '#172231', color: '#fff', boxSizing: 'border-box' } as const;
const passwordWrapStyle = { position: 'relative' } as const;
const ghostButtonStyle = { position: 'absolute', right: 8, top: 7, border: 0, borderRadius: 10, padding: '7px 10px', background: 'rgba(255,255,255,0.08)', color: '#fff', cursor: 'pointer' } as const;
const submitStyle = { padding: 14, borderRadius: 14, border: 0, background: '#f5c542', color: '#111', fontWeight: 900, cursor: 'pointer' } as const;
function alertStyle(type: 'idle' | 'success' | 'error' | 'info') { return { border: '1px solid rgba(255,255,255,0.12)', borderRadius: 14, padding: 12, background: type === 'error' ? 'rgba(255,70,70,0.12)' : type === 'success' ? 'rgba(80,255,140,0.12)' : 'rgba(255,255,255,0.06)', color: '#fff' } as const; }
