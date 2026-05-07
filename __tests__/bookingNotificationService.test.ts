import {
  createBookingNotificationService,
  getBookingNotificationMessage,
} from '../src/services/bookingNotificationService';

const notification = {
  id: 'notification-1',
  user_id: 'user-1',
  title: '예약 승인',
  body: '예약이 승인되었습니다.',
  notification_type: 'service_approved',
  data: { bookingId: 'booking-1' },
  read: false,
  sent_at: null,
  created_at: '2026-05-04T00:00:00.000Z',
};

const prefQuery = (preferences: unknown) => {
  const query = {
    select: jest.fn(() => query),
    eq: jest.fn(() => query),
    maybeSingle: jest.fn().mockResolvedValue({ data: preferences, error: null }),
  };

  return query;
};

const profileQuery = (token = 'ExponentPushToken[user]') => {
  const query = {
    select: jest.fn(() => query),
    eq: jest.fn(() => query),
    maybeSingle: jest.fn().mockResolvedValue({
      data: { expo_push_token: token },
      error: null,
    }),
  };

  return query;
};

describe('bookingNotificationService', () => {
  test('상태별 한국어 메시지와 거절 사유를 만든다', () => {
    expect(getBookingNotificationMessage('service', 'requested').body).toBe(
      '예약이 접수되었습니다.',
    );
    expect(getBookingNotificationMessage('service', 'rejected', '시간 만료').body).toContain(
      '사유: 시간 만료',
    );
    expect(getBookingNotificationMessage('demo', 'overdue').title).toBe('반납 지연');
  });

  test('예약 알림 설정 OFF면 알림을 만들지 않는다', async () => {
    const insert = jest.fn();
    const from = jest
      .fn()
      .mockReturnValueOnce(prefQuery({ booking_notifications: false }))
      .mockReturnValueOnce({ insert });
    const service = createBookingNotificationService({ from } as never);

    await expect(
      service.createStatusNotification({
        userId: 'user-1',
        bookingId: 'booking-1',
        bookingType: 'service',
        status: 'approved',
      }),
    ).resolves.toBeNull();
    expect(insert).not.toHaveBeenCalled();
  });

  test('quiet hours 안에서는 silent 데이터로 알림을 생성한다', async () => {
    const single = jest
      .fn()
      .mockResolvedValue({ data: notification, error: null });
    const select = jest.fn(() => ({ single }));
    const insert = jest.fn(() => ({ select }));
    const from = jest
      .fn()
      .mockReturnValueOnce(
        prefQuery({
          booking_notifications: true,
          quiet_hours_enabled: true,
          quiet_hours_start: '22:00',
          quiet_hours_end: '08:00',
        }),
      )
      .mockReturnValueOnce({ insert });
    const service = createBookingNotificationService(
      { from } as never,
      () => new Date(2026, 4, 4, 23, 30),
    );

    await expect(
      service.createStatusNotification({
        userId: 'user-1',
        bookingId: 'booking-1',
        bookingType: 'service',
        status: 'approved',
      }),
    ).resolves.toEqual(notification);

    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        notification_type: 'service_approved',
        data: expect.objectContaining({ silent: true }),
      }),
    );
  });

  test('Edge Function이 있으면 send-notification을 호출해 실제 푸시 경로를 탄다', async () => {
    const invoke = jest.fn().mockResolvedValue({
      data: { notification },
      error: null,
    });
    const from = jest
      .fn()
      .mockReturnValueOnce(
        prefQuery({
          booking_notifications: true,
          quiet_hours_enabled: false,
          quiet_hours_start: null,
          quiet_hours_end: null,
        }),
      )
      .mockReturnValueOnce(profileQuery('ExponentPushToken[user]'));
    const service = createBookingNotificationService({
      from,
      functions: { invoke },
    } as never);

    await expect(
      service.createStatusNotification({
        userId: 'user-1',
        bookingId: 'booking-1',
        bookingType: 'service',
        status: 'approved',
      }),
    ).resolves.toEqual(notification);

    expect(invoke).toHaveBeenCalledWith('send-notification', {
      body: expect.objectContaining({
        userId: 'user-1',
        notificationType: 'service_approved',
        pushToken: 'ExponentPushToken[user]',
      }),
    });
  });

  test('관리자 알림도 Edge Function을 통해 관리자별 푸시를 발송한다', async () => {
    const adminNotification = {
      ...notification,
      id: 'admin-notification-1',
      user_id: 'admin-1',
      notification_type: 'admin_new_booking',
    };
    const invoke = jest.fn().mockResolvedValue({
      data: { notification: adminNotification },
      error: null,
    });
    const adminQuery = {
      select: jest.fn(() => adminQuery),
      in: jest.fn().mockResolvedValue({
        data: [
          {
            id: 'admin-1',
            expo_push_token: 'ExponentPushToken[admin]',
          },
        ],
        error: null,
      }),
    };
    const service = createBookingNotificationService({
      from: jest.fn(() => adminQuery),
      functions: { invoke },
    } as never);

    await expect(
      service.notifyAdmins({
        title: '새로운 예약',
        body: '새로운 예약이 접수되었습니다.',
        notificationType: 'admin_new_booking',
        data: { bookingId: 'booking-1' },
      }),
    ).resolves.toEqual([adminNotification]);

    expect(invoke).toHaveBeenCalledWith('send-notification', {
      body: expect.objectContaining({
        userId: 'admin-1',
        notificationType: 'admin_new_booking',
        pushToken: 'ExponentPushToken[admin]',
      }),
    });
  });

  test('Edge Function status notification failure falls back to direct notification insert', async () => {
    const invoke = jest.fn().mockResolvedValue({
      data: null,
      error: { message: 'Failed to send a request to the Edge Function' },
    });
    const single = jest
      .fn()
      .mockResolvedValue({ data: notification, error: null });
    const select = jest.fn(() => ({ single }));
    const insert = jest.fn(() => ({ select }));
    const from = jest
      .fn()
      .mockReturnValueOnce(
        prefQuery({
          booking_notifications: true,
          quiet_hours_enabled: false,
          quiet_hours_start: null,
          quiet_hours_end: null,
        }),
      )
      .mockReturnValueOnce(profileQuery('ExponentPushToken[user]'))
      .mockReturnValueOnce({ insert });
    const service = createBookingNotificationService({
      from,
      functions: { invoke },
    } as never);

    await expect(
      service.createStatusNotification({
        userId: 'user-1',
        bookingId: 'booking-1',
        bookingType: 'service',
        status: 'approved',
      }),
    ).resolves.toEqual(notification);

    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-1',
        notification_type: 'service_approved',
      }),
    );
  });

  test('Edge Function admin notification failure is treated as best effort', async () => {
    const invoke = jest.fn().mockResolvedValue({
      data: null,
      error: { message: 'Failed to send a request to the Edge Function' },
    });
    const adminQuery = {
      select: jest.fn(() => adminQuery),
      in: jest.fn().mockResolvedValue({
        data: [
          {
            id: 'admin-1',
            expo_push_token: 'ExponentPushToken[admin]',
          },
        ],
        error: null,
      }),
    };
    const service = createBookingNotificationService({
      from: jest.fn(() => adminQuery),
      functions: { invoke },
    } as never);

    await expect(
      service.notifyAdmins({
        title: '새로운 예약',
        body: '새로운 예약이 접수되었습니다.',
        notificationType: 'admin_new_booking',
        data: { bookingId: 'booking-1' },
      }),
    ).resolves.toEqual([]);
  });
});
