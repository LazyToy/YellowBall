import type { ServiceBooking } from '@/types/database';

type BookingRelations = ServiceBooking & {
  user_rackets?: {
    brand?: string | null;
    model?: string | null;
  } | null;
  booking_slots?: {
    start_time?: string | null;
    end_time?: string | null;
  } | null;
  main_string?: {
    brand?: string | null;
    name?: string | null;
  } | null;
  cross_string?: {
    brand?: string | null;
    name?: string | null;
  } | null;
};

const joinParts = (...parts: (string | null | undefined)[]) =>
  parts.filter(Boolean).join(' ');

export const formatBookingDateTime = (value?: string | null) => {
  if (!value) {
    return '-';
  }

  return new Date(value).toISOString().slice(0, 16).replace('T', ' ');
};

export const getBookingRacketLabel = (booking: ServiceBooking) => {
  const related = booking as BookingRelations;
  const label = joinParts(
    related.user_rackets?.brand,
    related.user_rackets?.model,
  );

  return label || `라켓 ${booking.racket_id.slice(0, 8)}`;
};

export const getBookingStringLabel = (booking: ServiceBooking) => {
  const related = booking as BookingRelations;
  const main = joinParts(
    related.main_string?.brand,
    related.main_string?.name,
  );
  const cross = joinParts(
    related.cross_string?.brand,
    related.cross_string?.name,
  );

  if (main && cross) {
    return `${main} / ${cross}`;
  }

  if (main || cross) {
    return main || cross;
  }

  return `${booking.main_string_id.slice(0, 8)} / ${booking.cross_string_id.slice(
    0,
    8,
  )}`;
};

export const getBookingSlotLabel = (booking: ServiceBooking) => {
  const related = booking as BookingRelations;
  const startTime = related.booking_slots?.start_time;
  const endTime = related.booking_slots?.end_time;

  if (!startTime) {
    return `슬롯 ${booking.slot_id.slice(0, 8)}`;
  }

  return `${formatBookingDateTime(startTime)} - ${formatBookingDateTime(endTime)}`;
};
