const mockCreateClient = jest.fn(() => ({ from: jest.fn() }));
const mockGetItemAsync = jest.fn();
const mockSetItemAsync = jest.fn();
const mockDeleteItemAsync = jest.fn();
const mockPlatform = { OS: 'ios' };

jest.mock('@supabase/supabase-js', () => ({
  createClient: mockCreateClient,
}));

jest.mock('expo-secure-store', () => ({
  getItemAsync: mockGetItemAsync,
  setItemAsync: mockSetItemAsync,
  deleteItemAsync: mockDeleteItemAsync,
}));

jest.mock('react-native', () => ({
  Platform: mockPlatform,
}));

describe('Supabase 클라이언트', () => {
  const originalEnv = process.env;
  const originalLocalStorage = global.localStorage;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    mockPlatform.OS = 'ios';
    process.env = {
      ...originalEnv,
      EXPO_PUBLIC_SUPABASE_URL: 'https://yellowball.supabase.co',
      EXPO_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
    Object.defineProperty(global, 'localStorage', {
      configurable: true,
      value: originalLocalStorage,
    });
  });

  test('환경 변수와 SecureStore adapter로 싱글톤 클라이언트를 생성한다', async () => {
    const { createClient } = require('@supabase/supabase-js');
    const SecureStore = require('expo-secure-store');
    const { secureStoreAdapter, supabase } = require('../src/services/supabase');

    await secureStoreAdapter.setItem('session', 'token');
    await secureStoreAdapter.getItem('session');
    await secureStoreAdapter.removeItem('session');

    expect(supabase).toBeDefined();
    expect(createClient).toHaveBeenCalledTimes(1);
    expect(createClient).toHaveBeenCalledWith(
      'https://yellowball.supabase.co',
      'anon-key',
      expect.objectContaining({
        auth: expect.objectContaining({
          autoRefreshToken: true,
          detectSessionInUrl: false,
          persistSession: true,
          storage: secureStoreAdapter,
        }),
      }),
    );
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('session', 'token');
    expect(SecureStore.getItemAsync).toHaveBeenCalledWith('session');
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('session');
  });

  test('웹에서는 SecureStore 대신 localStorage adapter를 사용한다', async () => {
    const localStorage = {
      getItem: jest.fn(() => 'token'),
      removeItem: jest.fn(),
      setItem: jest.fn(),
    };
    mockPlatform.OS = 'web';
    Object.defineProperty(global, 'localStorage', {
      configurable: true,
      value: localStorage,
    });

    const { secureStoreAdapter } = require('../src/services/supabase');

    await expect(secureStoreAdapter.getItem('session')).resolves.toBe('token');
    await secureStoreAdapter.setItem('session', 'next-token');
    await secureStoreAdapter.removeItem('session');

    expect(localStorage.getItem).toHaveBeenCalledWith('session');
    expect(localStorage.setItem).toHaveBeenCalledWith('session', 'next-token');
    expect(localStorage.removeItem).toHaveBeenCalledWith('session');
    expect(mockGetItemAsync).not.toHaveBeenCalled();
    expect(mockSetItemAsync).not.toHaveBeenCalled();
    expect(mockDeleteItemAsync).not.toHaveBeenCalled();
  });

  test('공개 anon key가 없으면 한국어 오류를 발생시킨다', () => {
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = '';

    expect(() => require('../src/services/supabase')).toThrow(
      'Supabase 환경 변수가 설정되지 않았습니다.',
    );
  });
});
