import type { SupabaseClient } from '@supabase/supabase-js';

import type { AdminPermission, Database, Json, Profile } from '@/types/database';

export type PermissionKey = keyof Omit<AdminPermission, 'admin_id'>;
export type PermissionUpdate = Partial<Omit<AdminPermission, 'admin_id'>>;
type AdminClient = Pick<SupabaseClient<Database>, 'from' | 'rpc'>;

const toServiceError = (message: string, error: unknown) => {
  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return new Error(`${message} ${error.message}`);
  }

  return new Error(message);
};

export const allPermissionKeys: PermissionKey[] = [
  'can_manage_strings',
  'can_manage_demo_rackets',
  'can_manage_bookings',
  'can_ban_users',
  'can_manage_products',
  'can_manage_orders',
  'can_post_notice',
  'can_toggle_app_menu',
  'can_manage_admins',
];

export const defaultAdminPermissions = (adminId: string): AdminPermission => ({
  admin_id: adminId,
  can_manage_strings: false,
  can_manage_demo_rackets: false,
  can_manage_bookings: false,
  can_ban_users: false,
  can_manage_products: false,
  can_manage_orders: false,
  can_post_notice: false,
  can_toggle_app_menu: false,
  can_manage_admins: false,
});

const toJson = (value: unknown): Json | null => {
  if (value === undefined) {
    return null;
  }

  return value as Json;
};

const assertSuperAdmin = async (client: AdminClient, actorId: string) => {
  const { data, error } = await client
    .from('profiles')
    .select('role')
    .eq('id', actorId)
    .single();

  if (error || !data || data.role !== 'super_admin') {
    throw toServiceError('슈퍼 관리자만 수행할 수 있습니다.', error);
  }
};

const writeAuditLog = async (
  client: AdminClient,
  actorId: string,
  action: string,
  targetTable: string,
  targetId: string,
  beforeValue?: unknown,
  afterValue?: unknown,
) => {
  const { error } = await client.from('administrator_audit_logs').insert({
    actor_id: actorId,
    action,
    target_table: targetTable,
    target_id: targetId,
    before_value: toJson(beforeValue),
    after_value: toJson(afterValue),
  });

  if (error) {
    throw toServiceError('관리자 행동 로그를 저장하지 못했습니다.', error);
  }
};

export const createAdminService = (client: AdminClient) => ({
  async getAdminPermissions(adminId: string): Promise<AdminPermission | null> {
    const { data, error } = await client
      .from('admin_permissions')
      .select('*')
      .eq('admin_id', adminId)
      .maybeSingle();

    if (error) {
      throw toServiceError('관리자 권한을 불러오지 못했습니다.', error);
    }

    return data ?? null;
  },

  async getProfileRole(userId: string): Promise<Profile['role']> {
    const { data, error } = await client
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (error || !data) {
      throw toServiceError('사용자 역할을 불러오지 못했습니다.', error);
    }

    return data.role;
  },

  async isAdmin(userId: string): Promise<boolean> {
    const role = await this.getProfileRole(userId);

    return role === 'admin' || role === 'super_admin';
  },

  async isSuperAdmin(userId: string): Promise<boolean> {
    const role = await this.getProfileRole(userId);

    return role === 'super_admin';
  },

  async getAdmins(): Promise<(Profile & { permissions: AdminPermission | null })[]> {
    const { data, error } = await client
      .from('profiles')
      .select('*')
      .in('role', ['admin', 'super_admin'])
      .order('created_at', { ascending: false });

    if (error) {
      throw toServiceError('관리자 목록을 불러오지 못했습니다.', error);
    }

    const admins = data ?? [];
    const adminsWithPermissions = await Promise.all(
      admins.map(async (admin) => ({
        ...admin,
        permissions: await this.getAdminPermissions(admin.id),
      })),
    );

    return adminsWithPermissions;
  },

  async searchUsers(query: string): Promise<Profile[]> {
    const trimmed = query.trim();

    if (!trimmed) {
      return [];
    }

    const { data, error } = await client
      .from('profiles')
      .select('*')
      .or(`username.ilike.%${trimmed}%,nickname.ilike.%${trimmed}%,phone.ilike.%${trimmed}%`)
      .neq('role', 'super_admin')
      .limit(20);

    if (error) {
      throw toServiceError('사용자를 검색하지 못했습니다.', error);
    }

    return data ?? [];
  },

  async appointAdmin(actorId: string, userId: string): Promise<AdminPermission> {
    await assertSuperAdmin(client, actorId);

    const { data: beforeProfile, error: beforeError } = await client
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (beforeError || !beforeProfile) {
      throw toServiceError('임명할 사용자를 찾지 못했습니다.', beforeError);
    }

    const { data: updatedProfile, error: profileError } = await client.rpc(
      'admin_set_profile_role',
      {
        p_actor_id: actorId,
        p_target_id: userId,
        p_role: 'admin',
      },
    );

    if (profileError || !updatedProfile) {
      throw toServiceError('관리자로 임명하지 못했습니다.', profileError);
    }

    const { data: permissions, error: permissionError } = await client
      .from('admin_permissions')
      .upsert(defaultAdminPermissions(userId), { onConflict: 'admin_id' })
      .select('*')
      .single();

    if (permissionError || !permissions) {
      throw toServiceError('관리자 권한을 생성하지 못했습니다.', permissionError);
    }

    await writeAuditLog(
      client,
      actorId,
      'admin.appoint',
      'profiles',
      userId,
      beforeProfile,
      { ...updatedProfile, permissions },
    );

    return permissions;
  },

  async dismissAdmin(actorId: string, adminId: string): Promise<void> {
    await assertSuperAdmin(client, actorId);

    if (actorId === adminId) {
      throw new Error('자기 자신은 해임할 수 없습니다.');
    }

    const { data: beforeProfile, error: beforeError } = await client
      .from('profiles')
      .select('*')
      .eq('id', adminId)
      .single();

    if (beforeError || !beforeProfile) {
      throw toServiceError('해임할 관리자를 찾지 못했습니다.', beforeError);
    }

    const beforePermissions = await this.getAdminPermissions(adminId);

    const { data: updatedProfile, error: profileError } = await client.rpc(
      'admin_set_profile_role',
      {
        p_actor_id: actorId,
        p_target_id: adminId,
        p_role: 'user',
      },
    );

    if (profileError || !updatedProfile) {
      throw toServiceError('관리자를 해임하지 못했습니다.', profileError);
    }

    const { error: permissionError } = await client
      .from('admin_permissions')
      .delete()
      .eq('admin_id', adminId);

    if (permissionError) {
      throw toServiceError('관리자 권한을 삭제하지 못했습니다.', permissionError);
    }

    await writeAuditLog(
      client,
      actorId,
      'admin.dismiss',
      'profiles',
      adminId,
      { profile: beforeProfile, permissions: beforePermissions },
      { profile: updatedProfile, permissions: null },
    );
  },

  async updatePermissions(
    actorId: string,
    adminId: string,
    permissions: PermissionUpdate,
  ): Promise<AdminPermission> {
    await assertSuperAdmin(client, actorId);

    if (actorId === adminId) {
      throw new Error('자기 권한은 직접 변경할 수 없습니다.');
    }

    const beforePermissions = await this.getAdminPermissions(adminId);
    const safePermissions = allPermissionKeys.reduce<PermissionUpdate>((next, key) => {
      if (typeof permissions[key] === 'boolean') {
        next[key] = permissions[key];
      }

      return next;
    }, {});

    const { data, error } = await client
      .from('admin_permissions')
      .update(safePermissions)
      .eq('admin_id', adminId)
      .select('*')
      .single();

    if (error || !data) {
      throw toServiceError('관리자 권한을 변경하지 못했습니다.', error);
    }

    await writeAuditLog(
      client,
      actorId,
      'admin.permissions.update',
      'admin_permissions',
      adminId,
      beforePermissions,
      data,
    );

    return data;
  },
});

export const canUsePermission = (
  profile: Pick<Profile, 'role'> | null,
  permissions: AdminPermission | null,
  key: PermissionKey,
) => {
  if (!profile) {
    return false;
  }

  if (profile.role === 'super_admin') {
    return true;
  }

  if (profile.role !== 'admin') {
    return false;
  }

  return Boolean(permissions?.[key]);
};

const getDefaultAdminService = async () => {
  const { supabase } = await import('./supabase');

  return createAdminService(supabase);
};

export const getAdminPermissions = (adminId: string) =>
  getDefaultAdminService().then((service) =>
    service.getAdminPermissions(adminId),
  );

export const isAdmin = (userId: string) =>
  getDefaultAdminService().then((service) => service.isAdmin(userId));

export const isSuperAdmin = (userId: string) =>
  getDefaultAdminService().then((service) => service.isSuperAdmin(userId));

export const getAdmins = () =>
  getDefaultAdminService().then((service) => service.getAdmins());

export const searchUsers = (query: string) =>
  getDefaultAdminService().then((service) => service.searchUsers(query));

export const appointAdmin = (actorId: string, userId: string) =>
  getDefaultAdminService().then((service) =>
    service.appointAdmin(actorId, userId),
  );

export const dismissAdmin = (actorId: string, adminId: string) =>
  getDefaultAdminService().then((service) =>
    service.dismissAdmin(actorId, adminId),
  );

export const updatePermissions = (
  actorId: string,
  adminId: string,
  permissions: PermissionUpdate,
) =>
  getDefaultAdminService().then((service) =>
    service.updatePermissions(actorId, adminId, permissions),
  );
