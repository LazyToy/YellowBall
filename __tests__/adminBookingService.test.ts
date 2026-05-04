import { createAdminBookingService } from '../src/services/adminBookingService';
import type { ServiceBooking } from '../src/types/database';

const booking: ServiceBooking = {
  id: 'booking-1',
  user_id: 'user-1',
  racket_id: 'racket-1',
  main_string_id: 'string-1',
  cross_string_id: 'string-2',
  tension_main: 48,
  tension_cross: 46,
  slot_id: 'slot-1',
  delivery_method: 'store_pickup',
  address_id: null,
  status: 'requested',
  user_notes: null,
  admin_notes: null,
  no_show_counted: false,
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

const adminPermissionQuery = (allowed = true) => {
  const query = {
    select: jest.fn(() => query),
    eq: jest.fn(() => query),
    maybeSingle: jest.fn().mockResolvedValue({
      data: { can_manage_bookings: allowed },
      error: null,
    }),
  };

  return query;
};

describe('adminBookingService', () => {
  test('approveBooking은 권한 확인 후 RPC로 상태 변경과 로그 생성을 위임한다', async () => {
    const updated = { ...booking, status: 'approved' as const };
    const rpc = jest.fn().mockResolvedValue({ data: updated, error: null });
    const auditInsert = jest.fn().mockResolvedValue({ error: null });
    const notificationService = {
      createStatusNotification: jest.fn().mockResolvedValue(null),
      notifyAdmins: jest.fn().mockResolvedValue([]),
    };
    const from = jest
      .fn()
      .mockReturnValueOnce(singleQuery({ role: 'super_admin' }))
      .mockReturnValueOnce(singleQuery(booking))
      .mockReturnValueOnce({ insert: auditInsert });
    const service = createAdminBookingService(
      { from, rpc } as never,
      notificationService as never,
    );

    await expect(service.approveBooking('booking-1', 'admin-1')).resolves.toEqual(
      updated,
    );

    expect(rpc).toHaveBeenCalledWith('admin_update_service_booking_status', {
      p_booking_id: 'booking-1',
      p_admin_id: 'admin-1',
      p_new_status: 'approved',
      p_reason: null,
    });
    expect(auditInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'service_booking.status.update',
        target_id: 'booking-1',
      }),
    );
    expect(notificationService.createStatusNotification).toHaveBeenCalledWith({
      userId: 'user-1',
      bookingId: 'booking-1',
      bookingType: 'service',
      status: 'approved',
      reason: undefined,
    });
  });

  test('rejectBooking은 거절 사유와 슬롯 반환 액션 감사 로그를 남긴다', async () => {
    const updated = { ...booking, status: 'rejected' as const };
    const rpc = jest.fn().mockResolvedValue({ data: updated, error: null });
    const auditInsert = jest.fn().mockResolvedValue({ error: null });
    const notificationService = {
      createStatusNotification: jest.fn().mockResolvedValue(null),
      notifyAdmins: jest.fn().mockResolvedValue([]),
    };
    const from = jest
      .fn()
      .mockReturnValueOnce(singleQuery({ role: 'admin' }))
      .mockReturnValueOnce(adminPermissionQuery(true))
      .mockReturnValueOnce(singleQuery(booking))
      .mockReturnValueOnce({ insert: auditInsert });
    const service = createAdminBookingService(
      { from, rpc } as never,
      notificationService as never,
    );

    await expect(
      service.rejectBooking('booking-1', 'admin-1', '재고 부족'),
    ).resolves.toEqual(updated);

    expect(rpc).toHaveBeenCalledWith(
      'admin_update_service_booking_status',
      expect.objectContaining({
        p_new_status: 'rejected',
        p_reason: '재고 부족',
      }),
    );
    expect(auditInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'service_booking.status.update.release_slot',
      }),
    );
    expect(notificationService.createStatusNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        status: 'rejected',
        reason: '재고 부족',
      }),
    );
    expect(notificationService.notifyAdmins).not.toHaveBeenCalled();
  });

  test('무효 전환과 권한 없는 관리자는 차단한다', async () => {
    const invalidService = createAdminBookingService({
      from: jest
        .fn()
        .mockReturnValueOnce(singleQuery({ role: 'super_admin' }))
        .mockReturnValueOnce(singleQuery(booking)),
      rpc: jest.fn(),
    } as never);

    await expect(
      invalidService.updateStatus('booking-1', 'admin-1', 'completed'),
    ).rejects.toThrow('허용되지 않는 예약 상태 전환입니다.');

    const deniedService = createAdminBookingService({
      from: jest
        .fn()
        .mockReturnValueOnce(singleQuery({ role: 'admin' }))
        .mockReturnValueOnce(adminPermissionQuery(false)),
      rpc: jest.fn(),
    } as never);

    await expect(
      deniedService.approveBooking('booking-1', 'admin-1'),
    ).rejects.toThrow('예약 관리 권한이 없습니다.');
  });
});
