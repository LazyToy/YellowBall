import type { BadgeVariant } from '@/components/Badge';
import type {
  DemoBookingStatus,
  ServiceBookingStatus,
} from '@/types/database';

export type BookingStatusGroup = 'active' | 'completed' | 'cancelled';

export const serviceBookingStatusLabels: Record<ServiceBookingStatus, string> = {
  requested: '접수',
  approved: '승인',
  visit_pending: '방문 대기',
  racket_received: '라켓 입고',
  in_progress: '작업중',
  completed: '작업 완료',
  pickup_ready: '픽업 가능',
  delivered: '배송 완료',
  done: '완료',
  cancelled_user: '사용자 취소',
  cancelled_admin: '관리자 취소',
  rejected: '거절',
  reschedule_requested: '일정 변경',
  no_show: '노쇼',
  refund_pending: '환불 대기',
  refund_done: '환불 완료',
};

export const demoBookingStatusLabels: Record<DemoBookingStatus, string> = {
  requested: '접수',
  approved: '승인',
  in_use: '사용중',
  returned: '반납 완료',
  cancelled_user: '사용자 취소',
  cancelled_admin: '관리자 취소',
  rejected: '거절',
  no_show: '노쇼',
  overdue: '반납 지연',
};

export const serviceBookingTimeline: ServiceBookingStatus[] = [
  'requested',
  'approved',
  'visit_pending',
  'racket_received',
  'in_progress',
  'completed',
  'pickup_ready',
  'done',
];

export const serviceBookingStatusVariant = (
  status: ServiceBookingStatus,
): BadgeVariant => {
  if (
    ['done', 'delivered', 'pickup_ready', 'completed'].includes(status)
  ) {
    return 'success';
  }

  if (
    ['cancelled_user', 'cancelled_admin', 'rejected', 'no_show'].includes(status)
  ) {
    return 'destructive';
  }

  if (['reschedule_requested', 'refund_pending'].includes(status)) {
    return 'warning';
  }

  return 'secondary';
};

export const demoBookingStatusVariant = (
  status: DemoBookingStatus,
): BadgeVariant => {
  if (status === 'returned') {
    return 'success';
  }

  if (
    ['cancelled_user', 'cancelled_admin', 'rejected', 'no_show'].includes(status)
  ) {
    return 'destructive';
  }

  if (status === 'overdue') {
    return 'warning';
  }

  return 'secondary';
};

export const serviceBookingStatusGroup = (
  status: ServiceBookingStatus,
): BookingStatusGroup => {
  if (
    ['done', 'delivered', 'pickup_ready', 'completed', 'refund_done'].includes(
      status,
    )
  ) {
    return 'completed';
  }

  if (
    [
      'cancelled_user',
      'cancelled_admin',
      'rejected',
      'no_show',
      'refund_pending',
    ].includes(status)
  ) {
    return 'cancelled';
  }

  return 'active';
};
