import type {
  BookingSlot,
  ProfileStatus,
  ServiceBooking,
  ServiceDeliveryMethod,
} from '@/types/database';

const deliveryMethodsRequiringAddress = new Set<ServiceDeliveryMethod>([
  'local_quick',
  'parcel',
]);

export type RebookPrefill = Pick<
  ServiceBooking,
  | 'racket_id'
  | 'main_string_id'
  | 'cross_string_id'
  | 'tension_main'
  | 'tension_cross'
  | 'delivery_method'
  | 'address_id'
>;

export const isValidTension = (value: number) =>
  Number.isInteger(value) && value >= 20 && value <= 70;

export const assertValidTension = (value: number, label: string) => {
  if (!isValidTension(value)) {
    throw new Error(`${label} 텐션은 20에서 70 사이의 정수여야 합니다.`);
  }
};

export const assertDeliveryAddress = (
  deliveryMethod: ServiceDeliveryMethod,
  addressId?: string | null,
) => {
  if (deliveryMethodsRequiringAddress.has(deliveryMethod) && !addressId) {
    throw new Error('택배 또는 퀵 배송 예약에는 주소가 필요합니다.');
  }
};

export const assertProfileCanBook = (status: ProfileStatus) => {
  if (status === 'suspended') {
    throw new Error('제재된 사용자는 예약할 수 없습니다.');
  }

  if (status === 'deleted_pending') {
    throw new Error('탈퇴 처리 중인 사용자는 예약할 수 없습니다.');
  }
};

export const assertSlotAvailable = (
  slot: Pick<BookingSlot, 'is_blocked' | 'reserved_count' | 'capacity'>,
) => {
  if (slot.is_blocked) {
    throw new Error('차단된 슬롯은 예약할 수 없습니다.');
  }

  if (slot.reserved_count >= slot.capacity) {
    throw new Error('예약 가능한 인원이 모두 찬 슬롯입니다.');
  }
};

export const assertReturnWindow = (startTime: string, expectedReturnTime: string) => {
  const start = new Date(startTime).getTime();
  const end = new Date(expectedReturnTime).getTime();

  if (!Number.isFinite(start) || !Number.isFinite(end) || start >= end) {
    throw new Error('반납 예정 시간은 시작 시간보다 늦어야 합니다.');
  }
};

export const buildRebookPrefill = (booking: ServiceBooking): RebookPrefill => ({
  racket_id: booking.racket_id,
  main_string_id: booking.main_string_id,
  cross_string_id: booking.cross_string_id,
  tension_main: booking.tension_main,
  tension_cross: booking.tension_cross,
  delivery_method: booking.delivery_method,
  address_id: booking.address_id,
});
