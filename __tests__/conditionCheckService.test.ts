import { createConditionCheckService } from '../src/services/conditionCheckService';
import type { RacketConditionCheck } from '../src/types/database';

const check: RacketConditionCheck = {
  id: 'check-1',
  demo_booking_id: 'demo-booking-1',
  check_type: 'before_rental',
  photo_urls: ['admin-1/condition.jpg'],
  scratch_notes: '상단 프레임 미세 스크래치',
  string_condition: '양호',
  grip_condition: '교체 필요',
  damage_detected: true,
  deposit_deduction: 5000,
  checked_by: 'admin-1',
  checked_at: '2026-05-04T10:00:00.000Z',
};

const insertQuery = (data: unknown, insert = jest.fn()) => {
  const query = {
    insert: jest.fn((value) => {
      insert(value);
      return query;
    }),
    select: jest.fn(() => query),
    single: jest.fn().mockResolvedValue({ data, error: null }),
  };

  return query;
};

const listQuery = (data: unknown[]) => {
  const query = {
    select: jest.fn(() => query),
    eq: jest.fn(() => query),
    order: jest.fn().mockResolvedValue({ data, error: null }),
  };

  return query;
};

describe('conditionCheckService', () => {
  test('addCheck는 사진을 업로드하고 photo_urls 배열로 상태 체크를 저장한다', async () => {
    const insert = jest.fn();
    const from = jest.fn().mockReturnValue(insertQuery(check, insert));
    const storageService = {
      uploadConditionPhoto: jest
        .fn()
        .mockResolvedValue('admin-1/condition.jpg'),
    };
    const service = createConditionCheckService(
      { from, storage: {} } as never,
      storageService as never,
    );
    const blob = new Blob(['photo'], { type: 'image/jpeg' });

    await expect(
      service.addCheck({
        demo_booking_id: 'demo-booking-1',
        check_type: 'before_rental',
        photos: [{ fileUri: 'file:///condition.jpg', blob }],
        scratch_notes: '상단 프레임 미세 스크래치',
        string_condition: '양호',
        grip_condition: '교체 필요',
        damage_detected: true,
        deposit_deduction: 5000,
        checked_by: 'admin-1',
      }),
    ).resolves.toEqual(check);

    expect(storageService.uploadConditionPhoto).toHaveBeenCalledWith(
      'admin-1',
      'file:///condition.jpg',
      blob,
    );
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        check_type: 'before_rental',
        photo_urls: ['admin-1/condition.jpg'],
        damage_detected: true,
        deposit_deduction: 5000,
      }),
    );
  });

  test('getChecks는 예약 ID 기준으로 전후 체크 내역을 조회한다', async () => {
    const query = listQuery([check]);
    const from = jest.fn().mockReturnValue(query);
    const service = createConditionCheckService({ from, storage: {} } as never);

    await expect(service.getChecks('demo-booking-1')).resolves.toEqual([check]);

    expect(query.eq).toHaveBeenCalledWith('demo_booking_id', 'demo-booking-1');
    expect(query.order).toHaveBeenCalledWith('checked_at', { ascending: true });
  });

  test('잘못된 체크 유형과 보증금 차감액은 거부한다', async () => {
    const service = createConditionCheckService({
      from: jest.fn(),
      storage: {},
    } as never);

    await expect(
      service.addCheck({
        demo_booking_id: 'demo-booking-1',
        check_type: 'invalid' as never,
        checked_by: 'admin-1',
      }),
    ).rejects.toThrow('지원하지 않는 시타 상태 체크 유형입니다.');

    await expect(
      service.addCheck({
        demo_booking_id: 'demo-booking-1',
        check_type: 'after_return',
        checked_by: 'admin-1',
        deposit_deduction: -1,
      }),
    ).rejects.toThrow('보증금 차감액은 0 이상의 정수여야 합니다.');
  });
});
