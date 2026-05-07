const mockGetPermissionsAsync = jest.fn();
const mockRequestPermissionsAsync = jest.fn();
const mockGetExpoPushTokenAsync = jest.fn();

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: mockGetPermissionsAsync,
  requestPermissionsAsync: mockRequestPermissionsAsync,
  getExpoPushTokenAsync: mockGetExpoPushTokenAsync,
}));

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: { extra: { eas: { projectId: 'project-1' } } },
    easConfig: { projectId: 'project-1' },
  },
}));

// opt-in 상태를 기본 true로 설정하여 기존 registerPushToken 테스트 정상 동작
const secureStoreData: Record<string, string> = {
  yellowball_notification_opt_in: 'true',
};

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn((key: string) =>
    Promise.resolve(secureStoreData[key] ?? null),
  ),
  setItemAsync: jest.fn((key: string, value: string) => {
    secureStoreData[key] = value;
    return Promise.resolve();
  }),
  deleteItemAsync: jest.fn((key: string) => {
    delete secureStoreData[key];
    return Promise.resolve();
  }),
}));

const notification = {
  id: 'notification-1',
  user_id: 'user-1',
  title: '예약 승인',
  body: '예약이 승인되었습니다.',
  notification_type: 'booking_approved',
  data: { bookingId: 'booking-1' },
  read: false,
  sent_at: null,
  created_at: '2026-05-03T00:00:00.000Z',
};

describe('notificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(secureStoreData).forEach((key) => {
      delete secureStoreData[key];
    });
    secureStoreData.yellowball_notification_opt_in = 'true';
  });

  test('getNotificationOptInStatus는 미응답, 허용, 거절 상태를 구분한다', async () => {
    const {
      getNotificationOptInStatus,
      setNotificationOptIn,
    } = require('../src/services/notificationService');

    delete secureStoreData.yellowball_notification_opt_in;
    await expect(getNotificationOptInStatus()).resolves.toBeNull();

    await setNotificationOptIn(false);
    await expect(getNotificationOptInStatus()).resolves.toBe(false);

    await setNotificationOptIn(true);
    await expect(getNotificationOptInStatus()).resolves.toBe(true);
  });

  test('SecureStore 저장 실패 시 로컬 저장소로 opt-in 선택 상태를 유지한다', async () => {
    const SecureStore = require('expo-secure-store');
    const localStore: Record<string, string> = {};
    const originalLocalStorage = global.localStorage;

    Object.defineProperty(global, 'localStorage', {
      configurable: true,
      value: {
        getItem: jest.fn((key: string) => localStore[key] ?? null),
        setItem: jest.fn((key: string, value: string) => {
          localStore[key] = value;
        }),
      },
    });
    SecureStore.getItemAsync.mockRejectedValueOnce(new Error('unavailable'));
    SecureStore.setItemAsync.mockRejectedValueOnce(new Error('unavailable'));

    const {
      getNotificationOptInStatus,
      setNotificationOptIn,
    } = require('../src/services/notificationService');

    await setNotificationOptIn(false);
    await expect(getNotificationOptInStatus()).resolves.toBe(false);

    Object.defineProperty(global, 'localStorage', {
      configurable: true,
      value: originalLocalStorage,
    });
  });

  test('registerPushToken은 알림을 거절한 사용자의 시스템 권한을 다시 묻지 않는다', async () => {
    secureStoreData.yellowball_notification_opt_in = 'false';
    const rpc = jest.fn();
    const { createNotificationService } = require('../src/services/notificationService');
    const service = createNotificationService({ from: jest.fn(), rpc } as never);

    await expect(service.registerPushToken('user-1')).resolves.toBeNull();

    expect(mockGetPermissionsAsync).not.toHaveBeenCalled();
    expect(mockRequestPermissionsAsync).not.toHaveBeenCalled();
    expect(rpc).not.toHaveBeenCalled();
  });

  test('registerPushToken은 권한 확인 후 Expo 토큰을 profiles에 저장한다', async () => {
    mockGetPermissionsAsync.mockResolvedValue({ status: 'granted' });
    mockGetExpoPushTokenAsync.mockResolvedValue({ data: 'ExponentPushToken[abc]' });
    const rpc = jest.fn().mockResolvedValue({ error: null });
    const { createNotificationService } = require('../src/services/notificationService');
    const service = createNotificationService({ from: jest.fn(), rpc } as never);

    await expect(service.registerPushToken('user-1')).resolves.toBe(
      'ExponentPushToken[abc]',
    );

    expect(mockGetExpoPushTokenAsync).toHaveBeenCalledWith({
      projectId: 'project-1',
    });
    expect(rpc).toHaveBeenCalledWith('update_profile_push_token', {
      p_user_id: 'user-1',
      p_expo_push_token: 'ExponentPushToken[abc]',
    });
  });

  test('getNotifications는 최신순 알림 목록을 조회한다', async () => {
    const order = jest
      .fn()
      .mockResolvedValue({ data: [notification], error: null });
    const eq = jest.fn(() => ({ order }));
    const select = jest.fn(() => ({ eq }));
    const from = jest.fn(() => ({ select }));
    const { createNotificationService } = require('../src/services/notificationService');
    const service = createNotificationService({ from } as never);

    await expect(service.getNotifications('user-1')).resolves.toEqual([
      notification,
    ]);

    expect(from).toHaveBeenCalledWith('notifications');
    expect(eq).toHaveBeenCalledWith('user_id', 'user-1');
    expect(order).toHaveBeenCalledWith('created_at', { ascending: false });
  });

  test('markAsRead는 단건 알림을 읽음 처리한다', async () => {
    const single = jest
      .fn()
      .mockResolvedValue({ data: { ...notification, read: true }, error: null });
    const select = jest.fn(() => ({ single }));
    const eq = jest.fn(() => ({ select }));
    const update = jest.fn(() => ({ eq }));
    const from = jest.fn(() => ({ update }));
    const { createNotificationService } = require('../src/services/notificationService');
    const service = createNotificationService({ from } as never);

    await expect(service.markAsRead('notification-1')).resolves.toMatchObject({
      read: true,
    });

    expect(update).toHaveBeenCalledWith({ read: true });
    expect(eq).toHaveBeenCalledWith('id', 'notification-1');
  });
});
