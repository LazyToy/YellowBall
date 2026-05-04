import type { SupabaseClient } from '@supabase/supabase-js';

import type {
  AdminPermission,
  Database,
  Json,
  Profile,
  StringCatalogInsert,
  StringCatalogItem,
  StringCatalogUpdate,
} from '@/types/database';

type StringCatalogClient = Pick<SupabaseClient<Database>, 'from'>;
type NewStringCatalogItem = Omit<
  StringCatalogInsert,
  'id' | 'created_at' | 'updated_at' | 'deactivated_at' | 'deactivation_reason'
>;

export type StringCatalogFilters = {
  search?: string;
  brand?: string;
  gauge?: string;
  recommendedStyle?: string;
  recommended_style?: string;
};

export type GetStringByIdOptions = {
  activeOnly?: boolean;
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

const normalizeFilter = (value?: string | null) => {
  const normalized = value?.trim();

  return normalized ? normalized : undefined;
};

const toPostgrestSearchTerm = (value: string) =>
  value.replace(/[\\%_]/g, '\\$&').replace(/[(),]/g, ' ');

const getProfileRole = async (
  client: StringCatalogClient,
  actorId: string,
): Promise<Profile['role']> => {
  const { data, error } = await client
    .from('profiles')
    .select('role')
    .eq('id', actorId)
    .single();

  if (error || !data) {
    throw toServiceError('관리자 역할을 확인하지 못했습니다.', error);
  }

  return data.role;
};

const getAdminPermissions = async (
  client: StringCatalogClient,
  actorId: string,
): Promise<AdminPermission | null> => {
  const { data, error } = await client
    .from('admin_permissions')
    .select('*')
    .eq('admin_id', actorId)
    .maybeSingle();

  if (error) {
    throw toServiceError('관리자 권한을 확인하지 못했습니다.', error);
  }

  return data ?? null;
};

const assertCanManageStrings = async (
  client: StringCatalogClient,
  actorId: string,
) => {
  const role = await getProfileRole(client, actorId);

  if (role === 'super_admin') {
    return;
  }

  if (role !== 'admin') {
    throw new Error('스트링 카탈로그 관리 권한이 없습니다.');
  }

  const permissions = await getAdminPermissions(client, actorId);

  if (!permissions?.can_manage_strings) {
    throw new Error('스트링 카탈로그 관리 권한이 없습니다.');
  }
};

const writeAuditLog = async (
  client: StringCatalogClient,
  actorId: string,
  action: string,
  targetId: string,
  beforeValue?: unknown,
  afterValue?: unknown,
) => {
  const { error } = await client.from('administrator_audit_logs').insert({
    actor_id: actorId,
    action,
    target_table: 'string_catalog',
    target_id: targetId,
    before_value: toJson(beforeValue),
    after_value: toJson(afterValue),
  });

  if (error) {
    throw toServiceError('관리자 행동 로그를 저장하지 못했습니다.', error);
  }
};

export const createStringCatalogService = (client: StringCatalogClient) => ({
  async getActiveStrings(
    filters: StringCatalogFilters = {},
  ): Promise<StringCatalogItem[]> {
    let query = client
      .from('string_catalog')
      .select('*')
      .eq('is_active', true);

    const search = normalizeFilter(filters.search);
    const brand = normalizeFilter(filters.brand);
    const gauge = normalizeFilter(filters.gauge);
    const recommendedStyle = normalizeFilter(
      filters.recommendedStyle ?? filters.recommended_style,
    );

    if (search) {
      const term = toPostgrestSearchTerm(search);
      query = query.or(`brand.ilike.%${term}%,name.ilike.%${term}%`);
    }

    if (brand) {
      query = query.eq('brand', brand);
    }

    if (gauge) {
      query = query.eq('gauge', gauge);
    }

    if (recommendedStyle) {
      query = query.eq('recommended_style', recommendedStyle);
    }

    const { data, error } = await query
      .order('brand', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      throw toServiceError('?ㅽ듃留?移댄깉濡쒓렇瑜?遺덈윭?ㅼ? 紐삵뻽?듬땲??', error);
    }

    return data ?? [];
  },

  async searchStrings(query: string): Promise<StringCatalogItem[]> {
    return this.getActiveStrings({ search: query });
  },

  async filterStrings(filters: StringCatalogFilters): Promise<StringCatalogItem[]> {
    return this.getActiveStrings(filters);
  },

  async getAllStrings(): Promise<StringCatalogItem[]> {
    const { data, error } = await client
      .from('string_catalog')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw toServiceError('스트링 카탈로그를 불러오지 못했습니다.', error);
    }

    return data ?? [];
  },

  async addString(
    actorId: string,
    data: NewStringCatalogItem,
  ): Promise<StringCatalogItem> {
    await assertCanManageStrings(client, actorId);

    const { data: item, error } = await client
      .from('string_catalog')
      .insert(data)
      .select('*')
      .single();

    if (error || !item) {
      throw toServiceError('스트링을 등록하지 못했습니다.', error);
    }

    await writeAuditLog(client, actorId, 'string.create', item.id, null, item);

    return item;
  },

  async updateString(
    actorId: string,
    id: string,
    data: StringCatalogUpdate,
  ): Promise<StringCatalogItem> {
    await assertCanManageStrings(client, actorId);

    const before = await this.getStringById(id, { activeOnly: false });
    const { data: item, error } = await client
      .from('string_catalog')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single();

    if (error || !item) {
      throw toServiceError('스트링을 수정하지 못했습니다.', error);
    }

    await writeAuditLog(client, actorId, 'string.update', id, before, item);

    return item;
  },

  async deactivateString(
    actorId: string,
    id: string,
    reason: string,
  ): Promise<StringCatalogItem> {
    return this.updateString(actorId, id, {
      is_active: false,
      deactivation_reason: reason,
      deactivated_at: new Date().toISOString(),
    });
  },

  async activateString(actorId: string, id: string): Promise<StringCatalogItem> {
    return this.updateString(actorId, id, {
      is_active: true,
      deactivation_reason: null,
      deactivated_at: null,
    });
  },

  async getStringById(
    id: string,
    options: GetStringByIdOptions = { activeOnly: true },
  ): Promise<StringCatalogItem> {
    let query = client
      .from('string_catalog')
      .select('*')
      .eq('id', id);

    if (options.activeOnly !== false) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query.single();

    if (error || !data) {
      throw toServiceError('스트링을 찾지 못했습니다.', error);
    }

    return data;
  },
});

const getDefaultStringCatalogService = async () => {
  const { supabase } = await import('./supabase');

  return createStringCatalogService(supabase);
};

export const getAllStrings = () =>
  getDefaultStringCatalogService().then((service) => service.getAllStrings());

export const getActiveStrings = (filters?: StringCatalogFilters) =>
  getDefaultStringCatalogService().then((service) =>
    service.getActiveStrings(filters),
  );

export const getStringById = (id: string, options?: GetStringByIdOptions) =>
  getDefaultStringCatalogService().then((service) =>
    service.getStringById(id, options),
  );

export const searchStrings = (query: string) =>
  getDefaultStringCatalogService().then((service) =>
    service.searchStrings(query),
  );

export const filterStrings = (filters: StringCatalogFilters) =>
  getDefaultStringCatalogService().then((service) =>
    service.filterStrings(filters),
  );

export const addString = (actorId: string, data: NewStringCatalogItem) =>
  getDefaultStringCatalogService().then((service) =>
    service.addString(actorId, data),
  );

export const updateString = (
  actorId: string,
  id: string,
  data: StringCatalogUpdate,
) =>
  getDefaultStringCatalogService().then((service) =>
    service.updateString(actorId, id, data),
  );

export const deactivateString = (
  actorId: string,
  id: string,
  reason: string,
) =>
  getDefaultStringCatalogService().then((service) =>
    service.deactivateString(actorId, id, reason),
  );

export const activateString = (actorId: string, id: string) =>
  getDefaultStringCatalogService().then((service) =>
    service.activateString(actorId, id),
  );
