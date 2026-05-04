import type { SupabaseClient } from '@supabase/supabase-js';

import {
  createBookingNotificationService,
  type BookingNotificationService,
} from './bookingNotificationService';
import type {
  Database,
  DemoBooking,
  DemoBookingStatus,
  Json,
} from '@/types/database';
import { isValidDemoBookingTransition } from '@/utils/statusTransition';

type AdminDemoBookingClient = Pick<SupabaseClient<Database>, 'from' | 'rpc'>;

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

const assertCanManageDemoBookings = async (
  client: AdminDemoBookingClient,
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
    throw new Error('시타 예약 관리 권한이 없습니다.');
  }

  const { data: permissions, error: permissionError } = await client
    .from('admin_permissions')
    .select('can_manage_bookings, can_manage_demo_rackets')
    .eq('admin_id', adminId)
    .maybeSingle();

  if (
    permissionError ||
    (!permissions?.can_manage_bookings &&
      !permissions?.can_manage_demo_rackets)
  ) {
    throw toServiceError('시타 예약 관리 권한이 없습니다.', permissionError);
  }
};

const getDemoBooking = async (
  client: AdminDemoBookingClient,
  bookingId: string,
): Promise<DemoBooking> => {
  const { data, error } = await client
    .from('demo_bookings')
    .select('*')
    .eq('id', bookingId)
    .single();

  if (error || !data) {
    throw toServiceError('시타 예약을 찾지 못했습니다.', error);
  }

  return data;
};

const insertAuditLog = async (
  client: AdminDemoBookingClient,
  adminId: string,
  action: string,
  bookingId: string,
  beforeValue: unknown,
  afterValue: unknown,
) => {
  const { error } = await client.from('administrator_audit_logs').insert({
    actor_id: adminId,
    action,
    target_table: 'demo_bookings',
    target_id: bookingId,
    before_value: beforeValue as Json,
    after_value: afterValue as Json,
  });

  if (error) {
    throw toServiceError('관리자 행동 로그를 저장하지 못했습니다.', error);
  }
};

export const createAdminDemoBookingService = (
  client: AdminDemoBookingClient,
  notificationService: BookingNotificationService =
    createBookingNotificationService(client),
) => ({
  async getAllDemoBookings(): Promise<DemoBooking[]> {
    const { data, error } = await client
      .from('demo_bookings')
      .select('*, profiles(*), demo_rackets(*), booking_slots(*)')
      .order('created_at', { ascending: false });

    if (error) {
      throw toServiceError('시타 예약 목록을 불러오지 못했습니다.', error);
    }

    return (data ?? []) as DemoBooking[];
  },

  approveDemo(bookingId: string, adminId: string) {
    return this.updateDemoStatus(bookingId, adminId, 'approved');
  },

  rejectDemo(bookingId: string, adminId: string, reason: string) {
    return this.updateDemoStatus(bookingId, adminId, 'rejected', reason);
  },

  markInUse(bookingId: string, adminId: string) {
    return this.updateDemoStatus(bookingId, adminId, 'in_use');
  },

  markReturned(
    bookingId: string,
    adminId: string,
    actualReturnTime: string,
  ) {
    return this.updateDemoStatus(
      bookingId,
      adminId,
      'returned',
      null,
      actualReturnTime,
    );
  },

  markOverdue(bookingId: string, adminId: string) {
    return this.updateDemoStatus(bookingId, adminId, 'overdue');
  },

  async updateDemoStatus(
    bookingId: string,
    adminId: string,
    newStatus: DemoBookingStatus,
    reason?: string | null,
    actualReturnTime?: string | null,
  ): Promise<DemoBooking> {
    await assertCanManageDemoBookings(client, adminId);
    const before = await getDemoBooking(client, bookingId);

    if (!isValidDemoBookingTransition(before.status, newStatus)) {
      throw new Error('허용되지 않는 시타 예약 상태 전환입니다.');
    }

    if (newStatus === 'returned' && !actualReturnTime) {
      throw new Error('반납 처리에는 실제 반납 시간이 필요합니다.');
    }

    const { data, error } = await client.rpc('admin_update_demo_booking_status', {
      p_booking_id: bookingId,
      p_admin_id: adminId,
      p_new_status: newStatus,
      p_reason: reason?.trim() || null,
      p_actual_return_time: actualReturnTime ?? null,
    });

    if (error || !data) {
      throw toServiceError('시타 예약 상태를 변경하지 못했습니다.', error);
    }

    await insertAuditLog(
      client,
      adminId,
      'demo_booking.status.update',
      bookingId,
      before,
      data,
    );

    await notificationService.createStatusNotification({
      userId: data.user_id,
      bookingId: data.id,
      bookingType: 'demo',
      status: data.status,
      reason,
    });

    if (data.status === 'overdue') {
      await notificationService.notifyAdmins({
        title: '시타 반납 지연',
        body: '시타 라켓 반납이 지연되었습니다.',
        notificationType: 'admin_demo_overdue',
        data: {
          bookingId: data.id,
          bookingType: 'demo',
          status: data.status,
        },
      });
    }

    if (['cancelled_admin', 'cancelled_user'].includes(data.status)) {
      await notificationService.notifyAdmins({
        title: '시타 예약 취소',
        body: '시타 예약이 취소되었습니다.',
        notificationType: 'admin_booking_cancelled',
        data: {
          bookingId: data.id,
          bookingType: 'demo',
          status: data.status,
        },
      });
    }

    if (data.status === 'no_show') {
      await notificationService.notifyAdmins({
        title: '노쇼 위험 예약',
        body: '시타 예약이 노쇼로 처리되었습니다.',
        notificationType: 'admin_no_show_risk',
        data: {
          bookingId: data.id,
          bookingType: 'demo',
          status: data.status,
        },
      });
    }

    return data;
  },
});

const getDefaultAdminDemoBookingService = async () => {
  const { supabase } = await import('./supabase');

  return createAdminDemoBookingService(supabase);
};

export const getAllDemoBookings = () =>
  getDefaultAdminDemoBookingService().then((service) =>
    service.getAllDemoBookings(),
  );

export const approveDemo = (bookingId: string, adminId: string) =>
  getDefaultAdminDemoBookingService().then((service) =>
    service.approveDemo(bookingId, adminId),
  );

export const rejectDemo = (
  bookingId: string,
  adminId: string,
  reason: string,
) =>
  getDefaultAdminDemoBookingService().then((service) =>
    service.rejectDemo(bookingId, adminId, reason),
  );

export const markInUse = (bookingId: string, adminId: string) =>
  getDefaultAdminDemoBookingService().then((service) =>
    service.markInUse(bookingId, adminId),
  );

export const markReturned = (
  bookingId: string,
  adminId: string,
  actualReturnTime: string,
) =>
  getDefaultAdminDemoBookingService().then((service) =>
    service.markReturned(bookingId, adminId, actualReturnTime),
  );

export const markOverdue = (bookingId: string, adminId: string) =>
  getDefaultAdminDemoBookingService().then((service) =>
    service.markOverdue(bookingId, adminId),
  );
