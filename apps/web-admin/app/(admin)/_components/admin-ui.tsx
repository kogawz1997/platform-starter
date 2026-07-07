import { ReactNode } from 'react';

type PageProps = { eyebrow?: string; title: string; description?: string; actions?: ReactNode; children: ReactNode };
type CardProps = { title?: string; description?: string; action?: ReactNode; children: ReactNode };
type MetricProps = { title: string; value: string; helper?: string };

type ButtonTone = 'primary' | 'secondary' | 'danger' | 'success';
type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger';

export function AdminPage({ eyebrow, title, description, actions, children }: PageProps) {
  return <main style={pageStyle}><header style={pageHeadStyle}><div>{eyebrow && <p style={eyebrowStyle}>{eyebrow}</p>}<h1 style={titleStyle}>{title}</h1>{description && <p style={descriptionStyle}>{description}</p>}</div>{actions && <div style={actionsStyle}>{actions}</div>}</header>{children}</main>;
}

export function AdminCard({ title, description, action, children }: CardProps) {
  return <div style={cardStyle}>{(title || description || action) && <div style={cardHeadStyle}><div>{title && <h2 style={cardTitleStyle}>{title}</h2>}{description && <p style={mutedStyle}>{description}</p>}</div>{action}</div>}<div style={stackStyle}>{children}</div></div>;
}

export function AdminMetric({ title, value, helper }: MetricProps) {
  return <div style={metricStyle}><p style={metricLabelStyle}>{title}</p><strong style={metricValueStyle}>{value}</strong>{helper && <span style={metricHelperStyle}>{helper}</span>}</div>;
}

export function AdminMetricGrid({ children }: { children: ReactNode }) { return <div style={metricGridStyle}>{children}</div>; }
export function AdminGrid({ children }: { children: ReactNode }) { return <div style={gridStyle}>{children}</div>; }
export function AdminStack({ children }: { children: ReactNode }) { return <div style={stackStyle}>{children}</div>; }
export function AdminRow({ children }: { children: ReactNode }) { return <div style={rowStyle}>{children}</div>; }
export function AdminToolbar({ children }: { children: ReactNode }) { return <div style={toolbarStyle}>{children}</div>; }
export function AdminNotice({ children }: { children: ReactNode }) { return <div style={noticeStyle}>{children}</div>; }
export function AdminEmpty({ children }: { children: ReactNode }) { return <div style={emptyStyle}>{children}</div>; }

export function AdminButton({ children, onClick, type = 'button', disabled, tone = 'primary' }: { children: ReactNode; onClick?: () => void; type?: 'button' | 'submit'; disabled?: boolean; tone?: ButtonTone }) {
  return <button type={type} onClick={onClick} disabled={disabled} style={{ ...buttonBaseStyle, ...buttonToneStyle[tone], opacity: disabled ? 0.62 : 1 }}>{children}</button>;
}

export function AdminLinkButton({ children, href, tone = 'secondary' }: { children: ReactNode; href: string; tone?: 'primary' | 'secondary' }) {
  return <a href={href} style={{ ...buttonBaseStyle, ...buttonToneStyle[tone], textDecoration: 'none' }}>{children}</a>;
}

export function AdminBadge({ children, tone = 'neutral' }: { children: ReactNode; tone?: BadgeTone }) {
  return <span style={{ ...badgeStyle, ...badgeToneStyle[tone] }}>{children}</span>;
}

export function formatMoney(value: string | number) {
  return `THB ${Number(value).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`;
}

const pageStyle = { width: '100%', maxWidth: 1180, margin: '0 auto', padding: '24px 20px 56px', color: '#f8fafc' } as const;
const pageHeadStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, marginBottom: 18, flexWrap: 'wrap' as const };
const eyebrowStyle = { margin: '0 0 8px', color: '#f5c542', fontSize: 12, fontWeight: 950, textTransform: 'uppercase' as const, letterSpacing: '.12em' } as const;
const titleStyle = { margin: '4px 0 10px', fontSize: 'clamp(30px, 6vw, 48px)', lineHeight: 1.02, letterSpacing: -0.9, fontWeight: 950 } as const;
const descriptionStyle = { margin: 0, maxWidth: 720, color: '#94a3b8', lineHeight: 1.55 } as const;
const actionsStyle = { display: 'flex', gap: 10, flexWrap: 'wrap' as const, justifyContent: 'flex-end' as const };
const cardStyle = { border: '1px solid rgba(148,163,184,.18)', borderRadius: 18, background: '#111a24', padding: 16, boxShadow: 'none' } as const;
const cardHeadStyle = { display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', marginBottom: 12, flexWrap: 'wrap' as const };
const cardTitleStyle = { margin: 0, fontSize: 22, lineHeight: 1.18, fontWeight: 900 } as const;
const mutedStyle = { margin: '5px 0 0', color: '#94a3b8', lineHeight: 1.55 } as const;
const metricGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 16 } as const;
const metricStyle = { border: '1px solid rgba(148,163,184,.18)', borderRadius: 16, background: '#111a24', padding: 16 } as const;
const metricLabelStyle = { margin: '0 0 8px', color: '#94a3b8', fontSize: 13 } as const;
const metricValueStyle = { display: 'block', fontSize: 'clamp(22px,4vw,30px)', lineHeight: 1.05 } as const;
const metricHelperStyle = { display: 'block', color: '#94a3b8', fontSize: 12, marginTop: 8 } as const;
const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14 } as const;
const stackStyle = { display: 'grid', gap: 10 } as const;
const rowStyle = { display: 'flex', justifyContent: 'space-between', gap: 14, border: '1px solid rgba(148,163,184,.18)', borderRadius: 14, padding: 12, background: 'rgba(148,163,184,.045)', flexWrap: 'wrap' as const };
const toolbarStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10, border: '1px solid rgba(148,163,184,.18)', borderRadius: 18, padding: 14, background: '#111a24', marginBottom: 16 } as const;
const noticeStyle = { border: '1px solid rgba(148,163,184,.18)', borderRadius: 14, padding: 12, background: 'rgba(148,163,184,.06)', color: '#94a3b8' } as const;
const emptyStyle = { border: '1px solid rgba(148,163,184,.18)', borderRadius: 14, padding: 14, background: 'rgba(148,163,184,.06)', color: '#94a3b8', textAlign: 'center' as const };
const buttonBaseStyle = { minHeight: 44, borderRadius: 12, border: '1px solid rgba(148,163,184,.18)', padding: '0 14px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, cursor: 'pointer' } as const;
const buttonToneStyle = { primary: { background: '#f5c542', borderColor: '#f5c542', color: '#111827' }, secondary: { background: '#172231', color: '#f8fafc' }, danger: { background: 'rgba(239,68,68,.14)', borderColor: 'rgba(239,68,68,.32)', color: '#fecaca' }, success: { background: 'rgba(34,197,94,.14)', borderColor: 'rgba(34,197,94,.32)', color: '#bbf7d0' } } as const;
const badgeStyle = { display: 'inline-flex', alignItems: 'center', minHeight: 26, borderRadius: 999, padding: '0 10px', fontSize: 12, fontWeight: 950, border: '1px solid rgba(148,163,184,.18)' } as const;
const badgeToneStyle = { neutral: { background: 'rgba(148,163,184,.08)', color: '#cbd5e1' }, success: { background: 'rgba(34,197,94,.12)', borderColor: 'rgba(34,197,94,.28)', color: '#bbf7d0' }, warning: { background: 'rgba(245,197,66,.13)', borderColor: 'rgba(245,197,66,.3)', color: '#fde68a' }, danger: { background: 'rgba(239,68,68,.13)', borderColor: 'rgba(239,68,68,.3)', color: '#fecaca' } } as const;
