import type { ServiceBooking, ServiceDeliveryMethod } from '@/types/database';
import { formatKstDateTime } from './kstDateTime';

type BookingRelations = ServiceBooking & {
  addresses?: {
    address_line1?: string | null;
    address_line2?: string | null;
    phone?: string | null;
    postal_code?: string | null;
    recipient_name?: string | null;
  } | null;
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

const deliveryMethodLabels: Record<ServiceDeliveryMethod, string> = {
  local_quick: '퀵 배송',
  parcel: '택배',
  store_pickup: '매장 방문',
};

export const formatBookingDateTime = (value?: string | null) => {
  return formatKstDateTime(value);
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

  if (!startTime) {
    return `슬롯 ${booking.slot_id.slice(0, 8)}`;
  }

  return formatBookingDateTime(startTime);
};

export const getBookingDeliveryMethodLabel = (booking: ServiceBooking) =>
  deliveryMethodLabels[booking.delivery_method] ?? booking.delivery_method;

export const getBookingAddressLabel = (booking: ServiceBooking) => {
  const address = (booking as BookingRelations).addresses;

  if (!address) {
    return '-';
  }

  return joinParts(
    address.recipient_name,
    address.phone,
    address.postal_code ? `(${address.postal_code})` : null,
    address.address_line1,
    address.address_line2,
  );
};
