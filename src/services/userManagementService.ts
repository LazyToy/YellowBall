import type { SupabaseClient } from '@supabase/supabase-js';

import type { AdminPermission, Database, Json, Profile } from '@/types/database';

type UserManagementClient = Pick<SupabaseClient<Database>, 'from' | 'rpc'>;
type DynamicResult<T> = PromiseLike<{
  data?: T | null;
  count?: number | null;
  error?: unknown;
}>;
type DynamicTable = {
  select: (
    columns: string,
    options: { count: 'exact'; head: true },
  ) => {
    eq: (
      column: string,
      value: string,
    ) => {
      eq: (column: string, value: boolean) => DynamicResult<null>;
      };
  };
};
type DynamicClient = {
  from: (table: string) => DynamicTable;
};

export type ManagedUser = Profile & {
  noShowCount?: number | null;
};

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

const toJson = (value: unknown): Json | null => {
  if (value === undefined) {
    return null;
  }

  return value as Json;
};

const isMissingTableError = (error: unknown) => {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const code =
    'code' in error && typeof error.code === 'string' ? error.code : undefined;
  const message =
    'message' in error && typeof error.message === 'string'
      ? error.message.toLowerCase()
      : '';

  return (
    code === '42P01' ||
    code === 'PGRST106' ||
    code === 'PGRST205' ||
    message.includes('schema cache') ||
    (message.includes('relation') && message.includes('does not exist')) ||
    (message.includes('table') && message.includes('does not exist'))
  );
};

const isMissingColumnError = (error: unknown) => {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const code =
    'code' in error && typeof error.code === 'string' ? error.code : undefined;
  const message =
    'message' in error && typeof error.message === 'string'
      ? error.message.toLowerCase()
      : '';

  return (
    code === '42703' ||
    code === 'PGRST204' ||
    (message.includes('column') && message.includes('does not exist')) ||
    (message.includes('column') && message.includes('schema cache'))
  );
};

const getProfileRole = async (
  client: UserManagementClient,
  actorId: string,
): Promise<Profile['role']> => {
  const { data, error } = await client
    .from('profiles')
    .select('role')
    .eq('id', actorId)
    .single();

  if (error || !data) {
    throw toServiceError('Unable to verify administrator role.', error);
  }

  return data.role;
};

const getAdminPermissions = async (
  client: UserManagementClient,
  actorId: string,
): Promise<AdminPermission | null> => {
  const { data, error } = await client
    .from('admin_permissions')
    .select('*')
    .eq('admin_id', actorId)
    .maybeSingle();

  if (error) {
    throw toServiceError('Unable to verify administrator permissions.', error);
  }

  return data ?? null;
};

const assertCanBanUsers = async (
  client: UserManagementClient,
  actorId: string,
) => {
  const role = await getProfileRole(client, actorId);

  if (role === 'super_admin') {
    return;
  }

  if (role !== 'admin') {
    throw new Error('User suspension permission is required.');
  }

  const permissions = await getAdminPermissions(client, actorId);

  if (!permissions?.can_ban_users) {
    throw new Error('User suspension permission is required.');
  }
};

const writeAuditLog = async (
  client: UserManagementClient,
  actorId: string,
  action: string,
  targetId: string,
  beforeValue?: unknown,
  afterValue?: unknown,
) => {
  const { error } = await client.from('administrator_audit_logs').insert({
    actor_id: actorId,
    action,
    target_table: 'profiles',
    target_id: targetId,
    before_value: toJson(beforeValue),
    after_value: toJson(afterValue),
  });

  if (error) {
    throw toServiceError('Unable to write administrator audit log.', error);
  }
};

const getProfile = async (
  client: UserManagementClient,
  userId: string,
): Promise<Profile> => {
  const { data, error } = await client
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !data) {
    throw toServiceError('Unable to find user profile.', error);
  }

  return data;
};

const getNoShowCount = async (
  client: UserManagementClient,
  userId: string,
): Promise<number | null> => {
  const dynamicClient = client as unknown as DynamicClient;
  const { count, error } = await dynamicClient
    .from('service_bookings')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('no_show_counted', true);

  if (error) {
    if (isMissingTableError(error) || isMissingColumnError(error)) {
      return null;
    }

    throw toServiceError('Unable to load no-show count.', error);
  }

  return count ?? 0;
};

const withNoShowCounts = async (
  client: UserManagementClient,
  users: Profile[],
): Promise<ManagedUser[]> =>
  Promise.all(
    users.map(async (user) => ({
      ...user,
      noShowCount: await getNoShowCount(client, user.id),
    })),
  );

export const createUserManagementService = (client: UserManagementClient) => ({
  async searchUsers(actorId: string, query: string): Promise<ManagedUser[]> {
    await assertCanBanUsers(client, actorId);

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
      throw toServiceError('Unable to search users.', error);
    }

    return withNoShowCounts(client, data ?? []);
  },

  async getSuspendedUsers(actorId: string): Promise<ManagedUser[]> {
    await assertCanBanUsers(client, actorId);

    const { data, error } = await client
      .from('profiles')
      .select('*')
      .eq('status', 'suspended')
      .order('updated_at', { ascending: false });

    if (error) {
      throw toServiceError('Unable to load suspended users.', error);
    }

    return withNoShowCounts(client, data ?? []);
  },

  async suspendUser(
    actorId: string,
    userId: string,
    reason?: string,
  ): Promise<Profile> {
    await assertCanBanUsers(client, actorId);

    if (actorId === userId) {
      throw new Error('Administrators cannot suspend themselves.');
    }

    const before = await getProfile(client, userId);

    if (before.role === 'super_admin') {
      throw new Error('Super administrators cannot be suspended.');
    }

    const { data, error } = await client.rpc('admin_suspend_user_transaction', {
      p_actor_id: actorId,
      p_target_id: userId,
      p_reason: reason ?? null,
    });

    if (error || !data) {
      throw toServiceError('Unable to suspend user.', error);
    }

    return data;
  },

  async unsuspendUser(actorId: string, userId: string): Promise<Profile> {
    await assertCanBanUsers(client, actorId);

    const before = await getProfile(client, userId);
    const { data, error } = await client.rpc('admin_set_profile_status', {
      p_actor_id: actorId,
      p_target_id: userId,
      p_status: 'active',
    });

    if (error || !data) {
      throw toServiceError('Unable to unsuspend user.', error);
    }

    await writeAuditLog(client, actorId, 'user.unsuspend', userId, before, data);

    return data;
  },
});

const getDefaultUserManagementService = async () => {
  const { supabase } = await import('./supabase');

  return createUserManagementService(supabase);
};

export const searchUsers = (actorId: string, query: string) =>
  getDefaultUserManagementService().then((service) =>
    service.searchUsers(actorId, query),
  );

export const getSuspendedUsers = (actorId: string) =>
  getDefaultUserManagementService().then((service) =>
    service.getSuspendedUsers(actorId),
  );

export const suspendUser = (
  actorId: string,
  userId: string,
  reason?: string,
) =>
  getDefaultUserManagementService().then((service) =>
    service.suspendUser(actorId, userId, reason),
  );

export const unsuspendUser = (actorId: string, userId: string) =>
  getDefaultUserManagementService().then((service) =>
    service.unsuspendUser(actorId, userId),
  );
