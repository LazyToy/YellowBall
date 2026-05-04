import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import type { SupabaseClient } from '@supabase/supabase-js';

import type {
  AppNotification,
  AppNotificationUpdate,
  Database,
  Json,
} from '@/types/database';

type NotificationClient = Pick<SupabaseClient<Database>, 'from' | 'rpc'>;

/** opt-in 다이얼로그를 통해 사용자가 알림을 허용했는지 여부를 나타내는 키 */
const NOTIFICATION_OPT_IN_KEY = 'yellowball_notification_opt_in';

/** opt-in 여부 확인 */
export const hasNotificationOptIn = async (): Promise<boolean> => {
  try {
    const value = await SecureStore.getItemAsync(NOTIFICATION_OPT_IN_KEY);
    return value === 'true';
  } catch {
    return false;
  }
};

/** opt-in 상태 저장 */
export const setNotificationOptIn = async (allowed: boolean): Promise<void> => {
  try {
    await SecureStore.setItemAsync(NOTIFICATION_OPT_IN_KEY, String(allowed));
  } catch {
    // 저장 실패 시 무시 (다음 진입 시 다시 묻기)
  }
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

export const createNotificationService = (client: NotificationClient) => ({
  async registerPushToken(userId: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return null;
    }

    // opt-in 다이얼로그에서 사용자가 동의하지 않았으면 등록 생략
    const optedIn = await hasNotificationOptIn();
    if (!optedIn) {
      return null;
    }

    const existing = await Notifications.getPermissionsAsync();
    const finalStatus =
      existing.status === 'granted'
        ? existing.status
        : (await Notifications.requestPermissionsAsync()).status;

    if (finalStatus !== 'granted') {
      throw new Error('푸시 알림 권한이 필요합니다.');
    }

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;
    const token = (
      await Notifications.getExpoPushTokenAsync(
        projectId ? { projectId } : undefined,
      )
    ).data;

    const { error } = await client.rpc('update_profile_push_token', {
      p_user_id: userId,
      p_expo_push_token: token,
    });

    if (error) {
      throw toServiceError('푸시 토큰을 저장하지 못했습니다.', error);
    }

    return token;
  },

  async getNotifications(userId: string): Promise<AppNotification[]> {
    const { data, error } = await client
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw toServiceError('알림 목록을 불러오지 못했습니다.', error);
    }

    return data ?? [];
  },

  async markAsRead(id: string): Promise<AppNotification> {
    const { data, error } = await client
      .from('notifications')
      .update({ read: true } satisfies AppNotificationUpdate)
      .eq('id', id)
      .select('*')
      .single();

    if (error || !data) {
      throw toServiceError('알림을 읽음 처리하지 못했습니다.', error);
    }

    return data;
  },

  async markAllAsRead(userId: string): Promise<void> {
    const { error } = await client
      .from('notifications')
      .update({ read: true } satisfies AppNotificationUpdate)
      .eq('user_id', userId)
      .eq('read', false);

    if (error) {
      throw toServiceError('모든 알림을 읽음 처리하지 못했습니다.', error);
    }
  },

  async createNotification(input: {
    user_id: string;
    title: string;
    body: string;
    notification_type?: string;
    data?: Json;
  }): Promise<AppNotification> {
    const { data, error } = await client
      .from('notifications')
      .insert(input)
      .select('*')
      .single();

    if (error || !data) {
      throw toServiceError('알림을 생성하지 못했습니다.', error);
    }

    return data;
  },
});

const getDefaultNotificationService = async () => {
  const { supabase } = await import('./supabase');

  return createNotificationService(supabase);
};

export const registerPushToken = (userId: string) =>
  getDefaultNotificationService().then((service) =>
    service.registerPushToken(userId),
  );

export const getNotifications = (userId: string) =>
  getDefaultNotificationService().then((service) =>
    service.getNotifications(userId),
  );

export const markAsRead = (id: string) =>
  getDefaultNotificationService().then((service) => service.markAsRead(id));

export const markAllAsRead = (userId: string) =>
  getDefaultNotificationService().then((service) =>
    service.markAllAsRead(userId),
  );
