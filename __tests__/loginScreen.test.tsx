import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

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

const flattenStyle = (style: unknown) =>
  StyleSheet.flatten(
    typeof style === 'function'
      ? style({ pressed: false, hovered: false, focused: false })
      : style,
  );

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
    expect(screen.getByLabelText('카카오톡으로 로그인')).toBeTruthy();
    expect(screen.getByText('Google로 계속하기')).toBeTruthy();
    expect(screen.getByText('카카오톡으로 계속하기')).toBeTruthy();
    expect(screen.getByTestId('google-social-login-button')).toBeTruthy();
    expect(screen.getByTestId('kakao-social-login-button')).toBeTruthy();
    expect(screen.getByText('이메일로 회원가입')).toBeTruthy();
  });

  test('소셜 로그인 버튼은 Android에서 배경과 테두리를 잃지 않는 직접 표면을 가진다', () => {
    const LoginScreen = require('../app/(auth)/login').default;
    const screen = render(<LoginScreen />);

    const googleStyle = flattenStyle(
      screen.getByTestId('google-social-login-surface').props.style,
    );
    const kakaoStyle = flattenStyle(
      screen.getByTestId('kakao-social-login-surface').props.style,
    );

    expect(googleStyle).toEqual(
      expect.objectContaining({
        backgroundColor: '#FFFFFF',
        borderColor: '#DADCE0',
        height: 48,
        minHeight: 48,
        overflow: 'hidden',
        zIndex: 1,
      }),
    );
    expect(kakaoStyle).toEqual(
      expect.objectContaining({
        backgroundColor: '#FEE500',
        borderColor: '#FEE500',
        height: 48,
        minHeight: 48,
        overflow: 'hidden',
        zIndex: 1,
      }),
    );
  });

  test('social login button content fills the Android surface and keeps the label visible', () => {
    const LoginScreen = require('../app/(auth)/login').default;
    const screen = render(<LoginScreen />);

    const googleContentStyle = flattenStyle(
      screen.getByTestId('google-social-login-button').props.style,
    );
    const kakaoContentStyle = flattenStyle(
      screen.getByTestId('kakao-social-login-button').props.style,
    );
    const googleLabelStyle = StyleSheet.flatten(
      screen.getByTestId('google-social-login-label').props.style,
    );
    const kakaoLabelStyle = StyleSheet.flatten(
      screen.getByTestId('kakao-social-login-label').props.style,
    );

    expect(googleContentStyle).toEqual(
      expect.objectContaining({
        flex: 1,
        justifyContent: 'center',
        minHeight: 48,
        position: 'relative',
      }),
    );
    expect(kakaoContentStyle).toEqual(
      expect.objectContaining({
        flex: 1,
        justifyContent: 'center',
        minHeight: 48,
        position: 'relative',
      }),
    );
    expect(googleLabelStyle).toEqual(
      expect.objectContaining({
        maxWidth: '76%',
        textAlign: 'center',
      }),
    );
    expect(kakaoLabelStyle).toEqual(
      expect.objectContaining({
        maxWidth: '76%',
        textAlign: 'center',
      }),
    );
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
