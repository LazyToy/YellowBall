export type BookingStatusLockType = 'service' | 'demo';

const LOCKED_SERVICE_STATUSES = new Set([
  'completed',
  'pickup_ready',
  'delivered',
  'done',
  'refund_pending',
  'refund_done',
]);

const LOCKED_DEMO_STATUSES = new Set(['returned']);
const LOCKED_ORDER_STATUSES = new Set(['delivered']);

export function isBookingStatusLockedAfterCompletion(
  bookingType: BookingStatusLockType,
  status: string,
) {
  return bookingType === 'service'
    ? LOCKED_SERVICE_STATUSES.has(status)
    : LOCKED_DEMO_STATUSES.has(status);
}

export function isOrderStatusLockedAfterCompletion(status: string) {
  return LOCKED_ORDER_STATUSES.has(status);
}

export const COMPLETED_STATUS_LOCK_MESSAGE =
  '이미 완료된 상태는 변경할 수 없습니다.';
