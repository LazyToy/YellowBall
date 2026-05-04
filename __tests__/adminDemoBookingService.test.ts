import { createAdminDemoBookingService } from '../src/services/adminDemoBookingService';
import type { DemoBooking } from '../src/types/database';

const demoBooking: DemoBooking = {
  id: 'demo-booking-1',
  user_id: 'user-1',
  demo_racket_id: 'demo-1',
  slot_id: 'slot-1',
  start_time: '2026-05-04T10:00:00.000Z',
  expected_return_time: '2026-05-04T12:00:00.000Z',
  actual_return_time: null,
  status: 'requested',
  user_notes: null,
  admin_notes: null,
  created_at: '2026-05-04T00:00:00.000Z',
  updated_at: '2026-05-04T00:00:00.000Z',
};

const singleQuery = (data: unknown, error: unknown = null) => {
  const query = {
    select: jest.fn(() => query),
    eq: jest.fn(() => query),
    single: jest.fn().mockResolvedValue({ data, error }),
  };

  return query;
};

describe('adminDemoBookingService', () => {
  test('approveDemo는 booking_type demo 로그 RPC를 호출한다', async () => {
    const updated = { ...demoBooking, status: 'approved' as const };
    const rpc = jest.fn().mockResolvedValue({ data: updated, error: null });
    const auditInsert = jest.fn().mockResolvedValue({ error: null });
    const notificationService = {
      createStatusNotification: jest.fn().mockResolvedValue(null),
      notifyAdmins: jest.fn().mockResolvedValue([]),
    };
    const from = jest
      .fn()
      .mockReturnValueOnce(singleQuery({ role: 'super_admin' }))
      .mockReturnValueOnce(singleQuery(demoBooking))
      .mockReturnValueOnce({ insert: auditInsert });
    const service = createAdminDemoBookingService(
      { from, rpc } as never,
      notificationService as never,
    );

    await expect(
      service.approveDemo('demo-booking-1', 'admin-1'),
    ).resolves.toEqual(updated);

    expect(rpc).toHaveBeenCalledWith('admin_update_demo_booking_status', {
      p_booking_id: 'demo-booking-1',
      p_admin_id: 'admin-1',
      p_new_status: 'approved',
      p_reason: null,
      p_actual_return_time: null,
    });
    expect(auditInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'demo_booking.status.update',
        target_table: 'demo_bookings',
      }),
    );
    expect(notificationService.createStatusNotification).toHaveBeenCalledWith({
      userId: 'user-1',
      bookingId: 'demo-booking-1',
      bookingType: 'demo',
      status: 'approved',
      reason: undefined,
    });
  });

  test('반납 처리에는 실제 반납 시간이 필요하고 유효 전환만 허용한다', async () => {
    const inUseBooking = { ...demoBooking, status: 'in_use' as const };
    const returned = {
      ...inUseBooking,
      status: 'returned' as const,
      actual_return_time: '2026-05-04T12:10:00.000Z',
    };
    const rpc = jest.fn().mockResolvedValue({ data: returned, error: null });
    const notificationService = {
      createStatusNotification: jest.fn().mockResolvedValue(null),
      notifyAdmins: jest.fn().mockResolvedValue([]),
    };
    const from = jest
      .fn()
      .mockReturnValueOnce(singleQuery({ role: 'super_admin' }))
      .mockReturnValueOnce(singleQuery(inUseBooking))
      .mockReturnValueOnce({ insert: jest.fn().mockResolvedValue({ error: null }) });
    const service = createAdminDemoBookingService(
      { from, rpc } as never,
      notificationService as never,
    );

    await expect(
      service.markReturned(
        'demo-booking-1',
        'admin-1',
        '2026-05-04T12:10:00.000Z',
      ),
    ).resolves.toEqual(returned);

    const invalidService = createAdminDemoBookingService({
      from: jest
        .fn()
        .mockReturnValueOnce(singleQuery({ role: 'super_admin' }))
        .mockReturnValueOnce(singleQuery({ ...demoBooking, status: 'returned' })),
      rpc: jest.fn(),
    } as never);

    await expect(
      invalidService.markOverdue('demo-booking-1', 'admin-1'),
    ).rejects.toThrow('허용되지 않는 시타 예약 상태 전환입니다.');
  });
});
