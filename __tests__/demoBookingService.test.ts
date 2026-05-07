import { createDemoBookingService } from '../src/services/demoBookingService';
import type { BookingSlot, DemoBooking, DemoRacket } from '../src/types/database';

const demoRacket: DemoRacket = {
  id: 'demo-1',
  brand: 'Wilson',
  model: 'Blade Demo',
  grip_size: 'G2',
  weight: 305,
  head_size: '98',
  photo_url: null,
  description: null,
  status: 'active',
  is_demo_enabled: true,
  is_active: true,
  created_at: '2026-05-03T00:00:00.000Z',
  updated_at: '2026-05-03T00:00:00.000Z',
};

const slot: BookingSlot = {
  id: 'slot-1',
  service_type: 'demo',
  start_time: '2099-05-04T01:00:00.000Z',
  end_time: '2099-05-04T03:00:00.000Z',
  capacity: 1,
  reserved_count: 0,
  is_blocked: false,
  block_reason: null,
  created_at: '2026-05-03T00:00:00.000Z',
  updated_at: '2026-05-03T00:00:00.000Z',
};

const demoBooking: DemoBooking = {
  id: 'demo-booking-1',
  user_id: 'user-1',
  demo_racket_id: 'demo-1',
  slot_id: 'slot-1',
  start_time: '2099-05-04T01:00:00.000Z',
  expected_return_time: '2099-05-04T03:00:00.000Z',
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

const overlapQuery = (data: unknown[] = []) => {
  const query = {
    select: jest.fn(() => query),
    eq: jest.fn(() => query),
    in: jest.fn(() => query),
    lt: jest.fn(() => query),
    gt: jest.fn().mockResolvedValue({ data, error: null }),
  };

  return query;
};

const input = {
  userId: 'user-1',
  demoRacketId: 'demo-1',
  slotId: 'slot-1',
  expectedReturnTime: '2099-05-04T03:00:00.000Z',
};

describe('demoBookingService', () => {
  test('createDemoBooking은 스트링/텐션 없이 시타 예약 RPC를 호출한다', async () => {
    const rpc = jest.fn().mockResolvedValue({ data: demoBooking, error: null });
    const notificationService = {
      createStatusNotification: jest.fn().mockResolvedValue(null),
      notifyAdmins: jest.fn().mockResolvedValue([]),
    };
    const overlap = overlapQuery();
    const from = jest
      .fn()
      .mockReturnValueOnce(singleQuery({ status: 'active' }))
      .mockReturnValueOnce(singleQuery(demoRacket))
      .mockReturnValueOnce(singleQuery(slot))
      .mockReturnValueOnce(overlap);
    const service = createDemoBookingService(
      { from, rpc } as never,
      notificationService as never,
    );

    await expect(service.createDemoBooking(input)).resolves.toEqual(demoBooking);

    expect(rpc).toHaveBeenCalledWith('create_demo_booking_transaction', {
      p_user_id: 'user-1',
      p_demo_racket_id: 'demo-1',
      p_slot_id: 'slot-1',
      p_start_time: '2099-05-04T01:00:00.000Z',
      p_expected_return_time: '2099-05-04T03:00:00.000Z',
      p_user_notes: null,
    });
    expect(JSON.stringify(rpc.mock.calls[0][1])).not.toContain('string');
    expect(JSON.stringify(rpc.mock.calls[0][1])).not.toContain('tension');
    expect(notificationService.createStatusNotification).toHaveBeenCalledWith({
      userId: 'user-1',
      bookingId: 'demo-booking-1',
      bookingType: 'demo',
      status: 'requested',
    });
    expect(notificationService.notifyAdmins).toHaveBeenCalledWith(
      expect.objectContaining({
        notificationType: 'admin_new_booking',
      }),
    );
  });

  test('중복 시간과 비활성 라켓을 거부한다', async () => {
    const overlapService = createDemoBookingService({
      from: jest
        .fn()
        .mockReturnValueOnce(singleQuery({ status: 'active' }))
        .mockReturnValueOnce(singleQuery(demoRacket))
        .mockReturnValueOnce(singleQuery(slot))
        .mockReturnValueOnce(
          overlapQuery([
            {
              start_time: '2099-05-04T02:00:00.000Z',
              expected_return_time: '2099-05-04T04:00:00.000Z',
              status: 'approved',
            },
          ]),
        ),
      rpc: jest.fn(),
    } as never);

    await expect(overlapService.createDemoBooking(input)).rejects.toThrow(
      '해당 시간에는 시타 예약을 만들 수 없습니다.',
    );

    const inactiveService = createDemoBookingService({
      from: jest
        .fn()
        .mockReturnValueOnce(singleQuery({ status: 'active' }))
        .mockReturnValueOnce(singleQuery({ ...demoRacket, is_demo_enabled: false }))
        .mockReturnValueOnce(singleQuery(slot))
        .mockReturnValueOnce(overlapQuery()),
      rpc: jest.fn(),
    } as never);

    await expect(inactiveService.createDemoBooking(input)).rejects.toThrow(
      '해당 시간에는 시타 예약을 만들 수 없습니다.',
    );
  });

  test('제재 사용자와 잘못된 반납 시간을 거부한다', async () => {
    const suspendedService = createDemoBookingService({
      from: jest.fn().mockReturnValue(singleQuery({ status: 'suspended' })),
      rpc: jest.fn(),
    } as never);

    await expect(suspendedService.createDemoBooking(input)).rejects.toThrow(
      '제재된 사용자는 예약할 수 없습니다.',
    );

    const invalidReturnService = createDemoBookingService({
      from: jest
        .fn()
        .mockReturnValueOnce(singleQuery({ status: 'active' }))
        .mockReturnValueOnce(singleQuery(demoRacket))
        .mockReturnValueOnce(singleQuery(slot)),
      rpc: jest.fn(),
    } as never);

    await expect(
      invalidReturnService.createDemoBooking({
        ...input,
        expectedReturnTime: '2026-05-04T09:00:00.000Z',
      }),
    ).rejects.toThrow('반납 예정 시간은 시작 시간보다 늦어야 합니다.');
  });
});
