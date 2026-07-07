import type { Viewport } from 'next';
import './globals.css';
import MemberChrome from './member-chrome';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body style={{ margin: 0, minWidth: 0, fontFamily: 'system-ui, sans-serif' }}>
        <style>{`
          .global-member-topbar { margin: 0 !important; padding-left: 14px !important; padding-right: 14px !important; }
          .member-drawer-nav a.active { background: var(--brand) !important; color: #111 !important; border-color: var(--brand) !important; }
          .member-home-shell { padding-top: 14px !important; }
          main[style*="place-items"] { width: 100% !important; min-height: 100dvh !important; padding: 16px !important; box-sizing: border-box !important; display: grid !important; place-items: center !important; overflow-x: hidden !important; }
          main[style*="place-items"] > section { width: 100% !important; max-width: 520px !important; margin: 0 auto !important; display: grid !important; grid-template-columns: 1fr !important; gap: 16px !important; }
          main[style*="place-items"] form { max-width: 100% !important; box-sizing: border-box !important; }
          main[style*="place-items"] h1 { font-size: clamp(28px, 8vw, 38px) !important; line-height: 1 !important; }
        `}</style>
        <MemberChrome>{children}</MemberChrome>
      </body>
    </html>
  );
}
