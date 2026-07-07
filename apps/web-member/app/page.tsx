import { boolSetting, loadPublicSiteSettings, textSetting } from './site-settings';
import MemberHome from './member-home';

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
      <main style={{ minHeight: '100vh', background: backgroundColor, color: textColor, padding: 16 }}>
        <section style={{ maxWidth: 720, margin: '0 auto', paddingTop: 40 }}>
          <div style={{ border: '1px solid rgba(255,255,255,0.12)', borderRadius: 28, padding: 22, background: cardColor }}>
            <p style={{ margin: 0, opacity: 0.68 }}>Maintenance</p>
            <h1 style={{ margin: '8px 0', fontSize: 'clamp(34px, 10vw, 60px)', lineHeight: 1 }}>{siteName}</h1>
            <p style={{ margin: 0, opacity: 0.78 }}>{maintenanceMessage}</p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main style={{ minHeight: '100vh', background: backgroundColor, color: textColor, overflowX: 'hidden' }}>
      <MemberHome
        siteName={siteName}
        description={description}
        primaryColor={primaryColor}
        cardColor={cardColor}
        textColor={textColor}
        showBalanceHeader={showBalanceHeader}
        showButtons={showButtons}
        showPromotion={showPromotion}
        showCategories={showCategories}
        showProviders={showProviders}
        showRecommended={showRecommended}
      />
    </main>
  );
}
