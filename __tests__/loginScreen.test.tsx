import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

const mockReplace = jest.fn();
const mockSignIn = jest.fn();
const mockSignInWithOAuthProvider = jest.fn();
const mockGetAppContentBlock = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
}));

jest.mock('../src/hooks/useAuth', () => ({
  useAuth: () => ({
    signIn: mockSignIn,
    signInWithOAuthProvider: mockSignInWithOAuthProvider,
  }),
}));

jest.mock('../src/services/appContentService', () => ({
  getAppContentBlock: mockGetAppContentBlock,
}));

jest.mock('../src/services/storageService', () => ({
  getAppAssetUrl: (value?: string | null) =>
    value ? `https://storage.example.com/app-assets/${value}` : null,
}));

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAppContentBlock.mockResolvedValue(null);
    mockSignIn.mockResolvedValue({
      session: { user: { id: 'user-1' } },
      user: { id: 'user-1' },
      error: null,
    });
    mockSignInWithOAuthProvider.mockResolvedValue({
      session: { user: { id: 'user-1' } },
      user: { id: 'user-1' },
      error: null,
    });
  });

  test('이메일, 비밀번호 입력과 소셜 로그인 버튼, 회원가입 링크를 렌더링한다', () => {
    const LoginScreen = require('../app/(auth)/login').default;
    const screen = render(<LoginScreen />);

    expect(screen.getByLabelText('이메일')).toBeTruthy();
    expect(screen.getByLabelText('비밀번호')).toBeTruthy();
    expect(screen.getByLabelText('로그인')).toBeTruthy();
    expect(screen.getByLabelText('Google로 로그인')).toBeTruthy();
    expect(screen.getByLabelText('카카오로 로그인')).toBeTruthy();
    expect(screen.getByText('이메일로 회원가입')).toBeTruthy();
  });

  test('로그인 실패 시 오류 메시지를 표시한다', async () => {
    mockSignIn.mockResolvedValue({
      session: null,
      user: null,
      error: new Error('이메일 또는 비밀번호가 올바르지 않습니다.'),
    });
    const LoginScreen = require('../app/(auth)/login').default;
    const screen = render(<LoginScreen />);

    fireEvent.changeText(screen.getByLabelText('이메일'), 'user@example.com');
    fireEvent.changeText(screen.getByLabelText('비밀번호'), 'Wrong1!');
    fireEvent.press(screen.getByLabelText('로그인'));

    await waitFor(() =>
      expect(
        screen.getByText('이메일 또는 비밀번호가 올바르지 않습니다.'),
      ).toBeTruthy(),
    );
    expect(mockReplace).not.toHaveBeenCalledWith('/(tabs)');
  });

  test('제재 계정 오류를 화면에 표시하고 탭으로 이동하지 않는다', async () => {
    mockSignIn.mockResolvedValue({
      session: null,
      user: null,
      error: new Error('계정이 제재되었습니다.'),
    });
    const LoginScreen = require('../app/(auth)/login').default;
    const screen = render(<LoginScreen />);

    fireEvent.changeText(screen.getByLabelText('이메일'), 'user@example.com');
    fireEvent.changeText(screen.getByLabelText('비밀번호'), 'Yellow1!');
    fireEvent.press(screen.getByLabelText('로그인'));

    await waitFor(() =>
      expect(screen.getByText('계정이 제재되었습니다.')).toBeTruthy(),
    );
    expect(mockReplace).not.toHaveBeenCalledWith('/(tabs)');
  });

  test('로그인 성공 시 탭 화면으로 이동한다', async () => {
    const LoginScreen = require('../app/(auth)/login').default;
    const screen = render(<LoginScreen />);

    fireEvent.changeText(screen.getByLabelText('이메일'), 'user@example.com');
    fireEvent.changeText(screen.getByLabelText('비밀번호'), 'Yellow1!');
    fireEvent.press(screen.getByLabelText('로그인'));

    await waitFor(() =>
      expect(mockSignIn).toHaveBeenCalledWith('user@example.com', 'Yellow1!'),
    );
    expect(mockReplace).toHaveBeenCalledWith('/(tabs)');
  });

  test('Google 로그인 성공 시 탭 화면으로 이동한다', async () => {
    const LoginScreen = require('../app/(auth)/login').default;
    const screen = render(<LoginScreen />);

    fireEvent.press(screen.getByLabelText('Google로 로그인'));

    await waitFor(() =>
      expect(mockSignInWithOAuthProvider).toHaveBeenCalledWith('google'),
    );
    expect(mockReplace).toHaveBeenCalledWith('/(tabs)');
  });
});
