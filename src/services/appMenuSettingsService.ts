import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/types/database';

export const MENU_SETTINGS_KEY = 'app_menu_visibility';

export type MenuId =
  | 'string-booking'
  | 'demo-booking'
  | 'shop'
  | 'racket-library'
  | 'delivery'
  | 'community'
  | 'subscription'
  | 'queue-board'
  | 'auto-reorder'
  | 'analytics'
  | 'audit-log';

export type MenuSettings = Record<MenuId, boolean>;

type AppMenuSettingsClient = Pick<SupabaseClient<Database>, 'from'>;

const defaultMenuSettings: MenuSettings = {
  'string-booking': true,
  'demo-booking': true,
  shop: true,
  'racket-library': true,
  delivery: false,
  community: false,
  subscription: false,
  'queue-board': true,
  'auto-reorder': true,
  analytics: false,
  'audit-log': true,
};

const menuIds = new Set<MenuId>(
  Object.keys(defaultMenuSettings) as MenuId[],
);

export function createDefaultMenuSettings(): MenuSettings {
  return { ...defaultMenuSettings };
}

export function mergeMenuSettings(value: unknown): MenuSettings {
  const settings = createDefaultMenuSettings();
  const source =
    value && typeof value === 'object' && 'menus' in value
      ? (value as { menus?: unknown }).menus
      : value;

  if (!source || typeof source !== 'object') {
    return settings;
  }

  Object.entries(source as Record<string, unknown>).forEach(([key, enabled]) => {
    if (menuIds.has(key as MenuId) && typeof enabled === 'boolean') {
      settings[key as MenuId] = enabled;
    }
  });

  settings['audit-log'] = true;
  return settings;
}

export function hasAnyBookingMenu(settings: MenuSettings) {
  return settings['string-booking'] || settings['demo-booking'];
}

export const createAppMenuSettingsService = (
  client: AppMenuSettingsClient,
) => ({
  async getSettings(): Promise<MenuSettings> {
    try {
      const { data, error } = await client
        .from('app_settings')
        .select('value')
        .eq('key', MENU_SETTINGS_KEY)
        .maybeSingle();

      if (error) {
        console.warn('[appMenuSettingsService] 메뉴 설정 조회 실패:', error.message);
        return createDefaultMenuSettings();
      }

      return mergeMenuSettings(data?.value ?? null);
    } catch (error) {
      console.warn('[appMenuSettingsService] 메뉴 설정 처리 실패:', error);
      return createDefaultMenuSettings();
    }
  },
});

const getDefaultAppMenuSettingsService = async () => {
  const { supabase } = require('./supabase') as typeof import('./supabase');

  return createAppMenuSettingsService(supabase);
};

export const getAppMenuSettings = () => {
  if (process.env.NODE_ENV === 'test') {
    return Promise.resolve(createDefaultMenuSettings());
  }

  return getDefaultAppMenuSettingsService().then((service) => service.getSettings());
};
