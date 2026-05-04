import { createBookingService } from '../src/services/bookingService';
import type { BookingSlot, ServiceBooking } from '../src/types/database';

const slot: BookingSlot = {
  id: 'slot-1',
  service_type: 'stringing',
  start_time: '2026-05-04T09:00:00.000Z',
  end_time: '2026-05-04T10:00:00.000Z',
  capacity: 2,
  reserved_count: 1,
  is_blocked: false,
  block_reason: null,
  created_at: '2026-05-03T00:00:00.000Z',
  updated_at: '2026-05-03T00:00:00.000Z',
};

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

const queryResult = (data: unknown, error: unknown = null) => {
  const query = {
    select: jest.fn(() => query),
    eq: jest.fn(() => query),
    single: jest.fn().mockResolvedValue({ data, error }),
  };

  return query;
};

const input = {
  userId: 'user-1',
  racketId: 'racket-1',
  mainStringId: 'string-1',
  crossStringId: 'string-2',
  tensionMain: 48,
  tensionCross: 46,
  slotId: 'slot-1',
  deliveryMethod: 'store_pickup' as const,
};

describe('bookingService', () => {
  test('createBooking은 사전 검증 후 RPC 트랜잭션으로 예약을 생성한다', async () => {
    const rpc = jest.fn().mockResolvedValue({ data: booking, error: null });
    const notificationService = {
      createStatusNotification: jest.fn().mockResolvedValue(null),
      notifyAdmins: jest.fn().mockResolvedValue([]),
    };
    const from = jest
      .fn()
      .mockReturnValueOnce(queryResult({ status: 'active' }))
      .mockReturnValueOnce(queryResult({ id: 'racket-1', owner_id: 'user-1' }))
      .mockReturnValueOnce(queryResult({ id: 'string-1', is_active: true }))
      .mockReturnValueOnce(queryResult({ id: 'string-2', is_active: true }))
      .mockReturnValueOnce(queryResult(slot));
    const service = createBookingService(
      { from, rpc } as never,
      notificationService as never,
      { isBookingRestricted: jest.fn().mockResolvedValue(false) } as never,
    );

    await expect(service.createBooking(input)).resolves.toEqual(booking);

    expect(rpc).toHaveBeenCalledWith('create_service_booking_transaction', {
      p_user_id: 'user-1',
      p_racket_id: 'racket-1',
      p_main_string_id: 'string-1',
      p_cross_string_id: 'string-2',
      p_tension_main: 48,
      p_tension_cross: 46,
      p_slot_id: 'slot-1',
      p_delivery_method: 'store_pickup',
      p_address_id: null,
      p_user_notes: null,
    });
    expect(notificationService.createStatusNotification).toHaveBeenCalledWith({
      userId: 'user-1',
      bookingId: 'booking-1',
      bookingType: 'service',
      status: 'requested',
    });
    expect(notificationService.notifyAdmins).toHaveBeenCalledWith(
      expect.objectContaining({
        notificationType: 'admin_new_booking',
      }),
    );
  });

  test('만석/차단 슬롯과 제재 사용자를 거부한다', async () => {
    const suspendedService = createBookingService({
      from: jest.fn().mockReturnValue(queryResult({ status: 'suspended' })),
      rpc: jest.fn(),
    } as never);

    await expect(suspendedService.createBooking(input)).rejects.toThrow(
      '제재된 사용자는 예약할 수 없습니다.',
    );

    const blockedService = createBookingService({
      from: jest
        .fn()
        .mockReturnValueOnce(queryResult({ status: 'active' }))
        .mockReturnValueOnce(queryResult({ id: 'racket-1', owner_id: 'user-1' }))
        .mockReturnValueOnce(queryResult({ id: 'string-1', is_active: true }))
        .mockReturnValueOnce(queryResult({ id: 'string-2', is_active: true }))
        .mockReturnValueOnce(queryResult({ ...slot, is_blocked: true })),
      rpc: jest.fn(),
    } as never, undefined, {
      isBookingRestricted: jest.fn().mockResolvedValue(false),
    } as never);

    await expect(blockedService.createBooking(input)).rejects.toThrow(
      '차단된 슬롯은 예약할 수 없습니다.',
    );
  });

  test('배송 예약은 주소가 필요하고 텐션 범위를 벗어나면 차단한다', async () => {
    const service = createBookingService({ from: jest.fn(), rpc: jest.fn() } as never);

    await expect(
      service.createBooking({ ...input, deliveryMethod: 'parcel' }),
    ).rejects.toThrow('택배 또는 퀵 배송 예약에는 주소가 필요합니다.');

    await expect(service.createBooking({ ...input, tensionMain: 72 })).rejects.toThrow(
      '메인 텐션은 20에서 70 사이의 정수여야 합니다.',
    );
  });

  test('노쇼 3회 이상 사용자는 예약 생성을 차단한다', async () => {
    const service = createBookingService(
      {
        from: jest.fn().mockReturnValueOnce(queryResult({ status: 'active' })),
        rpc: jest.fn(),
      } as never,
      undefined,
      { isBookingRestricted: jest.fn().mockResolvedValue(true) } as never,
    );

    await expect(service.createBooking(input)).rejects.toThrow(
      '노쇼 3회 이상 사용자는 예약할 수 없습니다.',
    );
  });

  test('24시간 전 예약 취소는 RPC로 상태 변경과 슬롯 감소를 위임한다', async () => {
    const futureSlot = {
      ...slot,
      start_time: '2099-05-04T09:00:00.000Z',
    };
    const bookingWithSlot = {
      ...booking,
      status: 'approved' as const,
      booking_slots: futureSlot,
    };
    const cancelled = {
      ...booking,
      status: 'cancelled_user' as const,
    };
    const rpc = jest.fn().mockResolvedValue({ data: cancelled, error: null });
    const notificationService = {
      createStatusNotification: jest.fn().mockResolvedValue(null),
      notifyAdmins: jest.fn().mockResolvedValue([]),
    };
    const from = jest.fn().mockReturnValueOnce(queryResult(bookingWithSlot));
    const service = createBookingService(
      { from, rpc } as never,
      notificationService as never,
      { isBookingRestricted: jest.fn().mockResolvedValue(false) } as never,
    );

    await expect(
      service.cancelBooking('booking-1', 'user-1'),
    ).resolves.toMatchObject({
      booking: cancelled,
      cancelled: true,
      requiresAdminApproval: false,
    });

    expect(rpc).toHaveBeenCalledWith('user_cancel_service_booking', {
      p_booking_id: 'booking-1',
      p_user_id: 'user-1',
    });
    expect(notificationService.notifyAdmins).toHaveBeenCalledWith(
      expect.objectContaining({ notificationType: 'admin_booking_cancelled' }),
    );
  });

  test('24시간 이내 취소는 상태 변경 없이 취소 요청 로그를 남긴다', async () => {
    const soonSlot = {
      ...slot,
      start_time: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    };
    const bookingWithSlot = {
      ...booking,
      status: 'approved' as const,
      booking_slots: soonSlot,
    };
    const logInsert = jest.fn().mockResolvedValue({ error: null });
    const notificationService = {
      createStatusNotification: jest.fn().mockResolvedValue(null),
      notifyAdmins: jest.fn().mockResolvedValue([]),
    };
    const from = jest
      .fn()
      .mockReturnValueOnce(queryResult(bookingWithSlot))
      .mockReturnValueOnce({ insert: logInsert });
    const rpc = jest.fn();
    const service = createBookingService(
      { from, rpc } as never,
      notificationService as never,
      { isBookingRestricted: jest.fn().mockResolvedValue(false) } as never,
    );

    await expect(
      service.cancelBooking('booking-1', 'user-1'),
    ).resolves.toMatchObject({
      booking: bookingWithSlot,
      cancelled: false,
      requiresAdminApproval: true,
    });

    expect(rpc).not.toHaveBeenCalled();
    expect(logInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        booking_type: 'service',
        new_status: 'cancel_requested',
      }),
    );
  });

  test('작업 시작 이후 예약 취소는 거부한다', async () => {
    const service = createBookingService({
      from: jest.fn().mockReturnValueOnce(
        queryResult({
          ...booking,
          status: 'in_progress',
          booking_slots: slot,
        }),
      ),
      rpc: jest.fn(),
    } as never);

    await expect(
      service.cancelBooking('booking-1', 'user-1'),
    ).rejects.toThrow('작업 시작 이후에는 예약을 취소할 수 없습니다.');
  });
});
