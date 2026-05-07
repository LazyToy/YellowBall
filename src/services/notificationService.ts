import Constants from 'expo-constants';
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
type ExpoNotificationsModule = typeof import('expo-notifications');

declare const require: (moduleName: string) => unknown;

/** opt-in 다이얼로그를 통해 사용자가 알림을 허용했는지 여부를 나타내는 키 */
const NOTIFICATION_OPT_IN_KEY = 'yellowball_notification_opt_in';
let optInFallbackValue: string | null = null;

export type NotificationOptInStatus = boolean | null;

type LocalStorageLike = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
};

const getLocalStorage = (): LocalStorageLike | null => {
  const storage = (globalThis as typeof globalThis & {
    localStorage?: LocalStorageLike;
  }).localStorage;

  return storage ?? null;
};

const readStoredOptInValue = async (): Promise<string | null> => {
  try {
    const secureValue = await SecureStore.getItemAsync(NOTIFICATION_OPT_IN_KEY);

    if (secureValue !== null) {
      return secureValue;
    }
  } catch {
    // SecureStore를 사용할 수 없는 환경에서는 아래 대체 저장소를 확인합니다.
  }

  try {
    return getLocalStorage()?.getItem(NOTIFICATION_OPT_IN_KEY) ?? optInFallbackValue;
  } catch {
    return optInFallbackValue;
  }
};

const writeStoredOptInValue = async (value: string): Promise<void> => {
  optInFallbackValue = value;

  try {
    await SecureStore.setItemAsync(NOTIFICATION_OPT_IN_KEY, value);
    return;
  } catch {
    // SecureStore 저장 실패 시에도 같은 세션과 웹 환경에서는 선택을 유지합니다.
  }

  try {
    getLocalStorage()?.setItem(NOTIFICATION_OPT_IN_KEY, value);
  } catch {
    // 대체 저장소까지 실패하면 메모리 fallback만 유지합니다.
  }
};

export const getNotificationOptInStatus =
  async (): Promise<NotificationOptInStatus> => {
    const value = await readStoredOptInValue();

    if (value === 'true') {
      return true;
    }

    if (value === 'false') {
      return false;
    }

    return null;
  };

/** opt-in 여부 확인 */
export const hasNotificationOptIn = async (): Promise<boolean> => {
  return (await getNotificationOptInStatus()) === true;
};

/** opt-in 상태 저장 */
export const setNotificationOptIn = async (allowed: boolean): Promise<void> => {
  await writeStoredOptInValue(String(allowed));
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

const isExpoGoAndroid = () =>
  Platform.OS === 'android' && Constants.appOwnership === 'expo';

const getExpoNotifications = async (): Promise<ExpoNotificationsModule | null> => {
  if (isExpoGoAndroid()) {
    return null;
  }

  return require('expo-notifications') as ExpoNotificationsModule;
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

    const Notifications = await getExpoNotifications();
    if (!Notifications) {
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
