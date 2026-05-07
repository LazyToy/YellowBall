import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database, ShopOrderRow } from '@/types/database';

type ShopOrderClient = Pick<SupabaseClient<Database>, 'from'>;

export type ShopOrder = {
  id: string;
  user_id: string;
  order_number: string;
  status: string;
  total_amount: number;
  items: unknown[];
  created_at: string;
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

const toShopOrder = (row: ShopOrderRow): ShopOrder => ({
  created_at: row.created_at,
  id: row.id,
  items: Array.isArray(row.items) ? row.items : [],
  order_number: row.order_number,
  status: row.status,
  total_amount: row.total_amount,
  user_id: row.user_id,
});

export const createShopOrderService = (client: ShopOrderClient) => ({
  async getMyOrders(userId: string): Promise<ShopOrder[]> {
    const nextUserId = userId.trim();

    if (!nextUserId) {
      throw new Error('로그인이 필요합니다.');
    }

    const { data, error } = await client
      .from('shop_orders')
      .select('*')
      .eq('user_id', nextUserId)
      .order('created_at', { ascending: false });

    if (error) {
      throw toServiceError('주문내역을 불러오지 못했습니다.', error);
    }

    return (data ?? []).map(toShopOrder);
  },
});

const getDefaultShopOrderService = async () => {
  const { supabase } = await import('./supabase');

  return createShopOrderService(supabase);
};

export const getMyShopOrders = (userId: string) =>
  getDefaultShopOrderService().then((service) => service.getMyOrders(userId));
