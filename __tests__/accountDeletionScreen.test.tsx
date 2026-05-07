import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

const mockReplace = jest.fn();
const mockRequestAccountDeletion = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn(), replace: mockReplace }),
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

    expect(screen.getByText('계정 탈퇴를 요청할까요?')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('탈퇴 요청'));

    await waitFor(() =>
      expect(mockRequestAccountDeletion).toHaveBeenCalledWith(
        'user-1',
        'Yellow1!',
        expect.objectContaining({ id: 'user-1' }),
      ),
    );
    await waitFor(() =>
      expect(screen.getByText('탈퇴 요청이 접수되었습니다')).toBeTruthy(),
    );
    fireEvent.press(screen.getByLabelText('알림 확인'));
    expect(mockReplace).toHaveBeenCalledWith('/(auth)/login');
  });
});
