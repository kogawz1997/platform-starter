import { boolSetting, loadPublicSiteSettings, textSetting } from './site-settings';

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
      <main style={{ minHeight: '100vh', background: backgroundColor, color: textColor, padding: 24 }}>
        <section style={{ maxWidth: 720, margin: '80px auto', background: cardColor, borderRadius: 24, padding: 28 }}>
          <h1>{siteName}</h1>
          <h2>Maintenance Mode</h2>
          <p>{maintenanceMessage}</p>
        </section>
      </main>
    );
  }

  return (
    <main style={{ minHeight: '100vh', background: backgroundColor, color: textColor, padding: 24 }}>
      <section style={{ maxWidth: 1080, margin: '0 auto', display: 'grid', gap: 20 }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ marginBottom: 6 }}>{siteName}</h1>
            <p>{description}</p>
          </div>
          <nav style={{ display: 'flex', gap: 10 }}>
            <a href="/login" style={{ color: textColor }}>Login</a>
            <a href="/register" style={{ color: textColor }}>Register</a>
          </nav>
        </header>

        {showBalanceHeader && (
          <section style={{ background: cardColor, borderRadius: 22, padding: 20 }}>
            <p style={{ margin: 0 }}>ยอดเงิน</p>
            <h2 style={{ marginTop: 8 }}>฿0.00</h2>
            {showButtons && (
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button style={{ background: primaryColor, border: 0, borderRadius: 12, padding: '10px 18px' }}>ฝากเงิน</button>
                <button style={{ borderRadius: 12, padding: '10px 18px' }}>ถอนเงิน</button>
              </div>
            )}
          </section>
        )}

        {showPromotion && <Card title="Promotion Banner" text="พื้นที่แสดงโปรโมชั่นจาก Settings" color={cardColor} />}
        {showCategories && <Card title="Game Categories" text="หมวดหมู่เกมจะแสดงตรงนี้" color={cardColor} />}
        {showProviders && <Card title="Popular Providers" text="ค่ายยอดนิยมจะแสดงตรงนี้" color={cardColor} />}
        {showRecommended && <Card title="Recommended Games" text="เกมแนะนำจะแสดงตรงนี้" color={cardColor} />}
      </section>
    </main>
  );
}

function Card({ title, text, color }: { title: string; text: string; color: string }) {
  return (
    <section style={{ background: color, borderRadius: 22, padding: 20 }}>
      <h2>{title}</h2>
      <p>{text}</p>
    </section>
  );
}
