import {
  demoBookingTransitions,
  isValidDemoBookingTransition,
  isValidServiceBookingTransition,
  serviceBookingTransitions,
} from '../src/utils/statusTransition';
import {
  serviceBookingStatusLabels,
  serviceBookingStatusVariant,
} from '../src/utils/bookingStatus';
import type { ServiceBookingStatus } from '../src/types/database';

const allServiceStatuses: ServiceBookingStatus[] = [
  'requested',
  'approved',
  'visit_pending',
  'racket_received',
  'in_progress',
  'completed',
  'pickup_ready',
  'delivered',
  'done',
  'cancelled_user',
  'cancelled_admin',
  'rejected',
  'reschedule_requested',
  'no_show',
  'refund_pending',
  'refund_done',
];

describe('booking status utilities', () => {
  test('서비스 예약 상태 라벨은 전체 status를 한국어로 커버한다', () => {
    for (const status of allServiceStatuses) {
      expect(serviceBookingStatusLabels[status]).toBeTruthy();
      expect(serviceBookingStatusVariant(status)).toBeTruthy();
      expect(serviceBookingTransitions[status]).toBeDefined();
    }
  });

  test('서비스 예약 상태 전환은 유효한 경로만 허용한다', () => {
    expect(isValidServiceBookingTransition('requested', 'approved')).toBe(true);
    expect(isValidServiceBookingTransition('requested', 'completed')).toBe(false);
    expect(isValidServiceBookingTransition('in_progress', 'completed')).toBe(true);
    expect(isValidServiceBookingTransition('done', 'approved')).toBe(false);
  });

  test('시타 예약 상태 전환은 booking_type demo 흐름을 분리한다', () => {
    expect(demoBookingTransitions.requested).toContain('approved');
    expect(isValidDemoBookingTransition('approved', 'in_use')).toBe(true);
    expect(isValidDemoBookingTransition('in_use', 'returned')).toBe(true);
    expect(isValidDemoBookingTransition('returned', 'overdue')).toBe(false);
  });
});
