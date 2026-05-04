import type { SupabaseClient } from '@supabase/supabase-js';

import type {
  Database,
  UserRacket,
  UserRacketInsert,
  UserRacketUpdate,
} from '@/types/database';

type RacketClient = Pick<SupabaseClient<Database>, 'from'>;
type NewRacket = Omit<UserRacketInsert, 'id' | 'created_at' | 'is_primary'> & {
  is_primary?: boolean;
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

const getRacketOwner = async (client: RacketClient, racketId: string) => {
  const { data, error } = await client
    .from('user_rackets')
    .select('owner_id')
    .eq('id', racketId)
    .single();

  if (error || !data) {
    throw toServiceError('라켓을 찾을 수 없습니다.', error);
  }

  return data.owner_id;
};

const getFirstRacket = async (client: RacketClient, ownerId: string) => {
  const { data, error } = await client
    .from('user_rackets')
    .select('*')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: true })
    .limit(1);

  if (error) {
    throw toServiceError('메인 라켓을 이전하지 못했습니다.', error);
  }

  return data?.[0] ?? null;
};

export const createRacketService = (client: RacketClient) => ({
  async getRackets(userId: string): Promise<UserRacket[]> {
    const { data, error } = await client
      .from('user_rackets')
      .select('*')
      .eq('owner_id', userId)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      throw toServiceError('라켓 목록을 불러오지 못했습니다.', error);
    }

    return data ?? [];
  },

  async getRacket(id: string): Promise<UserRacket> {
    const { data, error } = await client
      .from('user_rackets')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw toServiceError('라켓을 불러오지 못했습니다.', error);
    }

    return data;
  },

  async addRacket(data: NewRacket): Promise<UserRacket> {
    const existing = await this.getRackets(data.owner_id);
    const shouldPrimary = data.is_primary ?? existing.length === 0;

    if (shouldPrimary) {
      await client
        .from('user_rackets')
        .update({ is_primary: false })
        .eq('owner_id', data.owner_id);
    }

    const { data: racket, error } = await client
      .from('user_rackets')
      .insert({ ...data, is_primary: shouldPrimary })
      .select('*')
      .single();

    if (error || !racket) {
      throw toServiceError('라켓을 추가하지 못했습니다.', error);
    }

    return racket;
  },

  async updateRacket(id: string, data: UserRacketUpdate): Promise<UserRacket> {
    const ownerId = await getRacketOwner(client, id);

    if (data.is_primary) {
      await client
        .from('user_rackets')
        .update({ is_primary: false })
        .eq('owner_id', ownerId);
    }

    const { data: racket, error } = await client
      .from('user_rackets')
      .update(data)
      .eq('id', id)
      .select('*')
      .single();

    if (error || !racket) {
      throw toServiceError('라켓을 수정하지 못했습니다.', error);
    }

    return racket;
  },

  async deleteRacket(id: string): Promise<void> {
    const ownerId = await getRacketOwner(client, id);
    const current = await client
      .from('user_rackets')
      .select('is_primary')
      .eq('id', id)
      .single();
    const wasPrimary = Boolean(current.data?.is_primary);
    const { error } = await client.from('user_rackets').delete().eq('id', id);

    if (error) {
      throw toServiceError('라켓을 삭제하지 못했습니다.', error);
    }

    if (wasPrimary) {
      const nextRacket = await getFirstRacket(client, ownerId);

      if (nextRacket) {
        await this.setPrimaryRacket(nextRacket.id);
      }
    }
  },

  async setPrimaryRacket(id: string): Promise<UserRacket> {
    const ownerId = await getRacketOwner(client, id);

    await client
      .from('user_rackets')
      .update({ is_primary: false })
      .eq('owner_id', ownerId);

    const { data, error } = await client
      .from('user_rackets')
      .update({ is_primary: true })
      .eq('id', id)
      .select('*')
      .single();

    if (error || !data) {
      throw toServiceError('메인 라켓을 설정하지 못했습니다.', error);
    }

    return data;
  },
});

const getDefaultRacketService = async () => {
  const { supabase } = await import('./supabase');

  return createRacketService(supabase);
};

export const getRackets = (userId: string) =>
  getDefaultRacketService().then((service) => service.getRackets(userId));

export const getRacket = (id: string) =>
  getDefaultRacketService().then((service) => service.getRacket(id));

export const addRacket = (data: NewRacket) =>
  getDefaultRacketService().then((service) => service.addRacket(data));

export const updateRacket = (id: string, data: UserRacketUpdate) =>
  getDefaultRacketService().then((service) => service.updateRacket(id, data));

export const deleteRacket = (id: string) =>
  getDefaultRacketService().then((service) => service.deleteRacket(id));

export const setPrimaryRacket = (id: string) =>
  getDefaultRacketService().then((service) => service.setPrimaryRacket(id));
