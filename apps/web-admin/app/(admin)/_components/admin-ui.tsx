import { ReactNode } from 'react';

type PageProps = { eyebrow?: string; title: string; description?: string; actions?: ReactNode; children: ReactNode };
type CardProps = { title?: string; description?: string; action?: ReactNode; children: ReactNode };
type MetricProps = { title: string; value: string; helper?: string };
type EmptyProps = { children: ReactNode };

export function AdminPage({ eyebrow, title, description, actions, children }: PageProps) {
  return <main className="adm-page"><header className="adm-page-head"><div>{eyebrow && <p className="adm-eyebrow">{eyebrow}</p>}<h1>{title}</h1>{description && <p className="adm-description">{description}</p>}</div>{actions && <div className="adm-page-actions">{actions}</div>}</header>{children}</main>;
}

export function AdminCard({ title, description, action, children }: CardProps) {
  return <section className="adm-card">{(title || description || action) && <div className="adm-card-head"><div>{title && <h2>{title}</h2>}{description && <p>{description}</p>}</div>{action}</div>}<div className="adm-card-body">{children}</div></section>;
}

export function AdminMetric({ title, value, helper }: MetricProps) {
  return <section className="adm-metric"><p>{title}</p><strong>{value}</strong>{helper && <span>{helper}</span>}</section>;
}

export function AdminMetricGrid({ children }: { children: ReactNode }) { return <section className="adm-metric-grid">{children}</section>; }
export function AdminGrid({ children }: { children: ReactNode }) { return <section className="adm-grid">{children}</section>; }
export function AdminStack({ children }: { children: ReactNode }) { return <div className="adm-stack">{children}</div>; }
export function AdminRow({ children }: { children: ReactNode }) { return <div className="adm-row">{children}</div>; }
export function AdminToolbar({ children }: { children: ReactNode }) { return <section className="adm-toolbar">{children}</section>; }
export function AdminNotice({ children }: { children: ReactNode }) { return <div className="adm-notice">{children}</div>; }
export function AdminEmpty({ children }: EmptyProps) { return <div className="adm-empty">{children}</div>; }

export function AdminButton({ children, onClick, type = 'button', disabled, tone = 'primary' }: { children: ReactNode; onClick?: () => void; type?: 'button' | 'submit'; disabled?: boolean; tone?: 'primary' | 'secondary' | 'danger' | 'success' }) {
  return <button type={type} onClick={onClick} disabled={disabled} className={`adm-button ${tone}`}>{children}</button>;
}

export function AdminLinkButton({ children, href, tone = 'secondary' }: { children: ReactNode; href: string; tone?: 'primary' | 'secondary' }) {
  return <a href={href} className={`adm-link-button ${tone}`}>{children}</a>;
}

export function AdminBadge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'success' | 'warning' | 'danger' }) {
  return <span className={`adm-badge ${tone}`}>{children}</span>;
}

export function formatMoney(value: string | number) {
  return `THB ${Number(value).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`;
}
