import type { BadgeVariant } from '@/components/Badge';
import type {
  DemoBookingStatus,
  ServiceBookingStatus,
} from '@/types/database';

export type BookingStatusGroup = 'active' | 'completed' | 'cancelled';

export type ServiceBookingWorkStatus =
  | 'requested'
  | 'approved'
  | 'in_progress'
  | 'completed';

export const serviceBookingWorkStatuses: ServiceBookingWorkStatus[] = [
  'requested',
  'approved',
  'in_progress',
  'completed',
];

export const serviceBookingWorkStatusLabels: Record<
  ServiceBookingWorkStatus,
  string
> = {
  requested: '접수',
  approved: '승인',
  in_progress: '작업중',
  completed: '완료',
};

export const getServiceBookingWorkStatus = (
  status: ServiceBookingStatus,
): ServiceBookingWorkStatus => {
  if (
    [
      'completed',
      'pickup_ready',
      'delivered',
      'done',
      'refund_pending',
      'refund_done',
    ].includes(status)
  ) {
    return 'completed';
  }

  if (['racket_received', 'in_progress'].includes(status)) {
    return 'in_progress';
  }

  if (['approved', 'visit_pending'].includes(status)) {
    return 'approved';
  }

  return 'requested';
};

export const serviceBookingStatusLabels: Record<ServiceBookingStatus, string> = {
  requested: '접수',
  approved: '승인',
  visit_pending: '승인',
  racket_received: '작업중',
  in_progress: '작업중',
  completed: '완료',
  pickup_ready: '완료',
  delivered: '완료',
  done: '완료',
  cancelled_user: '접수',
  cancelled_admin: '관리자 취소',
  rejected: '접수',
  reschedule_requested: '접수',
  no_show: '노쇼',
  refund_pending: '완료',
  refund_done: '완료',
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

export const serviceBookingTimeline: ServiceBookingWorkStatus[] = [
  'requested',
  'approved',
  'in_progress',
  'completed',
];

export const serviceBookingStatusVariant = (
  status: ServiceBookingStatus,
): BadgeVariant => {
  if (getServiceBookingWorkStatus(status) === 'completed') {
    return 'success';
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
