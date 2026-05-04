import type { SupabaseClient } from '@supabase/supabase-js';

import type {
  AdministratorAuditLog,
  AdministratorAuditLogInsert,
  Database,
  Json,
} from '@/types/database';

type AuditClient = Pick<SupabaseClient<Database>, 'from'>;

export type AuditTarget = {
  table?: string;
  id?: string;
};

export type AuditLogFilters = {
  actorId?: string;
  action?: string;
  targetTable?: string;
  limit?: number;
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

export const createAuditService = (client: AuditClient) => ({
  async logAction(
    actorId: string,
    action: string,
    target: AuditTarget = {},
    beforeValue?: unknown,
    afterValue?: unknown,
    metadata: Pick<AdministratorAuditLogInsert, 'ip_address' | 'user_agent'> = {},
  ): Promise<AdministratorAuditLog> {
    const payload: AdministratorAuditLogInsert = {
      actor_id: actorId,
      action,
      target_table: target.table ?? null,
      target_id: target.id ?? null,
      before_value: toJson(beforeValue),
      after_value: toJson(afterValue),
      ip_address: metadata.ip_address ?? null,
      user_agent: metadata.user_agent ?? null,
    };

    const { data, error } = await client
      .from('administrator_audit_logs')
      .insert(payload)
      .select('*')
      .single();

    if (error || !data) {
      throw toServiceError('관리자 행동 로그를 저장하지 못했습니다.', error);
    }

    return data;
  },

  async getAuditLogs(
    filters: AuditLogFilters = {},
  ): Promise<AdministratorAuditLog[]> {
    let query = client
      .from('administrator_audit_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters.actorId) {
      query = query.eq('actor_id', filters.actorId);
    }

    if (filters.action) {
      query = query.eq('action', filters.action);
    }

    if (filters.targetTable) {
      query = query.eq('target_table', filters.targetTable);
    }

    const { data, error } = await query.limit(filters.limit ?? 50);

    if (error) {
      throw toServiceError('관리자 행동 로그를 불러오지 못했습니다.', error);
    }

    return data ?? [];
  },

  async withAudit<T>(
    actorId: string,
    action: string,
    target: AuditTarget,
    task: () => Promise<T>,
    beforeValue?: unknown,
  ): Promise<T> {
    const result = await task();

    await this.logAction(actorId, action, target, beforeValue, result);

    return result;
  },
});

const getDefaultAuditService = async () => {
  const { supabase } = await import('./supabase');

  return createAuditService(supabase);
};

export const logAction = (
  actorId: string,
  action: string,
  target?: AuditTarget,
  beforeValue?: unknown,
  afterValue?: unknown,
) =>
  getDefaultAuditService().then((service) =>
    service.logAction(actorId, action, target, beforeValue, afterValue),
  );

export const getAuditLogs = (filters?: AuditLogFilters) =>
  getDefaultAuditService().then((service) => service.getAuditLogs(filters));

export const withAudit = <T>(
  actorId: string,
  action: string,
  target: AuditTarget,
  task: () => Promise<T>,
  beforeValue?: unknown,
) =>
  getDefaultAuditService().then((service) =>
    service.withAudit(actorId, action, target, task, beforeValue),
  );
