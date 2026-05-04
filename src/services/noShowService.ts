import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database, ServiceBooking } from '@/types/database';

type NoShowClient = Pick<SupabaseClient<Database>, 'from' | 'rpc'>;

const NO_SHOW_RESTRICTION_COUNT = 3;

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

export const createNoShowService = (client: NoShowClient) => ({
  async recordNoShow(bookingId: string, adminId: string): Promise<ServiceBooking> {
    const { data, error } = await client.rpc('record_service_booking_no_show', {
      p_booking_id: bookingId,
      p_admin_id: adminId,
    });

    if (error || !data) {
      throw toServiceError('노쇼를 기록하지 못했습니다.', error);
    }

    return data;
  },

  async getNoShowCount(userId: string): Promise<number> {
    const { count, error } = await client
      .from('service_bookings')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('no_show_counted', true);

    if (error) {
      throw toServiceError('노쇼 횟수를 불러오지 못했습니다.', error);
    }

    return count ?? 0;
  },

  async isBookingRestricted(userId: string): Promise<boolean> {
    return (await this.getNoShowCount(userId)) >= NO_SHOW_RESTRICTION_COUNT;
  },
});

export type NoShowService = ReturnType<typeof createNoShowService>;

const getDefaultNoShowService = async () => {
  const { supabase } = await import('./supabase');

  return createNoShowService(supabase);
};

export const recordNoShow = (bookingId: string, adminId: string) =>
  getDefaultNoShowService().then((service) =>
    service.recordNoShow(bookingId, adminId),
  );

export const getNoShowCount = (userId: string) =>
  getDefaultNoShowService().then((service) => service.getNoShowCount(userId));

export const isBookingRestricted = (userId: string) =>
  getDefaultNoShowService().then((service) =>
    service.isBookingRestricted(userId),
  );
