import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/types/database';

export type ContentTone = 'primary' | 'accent' | 'secondary' | 'card';

export type ShopSaleBanner = {
  meta: string;
  title: string;
  subtitle: string;
  buttonLabel: string;
  thumbLabel: string;
  image_path?: string | null;
  image_url?: string | null;
};

export type HomeBanner = {
  id: string;
  meta: string;
  title: string;
  subtitle: string;
  buttonLabel: string;
  image_path?: string | null;
  image_url?: string | null;
  route?: string | null;
};

export type HomeShopCategory = {
  id: string;
  label: string;
  image_path?: string | null;
  image_url?: string | null;
  route?: string | null;
};

export type AppBrandAssets = {
  logo_path?: string | null;
  logo_url?: string | null;
  login_logo_path?: string | null;
  login_logo_url?: string | null;
  app_icon_path?: string | null;
  adaptive_icon_path?: string | null;
  splash_icon_path?: string | null;
};

export type StoreHoursContent = {
  title: string;
  accent: string;
  subtitle: string;
};

export type AppContentBlockMap = {
  shop_filters: string[];
  shop_sale_banner: ShopSaleBanner;
  brand_assets: AppBrandAssets;
  home_banners: HomeBanner[];
  home_categories: (HomeShopCategory | string)[];
  home_store_hours: StoreHoursContent;
};

export type AppContentBlockKey = keyof AppContentBlockMap;

type AppContentClient = Pick<SupabaseClient<Database>, 'from'>;

const toServiceError = (message: string, error: unknown) => {
  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return new Error(`${message} ${error.message}`);
  }

  return new Error(message);
};

export const createAppContentService = (client: AppContentClient) => ({
  async getBlocks<K extends AppContentBlockKey>(
    keys: readonly K[],
  ): Promise<Partial<Pick<AppContentBlockMap, K>>> {
    const { data, error } = await client
      .from('app_content_blocks')
      .select('key,payload')
      .in('key', [...keys])
      .eq('is_active', true);

    if (error) {
      throw toServiceError('앱 콘텐츠 데이터를 불러오지 못했습니다.', error);
    }

    return (data ?? []).reduce<Partial<Pick<AppContentBlockMap, K>>>(
      (blocks, row) => ({
        ...blocks,
        [row.key as K]: row.payload as AppContentBlockMap[K],
      }),
      {},
    );
  },

  async getBlock<K extends AppContentBlockKey>(
    key: K,
  ): Promise<AppContentBlockMap[K] | null> {
    const blocks = await this.getBlocks([key]);

    return blocks[key] ?? null;
  },
});

const getDefaultAppContentService = async () => {
  const { supabase } = await import('./supabase');

  return createAppContentService(supabase);
};

export const getAppContentBlocks = <K extends AppContentBlockKey>(
  keys: readonly K[],
) => getDefaultAppContentService().then((service) => service.getBlocks(keys));

export const getAppContentBlock = <K extends AppContentBlockKey>(key: K) =>
  getDefaultAppContentService().then((service) => service.getBlock(key));
