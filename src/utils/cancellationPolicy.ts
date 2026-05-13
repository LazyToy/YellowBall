import type { BookingSlot, ServiceBooking } from '@/types/database';

export type BookingWithSlot = Pick<ServiceBooking, 'status'> & {
  booking_slots?: Pick<BookingSlot, 'start_time'> | null;
};

export const DEFAULT_FREE_CANCELLATION_HOURS = 6;

const hoursToMs = (hours: number) =>
  Math.max(0, hours) * 60 * 60 * 1000;

const statusesAfterWorkStart = new Set<ServiceBooking['status']>([
  'in_progress',
  'completed',
  'pickup_ready',
  'delivered',
  'done',
  'refund_pending',
  'refund_done',
]);

const cancelledOrClosedStatuses = new Set<ServiceBooking['status']>([
  'cancelled_user',
  'cancelled_admin',
  'rejected',
  'no_show',
]);

export const getCancellationDeadline = (
  booking: BookingWithSlot,
  freeCancellationHours = DEFAULT_FREE_CANCELLATION_HOURS,
) => {
  const startTime = booking.booking_slots?.start_time;

  if (!startTime) {
    return null;
  }

  const startsAt = new Date(startTime).getTime();

  if (!Number.isFinite(startsAt)) {
    return null;
  }

  return new Date(startsAt - hoursToMs(freeCancellationHours));
};

export const canCancelFreely = (
  booking: BookingWithSlot,
  now: Date = new Date(),
  freeCancellationHours = DEFAULT_FREE_CANCELLATION_HOURS,
) => {
  const deadline = getCancellationDeadline(booking, freeCancellationHours);

  return deadline !== null && now.getTime() <= deadline.getTime();
};

export const canRequestCancellation = (booking: BookingWithSlot) =>
  !statusesAfterWorkStart.has(booking.status) &&
  !cancelledOrClosedStatuses.has(booking.status);

export const getRemainingTime = (
  booking: BookingWithSlot,
  now: Date = new Date(),
  freeCancellationHours = DEFAULT_FREE_CANCELLATION_HOURS,
) => {
  const deadline = getCancellationDeadline(booking, freeCancellationHours);

  if (!deadline) {
    return {
      totalMs: 0,
      hours: 0,
      minutes: 0,
      isPastDeadline: true,
    };
  }

  const totalMs = Math.max(deadline.getTime() - now.getTime(), 0);

  return {
    totalMs,
    hours: Math.floor(totalMs / (60 * 60 * 1000)),
    minutes: Math.floor((totalMs % (60 * 60 * 1000)) / (60 * 1000)),
    isPastDeadline: totalMs === 0,
  };
};
