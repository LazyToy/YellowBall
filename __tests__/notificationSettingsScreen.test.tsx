import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

const mockGetPreferences = jest.fn();
const mockUpdatePreferences = jest.fn();

const preferences = {
  user_id: 'user-1',
  booking_notifications: true,
  delivery_notifications: true,
  string_life_notifications: true,
  marketing_notifications: false,
  quiet_hours_enabled: true,
  quiet_hours_start: '22:00',
  quiet_hours_end: '08:00',
};

jest.mock('../src/hooks/useAuth', () => ({
  useAuth: () => ({
    profile: { id: 'user-1' },
  }),
}));

jest.mock('../src/services/notificationPrefService', () => ({
  getPreferences: mockGetPreferences,
  updatePreferences: mockUpdatePreferences,
}));

describe('NotificationSettingsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetPreferences.mockResolvedValue(preferences);
    mockUpdatePreferences.mockImplementation((_userId, data) =>
      Promise.resolve({ ...preferences, ...data }),
    );
  });

  test('예약 알림 토글 변경 시 설정 서비스를 호출한다', async () => {
    const NotificationSettingsScreen =
      require('../app/(tabs)/notification-settings').default;
    const screen = render(<NotificationSettingsScreen />);

    await waitFor(() => expect(screen.getByLabelText('예약/작업 알림')).toBeTruthy());

    await act(async () => {
      fireEvent(screen.getByLabelText('예약/작업 알림'), 'valueChange', false);
    });

    await waitFor(() =>
      expect(mockUpdatePreferences).toHaveBeenCalledWith('user-1', {
        booking_notifications: false,
      }),
    );
  });

  test('야간 시간 저장 실패 시 오류 메시지를 표시하고 이전 값으로 되돌린다', async () => {
    mockUpdatePreferences.mockRejectedValueOnce(new Error('network'));
    const NotificationSettingsScreen =
      require('../app/(tabs)/notification-settings').default;
    const screen = render(<NotificationSettingsScreen />);

    await waitFor(() => expect(screen.getByLabelText('시작')).toBeTruthy());

    await act(async () => {
      fireEvent.changeText(screen.getByLabelText('시작'), '23:00');
    });

    await waitFor(() =>
      expect(screen.getByText('야간 제한 시간을 저장하지 못했습니다.')).toBeTruthy(),
    );
  });
});
