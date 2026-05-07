import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database, Profile, ProfileUpdate } from '@/types/database';

type ProfileClient = Pick<SupabaseClient<Database>, 'from'> & {
  auth?: Pick<SupabaseClient<Database>['auth'], 'updateUser'>;
};
type EditableProfileFields = Pick<
  ProfileUpdate,
  'nickname' | 'phone'
>;

export interface ProfileService {
  getProfile: (userId: string) => Promise<Profile>;
  updateProfile: (
    userId: string,
    data: EditableProfileFields,
  ) => Promise<Profile>;
}

const normalizeSupabaseError = (message: string, error: unknown): Error => {
  if (error instanceof Error) {
    return new Error(`${message} ${error.message}`);
  }

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

const buildProfileUpdate = (data: EditableProfileFields): ProfileUpdate => {
  const updateData: ProfileUpdate = {
    updated_at: new Date().toISOString(),
  };

  if (data.nickname !== undefined) {
    updateData.nickname = data.nickname;
  }

  if (data.phone !== undefined) {
    updateData.phone = data.phone;
  }

  return updateData;
};

const updateAuthPhone = async (
  client: ProfileClient,
  phone?: string | null,
) => {
  if (!phone || !client.auth?.updateUser) {
    return;
  }

  const { error } = await client.auth.updateUser({ phone });

  if (error) {
    throw normalizeSupabaseError('인증 전화번호를 수정하지 못했습니다.', error);
  }
};

const assertPhoneAvailable = async (
  client: ProfileClient,
  userId: string,
  phone?: string | null,
) => {
  if (!phone) {
    return;
  }

  const query = client
    .from('profiles')
    .select('id')
    .eq('phone', phone)
    .neq('id', userId)
    .maybeSingle();

  const { data, error } = await query;

  if (error) {
    throw normalizeSupabaseError('전화번호 중복 확인에 실패했습니다.', error);
  }

  if (data) {
    throw new Error('이미 사용 중인 전화번호입니다.');
  }
};

export const createProfileService = (
  client: ProfileClient,
): ProfileService => ({
  async getProfile(userId) {
    try {
      const { data, error } = await client
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        throw normalizeSupabaseError('프로필을 불러오지 못했습니다.', error);
      }

      if (!data) {
        throw new Error('프로필을 찾을 수 없습니다.');
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }

      throw normalizeSupabaseError('프로필을 불러오지 못했습니다.', error);
    }
  },

  async updateProfile(userId, data) {
    try {
      await assertPhoneAvailable(client, userId, data.phone);
      await updateAuthPhone(client, data.phone);

      const { data: profile, error } = await client
        .from('profiles')
        .update(buildProfileUpdate(data))
        .eq('id', userId)
        .select('*')
        .single();

      if (error) {
        throw normalizeSupabaseError('프로필을 수정하지 못했습니다.', error);
      }

      if (!profile) {
        throw new Error('프로필을 찾을 수 없습니다.');
      }

      return profile;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }

      throw normalizeSupabaseError('프로필을 수정하지 못했습니다.', error);
    }
  },
});

const getDefaultProfileService = async (): Promise<ProfileService> => {
  const { supabase } = await import('./supabase');

  return createProfileService(supabase);
};

export const getProfile = async (userId: string) =>
  (await getDefaultProfileService()).getProfile(userId);

export const updateProfile = (
  userId: string,
  data: EditableProfileFields,
) => getDefaultProfileService().then((service) => service.updateProfile(userId, data));
