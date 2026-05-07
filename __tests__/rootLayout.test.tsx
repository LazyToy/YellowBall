import React from 'react';
import { readFileSync } from 'fs';
import { join } from 'path';
import { render, waitFor } from '@testing-library/react-native';

const mockReplace = jest.fn();
const mockUseSegments = jest.fn();
const mockUseAuth = jest.fn();
const mockSyncAuthSession = jest.fn();
const mockGetSession = jest.fn();
const mockRefreshSession = jest.fn();
const mockOnAuthStateChange = jest.fn();
const mockUnsubscribe = jest.fn();

jest.mock('expo-router', () => {
  const React = require('react');

  const Stack = ({ children }: { children: React.ReactNode }) => <>{children}</>;
  Stack.Screen = () => null;

  return {
    Stack,
    useRouter: () => ({ replace: mockReplace }),
    useSegments: mockUseSegments,
  };
});

jest.mock('expo-status-bar', () => ({
  StatusBar: () => null,
}));

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    SafeAreaProvider: ({ children }: { children: React.ReactNode }) => (
      <>{children}</>
    ),
    SafeAreaView: ({
      children,
      ...props
    }: {
      children: React.ReactNode;
    }) => <View {...props}>{children}</View>,
  };
});

jest.mock('../src/hooks/useAuth', () => ({
  syncAuthSession: mockSyncAuthSession,
  useAuth: mockUseAuth,
}));

jest.mock('../src/services/supabase', () => ({
  supabase: {
    auth: {
      getSession: mockGetSession,
      refreshSession: mockRefreshSession,
      onAuthStateChange: mockOnAuthStateChange,
    },
  },
}));

describe('RootLayout 인증 분기', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue({ data: { session: null }, error: null });
    mockRefreshSession.mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } },
      error: null,
    });
    mockOnAuthStateChange.mockReturnValue({
      data: {
        subscription: {
          unsubscribe: mockUnsubscribe,
        },
      },
    });
  });

  test('app/_layout.tsx에서 Supabase 인증 리스너를 직접 구독한다', () => {
    const source = readFileSync(join(process.cwd(), 'app/_layout.tsx'), 'utf8');

    expect(source).toContain('onAuthStateChange');
    expect(source).toContain('refreshSession');
  });

  test('app/_layout.tsx에서 시스템 바 영역을 safe area로 제외한다', () => {
    const source = readFileSync(join(process.cwd(), 'app/_layout.tsx'), 'utf8');

    expect(source).toContain('SafeAreaProvider');
    expect(source).toContain('SafeAreaView');
    expect(source).toContain("edges={['top', 'bottom']}");
  });

  test('만료된 세션은 앱 시작 시 refreshSession으로 갱신한다', async () => {
    mockUseSegments.mockReturnValue(['(auth)']);
    mockUseAuth.mockReturnValue({
      session: null,
      isLoading: false,
    });
    mockGetSession.mockResolvedValue({
      data: {
        session: {
          expires_at: Math.floor(Date.now() / 1000) - 10,
          user: { id: 'user-1' },
        },
      },
      error: null,
    });

    const RootLayout = require('../app/_layout').default;
    render(<RootLayout />);

    await waitFor(() => expect(mockRefreshSession).toHaveBeenCalledTimes(1));
    expect(mockSyncAuthSession).toHaveBeenCalledWith({
      user: { id: 'user-1' },
    });
  });

  test('비인증 상태에서 로그인 화면으로 이동한다', async () => {
    mockUseSegments.mockReturnValue(['(tabs)']);
    mockUseAuth.mockReturnValue({
      session: null,
      isLoading: false,
    });

    const RootLayout = require('../app/_layout').default;
    render(<RootLayout />);

    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith('/(auth)/login'),
    );
  });

  test('인증 상태에서 탭 화면으로 이동한다', async () => {
    mockUseSegments.mockReturnValue(['(auth)']);
    mockUseAuth.mockReturnValue({
      session: { user: { id: 'user-1' } },
      isLoading: false,
    });

    const RootLayout = require('../app/_layout').default;
    render(<RootLayout />);

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/(tabs)'));
  });
});
