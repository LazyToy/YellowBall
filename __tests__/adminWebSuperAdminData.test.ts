import {
  buildSupabaseOAuthAuthorizeUrl,
  isAdminOAuthProvider,
  sanitizeAdminNextPath,
} from '../apps/admin-web/lib/admin-auth-core';
import {
  buildBusinessHourTimeSlots,
  canAccessAdminPath,
  createDefaultMenuSettings,
  getAdminDisplayInitial,
  getDefaultAdminPath,
  getShopScheduleForDate,
  getVisibleAdminNavItems,
  getVisibleBottomTabs,
  getVisibleHomeSections,
  getVisibleQuickServices,
  mergeMenuSettings,
  mergePolicySettings,
  mergeStoreSettings,
  normalizeAdminPermissions,
  normalizeShopSchedule,
} from '../apps/admin-web/lib/super-admin-data';

describe('admin web super admin data', () => {
  test('DB 메뉴 설정이 없으면 기본 메뉴 상태를 사용한다', () => {
    const settings = mergeMenuSettings(null);

    expect(settings['string-booking']).toBe(true);
    expect(settings.community).toBe(false);
    expect(settings['audit-log']).toBe(true);
  });

  test('DB 메뉴 설정은 알려진 메뉴 키만 반영한다', () => {
    const settings = mergeMenuSettings({
      menus: {
        shop: false,
        community: true,
        unknown: true,
      },
    });

    expect(settings.shop).toBe(false);
    expect(settings.community).toBe(true);
    expect(settings).not.toHaveProperty('unknown');
  });

  test('관리자 권한 row가 없으면 모든 세부 권한을 false로 채운다', () => {
    const permissions = normalizeAdminPermissions('admin-1', null);

    expect(permissions.admin_id).toBe('admin-1');
    expect(permissions.can_manage_bookings).toBe(false);
    expect(permissions.can_manage_admins).toBe(false);
  });

  test('기본 메뉴 설정은 호출자가 변경해도 다음 호출에 영향을 주지 않는다', () => {
    const first = createDefaultMenuSettings();
    first.shop = false;

    expect(createDefaultMenuSettings().shop).toBe(true);
  });

  test('비활성화된 사용자 앱 메뉴는 홈/하단 탭 노출 대상에서 제외된다', () => {
    const settings = {
      ...createDefaultMenuSettings(),
      'demo-booking': false,
      shop: false,
      'racket-library': false,
    };

    expect(getVisibleQuickServices(settings).map((item) => item.menuId)).not.toContain(
      'demo-booking',
    );
    expect(getVisibleQuickServices(settings).map((item) => item.menuId)).not.toContain('shop');
    expect(getVisibleHomeSections(settings)).not.toContain('demo-rackets');
    expect(getVisibleHomeSections(settings)).not.toContain('my-rackets');
    expect(getVisibleBottomTabs(settings).map((item) => item.id)).not.toContain('shop');
  });

  test('모든 예약 메뉴가 꺼지면 예약 탭과 신규 예약 버튼을 숨긴다', () => {
    const settings = {
      ...createDefaultMenuSettings(),
      'string-booking': false,
      'demo-booking': false,
    };

    expect(getVisibleBottomTabs(settings).map((item) => item.id)).not.toContain('bookings');
    expect(getVisibleBottomTabs(settings).map((item) => item.id)).not.toContain('new');
  });

  test('매장 설정은 app_settings JSON의 알려진 문자열 값만 반영한다', () => {
    const settings = mergeStoreSettings({
      storeName: 'YellowBall 성수',
      phone: '02-1111-2222',
      unknown: '무시',
      deliveryNotice: 123,
    });

    expect(settings.storeName).toBe('YellowBall 성수');
    expect(settings.phone).toBe('02-1111-2222');
    expect(settings.deliveryNotice).toBe('');
    expect(settings).not.toHaveProperty('unknown');
  });

  test('운영 정책은 app_settings JSON의 숫자와 boolean 값만 반영한다', () => {
    const settings = mergePolicySettings({
      bookingOpenHoursBefore: 4,
      notifyMarketing: true,
      maxConcurrentBookings: '3',
      unknown: true,
    });

    expect(settings.bookingOpenHoursBefore).toBe(4);
    expect(settings.notifyMarketing).toBe(true);
    expect(settings.maxConcurrentBookings).toBe(1);
    expect(settings).not.toHaveProperty('unknown');
  });

  test('영업시간은 shop_schedule의 0~6 요일 행을 정렬하고 누락 요일은 기본값으로 채운다', () => {
    const rows = normalizeShopSchedule([
      {
        day_of_week: 2,
        open_time: '11:00:00',
        close_time: '20:30:00',
        is_closed: false,
        updated_at: null,
      },
      {
        day_of_week: 0,
        open_time: '10:00:00',
        close_time: '17:00:00',
        is_closed: true,
        updated_at: null,
      },
    ]);

    expect(rows).toHaveLength(7);
    expect(rows[0]).toMatchObject({ day_of_week: 0, label: '일', is_closed: true });
    expect(rows[2]).toMatchObject({
      day_of_week: 2,
      label: '화',
      open_time: '11:00',
      close_time: '20:30',
    });
    expect(rows[6]).toMatchObject({ day_of_week: 6, label: '토' });
  });

  test('예약 화면 시간 슬롯은 선택한 날짜의 영업시간 시작 시각만 만든다', () => {
    const rows = normalizeShopSchedule([
      {
        day_of_week: 2,
        open_time: '10:00:00',
        close_time: '13:00:00',
        is_closed: false,
        updated_at: null,
      },
    ]);
    const schedule = getShopScheduleForDate('2099-05-05', rows);

    expect(schedule).toMatchObject({ day_of_week: 2, open_time: '10:00', close_time: '13:00' });
    expect(buildBusinessHourTimeSlots(schedule)).toEqual(['10:00', '11:00', '12:00']);
  });

  test('휴무일 예약 화면 시간 슬롯은 비어 있다', () => {
    const rows = normalizeShopSchedule([
      {
        day_of_week: 2,
        open_time: '10:00:00',
        close_time: '13:00:00',
        is_closed: true,
        updated_at: null,
      },
    ]);

    expect(buildBusinessHourTimeSlots(getShopScheduleForDate('2099-05-05', rows))).toEqual([]);
  });

  test('일반 관리자는 허용된 admin_permissions 메뉴만 볼 수 있다', () => {
    const permissions = normalizeAdminPermissions('admin-1', {
      can_manage_bookings: true,
      can_manage_products: false,
    });

    const items = getVisibleAdminNavItems({ role: 'admin' }, permissions).map(
      (item) => item.id,
    );

    expect(items).toContain('bookings');
    expect(items).toContain('queue');
    expect(items).not.toContain('products');
    expect(items).not.toContain('customers');
    expect(items).not.toContain('admins');
  });

  test('슈퍼 관리자는 일반 메뉴와 슈퍼 관리자 메뉴를 모두 볼 수 있다', () => {
    const items = getVisibleAdminNavItems({ role: 'super_admin' }, null).map(
      (item) => item.id,
    );

    expect(items).toContain('dashboard');
    expect(items).toContain('bookings');
    expect(items).toContain('admins');
    expect(items).toContain('audit');
  });

  test('관리자 라우트 접근은 role과 admin_permissions를 함께 확인한다', () => {
    const permissions = normalizeAdminPermissions('admin-1', {
      can_manage_bookings: true,
    });

    expect(canAccessAdminPath('/admin/bookings/service/booking-1', { role: 'admin' }, permissions)).toBe(
      true,
    );
    expect(canAccessAdminPath('/admin/products', { role: 'admin' }, permissions)).toBe(false);
    expect(canAccessAdminPath('/admin/super/admins', { role: 'admin' }, permissions)).toBe(
      false,
    );
    expect(canAccessAdminPath('/admin/super/admins', { role: 'super_admin' }, null)).toBe(true);
    expect(canAccessAdminPath('/admin/bookings', { role: 'user' }, null)).toBe(false);
  });

  test('일반 관리자의 기본 진입 경로는 첫 허용 메뉴이며 권한이 없으면 차단 페이지다', () => {
    expect(
      getDefaultAdminPath(
        { role: 'admin' },
        normalizeAdminPermissions('admin-1', { can_manage_products: true }),
      ),
    ).toBe('/admin/products');

    expect(getDefaultAdminPath({ role: 'admin' }, normalizeAdminPermissions('admin-1', null))).toBe(
      '/admin/forbidden',
    );
    expect(getDefaultAdminPath({ role: 'super_admin' }, null)).toBe('/admin');
  });

  test('관리자 표시 이니셜은 로그인한 프로필 이름에서 계산한다', () => {
    expect(getAdminDisplayInitial({ nickname: '정민수', username: null, email: null })).toBe('정');
    expect(getAdminDisplayInitial({ nickname: null, username: 'john min', email: null })).toBe('JM');
    expect(getAdminDisplayInitial({ nickname: null, username: null, email: 'manager@example.com' })).toBe(
      'M',
    );
  });

  test('관리자 OAuth provider는 Google과 Kakao만 허용한다', () => {
    expect(isAdminOAuthProvider('google')).toBe(true);
    expect(isAdminOAuthProvider('kakao')).toBe(true);
    expect(isAdminOAuthProvider('github')).toBe(false);
    expect(isAdminOAuthProvider(null)).toBe(false);
  });

  test('관리자 OAuth authorize URL은 안전한 관리자 콜백으로 생성한다', () => {
    const url = buildSupabaseOAuthAuthorizeUrl({
      provider: 'google',
      redirectOrigin: 'http://localhost:3001',
      nextPath: '/admin/bookings',
      supabaseUrl: 'https://project.supabase.co',
    });
    const parsed = new URL(url);

    expect(parsed.origin).toBe('https://project.supabase.co');
    expect(parsed.pathname).toBe('/auth/v1/authorize');
    expect(parsed.searchParams.get('provider')).toBe('google');
    expect(parsed.searchParams.get('redirect_to')).toBe(
      'http://localhost:3001/admin-auth/callback?next=%2Fadmin%2Fbookings',
    );
  });

  test('관리자 OAuth next 경로는 admin 내부 경로만 유지한다', () => {
    expect(sanitizeAdminNextPath('/admin/orders')).toBe('/admin/orders');
    expect(sanitizeAdminNextPath('/preview')).toBe('/preview');
    expect(sanitizeAdminNextPath('/booking/string/new')).toBe('/booking/string/new');
    expect(sanitizeAdminNextPath('https://evil.example/admin')).toBe('/admin');
    expect(sanitizeAdminNextPath('/admin-login')).toBe('/admin');
  });
});
