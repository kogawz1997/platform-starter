'use client';

import { FormEvent, useEffect, useState } from 'react';
import { PublicSiteSettings, defaultSettings, loadPublicSiteSettings, memberFeatureFlags, textSetting } from '../../site-settings';

export default function MemberSignInPage() {
  const [settings, setSettings] = useState<PublicSiteSettings>(defaultSettings);
  const [identifier, setIdentifier] = useState('');
  const [secret, setSecret] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error' | 'info'>('idle');
  const [loading, setLoading] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  useEffect(() => {
    if (window.localStorage.getItem('member_access_token') || window.localStorage.getItem('member_refresh_token')) { window.location.replace('/'); return; }
    loadPublicSiteSettings().then(setSettings).catch(() => setSettings(defaultSettings));
  }, []);

  const siteName = textSetting(settings, 'website', 'site_name', 'Member Center');
  const primaryColor = textSetting(settings, 'branding', 'primary_color', '#f5c542');
  const backgroundColor = textSetting(settings, 'branding', 'background_color', '#080808');
  const cardColor = textSetting(settings, 'branding', 'card_color', '#181818');
  const textColor = textSetting(settings, 'branding', 'text_color', '#ffffff');
  const logoUrl = textSetting(settings, 'branding', 'logo_url', '');
  const brandMark = textSetting(settings, 'branding', 'brand_mark', siteName.slice(0, 1).toUpperCase() || 'P');
  const flags = memberFeatureFlags(settings);
  const disabled = loading || !flags.login;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!flags.login) { setStatus('error'); setMessage('ขณะนี้ปิดการเข้าสู่ระบบชั่วคราว'); return; }
    if (!identifier.trim() || !secret.trim()) { setStatus('error'); setMessage('กรอกข้อมูลให้ครบ'); return; }
    setLoading(true); setStatus('info'); setMessage('กำลังเข้าสู่ระบบ...');
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'}/member/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ identifier: identifier.trim(), secret, deviceId: 'web-member' }) });
    const data = await res.json().catch(() => null); setLoading(false);
    if (!res.ok) { setStatus('error'); setMessage(data?.message ?? 'เข้าสู่ระบบไม่สำเร็จ'); return; }
    window.localStorage.setItem('member_access_token', data.accessToken);
    window.localStorage.setItem('member_refresh_token', data.refreshToken);
    setStatus('success'); setMessage('เข้าสู่ระบบสำเร็จ');
    window.location.replace('/');
  }

  return <main style={{ ...pageStyle, background: backgroundColor, color: textColor }}>
    <section style={shellStyle}>
      <form onSubmit={onSubmit} style={{ ...cardStyle, background: cardColor }}>
        <div style={logoOnlyRowStyle}><div style={{ ...logoStyle, background: primaryColor, color: '#111' }}>{logoUrl ? <img src={logoUrl} alt="" style={logoImageStyle} /> : brandMark}</div></div>
        {!flags.login && <div style={alertStyle('error')}>ขณะนี้ปิดการเข้าสู่ระบบชั่วคราว</div>}
        <label style={labelStyle}>Username / Phone / Email<input value={identifier} onChange={(e) => setIdentifier(e.target.value)} disabled={disabled} autoComplete="username" placeholder="กรอกชื่อผู้ใช้ เบอร์ หรืออีเมล" style={inputStyle} /></label>
        <label style={labelStyle}>Password<div style={passwordWrapStyle}><input value={secret} onChange={(e) => setSecret(e.target.value)} type={showSecret ? 'text' : 'password'} disabled={disabled} autoComplete="current-password" placeholder="กรอกรหัสผ่าน" style={{ ...inputStyle, paddingRight: 58 }} /><button type="button" onClick={() => setShowSecret((v) => !v)} style={eyeButtonStyle} disabled={disabled} aria-label={showSecret ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'} title={showSecret ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}>{showSecret ? '🙈' : '👁️'}</button></div></label>
        <button type="submit" disabled={disabled} style={{ ...submitStyle, background: primaryColor, color: '#111', opacity: disabled ? .58 : 1 }}>{loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}</button>
        {message && <div style={alertStyle(status)}>{message}</div>}
        {flags.registration && <p style={footerTextStyle}>ยังไม่มีบัญชี? <a href="/register" style={{ color: primaryColor, fontWeight: 900 }}>สมัครสมาชิก</a></p>}
      </form>
    </section>
  </main>;
}

const pageStyle = { minHeight: '100dvh', padding: 16, display: 'grid', placeItems: 'center' } as const;
const shellStyle = { width: '100%', maxWidth: 460, margin: '0 auto', display: 'grid', placeItems: 'center' } as const;
const cardStyle = { width: '100%', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 28, padding: 24, display: 'grid', gap: 16, boxShadow: '0 28px 90px rgba(0,0,0,0.34)', boxSizing: 'border-box' } as const;
const logoOnlyRowStyle = { display: 'flex', justifyContent: 'center', marginBottom: 4 } as const;
const logoStyle = { width: 52, height: 52, borderRadius: 18, display: 'grid', placeItems: 'center', fontWeight: 900, fontSize: 22, flex: '0 0 52px', overflow: 'hidden' as const };
const logoImageStyle = { width: '100%', height: '100%', objectFit: 'cover' as const, display: 'block' };
const labelStyle = { display: 'grid', gap: 8, fontWeight: 800 } as const;
const inputStyle = { width: '100%', padding: '13px 14px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.18)', background: 'rgba(255,255,255,0.08)', color: 'inherit', boxSizing: 'border-box', outline: 'none' } as const;
const passwordWrapStyle = { position: 'relative' } as const;
const eyeButtonStyle = { position: 'absolute', right: 8, top: 7, width: 38, height: 34, borderRadius: 12, border: '1px solid rgba(255,255,255,.14)', background: 'rgba(255,255,255,.10)', color: 'inherit', cursor: 'pointer', display: 'grid', placeItems: 'center', fontSize: 16 } as const;
const submitStyle = { border: 0, borderRadius: 14, padding: '14px 16px', fontWeight: 900, cursor: 'pointer' } as const;
const footerTextStyle = { textAlign: 'center' as const, margin: 0, color: 'rgba(255,255,255,.72)' };
function alertStyle(status: 'idle' | 'success' | 'error' | 'info') { return { border: '1px solid rgba(255,255,255,0.14)', borderRadius: 14, padding: 12, background: status === 'error' ? 'rgba(255,80,80,0.14)' : status === 'success' ? 'rgba(80,255,140,0.14)' : 'rgba(255,255,255,0.08)' } as const; }
