import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { Alert, BackHandler, StyleSheet } from 'react-native';

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

const flattenStyle = (style: unknown) =>
  StyleSheet.flatten(
    typeof style === 'function'
      ? style({ pressed: false, hovered: false, focused: false })
      : style,
  );

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

    expect(screen.getByTestId('register-scroll-view').props.keyboardDismissMode).toBe(
      'interactive',
    );
    expect(screen.getByTestId('register-scroll-view').props.keyboardShouldPersistTaps).toBe(
      'handled',
    );
    expect(screen.getByLabelText('이메일 아이디')).toBeTruthy();
    expect(screen.getByLabelText('이메일 도메인 선택')).toBeTruthy();
    expect(screen.getByLabelText('아이디')).toBeTruthy();
    expect(screen.getByLabelText('닉네임')).toBeTruthy();
    expect(screen.getByLabelText('비밀번호')).toBeTruthy();
    expect(screen.getByLabelText('비밀번호 확인')).toBeTruthy();
    expect(screen.getByLabelText('Google로 가입')).toBeTruthy();
    expect(screen.getByLabelText('카카오톡으로 가입')).toBeTruthy();
    expect(screen.getByText('Google로 계속하기')).toBeTruthy();
    expect(screen.getByText('카카오톡으로 계속하기')).toBeTruthy();
    expect(screen.getByText('로그인으로 이동')).toBeTruthy();
  });

  test('소셜 회원가입 버튼은 공통 Button 대신 Android용 직접 표면을 사용한다', () => {
    const RegisterScreen = require('../app/(auth)/register').default;
    const screen = render(<RegisterScreen />);

    const googleStyle = flattenStyle(
      screen.getByTestId('google-social-signup-surface').props.style,
    );
    const kakaoStyle = flattenStyle(
      screen.getByTestId('kakao-social-signup-surface').props.style,
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

  test('social signup button content fills the Android surface and keeps the label visible', () => {
    const RegisterScreen = require('../app/(auth)/register').default;
    const screen = render(<RegisterScreen />);

    const googleContentStyle = flattenStyle(
      screen.getByTestId('google-social-signup-button').props.style,
    );
    const kakaoContentStyle = flattenStyle(
      screen.getByTestId('kakao-social-signup-button').props.style,
    );
    const googleLabelStyle = StyleSheet.flatten(
      screen.getByTestId('google-social-signup-label').props.style,
    );
    const kakaoLabelStyle = StyleSheet.flatten(
      screen.getByTestId('kakao-social-signup-label').props.style,
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

  test('가입하기 버튼은 Android에서 배경과 텍스트를 잃지 않는 직접 Pressable 표면을 가진다', () => {
    const RegisterScreen = require('../app/(auth)/register').default;
    const screen = render(<RegisterScreen />);

    const submitButtonStyle = flattenStyle(
      screen.getByTestId('signup-submit-button').props.style,
    );
    const submitLabelStyle = StyleSheet.flatten(
      screen.getByTestId('signup-submit-label').props.style,
    );

    expect(submitButtonStyle).toEqual(
      expect.objectContaining({
        backgroundColor: '#103c28',
        borderColor: '#103c28',
        height: 48,
        minHeight: 48,
        overflow: 'hidden',
        width: '100%',
        zIndex: 1,
      }),
    );
    expect(submitLabelStyle).toEqual(
      expect.objectContaining({
        color: '#fcfaf4',
        fontSize: 16,
        lineHeight: 20,
      }),
    );
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

  test('이메일 도메인 메뉴 옵션은 화면 크기에 맞춰 여유 있는 세로 간격을 가진다', () => {
    const { getEmailDomainMenuMetrics } = require('../app/(auth)/register');

    const compactPhone = getEmailDomainMenuMetrics(320, 568);
    const galaxyPhone = getEmailDomainMenuMetrics(393, 852);
    const tablet = getEmailDomainMenuMetrics(768, 1024);

    expect(compactPhone.optionHeight).toBeGreaterThanOrEqual(72);
    expect(compactPhone.optionVerticalPadding).toBeGreaterThanOrEqual(16);
    expect(compactPhone.optionTextLineHeight).toBeGreaterThanOrEqual(22);
    expect(galaxyPhone.optionHeight).toBeGreaterThanOrEqual(
      compactPhone.optionHeight,
    );
    expect(tablet.optionHeight).toBeGreaterThan(galaxyPhone.optionHeight);
    expect(tablet.optionHeight).toBeLessThanOrEqual(84);
    expect(tablet.menuHeight).toBe(
      tablet.optionHeight * 6 + 1 * 5,
    );
  });

  test('이메일 도메인 메뉴가 열린 상태에서 빈 공간을 누르면 메뉴를 닫는다', () => {
    const RegisterScreen = require('../app/(auth)/register').default;
    const screen = render(<RegisterScreen />);

    fireEvent.press(screen.getByLabelText('이메일 도메인 선택'));

    expect(screen.getByTestId('domain-menu-anchor')).toBeTruthy();
    expect(screen.getByTestId('domain-menu-dismiss-layer')).toBeTruthy();

    fireEvent.press(screen.getByTestId('domain-menu-dismiss-layer'));

    expect(screen.queryByTestId('domain-menu-anchor')).toBeNull();
    expect(screen.queryByTestId('domain-menu-dismiss-layer')).toBeNull();
  });

  test('이메일 도메인 메뉴가 열린 상태에서 화면 배경을 누르면 메뉴를 닫는다', () => {
    const RegisterScreen = require('../app/(auth)/register').default;
    const screen = render(<RegisterScreen />);

    fireEvent.press(screen.getByLabelText('이메일 도메인 선택'));

    expect(screen.getByTestId('domain-menu-anchor')).toBeTruthy();
    expect(screen.getByTestId('domain-screen-dismiss-layer')).toBeTruthy();

    fireEvent.press(screen.getByTestId('domain-screen-dismiss-layer'));

    expect(screen.queryByTestId('domain-menu-anchor')).toBeNull();
  });

  test('도메인 메뉴가 열려 있어도 다른 입력칸 focus는 메뉴를 닫고 입력을 허용한다', () => {
    const RegisterScreen = require('../app/(auth)/register').default;
    const screen = render(<RegisterScreen />);

    const focusableInputs = ['아이디', '닉네임', '비밀번호', '비밀번호 확인'];

    focusableInputs.forEach((label) => {
      fireEvent.press(screen.getByLabelText('이메일 도메인 선택'));
      expect(screen.getByTestId('domain-menu-anchor')).toBeTruthy();

      fireEvent(screen.getByLabelText(label), 'focus');

      expect(screen.queryByTestId('domain-menu-anchor')).toBeNull();
    });
  });

  test('Android 하드웨어 뒤로가기는 회원가입에서 로그인 화면으로 이동한다', () => {
    const removeBackHandler = jest.fn();
    let backHandler: (() => boolean | null | undefined) | undefined;
    const addBackHandlerSpy = jest
      .spyOn(BackHandler, 'addEventListener')
      .mockImplementation((eventName, handler) => {
        expect(eventName).toBe('hardwareBackPress');
        backHandler = handler;
        return { remove: removeBackHandler } as never;
      });

    try {
      const RegisterScreen = require('../app/(auth)/register').default;
      const screen = render(<RegisterScreen />);

      expect(backHandler?.()).toBe(true);
      expect(mockReplace).toHaveBeenCalledWith('/(auth)/login');

      screen.unmount();
      expect(removeBackHandler).toHaveBeenCalled();
    } finally {
      addBackHandlerSpy.mockRestore();
    }
  });

  test('이메일 도메인을 선택하거나 직접 입력해 가입 이메일을 만든다', async () => {
    const RegisterScreen = require('../app/(auth)/register').default;
    const screen = render(<RegisterScreen />);

    fireEvent.changeText(screen.getByLabelText('이메일 아이디'), 'user');
    fireEvent.press(screen.getByLabelText('이메일 도메인 선택'));
    const gmailOption = screen.getByLabelText('이메일 도메인 gmail.com');
    const gmailOptionStyle = flattenStyle(gmailOption.props.style);
    expect(gmailOptionStyle).toEqual(
      expect.objectContaining({
        alignSelf: 'stretch',
        minHeight: expect.any(Number),
        paddingVertical: expect.any(Number),
        width: '100%',
      }),
    );
    expect(gmailOptionStyle.minHeight).toBeGreaterThanOrEqual(72);
    expect(gmailOptionStyle.paddingVertical).toBeGreaterThanOrEqual(16);
    expect(StyleSheet.flatten(screen.getByText('gmail.com').props.style)).toEqual(
      expect.objectContaining({
        lineHeight: expect.any(Number),
        paddingHorizontal: expect.any(Number),
      }),
    );
    expect(
      StyleSheet.flatten(screen.getByText('gmail.com').props.style).lineHeight,
    ).toBeGreaterThanOrEqual(22);
    expect(
      StyleSheet.flatten(
        screen.getByTestId('email-domain-option-separator-0').props.style,
      ),
    ).toEqual(
      expect.objectContaining({
        backgroundColor: '#e6e5dd',
        height: 1,
        width: '100%',
      }),
    );

    fireEvent.press(gmailOption);
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

  test('이메일 입력과 도메인 선택 박스는 Android에서 숫자 폭으로 같은 높이에 정렬된다', () => {
    const RegisterScreen = require('../app/(auth)/register').default;
    const screen = render(<RegisterScreen />);

    const emailRow = screen.getByTestId('email-row');
    const emailLabelRow = screen.getByTestId('email-label-row');
    const emailLocalField = screen.getByTestId('email-local-field');
    const domainField = screen.getByTestId('email-domain-field');
    const localLabelStyle = StyleSheet.flatten(
      screen.getByTestId('email-local-label').props.style,
    );
    const localFieldStyle = StyleSheet.flatten(emailLocalField.props.style);
    const domainFieldStyle = StyleSheet.flatten(domainField.props.style);

    expect(StyleSheet.flatten(emailLabelRow.props.style)).toEqual(
      expect.objectContaining({ alignItems: 'center' }),
    );
    expect(emailRow.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ alignItems: 'center' })]),
    );
    expect(localLabelStyle).toEqual(
      expect.objectContaining({
        fontSize: 14,
        lineHeight: 20,
        marginRight: expect.any(Number),
        width: expect.any(Number),
      }),
    );
    expect(localFieldStyle).toEqual(
      expect.objectContaining({
        flexGrow: 0,
        flexShrink: 0,
        marginRight: expect.any(Number),
        maxWidth: expect.any(Number),
        width: expect.any(Number),
      }),
    );
    expect(domainFieldStyle).toEqual(
      expect.objectContaining({
        flexGrow: 0,
        flexShrink: 0,
        maxWidth: localFieldStyle.width,
        width: localFieldStyle.width,
      }),
    );

    expect(StyleSheet.flatten(screen.getByTestId('email-at-sign').props.style)).toEqual(
      expect.objectContaining({
        height: expect.any(Number),
        marginRight: expect.any(Number),
      }),
    );

    expect(StyleSheet.flatten(screen.getByTestId('email-domain-label').props.style)).toEqual(
      expect.objectContaining({
        fontSize: 14,
        lineHeight: 20,
      }),
    );

    const domainSelectSurface = screen.getByTestId('email-domain-select-surface');
    const domainSelect = screen.getByLabelText('이메일 도메인 선택');
    expect(StyleSheet.flatten(domainSelectSurface.props.style)).toEqual(
      expect.objectContaining({
        backgroundColor: '#ffffff',
        borderColor: '#e6e5dd',
        borderWidth: 1,
        height: expect.any(Number),
        minHeight: expect.any(Number),
        overflow: 'hidden',
        width: '100%',
      }),
    );
    expect(flattenStyle(domainSelect.props.style)).toEqual(
      expect.objectContaining({
        bottom: 0,
        justifyContent: 'center',
        left: 0,
        overflow: 'hidden',
        position: 'absolute',
        right: 0,
        top: 0,
      }),
    );
    expect(StyleSheet.flatten(screen.getByText('naver.com').props.style)).toEqual(
      expect.objectContaining({
        lineHeight: 20,
        paddingHorizontal: expect.any(Number),
        width: '100%',
      }),
    );
    expect(
      StyleSheet.flatten(screen.getByText('naver.com').props.style).paddingHorizontal,
    ).toBeGreaterThanOrEqual(12);
    expect(screen.getByText('naver.com')).toBeTruthy();

    fireEvent.press(domainSelect);

    const domainMenuAnchor = screen.getByTestId('domain-menu-anchor');
    expect(StyleSheet.flatten(domainMenuAnchor.props.style)).toEqual(
      expect.objectContaining({
        elevation: expect.any(Number),
        left: expect.any(Number),
        position: 'absolute',
        top: expect.any(Number),
        width: domainFieldStyle.width,
        zIndex: 10,
      }),
    );

    fireEvent.press(screen.getByLabelText('이메일 도메인 gmail.com'));

    expect(screen.queryByTestId('domain-menu-anchor')).toBeNull();
    expect(screen.getByText('gmail.com')).toBeTruthy();
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

  test('shows availability success messages after email and username checks pass', async () => {
    const RegisterScreen = require('../app/(auth)/register').default;
    const screen = render(<RegisterScreen />);

    fireEvent.changeText(screen.getByLabelText('이메일 아이디'), 'available');
    fireEvent.changeText(screen.getByLabelText('아이디'), 'available_01');

    await waitFor(() =>
      expect(mockCheckEmailAvailable).toHaveBeenCalledWith(
        'available@naver.com',
      ),
    );
    await waitFor(() =>
      expect(mockCheckUsernameAvailable).toHaveBeenCalledWith('available_01'),
    );
    await waitFor(() => {
      expect(screen.getByText('가입 가능한 이메일입니다.')).toBeTruthy();
      expect(screen.getByText('가입 가능한 아이디입니다.')).toBeTruthy();
    });
  });

  test('blocks submit when username availability check fails', async () => {
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
          '아이디 중복 확인에 실패했습니다. 잠시 후 다시 시도해 주세요.',
        ),
      ).toBeTruthy(),
    );
    await waitFor(() =>
      expect(
        screen.getByLabelText('가입하기').props.accessibilityState.disabled,
      ).toBe(true),
    );

    fireEvent.press(screen.getByLabelText('가입하기'));

    expect(mockSignUp).not.toHaveBeenCalled();
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

    fireEvent.press(screen.getByLabelText('카카오톡으로 가입'));

    await waitFor(() =>
      expect(mockSignInWithOAuthProvider).toHaveBeenCalledWith('kakao'),
    );
    expect(mockReplace).toHaveBeenCalledWith('/(tabs)');
  });
});
