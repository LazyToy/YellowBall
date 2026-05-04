import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

const mockReplace = jest.fn();
const mockSignUp = jest.fn();
const mockCheckUsernameAvailable = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
}));

jest.mock('../src/services/authService', () => ({
  signUp: mockSignUp,
  checkUsernameAvailable: mockCheckUsernameAvailable,
}));

describe('RegisterScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCheckUsernameAvailable.mockResolvedValue(true);
    mockSignUp.mockResolvedValue({ user: { id: 'user-1' }, session: null });
  });

  test('renders signup fields and login link', () => {
    const RegisterScreen = require('../app/(auth)/register').default;

    const screen = render(<RegisterScreen />);

    expect(screen.getByLabelText('휴대폰 번호')).toBeTruthy();
    expect(screen.getByLabelText('아이디')).toBeTruthy();
    expect(screen.getByLabelText('닉네임')).toBeTruthy();
    expect(screen.getByLabelText('비밀번호')).toBeTruthy();
    expect(screen.getByLabelText('비밀번호 확인')).toBeTruthy();
    expect(screen.getByText('로그인으로 이동')).toBeTruthy();
  });

  test('shows field errors when submitting an empty form', async () => {
    const RegisterScreen = require('../app/(auth)/register').default;
    const screen = render(<RegisterScreen />);

    expect(
      screen.queryByText('휴대폰 번호는 010-1234-5678 형식으로 입력해 주세요.'),
    ).toBeNull();

    fireEvent.press(screen.getByLabelText('가입하기'));

    await waitFor(() => {
      expect(
        screen.getByText('휴대폰 번호는 010-1234-5678 형식으로 입력해 주세요.'),
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

    fireEvent.changeText(screen.getByLabelText('휴대폰 번호'), '010-1234-5678');
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

  test('shows duplicated username and blocks submit', async () => {
    mockCheckUsernameAvailable.mockResolvedValue(false);
    const RegisterScreen = require('../app/(auth)/register').default;
    const screen = render(<RegisterScreen />);

    fireEvent.changeText(screen.getByLabelText('아이디'), 'yellow_01');

    await waitFor(() =>
      expect(screen.getByText('이미 사용 중인 아이디입니다.')).toBeTruthy(),
    );

    fireEvent.changeText(screen.getByLabelText('휴대폰 번호'), '010-1234-5678');
    fireEvent.changeText(screen.getByLabelText('닉네임'), '옐로볼');
    fireEvent.changeText(screen.getByLabelText('비밀번호'), 'Yellow1!');
    fireEvent.changeText(screen.getByLabelText('비밀번호 확인'), 'Yellow1!');
    fireEvent.press(screen.getByLabelText('가입하기'));

    expect(mockSignUp).not.toHaveBeenCalled();
  });

  test('submits valid signup and navigates to login', async () => {
    const RegisterScreen = require('../app/(auth)/register').default;
    const screen = render(<RegisterScreen />);

    fireEvent.changeText(screen.getByLabelText('휴대폰 번호'), '010-1234-5678');
    fireEvent.changeText(screen.getByLabelText('아이디'), 'yellow_01');
    fireEvent.changeText(screen.getByLabelText('닉네임'), '옐로볼');
    fireEvent.changeText(screen.getByLabelText('비밀번호'), 'Yellow1!');
    fireEvent.changeText(screen.getByLabelText('비밀번호 확인'), 'Yellow1!');

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
        '010-1234-5678',
        'Yellow1!',
        'yellow_01',
        '옐로볼',
      ),
    );
    expect(mockReplace).toHaveBeenCalledWith('/(auth)/login');
  });
});
