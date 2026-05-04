import type { SupabaseClient } from '@supabase/supabase-js';

import {
  createBookingNotificationService,
  type BookingNotificationService,
} from './bookingNotificationService';
import type {
  Database,
  Json,
  ServiceBooking,
  ServiceBookingStatus,
} from '@/types/database';
import { isValidServiceBookingTransition } from '@/utils/statusTransition';

type AdminBookingClient = Pick<SupabaseClient<Database>, 'from' | 'rpc'>;

export type AdminBookingFilters = {
  status?: ServiceBookingStatus;
};

const bookingSelect =
  '*, profiles(*), user_rackets(*), booking_slots(*), main_string:string_catalog!service_bookings_main_string_id_fkey(*), cross_string:string_catalog!service_bookings_cross_string_id_fkey(*)';

const terminalReleaseStatuses: ServiceBookingStatus[] = [
  'rejected',
  'cancelled_admin',
  'cancelled_user',
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

const assertCanManageBookings = async (
  client: AdminBookingClient,
  adminId: string,
) => {
  const { data: profile, error: profileError } = await client
    .from('profiles')
    .select('role')
    .eq('id', adminId)
    .single();

  if (profileError || !profile) {
    throw toServiceError('관리자 권한을 확인하지 못했습니다.', profileError);
  }

  if (profile.role === 'super_admin') {
    return;
  }

  if (profile.role !== 'admin') {
    throw new Error('예약 관리 권한이 없습니다.');
  }

  const { data: permissions, error: permissionError } = await client
    .from('admin_permissions')
    .select('can_manage_bookings')
    .eq('admin_id', adminId)
    .maybeSingle();

  if (permissionError || !permissions?.can_manage_bookings) {
    throw toServiceError('예약 관리 권한이 없습니다.', permissionError);
  }
};

const getBooking = async (
  client: AdminBookingClient,
  bookingId: string,
): Promise<ServiceBooking> => {
  const { data, error } = await client
    .from('service_bookings')
    .select('*')
    .eq('id', bookingId)
    .single();

  if (error || !data) {
    throw toServiceError('예약을 찾지 못했습니다.', error);
  }

  return data;
};

const insertAuditLog = async (
  client: AdminBookingClient,
  adminId: string,
  action: string,
  bookingId: string,
  beforeValue: unknown,
  afterValue: unknown,
) => {
  const { error } = await client.from('administrator_audit_logs').insert({
    actor_id: adminId,
    action,
    target_table: 'service_bookings',
    target_id: bookingId,
    before_value: beforeValue as Json,
    after_value: afterValue as Json,
  });

  if (error) {
    throw toServiceError('관리자 행동 로그를 저장하지 못했습니다.', error);
  }
};

const adminEventForStatus = (
  status: ServiceBookingStatus,
): Parameters<BookingNotificationService['notifyAdmins']>[0] | null => {
  if (['cancelled_admin', 'cancelled_user'].includes(status)) {
    return {
      title: '예약 취소',
      body: '스트링 예약이 취소되었습니다.',
      notificationType: 'admin_booking_cancelled',
      data: { bookingType: 'service', status },
    };
  }

  if (status === 'reschedule_requested') {
    return {
      title: '일정 변경 요청',
      body: '스트링 예약 일정 변경 요청이 등록되었습니다.',
      notificationType: 'admin_reschedule_requested',
      data: { bookingType: 'service', status },
    };
  }

  if (status === 'no_show') {
    return {
      title: '노쇼 위험 예약',
      body: '스트링 예약이 노쇼로 처리되었습니다.',
      notificationType: 'admin_no_show_risk',
      data: { bookingType: 'service', status },
    };
  }

  return null;
};

export const createAdminBookingService = (
  client: AdminBookingClient,
  notificationService: BookingNotificationService =
    createBookingNotificationService(client),
) => ({
  async getAllBookings(
    filters: AdminBookingFilters = {},
  ): Promise<ServiceBooking[]> {
    let query = client
      .from('service_bookings')
      .select(bookingSelect)
      .order('created_at', { ascending: false });

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query;

    if (error) {
      throw toServiceError('예약 목록을 불러오지 못했습니다.', error);
    }

    return (data ?? []) as ServiceBooking[];
  },

  approveBooking(bookingId: string, adminId: string) {
    return this.updateStatus(bookingId, adminId, 'approved');
  },

  rejectBooking(bookingId: string, adminId: string, reason: string) {
    return this.updateStatus(bookingId, adminId, 'rejected', reason);
  },

  async updateStatus(
    bookingId: string,
    adminId: string,
    newStatus: ServiceBookingStatus,
    reason?: string | null,
  ): Promise<ServiceBooking> {
    await assertCanManageBookings(client, adminId);
    const before = await getBooking(client, bookingId);

    if (!isValidServiceBookingTransition(before.status, newStatus)) {
      throw new Error('허용되지 않는 예약 상태 전환입니다.');
    }

    const shouldReleaseSlot = terminalReleaseStatuses.includes(newStatus);
    const { data, error } = await client.rpc('admin_update_service_booking_status', {
      p_booking_id: bookingId,
      p_admin_id: adminId,
      p_new_status: newStatus,
      p_reason: reason?.trim() || null,
    });

    if (error || !data) {
      throw toServiceError('예약 상태를 변경하지 못했습니다.', error);
    }

    await insertAuditLog(
      client,
      adminId,
      shouldReleaseSlot
        ? 'service_booking.status.update.release_slot'
        : 'service_booking.status.update',
      bookingId,
      before,
      data,
    );

    await notificationService.createStatusNotification({
      userId: data.user_id,
      bookingId: data.id,
      bookingType: 'service',
      status: data.status,
      reason,
    });

    const adminEvent = adminEventForStatus(data.status);
    if (adminEvent) {
      await notificationService.notifyAdmins({
        ...adminEvent,
        data: {
          ...(typeof adminEvent.data === 'object' && adminEvent.data !== null
            ? adminEvent.data
            : {}),
          bookingId: data.id,
        },
      });
    }

    return data;
  },

  async addAdminNote(
    bookingId: string,
    adminId: string,
    note: string,
  ): Promise<ServiceBooking> {
    await assertCanManageBookings(client, adminId);
    const before = await getBooking(client, bookingId);
    const { data, error } = await client
      .from('service_bookings')
      .update({ admin_notes: note.trim() || null })
      .eq('id', bookingId)
      .select('*')
      .single();

    if (error || !data) {
      throw toServiceError('관리자 메모를 저장하지 못했습니다.', error);
    }

    await insertAuditLog(
      client,
      adminId,
      'service_booking.note.update',
      bookingId,
      before,
      data,
    );

    return data;
  },
});

const getDefaultAdminBookingService = async () => {
  const { supabase } = await import('./supabase');

  return createAdminBookingService(supabase);
};

export const getAllBookings = (filters?: AdminBookingFilters) =>
  getDefaultAdminBookingService().then((service) =>
    service.getAllBookings(filters),
  );

export const approveBooking = (bookingId: string, adminId: string) =>
  getDefaultAdminBookingService().then((service) =>
    service.approveBooking(bookingId, adminId),
  );

export const rejectBooking = (
  bookingId: string,
  adminId: string,
  reason: string,
) =>
  getDefaultAdminBookingService().then((service) =>
    service.rejectBooking(bookingId, adminId, reason),
  );

export const updateStatus = (
  bookingId: string,
  adminId: string,
  newStatus: ServiceBookingStatus,
  reason?: string | null,
) =>
  getDefaultAdminBookingService().then((service) =>
    service.updateStatus(bookingId, adminId, newStatus, reason),
  );

export const addAdminNote = (
  bookingId: string,
  adminId: string,
  note: string,
) =>
  getDefaultAdminBookingService().then((service) =>
    service.addAdminNote(bookingId, adminId, note),
  );
