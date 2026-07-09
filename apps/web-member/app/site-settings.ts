export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export type CmsContent = {
  banners: Array<{ title: string; subtitle: string; imageUrl: string; href: string; enabled: boolean }>;
  popup: { title: string; message: string; ctaLabel: string; href: string; enabled: boolean };
  announcements: Array<{ title: string; message: string; enabled: boolean }>;
  faqs: Array<{ question: string; answer: string; enabled: boolean }>;
};

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

export const defaultCmsContent: CmsContent = {
  banners: [{ title: 'พร้อมเล่นทุกเกม', subtitle: 'ฝาก ถอน เล่นเกม และดูประวัติได้ในมือถือเครื่องเดียว', imageUrl: '', href: '/games', enabled: true }],
  popup: { title: 'ประกาศ', message: 'ยินดีต้อนรับ', ctaLabel: 'ดูเกม', href: '/games', enabled: false },
  announcements: [{ title: 'ระบบพร้อมใช้งาน', message: 'ฝาก ถอน และเกมเปิดให้บริการตามปกติ', enabled: true }],
  faqs: [{ question: 'ฝากใช้เวลานานไหม', answer: 'หลังแนบสลิป แอดมินจะตรวจและอนุมัติให้เร็วที่สุด', enabled: true }],
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
    cms_content: defaultCmsContent,
  },
};

export async function loadPublicSiteSettings(): Promise<PublicSiteSettings> {
  try {
    const res = await fetch(`${API_URL}/public/site-settings`, { cache: 'no-store' });
    if (!res.ok) return defaultSettings;
    const data = await res.json();
    return { ...defaultSettings, ...data, features: { ...defaultSettings.features, ...(data.features ?? {}) } };
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

export function cmsContentSetting(settings: PublicSiteSettings): CmsContent {
  const value = settings.features?.cms_content;
  if (!value || typeof value !== 'object' || Array.isArray(value)) return defaultCmsContent;
  const data = value as Partial<CmsContent>;
  return {
    banners: Array.isArray(data.banners) ? data.banners.map((item: any) => ({ title: String(item.title ?? ''), subtitle: String(item.subtitle ?? ''), imageUrl: String(item.imageUrl ?? ''), href: String(item.href ?? '/games'), enabled: item.enabled !== false })) : defaultCmsContent.banners,
    popup: { ...defaultCmsContent.popup, ...(data.popup && typeof data.popup === 'object' ? data.popup : {}) } as CmsContent['popup'],
    announcements: Array.isArray(data.announcements) ? data.announcements.map((item: any) => ({ title: String(item.title ?? ''), message: String(item.message ?? ''), enabled: item.enabled !== false })) : defaultCmsContent.announcements,
    faqs: Array.isArray(data.faqs) ? data.faqs.map((item: any) => ({ question: String(item.question ?? ''), answer: String(item.answer ?? ''), enabled: item.enabled !== false })) : defaultCmsContent.faqs,
  };
}
