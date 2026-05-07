import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';

const mockReplace = jest.fn();
const mockSignUp = jest.fn();
const mockCheckEmailAvailable = jest.fn();
const mockCheckUsernameAvailable = jest.fn();
const mockSignInWithOAuthProvider = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
}));

jest.mock('../src/hooks/useAuth', () => ({
  useAuth: () => ({
    signInWithOAuthProvider: mockSignInWithOAuthProvider,
  }),
}));

jest.mock('../src/services/authService', () => ({
  signUp: mockSignUp,
  checkEmailAvailable: mockCheckEmailAvailable,
  checkUsernameAvailable: mockCheckUsernameAvailable,
}));

describe('RegisterScreen', () => {
  let alertSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());
    mockCheckEmailAvailable.mockResolvedValue(true);
    mockCheckUsernameAvailable.mockResolvedValue(true);
    mockSignUp.mockResolvedValue({ user: { id: 'user-1' }, session: null });
    mockSignInWithOAuthProvider.mockResolvedValue({
      session: { user: { id: 'user-1' } },
      user: { id: 'user-1' },
      error: null,
    });
  });

  afterEach(() => {
    alertSpy.mockRestore();
  });

  test('renders signup fields, social buttons, and login link', () => {
    const RegisterScreen = require('../app/(auth)/register').default;

    const screen = render(<RegisterScreen />);

    expect(screen.getByTestId('register-keyboard-view')).toBeTruthy();
    expect(screen.getByTestId('register-scroll-view').props.keyboardDismissMode).toBe(
      'interactive',
    );
    expect(screen.getByLabelText('이메일 아이디')).toBeTruthy();
    expect(screen.getByLabelText('이메일 도메인 선택')).toBeTruthy();
    expect(screen.getByLabelText('아이디')).toBeTruthy();
    expect(screen.getByLabelText('닉네임')).toBeTruthy();
    expect(screen.getByLabelText('비밀번호')).toBeTruthy();
    expect(screen.getByLabelText('비밀번호 확인')).toBeTruthy();
    expect(screen.getByLabelText('Google로 가입')).toBeTruthy();
    expect(screen.getByLabelText('카카오로 가입')).toBeTruthy();
    expect(screen.getByText('로그인으로 이동')).toBeTruthy();
  });

  test('shows field errors when submitting an empty form', async () => {
    const RegisterScreen = require('../app/(auth)/register').default;
    const screen = render(<RegisterScreen />);

    expect(
      screen.queryByText('이메일 주소를 올바른 형식으로 입력해 주세요.'),
    ).toBeNull();

    fireEvent.press(screen.getByLabelText('가입하기'));

    await waitFor(() => {
      expect(
        screen.getByText('이메일 주소를 올바른 형식으로 입력해 주세요.'),
      ).toBeTruthy();
      expect(
        screen.getByText(
          '아이디는 영문 소문자, 숫자, 언더스코어만 사용해 3~20자로 입력해 주세요.',
        ),
      ).toBeTruthy();
      expect(screen.getByText('닉네임은 2~10자로 입력해 주세요.')).toBeTruthy();
      expect(
        screen.getByText(
          '비밀번호는 8자 이상, 영문, 숫자, 특수문자를 포함해야 합니다.',
        ),
      ).toBeTruthy();
      expect(screen.getByText('비밀번호 확인을 입력해 주세요.')).toBeTruthy();
      expect(screen.getByText('입력값을 다시 확인해 주세요.')).toBeTruthy();
    });
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  test('blocks submit when password confirmation does not match', async () => {
    const RegisterScreen = require('../app/(auth)/register').default;
    const screen = render(<RegisterScreen />);

    fireEvent.changeText(screen.getByLabelText('이메일 아이디'), 'user');
    fireEvent.changeText(screen.getByLabelText('아이디'), 'yellow_01');
    fireEvent.changeText(screen.getByLabelText('닉네임'), '옐로볼');
    fireEvent.changeText(screen.getByLabelText('비밀번호'), 'Yellow1!');
    fireEvent.changeText(screen.getByLabelText('비밀번호 확인'), 'Yellow2!');
    fireEvent.press(screen.getByLabelText('가입하기'));

    await waitFor(() =>
      expect(screen.getByText('비밀번호가 일치하지 않습니다.')).toBeTruthy(),
    );
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  test('이메일 도메인을 선택하거나 직접 입력해 가입 이메일을 만든다', async () => {
    const RegisterScreen = require('../app/(auth)/register').default;
    const screen = render(<RegisterScreen />);

    fireEvent.changeText(screen.getByLabelText('이메일 아이디'), 'user');
    fireEvent.press(screen.getByLabelText('이메일 도메인 선택'));
    fireEvent.press(screen.getByLabelText('이메일 도메인 gmail.com'));
    fireEvent.changeText(screen.getByLabelText('아이디'), 'yellow_01');
    fireEvent.changeText(screen.getByLabelText('닉네임'), '옐로볼');
    fireEvent.changeText(screen.getByLabelText('비밀번호'), 'Yellow1!');
    fireEvent.changeText(screen.getByLabelText('비밀번호 확인'), 'Yellow1!');

    await waitFor(() =>
      expect(mockCheckEmailAvailable).toHaveBeenCalledWith('user@gmail.com'),
    );
    await waitFor(() =>
      expect(
        screen.getByLabelText('가입하기').props.accessibilityState.disabled,
      ).toBe(false),
    );

    fireEvent.press(screen.getByLabelText('가입하기'));

    await waitFor(() =>
      expect(mockSignUp).toHaveBeenCalledWith(
        'user@gmail.com',
        'Yellow1!',
        'yellow_01',
        '옐로볼',
      ),
    );

    jest.clearAllMocks();
    mockCheckEmailAvailable.mockResolvedValue(true);
    mockCheckUsernameAvailable.mockResolvedValue(true);
    mockSignUp.mockResolvedValue({ user: { id: 'user-1' }, session: null });
    const customScreen = render(<RegisterScreen />);

    fireEvent.changeText(customScreen.getByLabelText('이메일 아이디'), 'custom');
    fireEvent.press(customScreen.getByLabelText('이메일 도메인 선택'));
    fireEvent.press(customScreen.getByLabelText('이메일 도메인 직접 입력'));
    fireEvent.changeText(
      customScreen.getByLabelText('이메일 도메인 직접 입력'),
      'example.com',
    );
    fireEvent.changeText(customScreen.getByLabelText('아이디'), 'yellow_02');
    fireEvent.changeText(customScreen.getByLabelText('닉네임'), '옐로볼');
    fireEvent.changeText(customScreen.getByLabelText('비밀번호'), 'Yellow1!');
    fireEvent.changeText(
      customScreen.getByLabelText('비밀번호 확인'),
      'Yellow1!',
    );

    await waitFor(() =>
      expect(mockCheckEmailAvailable).toHaveBeenCalledWith(
        'custom@example.com',
      ),
    );
  });

  test('이메일 입력칸에는 @가 남지 않고 로컬 파트만 표시한다', async () => {
    const RegisterScreen = require('../app/(auth)/register').default;
    const screen = render(<RegisterScreen />);

    fireEvent.changeText(
      screen.getByLabelText('이메일 아이디'),
      'user@gmail.com',
    );

    await waitFor(() =>
      expect(mockCheckEmailAvailable).toHaveBeenCalledWith('user@gmail.com'),
    );
    expect(screen.getByLabelText('이메일 아이디').props.value).toBe('user');
    expect(screen.getByTestId('email-at-sign')).toBeTruthy();
  });

  test('이메일 입력과 도메인 선택 박스는 같은 높이로 정렬되고 메뉴는 도메인 선택 박스 아래에 맞춰 열린다', () => {
    const RegisterScreen = require('../app/(auth)/register').default;
    const screen = render(<RegisterScreen />);

    const emailRow = screen.getByTestId('email-row');
    const emailLocalField = screen.getByTestId('email-local-field');
    const domainField = screen.getByTestId('email-domain-field');

    expect(emailRow.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ alignItems: 'flex-end' })]),
    );
    expect(emailLocalField.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ flex: 1 })]),
    );
    expect(domainField.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ flex: 1 })]),
    );

    fireEvent.press(screen.getByLabelText('이메일 도메인 선택'));

    const domainMenuAnchor = screen.getByTestId('domain-menu-anchor');
    expect(domainMenuAnchor.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          alignSelf: 'flex-end',
          position: 'absolute',
          right: 0,
          width: '47%',
        }),
      ]),
    );
  });

  test('중복 이메일이면 가입을 막는다', async () => {
    mockCheckEmailAvailable.mockResolvedValue(false);
    const RegisterScreen = require('../app/(auth)/register').default;
    const screen = render(<RegisterScreen />);

    fireEvent.changeText(screen.getByLabelText('이메일 아이디'), 'user');

    await waitFor(() =>
      expect(screen.getByText('이미 가입된 이메일입니다.')).toBeTruthy(),
    );

    fireEvent.changeText(screen.getByLabelText('아이디'), 'yellow_01');
    fireEvent.changeText(screen.getByLabelText('닉네임'), '옐로볼');
    fireEvent.changeText(screen.getByLabelText('비밀번호'), 'Yellow1!');
    fireEvent.changeText(screen.getByLabelText('비밀번호 확인'), 'Yellow1!');
    fireEvent.press(screen.getByLabelText('가입하기'));

    expect(mockSignUp).not.toHaveBeenCalled();
  });

  test('shows duplicated username and blocks submit', async () => {
    mockCheckUsernameAvailable.mockResolvedValue(false);
    const RegisterScreen = require('../app/(auth)/register').default;
    const screen = render(<RegisterScreen />);

    fireEvent.changeText(screen.getByLabelText('아이디'), 'yellow_01');

    await waitFor(() =>
      expect(screen.getByText('이미 사용 중인 아이디입니다.')).toBeTruthy(),
    );

    fireEvent.changeText(screen.getByLabelText('이메일 아이디'), 'user');
    fireEvent.changeText(screen.getByLabelText('닉네임'), '옐로볼');
    fireEvent.changeText(screen.getByLabelText('비밀번호'), 'Yellow1!');
    fireEvent.changeText(screen.getByLabelText('비밀번호 확인'), 'Yellow1!');
    fireEvent.press(screen.getByLabelText('가입하기'));

    expect(mockSignUp).not.toHaveBeenCalled();
  });

  test('allows submit when username availability check fails', async () => {
    mockCheckUsernameAvailable.mockRejectedValue(new Error('Function not found'));
    const RegisterScreen = require('../app/(auth)/register').default;
    const screen = render(<RegisterScreen />);

    fireEvent.changeText(screen.getByLabelText('이메일 아이디'), 'user');
    fireEvent.changeText(screen.getByLabelText('아이디'), 'yellow_01');
    fireEvent.changeText(screen.getByLabelText('닉네임'), '옐로볼');
    fireEvent.changeText(screen.getByLabelText('비밀번호'), 'Yellow1!');
    fireEvent.changeText(screen.getByLabelText('비밀번호 확인'), 'Yellow1!');

    await waitFor(() =>
      expect(
        screen.getByText(
          '아이디 중복 확인을 건너뛰었습니다. 가입 시 다시 확인합니다.',
        ),
      ).toBeTruthy(),
    );
    await waitFor(() =>
      expect(
        screen.getByLabelText('가입하기').props.accessibilityState.disabled,
      ).toBe(false),
    );

    fireEvent.press(screen.getByLabelText('가입하기'));

    await waitFor(() =>
      expect(mockSignUp).toHaveBeenCalledWith(
        'user@naver.com',
        'Yellow1!',
        'yellow_01',
        '옐로볼',
      ),
    );
  });

  test('submits valid signup, shows email confirmation alert, and navigates to login after confirmation', async () => {
    const RegisterScreen = require('../app/(auth)/register').default;
    const screen = render(<RegisterScreen />);

    fireEvent.changeText(screen.getByLabelText('이메일 아이디'), 'user');
    fireEvent.changeText(screen.getByLabelText('아이디'), 'yellow_01');
    fireEvent.changeText(screen.getByLabelText('닉네임'), '옐로볼');
    fireEvent.changeText(screen.getByLabelText('비밀번호'), 'Yellow1!');
    fireEvent.changeText(screen.getByLabelText('비밀번호 확인'), 'Yellow1!');

    await waitFor(() =>
      expect(mockCheckEmailAvailable).toHaveBeenCalledWith('user@naver.com'),
    );
    await waitFor(() =>
      expect(mockCheckUsernameAvailable).toHaveBeenCalledWith('yellow_01'),
    );
    await waitFor(() =>
      expect(screen.queryByText('아이디 중복 확인 중입니다.')).toBeNull(),
    );
    await waitFor(() =>
      expect(
        screen.getByLabelText('가입하기').props.accessibilityState.disabled,
      ).toBe(false),
    );

    fireEvent.press(screen.getByLabelText('가입하기'));

    await waitFor(() =>
      expect(mockSignUp).toHaveBeenCalledWith(
        'user@naver.com',
        'Yellow1!',
        'yellow_01',
        '옐로볼',
      ),
    );

    expect(Alert.alert).toHaveBeenCalledWith(
      '이메일 인증 안내',
      'user@naver.com 주소로 인증 이메일을 보냈습니다. 메일함에서 인증을 완료한 뒤 로그인해 주세요.',
      expect.arrayContaining([
        expect.objectContaining({
          text: '확인',
        }),
      ]),
    );
    expect(mockReplace).not.toHaveBeenCalledWith('/(auth)/login');

    const alertButtons = alertSpy.mock.calls[0][2] as
      | { onPress?: () => void; text?: string }[]
      | undefined;
    alertButtons?.[0]?.onPress?.();

    expect(mockReplace).toHaveBeenCalledWith('/(auth)/login');
  });

  test('social signup signs in and navigates to tabs', async () => {
    const RegisterScreen = require('../app/(auth)/register').default;
    const screen = render(<RegisterScreen />);

    fireEvent.press(screen.getByLabelText('카카오로 가입'));

    await waitFor(() =>
      expect(mockSignInWithOAuthProvider).toHaveBeenCalledWith('kakao'),
    );
    expect(mockReplace).toHaveBeenCalledWith('/(tabs)');
  });
});
