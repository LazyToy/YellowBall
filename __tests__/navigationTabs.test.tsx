import React from 'react';
import { render } from '@testing-library/react-native';

const screenNames: string[] = [];

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
});
