import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

const mockReplace = jest.fn();
const mockPush = jest.fn();
const mockSignOut = jest.fn();
const mockUpdateProfile = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
}));

jest.mock('../src/services/profileService', () => ({
  updateProfile: mockUpdateProfile,
}));

jest.mock('../src/hooks/useAuth', () => ({
  useAuth: () => ({
    profile: {
      id: 'user-1',
      username: 'yellow01',
      nickname: '옐로볼',
      phone: '010-1234-5678',
    },
    signOut: mockSignOut,
  }),
}));

describe('MeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSignOut.mockResolvedValue(undefined);
    mockUpdateProfile.mockResolvedValue({
      id: 'user-1',
      username: 'yellow01',
      nickname: '새닉네임',
      phone: '010-2222-3333',
    });
  });

  test('프로필 정보와 로그아웃 버튼을 렌더링한다', () => {
    const MeScreen = require('../app/(tabs)/me').default;
    const screen = render(<MeScreen />);

    expect(screen.getByText('옐로볼')).toBeTruthy();
    expect(screen.getByText('010-1234-5678')).toBeTruthy();
    expect(screen.getByDisplayValue('yellow01')).toBeTruthy();
    expect(screen.getByLabelText('로그아웃')).toBeTruthy();
  });

  test('프로필 수정 모드에서 닉네임과 전화번호를 저장한다', async () => {
    const MeScreen = require('../app/(tabs)/me').default;
    const screen = render(<MeScreen />);

    fireEvent.press(screen.getByLabelText('프로필 수정'));
    fireEvent.changeText(screen.getByLabelText('닉네임'), '새닉네임');
    fireEvent.changeText(screen.getByLabelText('전화번호'), '010-2222-3333');
    fireEvent.press(screen.getByLabelText('프로필 저장'));

    await waitFor(() =>
      expect(mockUpdateProfile).toHaveBeenCalledWith('user-1', {
        nickname: '새닉네임',
        phone: '010-2222-3333',
      }),
    );
  });

  test('로그아웃 후 인증 화면으로 이동한다', async () => {
    const MeScreen = require('../app/(tabs)/me').default;
    const screen = render(<MeScreen />);

    fireEvent.press(screen.getByLabelText('로그아웃'));

    await waitFor(() => expect(mockSignOut).toHaveBeenCalledTimes(1));
    expect(mockReplace).toHaveBeenCalledWith('/(auth)/login');
  });
});
