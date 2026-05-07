import React from 'react';
import { render } from '@testing-library/react-native';

const screenNames: string[] = [];
let mockMenuSettings: Record<string, boolean>;

jest.mock('expo-router', () => {
  const React = require('react');

  const Tabs = ({ children }: { children: React.ReactNode }) => <>{children}</>;
  Tabs.Screen = ({
    name,
    options,
  }: {
    name: string;
    options?: { href?: string | null };
  }) => {
    if (options?.href !== null) {
      screenNames.push(name);
    }
    return null;
  };

  const Stack = () => null;

  return {
    Stack,
    Tabs,
  };
});

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ profile: null, session: null, isLoading: false }),
}));

jest.mock('@/hooks/useAppMenuSettings', () => ({
  useAppMenuSettings: () => mockMenuSettings,
}));

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  setItemAsync: jest.fn(() => Promise.resolve()),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'undetermined' })),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'undetermined' })),
  getExpoPushTokenAsync: jest.fn(() => Promise.resolve({ data: '' })),
}));

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: { extra: { eas: { projectId: 'test' } } },
    easConfig: { projectId: 'test' },
  },
}));

describe('탭 네비게이션', () => {
  beforeEach(() => {
    screenNames.length = 0;
    mockMenuSettings = {
      'string-booking': true,
      'demo-booking': true,
      shop: true,
      'racket-library': true,
      delivery: false,
      community: false,
      subscription: false,
      'queue-board': true,
      'auto-reorder': true,
      analytics: false,
      'audit-log': true,
    };
  });

  test('홈/예약/+/샵/마이 5개 탭을 렌더링한다', () => {
    const TabsLayout = require('../app/(tabs)/_layout').default;

    render(<TabsLayout />);

    expect(screenNames).toEqual([
      'index',
      'booking',
      'new-booking',
      'shop',
      'me',
    ]);
  });

  test('메뉴 설정에서 예약과 쇼핑을 끄면 실제 앱 탭도 숨긴다', () => {
    mockMenuSettings = {
      ...mockMenuSettings,
      'string-booking': false,
      'demo-booking': false,
      shop: false,
    };
    const TabsLayout = require('../app/(tabs)/_layout').default;

    render(<TabsLayout />);

    expect(screenNames).toEqual(['index', 'me']);
  });
});
