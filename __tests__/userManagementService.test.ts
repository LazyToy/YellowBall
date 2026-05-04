import { createUserManagementService } from '../src/services/userManagementService';

const permissionRow = {
  admin_id: 'admin-1',
  can_manage_strings: false,
  can_manage_demo_rackets: false,
  can_manage_bookings: false,
  can_ban_users: true,
  can_manage_products: false,
  can_manage_orders: false,
  can_post_notice: false,
  can_toggle_app_menu: false,
  can_manage_admins: false,
};

const profile = {
  id: 'user-1',
  username: 'user',
  nickname: 'User',
  phone: '010',
  role: 'user',
  status: 'active',
  expo_push_token: null,
  created_at: '2026-05-03T00:00:00.000Z',
  updated_at: '2026-05-03T00:00:00.000Z',
};

const actorRoleQuery = (role = 'admin') => {
  const single = jest.fn().mockResolvedValue({ data: { role }, error: null });
  const eq = jest.fn(() => ({ single }));
  const select = jest.fn(() => ({ eq }));

  return { select, eq, single };
};

const permissionsQuery = (permissions = permissionRow) => {
  const maybeSingle = jest.fn().mockResolvedValue({ data: permissions, error: null });
  const eq = jest.fn(() => ({ maybeSingle }));
  const select = jest.fn(() => ({ eq }));

  return { select, eq, maybeSingle };
};

const profileQuery = (data = profile) => {
  const single = jest.fn().mockResolvedValue({ data, error: null });
  const eq = jest.fn(() => ({ single }));
  const select = jest.fn(() => ({ eq }));

  return { select, eq, single };
};

const noShowCountQuery = (count: number | null = null) => {
  const eqNoShow = jest.fn().mockResolvedValue({ count, error: null });
  const eqUser = jest.fn(() => ({ eq: eqNoShow }));
  const select = jest.fn(() => ({ eq: eqUser }));

  return { select, eqUser, eqNoShow };
};

describe('userManagementService', () => {
  test('suspendUser checks can_ban_users and delegates suspension cascade to transaction RPC', async () => {
    const actor = actorRoleQuery();
    const permissions = permissionsQuery();
    const before = profileQuery();

    const updatedProfile = { ...profile, status: 'suspended' };
    const rpc = jest.fn().mockResolvedValue({ data: updatedProfile, error: null });

    const from = jest
      .fn()
      .mockReturnValueOnce({ select: actor.select })
      .mockReturnValueOnce({ select: permissions.select })
      .mockReturnValueOnce({ select: before.select });

    const service = createUserManagementService({ from, rpc } as never);

    await expect(
      service.suspendUser('admin-1', 'user-1', 'No-show policy'),
    ).resolves.toEqual(updatedProfile);

    expect(permissions.eq).toHaveBeenCalledWith('admin_id', 'admin-1');
    expect(from).not.toHaveBeenCalledWith('service_bookings');
    expect(from).not.toHaveBeenCalledWith('demo_bookings');
    expect(from).not.toHaveBeenCalledWith('administrator_audit_logs');
    expect(rpc).toHaveBeenCalledWith('admin_suspend_user_transaction', {
      p_actor_id: 'admin-1',
      p_target_id: 'user-1',
      p_reason: 'No-show policy',
    });
  });

  test('suspendUser rejects admins without can_ban_users', async () => {
    const actor = actorRoleQuery();
    const permissions = permissionsQuery({ ...permissionRow, can_ban_users: false });
    const from = jest
      .fn()
      .mockReturnValueOnce({ select: actor.select })
      .mockReturnValueOnce({ select: permissions.select });
    const service = createUserManagementService({ from } as never);

    await expect(service.suspendUser('admin-1', 'user-1')).rejects.toThrow(
      'User suspension permission is required.',
    );
  });

  test('unsuspendUser sets active status and writes audit log', async () => {
    const actor = actorRoleQuery('super_admin');
    const before = profileQuery({ ...profile, status: 'suspended' });
    const rpc = jest
      .fn()
      .mockResolvedValue({ data: { ...profile, status: 'active' }, error: null });
    const auditInsert = jest.fn().mockResolvedValue({ error: null });
    const from = jest
      .fn()
      .mockReturnValueOnce({ select: actor.select })
      .mockReturnValueOnce({ select: before.select })
      .mockReturnValueOnce({ insert: auditInsert });
    const service = createUserManagementService({ from, rpc } as never);

    await expect(service.unsuspendUser('super-1', 'user-1')).resolves.toEqual(
      expect.objectContaining({ status: 'active' }),
    );
    expect(rpc).toHaveBeenCalledWith('admin_set_profile_status', {
      p_actor_id: 'super-1',
      p_target_id: 'user-1',
      p_status: 'active',
    });
    expect(auditInsert).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'user.unsuspend' }),
    );
  });

  test('getSuspendedUsers returns suspended profiles with no-show counts when available', async () => {
    const actor = actorRoleQuery('super_admin');
    const suspended = { ...profile, status: 'suspended' };
    const order = jest.fn().mockResolvedValue({ data: [suspended], error: null });
    const statusEq = jest.fn(() => ({ order }));
    const suspendedSelect = jest.fn(() => ({ eq: statusEq }));
    const count = noShowCountQuery(3);
    const from = jest
      .fn()
      .mockReturnValueOnce({ select: actor.select })
      .mockReturnValueOnce({ select: suspendedSelect })
      .mockReturnValueOnce({ select: count.select });
    const service = createUserManagementService({ from } as never);

    await expect(service.getSuspendedUsers('super-1')).resolves.toEqual([
      expect.objectContaining({ id: 'user-1', noShowCount: 3 }),
    ]);
    expect(statusEq).toHaveBeenCalledWith('status', 'suspended');
    expect(count.eqNoShow).toHaveBeenCalledWith('no_show_counted', true);
  });
});
