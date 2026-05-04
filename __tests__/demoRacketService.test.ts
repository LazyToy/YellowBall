import type { DemoRacketStatus } from '../src/types/database';
import {
  createDemoRacketService,
  isAvailableForBooking,
} from '../src/services/demoRacketService';

const demoRacket = {
  id: 'demo-1',
  brand: 'Wilson',
  model: 'Blade Demo',
  grip_size: 'G2',
  weight: 305,
  head_size: '98',
  photo_url: null,
  description: null,
  status: 'active' as DemoRacketStatus,
  is_demo_enabled: true,
  is_active: true,
  created_at: '2026-05-03T00:00:00.000Z',
  updated_at: '2026-05-03T00:00:00.000Z',
};

const superAdminRoleQuery = () => {
  const single = jest
    .fn()
    .mockResolvedValue({ data: { role: 'super_admin' }, error: null });
  const eq = jest.fn(() => ({ single }));
  const select = jest.fn(() => ({ eq }));

  return { select };
};

describe('demoRacketService', () => {
  test('isAvailableForBooking은 활성/예약허용/노출 상태와 시간 중복을 확인한다', () => {
    const racket = {
      status: 'active' as const,
      is_demo_enabled: true,
      is_active: true,
    };
    const slot = {
      start_time: '2026-05-03T10:00:00.000Z',
      expected_return_time: '2026-05-03T12:00:00.000Z',
    };

    expect(isAvailableForBooking(racket, slot, [])).toBe(true);
    expect(
      isAvailableForBooking(racket, slot, [
        {
          start_time: '2026-05-03T11:00:00.000Z',
          expected_return_time: '2026-05-03T13:00:00.000Z',
          status: 'approved',
        },
      ]),
    ).toBe(false);
    expect(
      isAvailableForBooking({ ...racket, is_demo_enabled: false }, slot, []),
    ).toBe(false);
    expect(isAvailableForBooking({ ...racket, status: 'hidden' }, slot, [])).toBe(
      false,
    );
  });

  test('getDemoRackets는 활성/예약허용/노출 라켓만 조회하도록 필터링한다', async () => {
    const order = jest.fn().mockResolvedValue({ data: [demoRacket], error: null });
    const query = {
      eq: jest.fn(() => query),
      order,
    };
    const select = jest.fn(() => query);
    const from = jest.fn(() => ({ select }));
    const service = createDemoRacketService({ from } as never);

    await expect(service.getDemoRackets()).resolves.toEqual([demoRacket]);
    expect(query.eq).toHaveBeenCalledWith('status', 'active');
    expect(query.eq).toHaveBeenCalledWith('is_demo_enabled', true);
    expect(query.eq).toHaveBeenCalledWith('is_active', true);
  });

  test('권한 없는 admin의 CRUD를 차단한다', async () => {
    const roleSingle = jest
      .fn()
      .mockResolvedValue({ data: { role: 'admin' }, error: null });
    const roleEq = jest.fn(() => ({ single: roleSingle }));
    const roleSelect = jest.fn(() => ({ eq: roleEq }));
    const permissionSingle = jest.fn().mockResolvedValue({
      data: { admin_id: 'admin-1', can_manage_demo_rackets: false },
      error: null,
    });
    const permissionEq = jest.fn(() => ({ maybeSingle: permissionSingle }));
    const permissionSelect = jest.fn(() => ({ eq: permissionEq }));
    const from = jest
      .fn()
      .mockReturnValueOnce({ select: roleSelect })
      .mockReturnValueOnce({ select: permissionSelect });
    const service = createDemoRacketService({ from } as never);

    await expect(
      service.addDemoRacket('admin-1', {
        brand: 'Wilson',
        model: 'Blade Demo',
      }),
    ).rejects.toThrow('시타 라켓 관리 권한이 없습니다.');
  });

  test('super_admin은 시타 라켓을 등록하고 감사 로그를 남긴다', async () => {
    const insertSingle = jest
      .fn()
      .mockResolvedValue({ data: demoRacket, error: null });
    const insertSelect = jest.fn(() => ({ single: insertSingle }));
    const insert = jest.fn(() => ({ select: insertSelect }));
    const auditInsert = jest.fn().mockResolvedValue({ error: null });
    const from = jest
      .fn()
      .mockReturnValueOnce(superAdminRoleQuery())
      .mockReturnValueOnce({ insert })
      .mockReturnValueOnce({ insert: auditInsert });
    const service = createDemoRacketService({ from } as never);

    await expect(
      service.addDemoRacket('super-1', {
        brand: 'Wilson',
        model: 'Blade Demo',
      }),
    ).resolves.toEqual(demoRacket);
    expect(auditInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'demo_racket.create',
        target_id: 'demo-1',
      }),
    );
  });

  test('6개 상태 전환을 모두 허용하고 상태 변경 로그를 남긴다', async () => {
    const auditInsert = jest.fn().mockResolvedValue({ error: null });
    const service = createDemoRacketService({
      from: jest.fn(() => ({ insert: auditInsert })),
    } as never);
    const statuses: DemoRacketStatus[] = [
      'active',
      'inactive',
      'maintenance',
      'damaged',
      'sold',
      'hidden',
    ];

    service.getDemoRacket = jest.fn().mockResolvedValue(demoRacket);
    service.updateDemoRacket = jest
      .fn()
      .mockImplementation((_actorId, _id, data) =>
        Promise.resolve({ ...demoRacket, ...data }),
      );

    for (const status of statuses) {
      await expect(service.updateStatus('super-1', 'demo-1', status)).resolves.toEqual(
        expect.objectContaining({ status }),
      );
    }

    expect(service.updateDemoRacket).toHaveBeenCalledTimes(statuses.length);
    expect(auditInsert).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'demo_racket.status.update' }),
    );
  });

  test('updateStatus는 허용되지 않은 상태를 거부한다', async () => {
    const service = createDemoRacketService({ from: jest.fn() } as never);

    await expect(
      service.updateStatus('admin-1', 'racket-1', 'lost' as never),
    ).rejects.toThrow('지원하지 않는 시타 라켓 상태입니다.');
  });
});
