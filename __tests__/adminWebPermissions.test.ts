import {
  canAccessAdminPath,
  canUseAdminPermission,
  getAdminDisplayInitial,
  getDefaultAdminPath,
  getProfileDisplayName,
  getVisibleAdminNavItems,
  type AdminPermissionRow,
} from '../apps/admin-web/lib/super-admin-data';

const basePermissions: AdminPermissionRow = {
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
};

const activeAdmin = {
  id: 'admin-1',
  username: 'admin',
  nickname: '정민수',
  email: 'admin@example.com',
  role: 'admin' as const,
  status: 'active',
};

describe('admin web permissions', () => {
  test('예약 하위 경로는 예약 관리 권한을 요구한다', () => {
    expect(
      canAccessAdminPath('/admin/bookings/service/booking-1', activeAdmin, {
        ...basePermissions,
        can_manage_bookings: true,
      }),
    ).toBe(true);
    expect(canAccessAdminPath('/admin/bookings/service/booking-1', activeAdmin, basePermissions)).toBe(false);
  });

  test('일반 관리자는 부여된 권한이 있는 관리자 메뉴만 접근할 수 있다', () => {
    const permissions = {
      ...basePermissions,
      can_manage_bookings: true,
    };

    expect(canAccessAdminPath('/admin/bookings', activeAdmin, permissions)).toBe(true);
    expect(canAccessAdminPath('/admin/orders', activeAdmin, permissions)).toBe(false);
  });

  test('일반 관리자는 슈퍼 관리자 경로에 접근할 수 없다', () => {
    expect(
      canAccessAdminPath('/admin/super/admins', activeAdmin, {
        ...basePermissions,
        can_manage_admins: true,
      }),
    ).toBe(false);
  });

  test('슈퍼 관리자는 세부 권한과 무관하게 슈퍼 관리자 경로에 접근할 수 있다', () => {
    expect(
      canAccessAdminPath('/admin/super/admins', { ...activeAdmin, role: 'super_admin' }, null),
    ).toBe(true);
  });

  test('일반 관리자는 대시보드 대신 첫 번째 허용 메뉴로 이동한다', () => {
    expect(getDefaultAdminPath(activeAdmin, basePermissions)).toBe('/admin/forbidden');
    expect(
      getDefaultAdminPath(activeAdmin, {
        ...basePermissions,
        can_manage_orders: true,
      }),
    ).toBe('/admin/orders');
  });

  test('관리자 표시명과 이니셜은 로그인한 프로필 값에서 계산한다', () => {
    expect(getProfileDisplayName(activeAdmin)).toBe('정민수');
    expect(getAdminDisplayInitial(activeAdmin)).toBe('정');
    expect(getAdminDisplayInitial({ nickname: null, username: 'jane manager', email: null })).toBe('JM');
  });

  test('사이드바 메뉴는 일반 관리자에게 부여된 권한만 노출한다', () => {
    expect(
      getVisibleAdminNavItems(activeAdmin, {
        ...basePermissions,
        can_manage_products: true,
      }).map((item) => item.href),
    ).toEqual(['/admin/products', '/admin/inventory']);
  });

  test('권한 판정은 슈퍼 관리자에게 모든 세부 권한을 허용한다', () => {
    expect(canUseAdminPermission({ role: 'super_admin' }, null, 'can_manage_orders')).toBe(true);
    expect(canUseAdminPermission(activeAdmin, basePermissions, 'can_manage_orders')).toBe(false);
  });
});
