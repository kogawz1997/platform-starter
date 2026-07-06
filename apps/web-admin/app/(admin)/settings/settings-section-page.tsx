'use client';

import { FormEvent, useEffect, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

type FieldType = 'text' | 'textarea' | 'checkbox' | 'color';

type FieldConfig = {
  key: string;
  label: string;
  type?: FieldType;
  placeholder?: string;
};

type Props = {
  group: string;
  title: string;
  description: string;
  fields: FieldConfig[];
  preview?: 'branding' | 'theme' | 'maintenance' | 'default';
};

export default function SettingsSectionPage({ group, title, description, fields, preview = 'default' }: Props) {
  const [form, setForm] = useState<Record<string, any>>({});
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = window.localStorage.getItem('admin_access_token');
    if (!token) return;

    fetch(`${API_URL}/admin/settings/${group}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setForm(data.settings ?? {}))
      .catch(() => setMessage('โหลด settings ไม่สำเร็จ'));
  }, [group]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('กำลังบันทึก...');

    const token = window.localStorage.getItem('admin_access_token');
    const res = await fetch(`${API_URL}/admin/settings/${group}`, {
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

  function update(key: string, value: any) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  return (
    <main style={{ maxWidth: 1180, margin: '32px auto', padding: 24 }}>
      <a href="/settings">← Settings</a>
      <h1>{title}</h1>
      <p>{description}</p>

      <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 360px', gap: 24, alignItems: 'start' }}>
        <form onSubmit={onSubmit} style={{ display: 'grid', gap: 14, border: '1px solid #ddd', borderRadius: 16, padding: 20 }}>
          {fields.map((field) => {
            const type = field.type ?? 'text';
            const value = form[field.key];

            if (type === 'checkbox') {
              return (
                <label key={field.key}>
                  <input type="checkbox" checked={Boolean(value)} onChange={(e) => update(field.key, e.target.checked)} /> {field.label}
                </label>
              );
            }

            if (type === 'textarea') {
              return (
                <label key={field.key}>
                  {field.label}
                  <textarea value={value ?? ''} placeholder={field.placeholder} onChange={(e) => update(field.key, e.target.value)} style={inputStyle} />
                </label>
              );
            }

            return (
              <label key={field.key}>
                {field.label}
                <input type={type} value={value ?? ''} placeholder={field.placeholder} onChange={(e) => update(field.key, e.target.value)} style={inputStyle} />
              </label>
            );
          })}

          <button type="submit" style={{ padding: 12, borderRadius: 10, cursor: 'pointer' }}>Save Changes</button>
          {message && <p>{message}</p>}
        </form>

        <aside style={{ border: '1px solid #ddd', borderRadius: 16, padding: 20, position: 'sticky', top: 24 }}>
          <h2>Preview</h2>
          <Preview type={preview} form={form} title={title} />
        </aside>
      </section>
    </main>
  );
}

function Preview({ type, form, title }: { type: string; form: Record<string, any>; title: string }) {
  if (type === 'branding') {
    const primary = form.primary_color ?? '#f5c542';
    const bg = form.background_color ?? '#080808';
    const card = form.card_color ?? '#181818';
    const text = form.text_color ?? '#ffffff';

    return (
      <div style={{ background: bg, color: text, borderRadius: 16, padding: 16 }}>
        <strong>{form.logo_url ? 'Logo loaded' : 'Logo'}</strong>
        <div style={{ background: card, borderRadius: 14, padding: 14, marginTop: 12 }}>
          <p>Balance Card</p>
          <button style={{ background: primary, border: 0, borderRadius: 10, padding: '8px 14px' }}>ฝากเงิน</button>{' '}
          <button style={{ borderRadius: 10, padding: '8px 14px' }}>ถอนเงิน</button>
        </div>
      </div>
    );
  }

  if (type === 'maintenance') {
    return (
      <div style={{ border: '1px solid #eee', borderRadius: 14, padding: 16 }}>
        <p>Maintenance: {form.enabled ? 'ON' : 'OFF'}</p>
        <p>Message: {form.message ?? 'ระบบกำลังปรับปรุง'}</p>
        <p>Deposit: {form.deposit_enabled ? 'ปิดปรับปรุง' : 'เปิดใช้งาน'}</p>
        <p>Withdraw: {form.withdraw_enabled ? 'ปิดปรับปรุง' : 'เปิดใช้งาน'}</p>
      </div>
    );
  }

  return (
    <div style={{ border: '1px solid #eee', borderRadius: 14, padding: 16 }}>
      <strong>{title}</strong>
      {Object.entries(form).slice(0, 8).map(([key, value]) => (
        <p key={key}>{key}: {String(value)}</p>
      ))}
    </div>
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
