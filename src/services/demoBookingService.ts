import type { SupabaseClient } from '@supabase/supabase-js';

import {
  createBookingNotificationService,
  type BookingNotificationService,
} from './bookingNotificationService';
import { isAvailableForBooking } from './demoRacketService';
import type {
  BookingSlot,
  Database,
  DemoBooking,
  DemoBookingStatus,
  DemoRacket,
} from '@/types/database';
import {
  assertProfileCanBook,
  assertReturnWindow,
  assertSlotAvailable,
} from '@/utils/bookingValidation';

type DemoBookingClient = Pick<SupabaseClient<Database>, 'from' | 'rpc'>;

export type CreateDemoBookingInput = {
  userId: string;
  demoRacketId: string;
  slotId: string;
  expectedReturnTime: string;
  userNotes?: string | null;
};

const activeDemoStatuses: DemoBookingStatus[] = [
  'requested',
  'approved',
  'in_use',
  'overdue',
];

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

const getProfileStatus = async (client: DemoBookingClient, userId: string) => {
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

const getDemoRacket = async (
  client: DemoBookingClient,
  demoRacketId: string,
): Promise<DemoRacket> => {
  const { data, error } = await client
    .from('demo_rackets')
    .select('*')
    .eq('id', demoRacketId)
    .single();

  if (error || !data) {
    throw toServiceError('시타 라켓을 확인하지 못했습니다.', error);
  }

  return data;
};

const getSlot = async (
  client: DemoBookingClient,
  slotId: string,
): Promise<BookingSlot> => {
  const { data, error } = await client
    .from('booking_slots')
    .select('*')
    .eq('id', slotId)
    .eq('service_type', 'demo')
    .single();

  if (error || !data) {
    throw toServiceError('시타 슬롯을 확인하지 못했습니다.', error);
  }

  return data;
};

const getOverlappingBookings = async (
  client: DemoBookingClient,
  demoRacketId: string,
  startTime: string,
  expectedReturnTime: string,
) => {
  const { data, error } = await client
    .from('demo_bookings')
    .select('start_time, expected_return_time, status')
    .eq('demo_racket_id', demoRacketId)
    .in('status', activeDemoStatuses)
    .lt('start_time', expectedReturnTime)
    .gt('expected_return_time', startTime);

  if (error) {
    throw toServiceError('시타 예약 중복을 확인하지 못했습니다.', error);
  }

  return data ?? [];
};

export const createDemoBookingService = (
  client: DemoBookingClient,
  notificationService: BookingNotificationService =
    createBookingNotificationService(client),
) => ({
  async createDemoBooking(input: CreateDemoBookingInput): Promise<DemoBooking> {
    const status = await getProfileStatus(client, input.userId);
    assertProfileCanBook(status);

    const racket = await getDemoRacket(client, input.demoRacketId);
    const slot = await getSlot(client, input.slotId);
    assertSlotAvailable(slot);
    assertReturnWindow(slot.start_time, input.expectedReturnTime);

    const overlappingBookings = await getOverlappingBookings(
      client,
      input.demoRacketId,
      slot.start_time,
      input.expectedReturnTime,
    );

    if (
      !isAvailableForBooking(
        racket,
        {
          start_time: slot.start_time,
          expected_return_time: input.expectedReturnTime,
        },
        overlappingBookings,
      )
    ) {
      throw new Error('해당 시간에는 시타 예약을 만들 수 없습니다.');
    }

    const { data, error } = await client.rpc('create_demo_booking_transaction', {
      p_user_id: input.userId,
      p_demo_racket_id: input.demoRacketId,
      p_slot_id: input.slotId,
      p_start_time: slot.start_time,
      p_expected_return_time: input.expectedReturnTime,
      p_user_notes: input.userNotes?.trim() || null,
    });
    const booking = normalizeRpcRow(data);

    if (error || !booking) {
      throw toServiceError('시타 예약을 생성하지 못했습니다.', error);
    }

    await notificationService.createStatusNotification({
      userId: booking.user_id,
      bookingId: booking.id,
      bookingType: 'demo',
      status: booking.status,
    });
    await notificationService.notifyAdmins({
      title: '새로운 시타 예약',
      body: '새로운 시타 예약이 접수되었습니다.',
      notificationType: 'admin_new_booking',
      data: {
        bookingId: booking.id,
        bookingType: 'demo',
        status: booking.status,
      },
    });

    return booking;
  },

  async getMyDemoBookings(userId: string): Promise<DemoBooking[]> {
    const { data, error } = await client
      .from('demo_bookings')
      .select('*, demo_rackets(*), booking_slots(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw toServiceError('시타 예약 목록을 불러오지 못했습니다.', error);
    }

    return (data ?? []) as DemoBooking[];
  },

  async getDemoBookingDetail(bookingId: string): Promise<DemoBooking> {
    const { data, error } = await client
      .from('demo_bookings')
      .select('*, demo_rackets(*), booking_slots(*)')
      .eq('id', bookingId)
      .single();

    if (error || !data) {
      throw toServiceError('시타 예약 상세를 불러오지 못했습니다.', error);
    }

    return data as DemoBooking;
  },
});

const getDefaultDemoBookingService = async () => {
  const { supabase } = await import('./supabase');

  return createDemoBookingService(supabase);
};

export const createDemoBooking = (input: CreateDemoBookingInput) =>
  getDefaultDemoBookingService().then((service) =>
    service.createDemoBooking(input),
  );

export const getMyDemoBookings = (userId: string) =>
  getDefaultDemoBookingService().then((service) =>
    service.getMyDemoBookings(userId),
  );

export const getDemoBookingDetail = (bookingId: string) =>
  getDefaultDemoBookingService().then((service) =>
    service.getDemoBookingDetail(bookingId),
  );
