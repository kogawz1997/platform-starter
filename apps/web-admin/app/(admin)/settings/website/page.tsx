'use client';

import { FormEvent, useEffect, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

type WebsiteSettings = {
  site_name: string;
  site_description: string;
  site_url: string;
  admin_url: string;
  default_language: string;
  timezone: string;
  currency: string;
  date_format: string;
  maintenance_mode: boolean;
  registration_enabled: boolean;
  login_enabled: boolean;
};

const defaults: WebsiteSettings = {
  site_name: '',
  site_description: '',
  site_url: '',
  admin_url: '',
  default_language: 'th',
  timezone: 'Asia/Bangkok',
  currency: 'THB',
  date_format: 'DD/MM/YYYY',
  maintenance_mode: false,
  registration_enabled: true,
  login_enabled: true,
};

export default function WebsiteSettingsPage() {
  const [form, setForm] = useState<WebsiteSettings>(defaults);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = window.localStorage.getItem('admin_access_token');
    if (!token) return;

    fetch(`${API_URL}/admin/settings/website`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setForm({ ...defaults, ...(data.settings ?? {}) }))
      .catch(() => setMessage('โหลด settings ไม่สำเร็จ'));
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('กำลังบันทึก...');

    const token = window.localStorage.getItem('admin_access_token');
    const res = await fetch(`${API_URL}/admin/settings/website`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(form),
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setMessage(data?.message ?? 'บันทึกไม่สำเร็จ');
      return;
    }

    setMessage(data.requiresDualApproval ? 'บันทึกแล้ว แต่รายการเสี่ยงควรเข้าคิว Dual Approval' : 'บันทึกสำเร็จ');
  }

  function update<K extends keyof WebsiteSettings>(key: K, value: WebsiteSettings[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  return (
    <main style={{ maxWidth: 1180, margin: '32px auto', padding: 24 }}>
      <a href="/settings">← Settings</a>
      <h1>Website Settings</h1>
      <p>ตั้งค่าข้อมูลเว็บไซต์หลัก แยกจากระบบเงินและ Provider balance</p>

      <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 360px', gap: 24, alignItems: 'start' }}>
        <form onSubmit={onSubmit} style={{ display: 'grid', gap: 14, border: '1px solid #ddd', borderRadius: 16, padding: 20 }}>
          <label>
            Site Name
            <input value={form.site_name} onChange={(e) => update('site_name', e.target.value)} style={inputStyle} />
          </label>
          <label>
            Site Description
            <textarea value={form.site_description} onChange={(e) => update('site_description', e.target.value)} style={inputStyle} />
          </label>
          <label>
            Domain
            <input value={form.site_url} onChange={(e) => update('site_url', e.target.value)} style={inputStyle} />
          </label>
          <label>
            Admin Domain
            <input value={form.admin_url} onChange={(e) => update('admin_url', e.target.value)} style={inputStyle} />
          </label>
          <label>
            Default Language
            <select value={form.default_language} onChange={(e) => update('default_language', e.target.value)} style={inputStyle}>
              <option value="th">Thai</option>
              <option value="en">English</option>
            </select>
          </label>
          <label>
            Timezone
            <input value={form.timezone} onChange={(e) => update('timezone', e.target.value)} style={inputStyle} />
          </label>
          <label>
            Currency
            <input value={form.currency} onChange={(e) => update('currency', e.target.value)} style={inputStyle} />
          </label>
          <label>
            Date Format
            <input value={form.date_format} onChange={(e) => update('date_format', e.target.value)} style={inputStyle} />
          </label>

          <label>
            <input type="checkbox" checked={form.maintenance_mode} onChange={(e) => update('maintenance_mode', e.target.checked)} /> Maintenance Mode
          </label>
          <label>
            <input type="checkbox" checked={form.registration_enabled} onChange={(e) => update('registration_enabled', e.target.checked)} /> Registration Enabled
          </label>
          <label>
            <input type="checkbox" checked={form.login_enabled} onChange={(e) => update('login_enabled', e.target.checked)} /> Login Enabled
          </label>

          <button type="submit" style={{ padding: 12, borderRadius: 10, cursor: 'pointer' }}>Save Changes</button>
          {message && <p>{message}</p>}
        </form>

        <aside style={{ border: '1px solid #ddd', borderRadius: 16, padding: 20, position: 'sticky', top: 24 }}>
          <h2>Preview</h2>
          <div style={{ border: '1px solid #eee', borderRadius: 14, padding: 16 }}>
            <strong>{form.site_name || 'Website Name'}</strong>
            <p>{form.site_description || 'Website description preview'}</p>
            <p>URL: {form.site_url || '-'}</p>
            <p>Language: {form.default_language}</p>
            <p>Timezone: {form.timezone}</p>
            <p>Currency: {form.currency}</p>
            <hr />
            <p>Register: {form.registration_enabled ? 'เปิด' : 'ปิด'}</p>
            <p>Login: {form.login_enabled ? 'เปิด' : 'ปิด'}</p>
            <p>Maintenance: {form.maintenance_mode ? 'ON' : 'OFF'}</p>
          </div>
        </aside>
      </section>
    </main>
  );
}

const inputStyle = {
  display: 'block',
  width: '100%',
  padding: 10,
  marginTop: 6,
  borderRadius: 10,
  border: '1px solid #ccc',
} as const;
