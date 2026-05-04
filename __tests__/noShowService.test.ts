import { createNoShowService } from '../src/services/noShowService';
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
  status: 'no_show',
  user_notes: null,
  admin_notes: null,
  no_show_counted: true,
  created_at: '2026-05-04T00:00:00.000Z',
  updated_at: '2026-05-04T00:00:00.000Z',
};

const countQuery = (count: number) => {
  const result = Promise.resolve({ count, error: null });
  const query = {
    select: jest.fn(() => query),
    eq: jest.fn(() => query),
    then: result.then.bind(result),
    catch: result.catch.bind(result),
    finally: result.finally.bind(result),
  };

  return query;
};

describe('noShowService', () => {
  test('recordNoShow는 RPC로 노쇼 상태와 counted 플래그를 기록한다', async () => {
    const rpc = jest.fn().mockResolvedValue({ data: booking, error: null });
    const service = createNoShowService({ from: jest.fn(), rpc } as never);

    await expect(
      service.recordNoShow('booking-1', 'admin-1'),
    ).resolves.toEqual(booking);

    expect(rpc).toHaveBeenCalledWith('record_service_booking_no_show', {
      p_booking_id: 'booking-1',
      p_admin_id: 'admin-1',
    });
  });

  test('no_show_counted=true인 예약만 제한 횟수에 포함한다', async () => {
    const from = jest.fn().mockReturnValue(countQuery(3));
    const service = createNoShowService({ from, rpc: jest.fn() } as never);

    await expect(service.getNoShowCount('user-1')).resolves.toBe(3);
    await expect(service.isBookingRestricted('user-1')).resolves.toBe(true);

    expect(from).toHaveBeenCalledWith('service_bookings');
  });
});
