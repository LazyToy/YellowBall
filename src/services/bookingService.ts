import type { SupabaseClient } from '@supabase/supabase-js';

import {
  createBookingNotificationService,
  type BookingNotificationService,
} from './bookingNotificationService';
import {
  createNoShowService,
  type NoShowService,
} from './noShowService';
import type {
  BookingSlot,
  Database,
  ServiceBooking,
  ServiceDeliveryMethod,
  ServiceBookingStatus,
} from '@/types/database';
import {
  assertDeliveryAddress,
  assertProfileCanBook,
  assertSlotAvailable,
  assertValidTension,
  buildRebookPrefill,
} from '@/utils/bookingValidation';
import {
  canCancelFreely,
  canRequestCancellation,
  getCancellationDeadline,
  type BookingWithSlot,
} from '@/utils/cancellationPolicy';

type BookingClient = Pick<SupabaseClient<Database>, 'from' | 'rpc'>;

export type CreateBookingInput = {
  userId: string;
  racketId: string;
  mainStringId: string;
  crossStringId: string;
  tensionMain: number;
  tensionCross: number;
  slotId: string;
  deliveryMethod: ServiceDeliveryMethod;
  addressId?: string | null;
  userNotes?: string | null;
};

export type MyBookingFilters = {
  statuses?: ServiceBookingStatus[];
};

export type CancelBookingResult = {
  booking: ServiceBooking;
  cancelled: boolean;
  requiresAdminApproval: boolean;
  cancellationDeadline: string | null;
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

const normalizeRpcRow = <T>(data: T | T[] | null): T | null =>
  Array.isArray(data) ? data[0] ?? null : data;

const getProfileStatus = async (client: BookingClient, userId: string) => {
  const { data, error } = await client
    .from('profiles')
    .select('status')
    .eq('id', userId)
    .single();

  if (error || !data) {
    throw toServiceError('프로필 상태를 확인하지 못했습니다.', error);
  }

  return data.status;
};

const getOwnedRacket = async (
  client: BookingClient,
  userId: string,
  racketId: string,
) => {
  const { data, error } = await client
    .from('user_rackets')
    .select('id, owner_id')
    .eq('id', racketId)
    .single();

  if (error || !data) {
    throw toServiceError('라켓을 확인하지 못했습니다.', error);
  }

  if (data.owner_id !== userId) {
    throw new Error('본인 라켓으로만 예약할 수 있습니다.');
  }
};

const getActiveString = async (client: BookingClient, stringId: string) => {
  const { data, error } = await client
    .from('string_catalog')
    .select('id, is_active')
    .eq('id', stringId)
    .single();

  if (error || !data || !data.is_active) {
    throw toServiceError('사용 가능한 스트링을 확인하지 못했습니다.', error);
  }
};

const getSlot = async (
  client: BookingClient,
  slotId: string,
): Promise<BookingSlot> => {
  const { data, error } = await client
    .from('booking_slots')
    .select('*')
    .eq('id', slotId)
    .eq('service_type', 'stringing')
    .single();

  if (error || !data) {
    throw toServiceError('예약 슬롯을 확인하지 못했습니다.', error);
  }

  return data;
};

export const createBookingService = (
  client: BookingClient,
  notificationService: BookingNotificationService =
    createBookingNotificationService(client),
  noShowService: NoShowService = createNoShowService(client),
) => ({
  async createBooking(input: CreateBookingInput): Promise<ServiceBooking> {
    assertValidTension(input.tensionMain, '메인');
    assertValidTension(input.tensionCross, '크로스');
    assertDeliveryAddress(input.deliveryMethod, input.addressId);

    const status = await getProfileStatus(client, input.userId);
    assertProfileCanBook(status);
    if (await noShowService.isBookingRestricted(input.userId)) {
      throw new Error('노쇼 3회 이상 사용자는 예약할 수 없습니다.');
    }
    await getOwnedRacket(client, input.userId, input.racketId);
    await getActiveString(client, input.mainStringId);
    await getActiveString(client, input.crossStringId);
    assertSlotAvailable(await getSlot(client, input.slotId));

    const { data, error } = await client.rpc('create_service_booking_transaction', {
      p_user_id: input.userId,
      p_racket_id: input.racketId,
      p_main_string_id: input.mainStringId,
      p_cross_string_id: input.crossStringId,
      p_tension_main: input.tensionMain,
      p_tension_cross: input.tensionCross,
      p_slot_id: input.slotId,
      p_delivery_method: input.deliveryMethod,
      p_address_id: input.addressId ?? null,
      p_user_notes: input.userNotes?.trim() || null,
    });
    const booking = normalizeRpcRow(data);

    if (error || !booking) {
      throw toServiceError('예약을 생성하지 못했습니다.', error);
    }

    await notificationService.createStatusNotification({
      userId: booking.user_id,
      bookingId: booking.id,
      bookingType: 'service',
      status: booking.status,
    });
    await notificationService.notifyAdmins({
      title: '새로운 예약',
      body: '새로운 스트링 예약이 접수되었습니다.',
      notificationType: 'admin_new_booking',
      data: {
        bookingId: booking.id,
        bookingType: 'service',
        status: booking.status,
      },
    });

    return booking;
  },

  async getMyBookings(
    userId: string,
    filters: MyBookingFilters = {},
  ): Promise<ServiceBooking[]> {
    let query = client
      .from('service_bookings')
      .select(
        '*, user_rackets(*), booking_slots(*), main_string:string_catalog!service_bookings_main_string_id_fkey(*), cross_string:string_catalog!service_bookings_cross_string_id_fkey(*)',
      )
      .eq('user_id', userId);

    if (filters.statuses?.length) {
      query = query.in('status', filters.statuses);
    }

    const { data, error } = await query
      .order('created_at', { ascending: false });

    if (error) {
      throw toServiceError('예약 목록을 불러오지 못했습니다.', error);
    }

    return (data ?? []) as ServiceBooking[];
  },

  async getBookingDetail(bookingId: string): Promise<ServiceBooking> {
    const { data, error } = await client
      .from('service_bookings')
      .select(
        '*, user_rackets(*), booking_slots(*), main_string:string_catalog!service_bookings_main_string_id_fkey(*), cross_string:string_catalog!service_bookings_cross_string_id_fkey(*)',
      )
      .eq('id', bookingId)
      .single();

    if (error || !data) {
      throw toServiceError('예약 상세를 불러오지 못했습니다.', error);
    }

    return data as ServiceBooking;
  },

  async cancelBooking(
    bookingId: string,
    userId: string,
  ): Promise<CancelBookingResult> {
    const booking = (await this.getBookingDetail(bookingId)) as ServiceBooking &
      BookingWithSlot;

    if (booking.user_id !== userId) {
      throw new Error('본인 예약만 취소할 수 있습니다.');
    }

    if (!canRequestCancellation(booking)) {
      throw new Error('작업 시작 이후에는 예약을 취소할 수 없습니다.');
    }

    const cancellationDeadline = getCancellationDeadline(booking);

    if (!canCancelFreely(booking)) {
      const { error } = await client.from('booking_status_logs').insert({
        booking_type: 'service',
        booking_id: bookingId,
        previous_status: booking.status,
        new_status: 'cancel_requested',
        changed_by: userId,
        reason: '사용자 취소 요청 - 24시간 이내 관리자 확인 필요',
      });

      if (error) {
        throw toServiceError('취소 요청을 등록하지 못했습니다.', error);
      }

      await notificationService.notifyAdmins({
        title: '예약 취소 요청',
        body: '24시간 이내 예약 취소 요청이 등록되었습니다.',
        notificationType: 'admin_booking_cancel_requested',
        data: {
          bookingId,
          bookingType: 'service',
          status: booking.status,
        },
      });

      return {
        booking,
        cancelled: false,
        requiresAdminApproval: true,
        cancellationDeadline: cancellationDeadline?.toISOString() ?? null,
      };
    }

    const { data, error } = await client.rpc('user_cancel_service_booking', {
      p_booking_id: bookingId,
      p_user_id: userId,
    });

    if (error || !data) {
      throw toServiceError('예약을 취소하지 못했습니다.', error);
    }

    await notificationService.createStatusNotification({
      userId: data.user_id,
      bookingId: data.id,
      bookingType: 'service',
      status: data.status,
    });

    await notificationService.notifyAdmins({
      title: '예약 취소',
      body: '스트링 예약이 취소되었습니다.',
      notificationType: 'admin_booking_cancelled',
      data: {
        bookingId: data.id,
        bookingType: 'service',
        status: data.status,
      },
    });

    return {
      booking: data,
      cancelled: true,
      requiresAdminApproval: false,
      cancellationDeadline: cancellationDeadline?.toISOString() ?? null,
    };
  },

  buildRebookPrefill,
});

const getDefaultBookingService = async () => {
  const { supabase } = await import('./supabase');

  return createBookingService(supabase);
};

export const createBooking = (input: CreateBookingInput) =>
  getDefaultBookingService().then((service) => service.createBooking(input));

export const getMyBookings = (userId: string, filters?: MyBookingFilters) =>
  getDefaultBookingService().then((service) =>
    service.getMyBookings(userId, filters),
  );

export const getBookingDetail = (bookingId: string) =>
  getDefaultBookingService().then((service) =>
    service.getBookingDetail(bookingId),
  );

export const cancelBooking = (bookingId: string, userId: string) =>
  getDefaultBookingService().then((service) =>
    service.cancelBooking(bookingId, userId),
  );

export { buildRebookPrefill };
