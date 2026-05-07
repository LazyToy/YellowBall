import { useEffect, useState } from 'react';

import {
  createDefaultMenuSettings,
  getAppMenuSettings,
  type MenuSettings,
} from '@/services/appMenuSettingsService';

export function useAppMenuSettings(): MenuSettings {
  const [settings, setSettings] = useState<MenuSettings>(() =>
    createDefaultMenuSettings(),
  );

  useEffect(() => {
    let mounted = true;

    getAppMenuSettings()
      .then((nextSettings) => {
        if (mounted) {
          setSettings(nextSettings);
        }
      })
      .catch(() => {
        if (mounted) {
          setSettings(createDefaultMenuSettings());
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  return settings;
}
