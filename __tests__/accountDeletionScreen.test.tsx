import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

const mockReplace = jest.fn();
const mockRequestAccountDeletion = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

jest.mock('../src/hooks/useAuth', () => ({
  useAuth: () => ({
    profile: {
      id: 'user-1',
      role: 'user',
      phone: '010-1111-2222',
    },
  }),
}));

jest.mock('../src/services/authService', () => ({
  requestAccountDeletion: mockRequestAccountDeletion,
}));

describe('AccountDeletionScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequestAccountDeletion.mockResolvedValue(undefined);
    jest.spyOn(Alert, 'alert').mockImplementation((_title, _message, buttons) => {
      buttons?.find((button) => button.text === '탈퇴')?.onPress?.();
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('확인 다이얼로그를 거친 뒤 탈퇴 요청을 처리한다', async () => {
    const AccountDeletionScreen = require('../app/(tabs)/account-deletion').default;
    const screen = render(<AccountDeletionScreen />);

    fireEvent.changeText(screen.getByLabelText('비밀번호 재입력'), 'Yellow1!');
    fireEvent.changeText(
      screen.getByLabelText('확인 문구'),
      '정말 탈퇴하시겠습니까?',
    );
    fireEvent.press(screen.getByLabelText('계정 탈퇴 요청'));

    expect(Alert.alert).toHaveBeenCalledWith(
      '계정 탈퇴',
      '정말 탈퇴하시겠습니까?',
      expect.any(Array),
    );
    await waitFor(() =>
      expect(mockRequestAccountDeletion).toHaveBeenCalledWith(
        'user-1',
        'Yellow1!',
        expect.objectContaining({ id: 'user-1' }),
      ),
    );
    expect(mockReplace).toHaveBeenCalledWith('/(auth)/login');
  });
});
