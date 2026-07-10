import type { Viewport } from 'next';
import './design-tokens.css';
import './member-ui.css';
import './member-home-sections.css';
import './member-shell.css';
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
      <body>
        <SiteSettingsProvider>
          <MemberSessionProvider>
            <MemberChrome>{children}</MemberChrome>
          </MemberSessionProvider>
        </SiteSettingsProvider>
      </body>
    </html>
  );
}
