import type { SupabaseClient } from '@supabase/supabase-js';

import type {
  Database,
  UserStringSetup,
  UserStringSetupInsert,
  UserStringSetupUpdate,
} from '@/types/database';

type StringSetupClient = Pick<SupabaseClient<Database>, 'from'>;
type NewStringSetup = Omit<
  UserStringSetupInsert,
  'id' | 'created_at' | 'updated_at'
>;
type StringSetupChanges = Omit<
  UserStringSetupUpdate,
  'id' | 'user_id' | 'created_at' | 'updated_at'
>;

const tensionMin = 20;
const tensionMax = 70;

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

const validateTension = (value: number | undefined, field: string) => {
  if (value === undefined) {
    return;
  }

  if (!Number.isInteger(value) || value < tensionMin || value > tensionMax) {
    throw new Error(`${field} must be an integer from 20 to 70.`);
  }
};

const normalizeMemo = (memo: string | null | undefined) => {
  if (memo === undefined) {
    return undefined;
  }

  return memo?.trim() || null;
};

const normalizeNewSetup = (data: NewStringSetup): NewStringSetup => {
  validateTension(data.tension_main, 'tension_main');
  validateTension(data.tension_cross, 'tension_cross');

  const isHybrid = data.is_hybrid ?? false;

  return {
    ...data,
    is_hybrid: isHybrid,
    cross_string_id: isHybrid ? data.cross_string_id : data.main_string_id,
    memo: normalizeMemo(data.memo),
  };
};

const normalizeSetupChanges = (
  data: StringSetupChanges,
): StringSetupChanges => {
  validateTension(data.tension_main, 'tension_main');
  validateTension(data.tension_cross, 'tension_cross');

  const normalized: StringSetupChanges = {
    ...data,
    memo: normalizeMemo(data.memo),
  };

  if (data.is_hybrid === false && data.main_string_id) {
    normalized.cross_string_id = data.main_string_id;
  }

  return normalized;
};

const getCurrentMainStringId = async (
  client: StringSetupClient,
  id: string,
) => {
  const { data, error } = await client
    .from('user_string_setups')
    .select('main_string_id')
    .eq('id', id)
    .single();

  if (error || !data) {
    throw toServiceError('Unable to load current string setup.', error);
  }

  return data.main_string_id;
};

export const createStringSetupService = (client: StringSetupClient) => ({
  async getSetups(userId: string): Promise<UserStringSetup[]> {
    const { data, error } = await client
      .from('user_string_setups')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw toServiceError('Unable to load string setups.', error);
    }

    return data ?? [];
  },

  async getSetupsByRacket(
    userId: string,
    racketId: string,
  ): Promise<UserStringSetup[]> {
    const { data, error } = await client
      .from('user_string_setups')
      .select('*')
      .eq('user_id', userId)
      .eq('racket_id', racketId)
      .order('created_at', { ascending: false });

    if (error) {
      throw toServiceError('Unable to load racket string setups.', error);
    }

    return data ?? [];
  },

  async addSetup(data: NewStringSetup): Promise<UserStringSetup> {
    const payload = normalizeNewSetup(data);
    const { data: setup, error } = await client
      .from('user_string_setups')
      .insert(payload)
      .select('*')
      .single();

    if (error || !setup) {
      throw toServiceError('Unable to add string setup.', error);
    }

    return setup;
  },

  async updateSetup(
    id: string,
    data: StringSetupChanges,
  ): Promise<UserStringSetup> {
    const changes = normalizeSetupChanges(data);

    if (data.is_hybrid === false && !changes.cross_string_id) {
      changes.cross_string_id = await getCurrentMainStringId(client, id);
    }

    const payload = {
      ...changes,
      updated_at: new Date().toISOString(),
    };
    const { data: setup, error } = await client
      .from('user_string_setups')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single();

    if (error || !setup) {
      throw toServiceError('Unable to update string setup.', error);
    }

    return setup;
  },

  async deleteSetup(id: string): Promise<void> {
    const { error } = await client
      .from('user_string_setups')
      .delete()
      .eq('id', id);

    if (error) {
      throw toServiceError('Unable to delete string setup.', error);
    }
  },
});

const getDefaultStringSetupService = async () => {
  const { supabase } = await import('./supabase');

  return createStringSetupService(supabase);
};

export const getSetups = (userId: string) =>
  getDefaultStringSetupService().then((service) => service.getSetups(userId));

export const getSetupsByRacket = (userId: string, racketId: string) =>
  getDefaultStringSetupService().then((service) =>
    service.getSetupsByRacket(userId, racketId),
  );

export const addSetup = (data: NewStringSetup) =>
  getDefaultStringSetupService().then((service) => service.addSetup(data));

export const updateSetup = (id: string, data: StringSetupChanges) =>
  getDefaultStringSetupService().then((service) =>
    service.updateSetup(id, data),
  );

export const deleteSetup = (id: string) =>
  getDefaultStringSetupService().then((service) => service.deleteSetup(id));
