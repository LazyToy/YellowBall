import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { AUTH_SESSION_STORAGE_KEY } from '@/constants/auth';
import type { Database } from '@/types/database';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase 환경 변수가 설정되지 않았습니다.');
}

const memoryStorage = new Map<string, string>();

const getBrowserStorage = () => {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
};

const webStorageAdapter = {
  getItem: async (key: string) => {
    const storage = getBrowserStorage();

    return storage?.getItem(key) ?? memoryStorage.get(key) ?? null;
  },
  setItem: async (key: string, value: string) => {
    const storage = getBrowserStorage();

    if (storage) {
      storage.setItem(key, value);
      return;
    }

    memoryStorage.set(key, value);
  },
  removeItem: async (key: string) => {
    const storage = getBrowserStorage();

    if (storage) {
      storage.removeItem(key);
      return;
    }

    memoryStorage.delete(key);
  },
};

const nativeSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

export const secureStoreAdapter =
  Platform.OS === 'web' ||
  (typeof document !== 'undefined' &&
    typeof document.createElement === 'function')
    ? webStorageAdapter
    : nativeSecureStoreAdapter;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    detectSessionInUrl: false,
    persistSession: false,
    storageKey: AUTH_SESSION_STORAGE_KEY,
    storage: secureStoreAdapter,
  },
});
