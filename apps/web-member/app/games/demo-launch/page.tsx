'use client';

import { useSearchParams } from 'next/navigation';

export default function DemoLaunchPage() {
  const params = useSearchParams();
  const game = params.get('game') ?? 'demo-game';
  const session = params.get('session') ?? '-';

  return <main style={pageStyle}>
    <section style={cardStyle}>
      <span style={eyebrowStyle}>Demo Launch</span>
      <h1 style={titleStyle}>เปิดเกมสำเร็จ</h1>
      <p style={mutedStyle}>นี่คือหน้า demo launch สำหรับทดสอบ flow เท่านั้น ยังไม่มีการตัดเงินจริงหรือเรียก provider จริง</p>
      <div style={screenStyle}>
        <strong>{game}</strong>
        <span>Session</span>
        <code style={codeStyle}>{session}</code>
      </div>
      <a href="/games" style={buttonStyle}>กลับไปหน้าเกม</a>
    </section>
  </main>;
}

const pageStyle = { minHeight: '100dvh', background: 'radial-gradient(circle at top,#1f2937,#050505 58%)', color: '#fff', display: 'grid', placeItems: 'center', padding: 18 } as const;
const cardStyle = { width: '100%', maxWidth: 520, border: '1px solid rgba(245,197,66,.24)', borderRadius: 28, padding: 22, background: 'rgba(15,23,42,.86)', boxShadow: '0 28px 80px rgba(0,0,0,.45)', display: 'grid', gap: 16 } as const;
const eyebrowStyle = { color: '#facc15', fontWeight: 950, letterSpacing: '.1em', textTransform: 'uppercase' as const, fontSize: 12 };
const titleStyle = { margin: 0, fontSize: 36, lineHeight: 1.05 } as const;
const mutedStyle = { margin: 0, color: '#cbd5e1', lineHeight: 1.6 } as const;
const screenStyle = { minHeight: 220, borderRadius: 22, border: '1px solid rgba(148,163,184,.2)', background: 'linear-gradient(135deg,rgba(245,197,66,.16),rgba(59,130,246,.12))', display: 'grid', placeItems: 'center', textAlign: 'center' as const, gap: 8, padding: 18 };
const codeStyle = { maxWidth: '100%', overflowWrap: 'anywhere' as const, color: '#fef3c7', background: 'rgba(0,0,0,.24)', borderRadius: 12, padding: '8px 10px' };
const buttonStyle = { minHeight: 48, borderRadius: 16, display: 'grid', placeItems: 'center', background: '#f5c542', color: '#111827', fontWeight: 950, textDecoration: 'none' } as const;
