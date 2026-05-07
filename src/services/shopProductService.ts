import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database, ShopProductRow } from '@/types/database';
import type { ContentTone } from './appContentService';

type ShopProductClient = Pick<SupabaseClient<Database>, 'from'>;

export type ShopProduct = {
  id: string;
  name: string;
  category: string;
  image_path: string | null;
  image_url: string | null;
  price: number;
  sale: number;
  rating: number;
  reviews: number;
  tag: string | null;
  tone: ContentTone;
};

export type ShopProductFilters = {
  search?: string;
  category?: string;
};

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

const normalizeFilter = (value?: string | null) => {
  const normalized = value?.trim();

  return normalized ? normalized : undefined;
};

const toPostgrestSearchTerm = (value: string) =>
  value.replace(/[\\%_]/g, '\\$&').replace(/[(),]/g, ' ');

const toShopProduct = (row: ShopProductRow): ShopProduct => ({
  category: row.category,
  id: row.id,
  image_path: row.image_path,
  image_url: row.image_url,
  name: row.name,
  price: row.price,
  rating: Number(row.rating_average),
  reviews: row.review_count,
  sale: row.sale_price,
  tag: row.tag,
  tone: row.tone,
});

export const createShopProductService = (client: ShopProductClient) => ({
  async getActiveProducts(
    filters: ShopProductFilters = {},
  ): Promise<ShopProduct[]> {
    let query = client
      .from('shop_products')
      .select('*')
      .eq('is_active', true);

    const search = normalizeFilter(filters.search);
    const category = normalizeFilter(filters.category);

    if (search) {
      const term = toPostgrestSearchTerm(search);
      query = query.or(`name.ilike.%${term}%,category.ilike.%${term}%`);
    }

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      throw toServiceError('상품 데이터를 불러오지 못했습니다.', error);
    }

    return (data ?? []).map(toShopProduct);
  },

  async getActiveProductById(id: string): Promise<ShopProduct> {
    const productId = id.trim();

    if (!productId) {
      throw new Error('상품 ID가 없습니다.');
    }

    const { data, error } = await client
      .from('shop_products')
      .select('*')
      .eq('id', productId)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      throw toServiceError('상품 상세를 불러오지 못했습니다.', error);
    }

    return toShopProduct(data);
  },
});

const getDefaultShopProductService = async () => {
  const { supabase } = await import('./supabase');

  return createShopProductService(supabase);
};

export const getActiveShopProducts = (filters?: ShopProductFilters) =>
  getDefaultShopProductService().then((service) =>
    service.getActiveProducts(filters),
  );

export const getActiveShopProductById = (id: string) =>
  getDefaultShopProductService().then((service) =>
    service.getActiveProductById(id),
  );
