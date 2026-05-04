import type { SupabaseClient } from '@supabase/supabase-js';

import type {
  Database,
  NotificationPreference,
  NotificationPreferenceUpdate,
} from '@/types/database';

type NotificationPrefClient = Pick<SupabaseClient<Database>, 'from'>;

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

export const createNotificationPrefService = (
  client: NotificationPrefClient,
) => ({
  async getPreferences(userId: string): Promise<NotificationPreference> {
    const { data, error } = await client
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      throw toServiceError('알림 설정을 불러오지 못했습니다.', error);
    }

    return data;
  },

  async updatePreferences(
    userId: string,
    data: NotificationPreferenceUpdate,
  ): Promise<NotificationPreference> {
    const { data: preferences, error } = await client
      .from('notification_preferences')
      .update(data)
      .eq('user_id', userId)
      .select('*')
      .single();

    if (error || !preferences) {
      throw toServiceError('알림 설정을 저장하지 못했습니다.', error);
    }

    return preferences;
  },
});

const getDefaultNotificationPrefService = async () => {
  const { supabase } = await import('./supabase');

  return createNotificationPrefService(supabase);
};

export const getPreferences = (userId: string) =>
  getDefaultNotificationPrefService().then((service) =>
    service.getPreferences(userId),
  );

export const updatePreferences = (
  userId: string,
  data: NotificationPreferenceUpdate,
) =>
  getDefaultNotificationPrefService().then((service) =>
    service.updatePreferences(userId, data),
  );
