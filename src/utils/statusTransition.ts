import type {
  DemoBookingStatus,
  ServiceBookingStatus,
} from '@/types/database';

export const serviceBookingTransitions: Record<
  ServiceBookingStatus,
  ServiceBookingStatus[]
> = {
  requested: [
    'approved',
    'in_progress',
    'completed',
    'rejected',
    'reschedule_requested',
    'cancelled_admin',
    'cancelled_user',
  ],
  approved: ['requested', 'in_progress', 'completed', 'cancelled_admin', 'cancelled_user'],
  visit_pending: ['requested', 'approved', 'in_progress', 'completed', 'no_show', 'cancelled_user'],
  racket_received: ['requested', 'approved', 'in_progress', 'completed'],
  in_progress: ['requested', 'approved', 'completed'],
  completed: ['requested', 'approved', 'in_progress', 'pickup_ready', 'delivered'],
  pickup_ready: ['done'],
  delivered: ['done'],
  done: [],
  cancelled_user: [],
  cancelled_admin: [],
  rejected: [],
  reschedule_requested: ['approved', 'cancelled_admin', 'cancelled_user'],
  no_show: [],
  refund_pending: ['refund_done'],
  refund_done: [],
};

export const demoBookingTransitions: Record<
  DemoBookingStatus,
  DemoBookingStatus[]
> = {
  requested: ['approved', 'rejected', 'cancelled_admin'],
  approved: ['in_use', 'cancelled_admin', 'no_show'],
  in_use: ['returned', 'overdue'],
  returned: [],
  cancelled_user: [],
  cancelled_admin: [],
  rejected: [],
  no_show: [],
  overdue: ['returned'],
};

export const isValidServiceBookingTransition = (
  current: ServiceBookingStatus,
  next: ServiceBookingStatus,
) => serviceBookingTransitions[current]?.includes(next) ?? false;

export const isValidDemoBookingTransition = (
  current: DemoBookingStatus,
  next: DemoBookingStatus,
) => demoBookingTransitions[current]?.includes(next) ?? false;
