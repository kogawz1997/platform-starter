import type { Viewport } from 'next';
import './globals.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body style={{ margin: 0, minWidth: 0, fontFamily: 'system-ui, sans-serif' }}>
        <style>{`
          main[style*="place-items"] {
            width: 100% !important;
            min-height: 100dvh !important;
            padding: 16px !important;
            box-sizing: border-box !important;
            display: block !important;
            overflow-x: hidden !important;
          }
          main[style*="place-items"] > section {
            width: 100% !important;
            max-width: 520px !important;
            margin: 0 auto !important;
            display: grid !important;
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
          main[style*="place-items"] form,
          main[style*="place-items"] input,
          main[style*="place-items"] textarea,
          main[style*="place-items"] select,
          main[style*="place-items"] button {
            max-width: 100% !important;
            box-sizing: border-box !important;
          }
          main[style*="place-items"] h1 {
            font-size: clamp(34px, 11vw, 48px) !important;
            line-height: 1 !important;
          }
        `}</style>
        {children}
      </body>
    </html>
  );
}
