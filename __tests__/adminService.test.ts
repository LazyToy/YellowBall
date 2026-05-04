import { canUsePermission, createAdminService } from '../src/services/adminService';

const permissions = {
  admin_id: 'admin-1',
  can_manage_strings: true,
  can_manage_demo_rackets: false,
  can_manage_bookings: false,
  can_ban_users: false,
  can_manage_products: false,
  can_manage_orders: false,
  can_post_notice: false,
  can_toggle_app_menu: false,
  can_manage_admins: false,
};

describe('adminService', () => {
  test('super_admin은 모든 권한을 통과한다', () => {
    expect(
      canUsePermission(
        { role: 'super_admin' },
        null,
        'can_manage_demo_rackets',
      ),
    ).toBe(true);
  });

  test('admin은 부여된 권한만 통과한다', () => {
    expect(
      canUsePermission({ role: 'admin' }, permissions, 'can_manage_strings'),
    ).toBe(true);
    expect(
      canUsePermission({ role: 'admin' }, permissions, 'can_ban_users'),
    ).toBe(false);
  });

  test('일반 사용자는 관리자 권한을 사용할 수 없다', () => {
    expect(
      canUsePermission({ role: 'user' }, permissions, 'can_manage_strings'),
    ).toBe(false);
  });

  test('isAdmin은 admin과 super_admin을 허용한다', async () => {
    const single = jest
      .fn()
      .mockResolvedValue({ data: { role: 'admin' }, error: null });
    const eq = jest.fn(() => ({ single }));
    const select = jest.fn(() => ({ eq }));
    const from = jest.fn(() => ({ select }));
    const service = createAdminService({ from } as never);

    await expect(service.isAdmin('admin-1')).resolves.toBe(true);
    expect(from).toHaveBeenCalledWith('profiles');
    expect(select).toHaveBeenCalledWith('role');
    expect(eq).toHaveBeenCalledWith('id', 'admin-1');
  });

  test('appointAdmin은 role 변경, 권한 초기화, 감사 로그를 함께 수행한다', async () => {
    const actorSingle = jest
      .fn()
      .mockResolvedValue({ data: { role: 'super_admin' }, error: null });
    const actorEq = jest.fn(() => ({ single: actorSingle }));
    const actorSelect = jest.fn(() => ({ eq: actorEq }));

    const profile = {
      id: 'user-1',
      username: 'user',
      nickname: '사용자',
      phone: '010',
      role: 'user',
      status: 'active',
      expo_push_token: null,
      created_at: '2026-05-03T00:00:00.000Z',
      updated_at: '2026-05-03T00:00:00.000Z',
    };
    const beforeSingle = jest.fn().mockResolvedValue({ data: profile, error: null });
    const beforeEq = jest.fn(() => ({ single: beforeSingle }));
    const beforeSelect = jest.fn(() => ({ eq: beforeEq }));

    const rpc = jest
      .fn()
      .mockResolvedValue({ data: { ...profile, role: 'admin' }, error: null });

    const upsertSingle = jest
      .fn()
      .mockResolvedValue({ data: { ...permissions, admin_id: 'user-1' }, error: null });
    const upsertSelect = jest.fn(() => ({ single: upsertSingle }));
    const upsert = jest.fn(() => ({ select: upsertSelect }));

    const auditInsert = jest.fn().mockResolvedValue({ error: null });
    const from = jest
      .fn()
      .mockReturnValueOnce({ select: actorSelect })
      .mockReturnValueOnce({ select: beforeSelect })
      .mockReturnValueOnce({ upsert })
      .mockReturnValueOnce({ insert: auditInsert });
    const service = createAdminService({ from, rpc } as never);

    await expect(service.appointAdmin('super-1', 'user-1')).resolves.toEqual({
      ...permissions,
      admin_id: 'user-1',
    });

    expect(rpc).toHaveBeenCalledWith('admin_set_profile_role', {
      p_actor_id: 'super-1',
      p_target_id: 'user-1',
      p_role: 'admin',
    });
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ admin_id: 'user-1', can_manage_strings: false }),
      { onConflict: 'admin_id' },
    );
    expect(auditInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        actor_id: 'super-1',
        action: 'admin.appoint',
        target_table: 'profiles',
        target_id: 'user-1',
      }),
    );
  });

  test('dismissAdmin은 자기 자신 해임을 막는다', async () => {
    const actorSingle = jest
      .fn()
      .mockResolvedValue({ data: { role: 'super_admin' }, error: null });
    const actorEq = jest.fn(() => ({ single: actorSingle }));
    const actorSelect = jest.fn(() => ({ eq: actorEq }));
    const from = jest.fn().mockReturnValueOnce({ select: actorSelect });
    const service = createAdminService({ from, rpc: jest.fn() } as never);

    await expect(service.dismissAdmin('super-1', 'super-1')).rejects.toThrow(
      '자기 자신은 해임할 수 없습니다.',
    );
  });
});
