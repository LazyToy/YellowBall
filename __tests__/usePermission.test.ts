import { renderHook, waitFor } from '@testing-library/react-native';

const mockUseAuth = jest.fn();
const mockGetAdminPermissions = jest.fn();

jest.mock('../src/hooks/useAuth', () => ({
  useAuth: mockUseAuth,
}));

jest.mock('../src/services/adminService', () => {
  const actual = jest.requireActual('../src/services/adminService');

  return {
    ...actual,
    getAdminPermissions: mockGetAdminPermissions,
  };
});

describe('usePermission', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('super_admin은 권한 조회 없이 모든 권한을 허용한다', () => {
    mockUseAuth.mockReturnValue({
      profile: { id: 'super-1', role: 'super_admin' },
    });
    const { usePermission } = require('../src/hooks/usePermission');
    const { result } = renderHook(() => usePermission('can_manage_strings'));

    expect(result.current.allowed).toBe(true);
    expect(mockGetAdminPermissions).not.toHaveBeenCalled();
  });

  test('admin은 admin_permissions 조회 결과에 따라 권한을 받는다', async () => {
    mockUseAuth.mockReturnValue({
      profile: { id: 'admin-1', role: 'admin' },
    });
    mockGetAdminPermissions.mockResolvedValue({
      admin_id: 'admin-1',
      can_manage_strings: true,
      can_manage_demo_rackets: false,
      can_manage_bookings: false,
      can_ban_users: false,
      can_manage_products: false,
      can_manage_orders: false,
      can_post_notice: false,
      can_toggle_app_menu: false,
      can_manage_admins: false,
    });
    const { usePermission } = require('../src/hooks/usePermission');
    const { result } = renderHook(() => usePermission('can_manage_strings'));

    await waitFor(() => expect(result.current.isChecking).toBe(false));

    expect(mockGetAdminPermissions).toHaveBeenCalledWith('admin-1');
    expect(result.current.allowed).toBe(true);
  });
});
