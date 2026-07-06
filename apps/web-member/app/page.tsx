import { boolSetting, loadPublicSiteSettings, textSetting } from './site-settings';
import WalletCard from './wallet-card';

export default async function Page() {
  const settings = await loadPublicSiteSettings();
  const siteName = textSetting(settings, 'website', 'site_name', 'Platform Starter');
  const description = textSetting(settings, 'website', 'site_description', 'Member platform starter');
  const primaryColor = textSetting(settings, 'branding', 'primary_color', '#f5c542');
  const backgroundColor = textSetting(settings, 'branding', 'background_color', '#080808');
  const cardColor = textSetting(settings, 'branding', 'card_color', '#181818');
  const textColor = textSetting(settings, 'branding', 'text_color', '#ffffff');
  const maintenanceEnabled =
    boolSetting(settings, 'maintenance', 'enabled', false) ||
    boolSetting(settings, 'maintenance', 'member_enabled', false) ||
    boolSetting(settings, 'website', 'maintenance_mode', false);
  const maintenanceMessage = textSetting(settings, 'maintenance', 'message', 'ระบบกำลังปรับปรุง');

  const showBalanceHeader = boolSetting(settings, 'theme', 'show_balance_header', true);
  const showButtons = boolSetting(settings, 'theme', 'show_deposit_withdraw_buttons', true);
  const showPromotion = boolSetting(settings, 'theme', 'show_promotion_banner', true);
  const showCategories = boolSetting(settings, 'theme', 'show_game_categories', true);
  const showProviders = boolSetting(settings, 'theme', 'show_popular_providers', true);
  const showRecommended = boolSetting(settings, 'theme', 'show_recommended_games', true);

  if (maintenanceEnabled) {
    return (
      <main style={{ ...pageStyle, background: backgroundColor, color: textColor }}>
        <section style={{ ...containerStyle, paddingTop: 40 }}>
          <div style={{ ...softCardStyle, background: cardColor }}>
            <p style={eyebrowStyle}>Maintenance</p>
            <h1 style={titleStyle}>{siteName}</h1>
            <p style={mutedStyle}>{maintenanceMessage}</p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main style={{ ...pageStyle, background: backgroundColor, color: textColor }}>
      <section style={containerStyle}>
        <header style={headerStyle}>
          <div>
            <div style={{ ...brandMarkStyle, background: primaryColor, color: '#111' }}>{siteName.slice(0, 1).toUpperCase()}</div>
            <p style={eyebrowStyle}>Member Area</p>
            <h1 style={titleStyle}>{siteName}</h1>
            <p style={mutedStyle}>{description}</p>
          </div>
          <nav style={navStyle}>
            <a href="/login" style={{ ...navLinkStyle, color: textColor }}>Login</a>
            <a href="/register" style={{ ...navLinkStyle, background: primaryColor, color: '#111' }}>Register</a>
          </nav>
        </header>

        {showBalanceHeader && <WalletCard primaryColor={primaryColor} cardColor={cardColor} showButtons={showButtons} />}

        <section style={quickGridStyle}>
          <QuickAction href="/deposit" title="ฝากเงิน" text="สร้างรายการเติมเงิน" color={primaryColor} />
          <QuickAction href="/withdraw" title="ถอนเงิน" text="ส่งคำขอถอน" />
          <QuickAction href="/transactions" title="ประวัติ" text="ดูรายการเงินล่าสุด" />
        </section>

        {showPromotion && <Card title="Promotion Banner" text="พื้นที่แสดงโปรโมชั่นจาก Settings" color={cardColor} />}
        {showCategories && <Card title="Game Categories" text="หมวดหมู่จะแสดงตรงนี้" color={cardColor} />}
        {showProviders && <Card title="Popular Providers" text="ผู้ให้บริการยอดนิยมจะแสดงตรงนี้" color={cardColor} />}
        {showRecommended && <Card title="Recommended" text="รายการแนะนำจะแสดงตรงนี้" color={cardColor} />}
      </section>
    </main>
  );
}

function QuickAction({ href, title, text, color }: { href: string; title: string; text: string; color?: string }) {
  return (
    <a href={href} style={{ ...quickActionStyle, background: color ?? 'rgba(255,255,255,0.08)', color: color ? '#111' : 'inherit' }}>
      <strong>{title}</strong>
      <span>{text}</span>
    </a>
  );
}

function Card({ title, text, color }: { title: string; text: string; color: string }) {
  return (
    <section style={{ ...softCardStyle, background: color }}>
      <p style={eyebrowStyle}>Section</p>
      <h2 style={{ margin: '4px 0 8px', fontSize: 'clamp(24px, 7vw, 38px)', lineHeight: 1.05 }}>{title}</h2>
      <p style={mutedStyle}>{text}</p>
    </section>
  );
}

const pageStyle = { minHeight: '100vh', width: '100%', overflowX: 'hidden' } as const;
const containerStyle = { width: '100%', maxWidth: 920, margin: '0 auto', padding: '22px 16px 40px', boxSizing: 'border-box', display: 'grid', gap: 18 } as const;
const headerStyle = { display: 'grid', gap: 18, paddingTop: 8 } as const;
const brandMarkStyle = { width: 48, height: 48, borderRadius: 16, display: 'grid', placeItems: 'center', fontWeight: 900, fontSize: 22, marginBottom: 14 } as const;
const eyebrowStyle = { margin: 0, opacity: 0.68, fontSize: 14, letterSpacing: 0.2 } as const;
const titleStyle = { margin: '6px 0 8px', fontSize: 'clamp(34px, 12vw, 64px)', lineHeight: 0.98, letterSpacing: -1.2 } as const;
const mutedStyle = { margin: 0, opacity: 0.78, fontSize: 'clamp(15px, 4.5vw, 20px)', lineHeight: 1.55 } as const;
const navStyle = { display: 'flex', gap: 10, flexWrap: 'wrap' } as const;
const navLinkStyle = { border: '1px solid rgba(255,255,255,0.14)', borderRadius: 999, padding: '10px 14px', textDecoration: 'none', fontWeight: 800 } as const;
const softCardStyle = { border: '1px solid rgba(255,255,255,0.10)', borderRadius: 28, padding: 22, boxShadow: '0 20px 70px rgba(0,0,0,0.18)' } as const;
const quickGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 } as const;
const quickActionStyle = { border: '1px solid rgba(255,255,255,0.10)', borderRadius: 18, padding: 14, minHeight: 78, textDecoration: 'none', display: 'grid', alignContent: 'center', gap: 4, boxSizing: 'border-box' } as const;
