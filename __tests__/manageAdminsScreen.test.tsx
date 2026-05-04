import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

const mockGetAdmins = jest.fn();
const mockSearchUsers = jest.fn();
const mockAppointAdmin = jest.fn();
const mockDismissAdmin = jest.fn();
const mockUpdatePermissions = jest.fn();

const admin = {
  id: 'admin-1',
  username: 'admin',
  nickname: '관리자',
  phone: '010',
  role: 'admin',
  status: 'active',
  expo_push_token: null,
  created_at: '2026-05-03T00:00:00.000Z',
  updated_at: '2026-05-03T00:00:00.000Z',
  permissions: {
    admin_id: 'admin-1',
    can_manage_strings: false,
    can_manage_demo_rackets: false,
    can_manage_bookings: false,
    can_ban_users: false,
    can_manage_products: false,
    can_manage_orders: false,
    can_post_notice: false,
    can_toggle_app_menu: false,
    can_manage_admins: false,
  },
};

jest.mock('../src/hooks/useAuth', () => ({
  useAuth: () => ({
    profile: { id: 'super-1', role: 'super_admin' },
  }),
}));

jest.mock('../src/services/adminService', () => {
  const actual = jest.requireActual('../src/services/adminService');

  return {
    ...actual,
    appointAdmin: mockAppointAdmin,
    dismissAdmin: mockDismissAdmin,
    getAdmins: mockGetAdmins,
    searchUsers: mockSearchUsers,
    updatePermissions: mockUpdatePermissions,
  };
});

describe('ManageAdminsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAdmins.mockResolvedValue([admin]);
    mockSearchUsers.mockResolvedValue([]);
    mockDismissAdmin.mockResolvedValue(undefined);
    jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());
  });

  test('해임 버튼은 즉시 해임하지 않고 확인 다이얼로그를 연다', async () => {
    const ManageAdminsScreen = require('../app/(admin)/manage-admins').default;
    const screen = render(<ManageAdminsScreen />);

    await waitFor(() =>
      expect(screen.getByLabelText('관리자 관리자 해임 확인')).toBeTruthy(),
    );
    fireEvent.press(screen.getByLabelText('관리자 관리자 해임 확인'));

    expect(Alert.alert).toHaveBeenCalledWith(
      '관리자 해임',
      expect.stringContaining('관리자를 해임할까요'),
      expect.arrayContaining([
        expect.objectContaining({ text: '취소', style: 'cancel' }),
        expect.objectContaining({ text: '해임', style: 'destructive' }),
      ]),
    );
    expect(mockDismissAdmin).not.toHaveBeenCalled();
  });
});
