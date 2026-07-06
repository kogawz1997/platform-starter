export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export type PublicSiteSettings = {
  website?: Record<string, unknown>;
  branding?: Record<string, unknown>;
  theme?: Record<string, unknown>;
  seo?: Record<string, unknown>;
  contact?: Record<string, unknown>;
  maintenance?: Record<string, unknown>;
  features?: Record<string, unknown>;
  legal?: Record<string, unknown>;
};

export const defaultSettings: PublicSiteSettings = {
  website: {
    site_name: 'Platform Starter',
    site_description: 'Member platform starter',
    registration_enabled: true,
    login_enabled: true,
    maintenance_mode: false,
  },
  branding: {
    primary_color: '#f5c542',
    background_color: '#080808',
    card_color: '#181818',
    text_color: '#ffffff',
    success_color: '#22c55e',
    danger_color: '#ef4444',
  },
  theme: {
    show_balance_header: true,
    show_deposit_withdraw_buttons: true,
    show_promotion_banner: true,
    show_game_categories: true,
    show_popular_providers: true,
    show_recommended_games: true,
  },
  maintenance: {
    enabled: false,
    member_enabled: false,
    message: 'ระบบกำลังปรับปรุง',
  },
  features: {
    registration_enabled: true,
    login_enabled: true,
    deposit_enabled: true,
    withdraw_enabled: true,
    promotion_enabled: true,
  },
};

export async function loadPublicSiteSettings(): Promise<PublicSiteSettings> {
  try {
    const res = await fetch(`${API_URL}/public/site-settings`, { cache: 'no-store' });
    if (!res.ok) return defaultSettings;
    const data = await res.json();
    return { ...defaultSettings, ...data };
  } catch {
    return defaultSettings;
  }
}

export function textSetting(settings: PublicSiteSettings, group: keyof PublicSiteSettings, key: string, fallback: string) {
  const value = settings[group]?.[key];
  return typeof value === 'string' ? value : fallback;
}

export function boolSetting(settings: PublicSiteSettings, group: keyof PublicSiteSettings, key: string, fallback: boolean) {
  const value = settings[group]?.[key];
  return typeof value === 'boolean' ? value : fallback;
}
