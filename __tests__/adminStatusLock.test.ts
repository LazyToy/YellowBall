import {
  isBookingStatusLockedAfterCompletion,
  isOrderStatusLockedAfterCompletion,
} from '../apps/admin-web/lib/admin-status-lock';

describe('admin status completion lock', () => {
  test('service bookings cannot be changed after a completed-equivalent status', () => {
    expect(isBookingStatusLockedAfterCompletion('service', 'completed')).toBe(true);
    expect(isBookingStatusLockedAfterCompletion('service', 'pickup_ready')).toBe(true);
    expect(isBookingStatusLockedAfterCompletion('service', 'delivered')).toBe(true);
    expect(isBookingStatusLockedAfterCompletion('service', 'done')).toBe(true);
    expect(isBookingStatusLockedAfterCompletion('service', 'refund_pending')).toBe(true);
    expect(isBookingStatusLockedAfterCompletion('service', 'refund_done')).toBe(true);
    expect(isBookingStatusLockedAfterCompletion('service', 'in_progress')).toBe(false);
  });

  test('demo bookings cannot be changed after returned completion', () => {
    expect(isBookingStatusLockedAfterCompletion('demo', 'returned')).toBe(true);
    expect(isBookingStatusLockedAfterCompletion('demo', 'in_use')).toBe(false);
  });

  test('shop orders cannot be changed after delivery completion but paid can still progress', () => {
    expect(isOrderStatusLockedAfterCompletion('delivered')).toBe(true);
    expect(isOrderStatusLockedAfterCompletion('paid')).toBe(false);
  });
});
