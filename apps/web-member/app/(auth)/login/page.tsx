'use client';

import { FormEvent, useEffect, useState } from 'react';
import { API_URL, PublicSiteSettings, defaultSettings, textSetting } from '../../site-settings';

export default function MemberSignInPage() {
  const [settings, setSettings] = useState<PublicSiteSettings>(defaultSettings);
  const [identifier, setIdentifier] = useState('');
  const [secret, setSecret] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error' | 'info'>('idle');
  const [loading, setLoading] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  useEffect(() => {
    if (window.localStorage.getItem('member_access_token')) { window.location.replace('/'); return; }
    fetch(`${API_URL}/public/site-settings`).then((res) => res.json()).then((data) => setSettings({ ...defaultSettings, ...data })).catch(() => setSettings(defaultSettings));
  }, []);

  const siteName = textSetting(settings, 'website', 'site_name', 'Member Center');
  const primaryColor = textSetting(settings, 'branding', 'primary_color', '#f5c542');
  const backgroundColor = textSetting(settings, 'branding', 'background_color', '#080808');
  const cardColor = textSetting(settings, 'branding', 'card_color', '#181818');
  const textColor = textSetting(settings, 'branding', 'text_color', '#ffffff');

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!identifier.trim() || !secret.trim()) { setStatus('error'); setMessage('กรอกข้อมูลให้ครบ'); return; }
    setLoading(true); setStatus('info'); setMessage('กำลังเข้าสู่ระบบ...');
    const res = await fetch(`${API_URL}/member/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ identifier: identifier.trim(), secret, deviceId: 'web-member' }) });
    const data = await res.json().catch(() => null); setLoading(false);
    if (!res.ok) { setStatus('error'); setMessage(data?.message ?? 'เข้าสู่ระบบไม่สำเร็จ'); return; }
    window.localStorage.setItem('member_access_token', data.accessToken);
    window.localStorage.setItem('member_refresh_token', data.refreshToken);
    setStatus('success'); setMessage('เข้าสู่ระบบสำเร็จ');
    window.location.replace('/');
  }

  return <main style={{ ...pageStyle, background: backgroundColor, color: textColor }}><form onSubmit={onSubmit} style={{ ...cardStyle, background: cardColor }}><div><p style={eyebrowStyle}>Member Center</p><h1 style={titleStyle}>{siteName}</h1></div><label style={labelStyle}>Username / Phone / Email<input value={identifier} onChange={(e) => setIdentifier(e.target.value)} disabled={loading} autoComplete="username" style={inputStyle} /></label><label style={labelStyle}>Password<div style={passwordWrapStyle}><input value={secret} onChange={(e) => setSecret(e.target.value)} type={showSecret ? 'text' : 'password'} disabled={loading} autoComplete="current-password" style={{ ...inputStyle, paddingRight: 78 }} /><button type="button" onClick={() => setShowSecret((v) => !v)} style={ghostButtonStyle} disabled={loading}>{showSecret ? 'ซ่อน' : 'แสดง'}</button></div></label><button type="submit" disabled={loading} style={{ ...submitStyle, background: primaryColor, color: '#111' }}>{loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}</button>{message && <div style={alertStyle(status)}>{message}</div>}<p style={{ textAlign: 'center', margin: 0, color: 'rgba(255,255,255,.72)' }}>ยังไม่มีบัญชี? <a href="/register" style={{ color: primaryColor, fontWeight: 900 }}>สมัครสมาชิก</a></p></form></main>;
}

const pageStyle = { minHeight: '100vh', padding: 24, display: 'grid', placeItems: 'center' } as const;
const cardStyle = { width: '100%', maxWidth: 440, border: '1px solid rgba(255,255,255,0.12)', borderRadius: 24, padding: 24, display: 'grid', gap: 16, boxShadow: '0 24px 80px rgba(0,0,0,0.28)' } as const;
const eyebrowStyle = { margin: 0, opacity: 0.68, fontSize: 13, fontWeight: 900 } as const;
const titleStyle = { margin: '6px 0 0', fontSize: 34, lineHeight: 1.05 } as const;
const labelStyle = { display: 'grid', gap: 8, fontWeight: 800 } as const;
const inputStyle = { width: '100%', padding: '13px 14px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.18)', background: 'rgba(255,255,255,0.08)', color: 'inherit', boxSizing: 'border-box' } as const;
const passwordWrapStyle = { position: 'relative' } as const;
const ghostButtonStyle = { position: 'absolute', right: 8, top: 7, padding: '7px 10px', borderRadius: 10, border: 0, cursor: 'pointer' } as const;
const submitStyle = { border: 0, borderRadius: 14, padding: '14px 16px', fontWeight: 900, cursor: 'pointer' } as const;
function alertStyle(status: 'idle' | 'success' | 'error' | 'info') { return { border: '1px solid rgba(255,255,255,0.14)', borderRadius: 14, padding: 12, background: status === 'error' ? 'rgba(255,80,80,0.14)' : status === 'success' ? 'rgba(80,255,140,0.14)' : 'rgba(255,255,255,0.08)' } as const; }
