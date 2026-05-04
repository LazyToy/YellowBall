import { createAdminNotificationService } from '../src/services/adminNotificationService';

const notification = {
  id: 'notification-1',
  user_id: 'admin-1',
  title: '새로운 예약',
  body: '새로운 예약이 접수되었습니다.',
  notification_type: 'admin_new_booking',
  data: { bookingId: 'booking-1' },
  read: false,
  sent_at: null,
  created_at: '2026-05-04T00:00:00.000Z',
};

const adminQuery = () => {
  const query = {
    select: jest.fn(() => query),
    eq: jest.fn(() => query),
    single: jest.fn().mockResolvedValue({
      data: { role: 'admin' },
      error: null,
    }),
  };

  return query;
};

describe('adminNotificationService', () => {
  test('관리자 알림은 PRD 이벤트 타입으로 필터링된다', async () => {
    const query = {
      select: jest.fn(() => query),
      eq: jest.fn(() => query),
      in: jest.fn(() => query),
      order: jest.fn().mockResolvedValue({ data: [notification], error: null }),
    };
    const from = jest
      .fn()
      .mockReturnValueOnce(adminQuery())
      .mockReturnValueOnce(query);
    const service = createAdminNotificationService({ from } as never);

    await expect(
      service.getAdminNotifications('admin-1', {
        type: 'admin_new_booking',
      }),
    ).resolves.toEqual([notification]);

    expect(query.in).toHaveBeenCalledWith('notification_type', [
      'admin_new_booking',
      'admin_booking_cancelled',
      'admin_booking_cancel_requested',
      'admin_reschedule_requested',
      'admin_demo_overdue',
      'admin_no_show_risk',
    ]);
    expect(query.eq).toHaveBeenCalledWith(
      'notification_type',
      'admin_new_booking',
    );
  });

  test('관리자 알림 읽음 처리는 본인 알림에만 적용된다', async () => {
    const single = jest.fn().mockResolvedValue({
      data: { ...notification, read: true },
      error: null,
    });
    const select = jest.fn(() => ({ single }));
    const query = {
      update: jest.fn(() => query),
      eq: jest.fn(() => query),
      select,
    };
    const from = jest
      .fn()
      .mockReturnValueOnce(adminQuery())
      .mockReturnValueOnce(query);
    const service = createAdminNotificationService({ from } as never);

    await expect(
      service.markAdminNotificationAsRead('admin-1', 'notification-1'),
    ).resolves.toMatchObject({ read: true });

    expect(query.update).toHaveBeenCalledWith({ read: true });
    expect(query.eq).toHaveBeenCalledWith('id', 'notification-1');
    expect(query.eq).toHaveBeenCalledWith('user_id', 'admin-1');
  });
});
