import type { Viewport } from 'next';
import './design-tokens.css';
import './member-ui.css';
import './member-home-sections.css';
import './globals.css';
import MemberChrome from './member-chrome';
import { MemberSessionProvider } from './member-session-provider';
import { SiteSettingsProvider } from './site-settings-provider';

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
          .member-drawer-nav a.active { background: rgba(245,197,66,.14) !important; color: #fff !important; border-color: rgba(245,197,66,.42) !important; }
          .member-drawer-copy { min-width: 0 !important; height: auto !important; border-radius: 0 !important; background: transparent !important; color: inherit !important; display: grid !important; place-items: initial !important; gap: 3px !important; font-size: inherit !important; }
          .member-drawer-copy small { color: var(--muted); font-size: 12px; font-weight: 800; line-height: 1.35; }
          .member-drawer-nav a em { min-width: 24px; height: 24px; border-radius: 999px; background: rgba(255, 80, 80, .95); color: #fff; display: grid; place-items: center; font-size: 12px; font-style: normal; font-weight: 950; flex: 0 0 auto; }
          .member-home-shell { padding-top: 14px !important; }
          @media (max-width: 760px) {
            .member-shell { padding-bottom: calc(128px + env(safe-area-inset-bottom)) !important; }
            .member-bottom-nav { bottom: max(12px, env(safe-area-inset-bottom)) !important; min-height: 70px !important; padding: 8px !important; border-radius: 28px !important; background: linear-gradient(180deg, rgba(24,24,24,.96), rgba(12,12,12,.94)) !important; }
            .member-bottom-nav a { min-height: 54px; transition: transform .15s ease, background .15s ease, color .15s ease; }
            .member-bottom-nav a:active { transform: scale(.97); }
            .member-bottom-nav a.active { box-shadow: inset 0 -2px 0 rgba(0,0,0,.18); }
          }
          @media (min-width: 761px) {
            .member-shell { padding-bottom: 28px !important; }
          }
        `}</style>
        <SiteSettingsProvider>
          <MemberSessionProvider>
            <MemberChrome>{children}</MemberChrome>
          </MemberSessionProvider>
        </SiteSettingsProvider>
      </body>
    </html>
  );
}
