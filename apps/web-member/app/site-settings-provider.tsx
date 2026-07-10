'use client';

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { defaultSettings, loadPublicSiteSettings, PublicSiteSettings } from './site-settings';

type SiteSettingsContextValue = {
  settings: PublicSiteSettings;
  ready: boolean;
  reload: () => Promise<void>;
};

const SiteSettingsContext = createContext<SiteSettingsContextValue | null>(null);

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<PublicSiteSettings>(defaultSettings);
  const [ready, setReady] = useState(false);

  async function reload() {
    try {
      setSettings(await loadPublicSiteSettings());
    } catch {
      setSettings(defaultSettings);
    } finally {
      setReady(true);
    }
  }

  useEffect(() => { reload(); }, []);

  const value = useMemo(() => ({ settings, ready, reload }), [settings, ready]);
  return <SiteSettingsContext.Provider value={value}>{children}</SiteSettingsContext.Provider>;
}

export function useSiteSettings() {
  const context = useContext(SiteSettingsContext);
  if (!context) throw new Error('useSiteSettings must be used inside SiteSettingsProvider');
  return context;
}
