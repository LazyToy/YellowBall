import {
  assertDeliveryAddress,
  assertProfileCanBook,
  assertReturnWindow,
  assertSlotAvailable,
  assertValidTension,
  buildRebookPrefill,
} from '../src/utils/bookingValidation';
import type { ServiceBooking } from '../src/types/database';

describe('bookingValidation', () => {
  test('텐션은 20~70 사이 정수만 허용한다', () => {
    expect(() => assertValidTension(48, '메인')).not.toThrow();
    expect(() => assertValidTension(71, '메인')).toThrow(
      '메인 텐션은 20에서 70 사이의 정수여야 합니다.',
    );
    expect(() => assertValidTension(48.5, '크로스')).toThrow();
  });

  test('배송 예약에는 주소가 필요하고 제재 사용자는 예약할 수 없다', () => {
    expect(() => assertDeliveryAddress('store_pickup', null)).not.toThrow();
    expect(() => assertDeliveryAddress('parcel', null)).toThrow(
      '택배 또는 퀵 배송 예약에는 주소가 필요합니다.',
    );
    expect(() => assertProfileCanBook('active')).not.toThrow();
    expect(() => assertProfileCanBook('suspended')).toThrow(
      '제재된 사용자는 예약할 수 없습니다.',
    );
    expect(() => assertProfileCanBook('deleted_pending')).toThrow(
      '탈퇴 처리 중인 사용자는 예약할 수 없습니다.',
    );
    expect(() => assertProfileCanBook('deleted')).toThrow(
      '탈퇴가 완료된 사용자는 예약할 수 없습니다.',
    );
  });

  test('슬롯 가용성과 시타 반납 시간을 검증한다', () => {
    expect(() =>
      assertSlotAvailable({ is_blocked: false, reserved_count: 0, capacity: 1 }),
    ).not.toThrow();
    expect(() =>
      assertSlotAvailable({ is_blocked: true, reserved_count: 0, capacity: 1 }),
    ).toThrow('차단된 슬롯은 예약할 수 없습니다.');
    expect(() =>
      assertReturnWindow(
        '2026-05-04T10:00:00.000Z',
        '2026-05-04T12:00:00.000Z',
      ),
    ).not.toThrow();
    expect(() =>
      assertReturnWindow(
        '2026-05-04T10:00:00.000Z',
        '2026-05-04T10:00:00.000Z',
      ),
    ).toThrow('반납 예정 시간은 시작 시간보다 늦어야 합니다.');
  });

  test('다시 예약 프리필은 라켓/스트링/텐션과 수령 정보를 복사한다', () => {
    const booking = {
      racket_id: 'racket-1',
      main_string_id: 'string-main',
      cross_string_id: 'string-cross',
      tension_main: 48,
      tension_cross: 46,
      delivery_method: 'parcel',
      address_id: 'address-1',
    } as ServiceBooking;

    expect(buildRebookPrefill(booking)).toEqual({
      racket_id: 'racket-1',
      main_string_id: 'string-main',
      cross_string_id: 'string-cross',
      tension_main: 48,
      tension_cross: 46,
      delivery_method: 'parcel',
      address_id: 'address-1',
    });
  });
});
