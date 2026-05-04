import { renderHook, waitFor } from '@testing-library/react-native';

const mockReplace = jest.fn();
const mockUseSegments = jest.fn();
const mockUseAuth = jest.fn();
const mockGetAdminPermissions = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace }),
  useSegments: mockUseSegments,
}));

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

const fullPermissions = {
  admin_id: 'admin-1',
  can_manage_strings: true,
  can_manage_demo_rackets: true,
  can_manage_bookings: true,
  can_ban_users: true,
  can_manage_products: true,
  can_manage_orders: true,
  can_post_notice: true,
  can_toggle_app_menu: true,
  can_manage_admins: true,
};

describe('useAdminPermissionGuard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('관리자 하위 라우트에 필요한 권한과 슈퍼 관리자 전용 라우트를 계산한다', () => {
    const {
      getRequiredAdminPermission,
      requiresSuperAdmin,
    } = require('../src/hooks/useAdminPermissionGuard');

    expect(getRequiredAdminPermission(['(admin)', 'bookings'])).toBe(
      'can_manage_bookings',
    );
    expect(getRequiredAdminPermission(['(admin)', 'index'])).toBe(null);
    expect(getRequiredAdminPermission(['(admin)', 'manage-admins'])).toBe(null);
    expect(requiresSuperAdmin(['(admin)', 'manage-admins'])).toBe(true);
  });

  test('권한 없는 admin은 관리자 홈으로 리다이렉트한다', async () => {
    mockUseSegments.mockReturnValue(['(admin)', 'bookings']);
    mockUseAuth.mockReturnValue({
      session: { user: { id: 'admin-1' } },
      isLoading: false,
      isAdmin: true,
      isSuperAdmin: false,
      profile: { id: 'admin-1', role: 'admin' },
    });
    mockGetAdminPermissions.mockResolvedValue({
      ...fullPermissions,
      can_manage_bookings: false,
    });
    const { useAdminPermissionGuard } = require('../src/hooks/useAdminPermissionGuard');
    const { result } = renderHook(() => useAdminPermissionGuard());

    await waitFor(() => expect(result.current.isChecking).toBe(false));
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/(admin)'));
    expect(result.current.canAccess).toBe(false);
  });

  test('can_manage_admins 권한이 있어도 일반 admin은 manage-admins에 진입할 수 없다', async () => {
    mockUseSegments.mockReturnValue(['(admin)', 'manage-admins']);
    mockUseAuth.mockReturnValue({
      session: { user: { id: 'admin-1' } },
      isLoading: false,
      isAdmin: true,
      isSuperAdmin: false,
      profile: { id: 'admin-1', role: 'admin' },
    });
    mockGetAdminPermissions.mockResolvedValue(fullPermissions);
    const { useAdminPermissionGuard } = require('../src/hooks/useAdminPermissionGuard');
    const { result } = renderHook(() => useAdminPermissionGuard());

    await waitFor(() => expect(result.current.isChecking).toBe(false));
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/(admin)'));
    expect(result.current.canAccess).toBe(false);
    expect(result.current.superAdminOnly).toBe(true);
  });

  test('super_admin은 manage-admins에 진입할 수 있다', async () => {
    mockUseSegments.mockReturnValue(['(admin)', 'manage-admins']);
    mockUseAuth.mockReturnValue({
      session: { user: { id: 'super-1' } },
      isLoading: false,
      isAdmin: true,
      isSuperAdmin: true,
      profile: { id: 'super-1', role: 'super_admin' },
    });
    const { useAdminPermissionGuard } = require('../src/hooks/useAdminPermissionGuard');
    const { result } = renderHook(() => useAdminPermissionGuard());

    await waitFor(() => expect(result.current.isChecking).toBe(false));
    expect(result.current.canAccess).toBe(true);
    expect(mockGetAdminPermissions).not.toHaveBeenCalled();
  });
});
