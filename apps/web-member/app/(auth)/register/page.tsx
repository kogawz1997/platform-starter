'use client';

import { FormEvent, useEffect, useState } from 'react';
import { API_URL, PublicSiteSettings, boolSetting, defaultSettings, textSetting } from '../../site-settings';

const REFERRAL_CODE_KEY = 'member_pending_referral_code';

export default function MemberRegisterPage() {
  const [settings, setSettings] = useState<PublicSiteSettings>(defaultSettings);
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [secret, setSecret] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error' | 'info'>('idle');
  const [loading, setLoading] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  useEffect(() => {
    if (window.localStorage.getItem('member_access_token') || window.localStorage.getItem('member_refresh_token')) { window.location.replace('/'); return; }
    const ref = new URLSearchParams(window.location.search).get('ref') ?? window.localStorage.getItem(REFERRAL_CODE_KEY) ?? '';
    const cleanRef = normalizeReferralCode(ref);
    if (cleanRef) { setReferralCode(cleanRef); window.localStorage.setItem(REFERRAL_CODE_KEY, cleanRef); }
    fetch(`${API_URL}/public/site-settings`).then((res) => res.json()).then((data) => setSettings({ ...defaultSettings, ...data })).catch(() => setSettings(defaultSettings));
  }, []);

  const siteName = textSetting(settings, 'website', 'site_name', 'Platform Starter');
  const primaryColor = textSetting(settings, 'branding', 'primary_color', '#f5c542');
  const backgroundColor = textSetting(settings, 'branding', 'background_color', '#080808');
  const cardColor = textSetting(settings, 'branding', 'card_color', '#181818');
  const textColor = textSetting(settings, 'branding', 'text_color', '#ffffff');
  const registrationEnabled = boolSetting(settings, 'features', 'registration_enabled', true) && boolSetting(settings, 'website', 'registration_enabled', true);
  const maintenanceEnabled = boolSetting(settings, 'maintenance', 'enabled', false) || boolSetting(settings, 'maintenance', 'member_enabled', false) || boolSetting(settings, 'website', 'maintenance_mode', false);
  const disabled = !registrationEnabled || maintenanceEnabled || loading;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (maintenanceEnabled) { setStatus('error'); setMessage('ระบบกำลังปรับปรุง กรุณาลองใหม่ภายหลัง'); return; }
    if (!registrationEnabled) { setStatus('error'); setMessage('ขณะนี้ปิดรับสมัครสมาชิก'); return; }
    if (!username.trim() || !phone.trim() || !secret.trim()) { setStatus('error'); setMessage('กรุณากรอกข้อมูลให้ครบ'); return; }
    setLoading(true); setStatus('info'); setMessage('กำลังสมัครสมาชิก...');
    const cleanRef = normalizeReferralCode(referralCode);
    const res = await fetch(`${API_URL}/member/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: username.trim(), phone: phone.trim(), email: email.trim() || undefined, secret, deviceId: 'web-member' }) });
    const data = await res.json().catch(() => null); setLoading(false);
    if (!res.ok) { setStatus('error'); setMessage(data?.message ?? 'สมัครสมาชิกไม่สำเร็จ กรุณาตรวจสอบข้อมูล'); return; }
    window.localStorage.setItem('member_access_token', data.accessToken);
    window.localStorage.setItem('member_refresh_token', data.refreshToken);
    if (cleanRef) await linkReferralAfterRegister(cleanRef, data.accessToken);
    setStatus('success'); setMessage(cleanRef ? 'สมัครสมาชิกสำเร็จและบันทึกรหัสแนะนำแล้ว กำลังพาไปหน้าแรก...' : 'สมัครสมาชิกสำเร็จ กำลังพาไปหน้าแรก...');
    window.location.replace('/');
  }

  return <main style={{ ...pageStyle, background: backgroundColor, color: textColor }}>
    <section style={shellStyle}>
      <form onSubmit={onSubmit} style={{ ...cardStyle, background: cardColor }}>
        <div style={logoOnlyRowStyle}><div style={{ ...logoStyle, background: primaryColor, color: '#111' }}>{siteName.slice(0, 1).toUpperCase()}</div></div>
        {(maintenanceEnabled || !registrationEnabled) && <div style={alertStyle('error')}>{maintenanceEnabled ? 'ระบบกำลังปรับปรุง' : 'ขณะนี้ปิดรับสมัครสมาชิก'}</div>}
        <label style={labelStyle}>Username<input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="ตั้งชื่อผู้ใช้" disabled={disabled} autoComplete="username" style={inputStyle} /></label>
        <label style={labelStyle}>Phone<input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="เบอร์โทรศัพท์" disabled={disabled} autoComplete="tel" inputMode="tel" style={inputStyle} /></label>
        <label style={labelStyle}>Email <span style={{ opacity: 0.6, fontWeight: 500 }}>(ไม่บังคับ)</span><input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="อีเมล" disabled={disabled} autoComplete="email" type="email" style={inputStyle} /></label>
        <label style={labelStyle}>Referral code <span style={{ opacity: 0.6, fontWeight: 500 }}>(ไม่บังคับ)</span><input value={referralCode} onChange={(e) => { const value = normalizeReferralCode(e.target.value); setReferralCode(value); if (value) window.localStorage.setItem(REFERRAL_CODE_KEY, value); }} placeholder="รหัสแนะนำ" disabled={disabled} autoComplete="off" style={inputStyle} /></label>
        <label style={labelStyle}>Password<div style={passwordWrapStyle}><input value={secret} onChange={(e) => setSecret(e.target.value)} placeholder="ตั้ง Password" type={showSecret ? 'text' : 'password'} disabled={disabled} autoComplete="new-password" style={{ ...inputStyle, paddingRight: 58 }} /><button type="button" onClick={() => setShowSecret((v) => !v)} style={eyeButtonStyle} disabled={disabled} aria-label={showSecret ? 'Hide password' : 'Show password'} title={showSecret ? 'Hide password' : 'Show password'}>{showSecret ? '🙈' : '👁️'}</button></div></label>
        <button type="submit" disabled={disabled} style={{ ...submitStyle, background: primaryColor, color: '#111' }}>{loading ? 'กำลังสมัคร...' : 'สมัครสมาชิก'}</button>
        {message && <div style={alertStyle(status)}>{message}</div>}
        <p style={footerTextStyle}>มีบัญชีแล้ว? <a href="/login" style={{ color: primaryColor, fontWeight: 900 }}>เข้าสู่ระบบ</a></p>
      </form>
    </section>
  </main>;
}

async function linkReferralAfterRegister(referralCode: string, token?: string) {
  const accessToken = token || window.localStorage.getItem('member_access_token');
  if (!accessToken) return;
  const res = await fetch(`${API_URL}/member/affiliate/link`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` }, body: JSON.stringify({ referralCode }) });
  if (res.ok) window.localStorage.removeItem(REFERRAL_CODE_KEY);
}
function normalizeReferralCode(value: string) { return String(value ?? '').trim().toUpperCase().replace(/[^A-Z0-9_-]+/g, '').slice(0, 24); }
const pageStyle = { minHeight: '100dvh', padding: 16, display: 'grid', placeItems: 'center' } as const;
const shellStyle = { width: '100%', maxWidth: 460, margin: '0 auto', display: 'grid', placeItems: 'center' } as const;
const cardStyle = { width: '100%', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 28, padding: 24, display: 'grid', gap: 14, boxShadow: '0 28px 90px rgba(0,0,0,0.34)', boxSizing: 'border-box' } as const;
const logoOnlyRowStyle = { display: 'flex', justifyContent: 'center', marginBottom: 4 } as const;
const logoStyle = { width: 52, height: 52, borderRadius: 18, display: 'grid', placeItems: 'center', fontWeight: 900, fontSize: 22, flex: '0 0 52px' } as const;
const labelStyle = { display: 'grid', gap: 8, fontWeight: 800 } as const;
const inputStyle = { width: '100%', padding: '13px 14px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.18)', background: 'rgba(255,255,255,0.08)', color: 'inherit', boxSizing: 'border-box', outline: 'none' } as const;
const passwordWrapStyle = { position: 'relative' } as const;
const eyeButtonStyle = { position: 'absolute', right: 8, top: 7, width: 38, height: 34, borderRadius: 12, border: '1px solid rgba(255,255,255,.14)', background: 'rgba(255,255,255,.10)', color: 'inherit', cursor: 'pointer', display: 'grid', placeItems: 'center', fontSize: 16 } as const;
const submitStyle = { border: 0, borderRadius: 14, padding: '14px 16px', fontWeight: 900, cursor: 'pointer' } as const;
const footerTextStyle = { textAlign: 'center' as const, margin: 0, color: 'rgba(255,255,255,.72)' };
function alertStyle(status: 'idle' | 'success' | 'error' | 'info') { return { border: '1px solid rgba(255,255,255,0.14)', borderRadius: 14, padding: 12, background: status === 'error' ? 'rgba(255,80,80,0.14)' : status === 'success' ? 'rgba(80,255,140,0.14)' : 'rgba(255,255,255,0.08)' } as const; }
