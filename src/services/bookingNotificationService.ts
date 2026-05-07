import type { SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

import type {
  AppNotification,
  BookingStatusLogType,
  Database,
  DemoBookingStatus,
  Json,
  ServiceBookingStatus,
} from '@/types/database';

type FunctionInvokeResult = {
  data: { notification?: AppNotification } | AppNotification | null;
  error: unknown;
};

type BookingNotificationClient = Pick<SupabaseClient<Database>, 'from'> & {
  functions?: {
    invoke: (
      functionName: string,
      options: { body: Record<string, unknown> },
    ) => Promise<FunctionInvokeResult>;
  };
};

export type BookingNotificationInput = {
  userId: string;
  bookingId: string;
  bookingType: BookingStatusLogType;
  status: ServiceBookingStatus | DemoBookingStatus;
  reason?: string | null;
};

const serviceStatusMessages: Record<
  ServiceBookingStatus,
  { title: string; body: string }
> = {
  requested: {
    title: '예약 접수',
    body: '예약이 접수되었습니다.',
  },
  approved: {
    title: '예약 승인',
    body: '예약이 승인되었습니다.',
  },
  visit_pending: {
    title: '방문 대기',
    body: '방문 예정 단계로 변경되었습니다.',
  },
  racket_received: {
    title: '라켓 입고',
    body: '라켓이 매장에 입고되었습니다.',
  },
  in_progress: {
    title: '작업 시작',
    body: '작업이 시작되었습니다.',
  },
  completed: {
    title: '작업 완료',
    body: '작업이 완료되었습니다.',
  },
  pickup_ready: {
    title: '픽업 가능',
    body: '픽업 가능한 상태입니다.',
  },
  delivered: {
    title: '배송 완료',
    body: '배송이 완료되었습니다.',
  },
  done: {
    title: '예약 완료',
    body: '예약이 완료 처리되었습니다.',
  },
  cancelled_user: {
    title: '예약 취소',
    body: '예약이 취소되었습니다.',
  },
  cancelled_admin: {
    title: '예약 취소',
    body: '관리자에 의해 예약이 취소되었습니다.',
  },
  rejected: {
    title: '예약 거절',
    body: '예약이 거절되었습니다.',
  },
  reschedule_requested: {
    title: '일정 변경 제안',
    body: '일정 변경이 제안되었습니다.',
  },
  no_show: {
    title: '노쇼 처리',
    body: '예약이 노쇼로 처리되었습니다.',
  },
  refund_pending: {
    title: '환불 대기',
    body: '환불 대기 상태로 변경되었습니다.',
  },
  refund_done: {
    title: '환불 완료',
    body: '환불이 완료되었습니다.',
  },
};

const demoStatusMessages: Record<
  DemoBookingStatus,
  { title: string; body: string }
> = {
  requested: {
    title: '시타 예약 접수',
    body: '시타 예약이 접수되었습니다.',
  },
  approved: {
    title: '시타 예약 승인',
    body: '시타 예약이 승인되었습니다.',
  },
  in_use: {
    title: '시타 시작',
    body: '시타 라켓 사용이 시작되었습니다.',
  },
  returned: {
    title: '시타 반납 완료',
    body: '시타 라켓 반납이 완료되었습니다.',
  },
  cancelled_user: {
    title: '시타 예약 취소',
    body: '시타 예약이 취소되었습니다.',
  },
  cancelled_admin: {
    title: '시타 예약 취소',
    body: '관리자에 의해 시타 예약이 취소되었습니다.',
  },
  rejected: {
    title: '시타 예약 거절',
    body: '시타 예약이 거절되었습니다.',
  },
  no_show: {
    title: '시타 노쇼 처리',
    body: '시타 예약이 노쇼로 처리되었습니다.',
  },
  overdue: {
    title: '반납 지연',
    body: '시타 라켓 반납이 지연되었습니다.',
  },
};

export const adminNotificationTypes = [
  'admin_new_booking',
  'admin_booking_cancelled',
  'admin_booking_cancel_requested',
  'admin_reschedule_requested',
  'admin_demo_overdue',
  'admin_no_show_risk',
] as const;

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

export const getBookingNotificationMessage = (
  bookingType: BookingStatusLogType,
  status: ServiceBookingStatus | DemoBookingStatus,
  reason?: string | null,
) => {
  const base =
    bookingType === 'service'
      ? serviceStatusMessages[status as ServiceBookingStatus]
      : demoStatusMessages[status as DemoBookingStatus];

  if (!base) {
    throw new Error('지원하지 않는 예약 알림 상태입니다.');
  }

  return {
    title: base.title,
    body:
      status === 'rejected' && reason?.trim()
        ? `${base.body} 사유: ${reason.trim()}`
        : base.body,
  };
};

const isQuietHour = (
  now: Date,
  start: string | null,
  end: string | null,
) => {
  if (!start || !end) {
    return false;
  }

  const minutes = now.getHours() * 60 + now.getMinutes();
  const [startHour, startMinute] = start.split(':').map(Number);
  const [endHour, endMinute] = end.split(':').map(Number);
  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;

  if (startMinutes <= endMinutes) {
    return minutes >= startMinutes && minutes < endMinutes;
  }

  return minutes >= startMinutes || minutes < endMinutes;
};

const resolveInvokedNotification = (
  data: FunctionInvokeResult['data'],
): AppNotification | null => {
  if (!data) {
    return null;
  }

  if ('notification' in data && !('id' in data)) {
    return data.notification ?? null;
  }

  if ('id' in data) {
    return data;
  }

  return null;
};

const getPushToken = async (
  client: BookingNotificationClient,
  userId: string,
) => {
  const { data, error } = await client
    .from('profiles')
    .select('expo_push_token')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw toServiceError('푸시 토큰을 확인하지 못했습니다.', error);
  }

  return data?.expo_push_token ?? null;
};

const insertNotificationDirectly = async (
  client: BookingNotificationClient,
  payload: {
    user_id: string;
    title: string;
    body: string;
    notification_type: string;
    data: Json;
  },
) => {
  const { data, error } = await client
    .from('notifications')
    .insert(payload)
    .select('*')
    .single();

  if (error || !data) {
    throw toServiceError('예약 알림을 생성하지 못했습니다.', error);
  }

  return data;
};

export const createBookingNotificationService = (
  client: BookingNotificationClient,
  now: () => Date = () => new Date(),
) => ({
  async createStatusNotification(
    input: BookingNotificationInput,
  ): Promise<AppNotification | null> {
    const { data: preferences, error: prefError } = await client
      .from('notification_preferences')
      .select(
        'booking_notifications, quiet_hours_enabled, quiet_hours_start, quiet_hours_end',
      )
      .eq('user_id', input.userId)
      .maybeSingle();

    if (prefError) {
      throw toServiceError('알림 수신 설정을 확인하지 못했습니다.', prefError);
    }

    if (preferences?.booking_notifications === false) {
      return null;
    }

    const message = getBookingNotificationMessage(
      input.bookingType,
      input.status,
      input.reason,
    );
    const silent = Boolean(
      preferences?.quiet_hours_enabled &&
        isQuietHour(
          now(),
          preferences.quiet_hours_start,
          preferences.quiet_hours_end,
        ),
    );
    const payload = {
      user_id: input.userId,
      title: message.title,
      body: message.body,
      notification_type: `${input.bookingType}_${input.status}`,
      data: {
        bookingId: input.bookingId,
        bookingType: input.bookingType,
        status: input.status,
        silent,
      } satisfies Json,
    };

    if (Platform.OS === 'web') {
      return insertNotificationDirectly(client, payload);
    }

    if (client.functions?.invoke) {
      const { data, error } = await client.functions.invoke('send-notification', {
        body: {
          userId: input.userId,
          title: message.title,
          body: message.body,
          notificationType: payload.notification_type,
          data: payload.data,
          pushToken: await getPushToken(client, input.userId),
          silent,
        },
      });

      if (error) {
        return insertNotificationDirectly(client, payload);
      }

      return resolveInvokedNotification(data);
    }

    return insertNotificationDirectly(client, payload);
  },

  async notifyAdmins(input: {
    title: string;
    body: string;
    notificationType: (typeof adminNotificationTypes)[number];
    data?: Json;
  }): Promise<AppNotification[]> {
    const { data: admins, error: adminsError } = await client
      .from('profiles')
      .select('id, expo_push_token')
      .in('role', ['admin', 'super_admin']);

    if (adminsError) {
      throw toServiceError('관리자 목록을 불러오지 못했습니다.', adminsError);
    }

    const payloads = (admins ?? []).map((admin) => ({
      user_id: admin.id,
      title: input.title,
      body: input.body,
      notification_type: input.notificationType,
      data: input.data ?? null,
    }));

    if (payloads.length === 0) {
      return [];
    }

    if (Platform.OS === 'web') {
      return [];
    }

    if (client.functions?.invoke) {
      const results = await Promise.all(
        payloads.map((payload, index) =>
          client.functions!.invoke('send-notification', {
            body: {
              userId: payload.user_id,
              title: payload.title,
              body: payload.body,
              notificationType: payload.notification_type,
              data: payload.data,
              pushToken: admins?.[index]?.expo_push_token ?? null,
            },
          }),
        ),
      );
      const failed = results.find((result) => result.error);

      if (failed) {
        return [];
      }

      return results
        .map((result) => resolveInvokedNotification(result.data))
        .filter((notification): notification is AppNotification =>
          Boolean(notification),
        );
    }

    const { data, error } = await client
      .from('notifications')
      .insert(payloads)
      .select('*');

    if (error) {
      throw toServiceError('관리자 알림을 생성하지 못했습니다.', error);
    }

    return data ?? [];
  },
});

export type BookingNotificationService = ReturnType<
  typeof createBookingNotificationService
>;
