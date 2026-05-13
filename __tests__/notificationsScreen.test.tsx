import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

const mockBack = jest.fn();
const mockGetNotifications = jest.fn();
const mockMarkAllAsRead = jest.fn();
const mockMarkAsRead = jest.fn();
const mockRegisterPushToken = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: mockBack,
  }),
}));

jest.mock('../src/hooks/useAuth', () => ({
  useAuth: () => ({
    profile: { id: 'user-1' },
  }),
}));

jest.mock('../src/services/notificationService', () => ({
  getNotifications: mockGetNotifications,
  markAllAsRead: mockMarkAllAsRead,
  markAsRead: mockMarkAsRead,
  registerPushToken: mockRegisterPushToken,
}));

const unreadNotification = {
  id: 'notification-1',
  user_id: 'user-1',
  title: '예약 승인',
  body: '예약이 승인되었습니다.',
  notification_type: 'booking_approved',
  data: { bookingId: 'booking-1' },
  read: false,
  sent_at: null,
  created_at: '2026-05-03T00:00:00.000Z',
};

describe('NotificationsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetNotifications.mockResolvedValue([unreadNotification]);
    mockMarkAllAsRead.mockResolvedValue(undefined);
    mockMarkAsRead.mockResolvedValue({ ...unreadNotification, read: true });
    mockRegisterPushToken.mockResolvedValue('ExponentPushToken[abc]');
  });

  test('모두 읽음 처리 후 알림창을 표시한다', async () => {
    const NotificationsScreen = require('../app/(tabs)/notifications').default;
    const screen = render(<NotificationsScreen />);

    await waitFor(() => expect(screen.getByText('예약 승인')).toBeTruthy());
    fireEvent.press(screen.getByText('모두 읽음'));

    await waitFor(() => expect(mockMarkAllAsRead).toHaveBeenCalledWith('user-1'));
    await waitFor(() =>
      expect(screen.getByText('모든 알림을 읽음 처리했습니다')).toBeTruthy(),
    );
  });

  test('단건 읽음 처리와 푸시 토큰 등록 후 알림창을 표시한다', async () => {
    const NotificationsScreen = require('../app/(tabs)/notifications').default;
    const screen = render(<NotificationsScreen />);

    await waitFor(() => expect(screen.getByText('예약 승인')).toBeTruthy());
    fireEvent.press(screen.getByText('읽음'));

    await waitFor(() => expect(mockMarkAsRead).toHaveBeenCalledWith('notification-1'));
    await waitFor(() =>
      expect(screen.getByText('알림을 읽음 처리했습니다')).toBeTruthy(),
    );
    fireEvent.press(screen.getByText('확인'));

    fireEvent.press(screen.getByText('푸시 토큰 등록'));

    await waitFor(() => expect(mockRegisterPushToken).toHaveBeenCalledWith('user-1'));
    await waitFor(() =>
      expect(screen.getByText('푸시 토큰이 등록되었습니다')).toBeTruthy(),
    );
  });
});
