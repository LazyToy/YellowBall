export const MENU_SETTINGS_KEY = 'app_menu_visibility';
export const STORE_SETTINGS_KEY = 'store_profile';
export const POLICY_SETTINGS_KEY = 'operation_policy';

export type AdminRole = 'super_admin' | 'admin' | 'user';

export type ProfileRow = {
  id: string;
  username: string | null;
  nickname: string | null;
  email: string | null;
  phone: string | null;
  role: AdminRole;
  status: string;
  created_at: string;
  updated_at: string | null;
};

export type AdminPermissionKey =
  | 'can_manage_strings'
  | 'can_manage_demo_rackets'
  | 'can_manage_bookings'
  | 'can_ban_users'
  | 'can_manage_products'
  | 'can_manage_orders'
  | 'can_post_notice'
  | 'can_toggle_app_menu'
  | 'can_manage_admins';

export type AdminPermissionRow = Record<AdminPermissionKey, boolean> & {
  admin_id: string;
};

export type AdminWithPermissions = ProfileRow & {
  permissions: AdminPermissionRow;
};

export type AdminNavSection = 'admin' | 'super';
export type AdminNavItemId =
  | 'dashboard'
  | 'bookings'
  | 'queue'
  | 'demo'
  | 'products'
  | 'inventory'
  | 'customers'
  | 'orders'
  | 'announcements'
  | 'settings'
  | 'admins'
  | 'menus'
  | 'policies'
  | 'audit';

export type AdminNavItemDefinition = {
  id: AdminNavItemId;
  label: string;
  href: string;
  section: AdminNavSection;
  permission: AdminPermissionKey | null;
  superOnly: boolean;
};

export type MenuId =
  | 'string-booking'
  | 'demo-booking'
  | 'shop'
  | 'racket-library'
  | 'delivery'
  | 'community'
  | 'subscription'
  | 'queue-board'
  | 'auto-reorder'
  | 'analytics'
  | 'audit-log';

export type MenuSettings = Record<MenuId, boolean>;
export type BottomTabId = 'home' | 'bookings' | 'new' | 'shop' | 'me';
export type HomeSectionId =
  | 'booking-status'
  | 'my-rackets'
  | 'shop-hours'
  | 'demo-rackets'
  | 'promo-banner'
  | 'featured-strings'
  | 'shop-categories';

export type QuickServiceDefinition = {
  menuId: MenuId | 'booking-history';
  label: string;
  sub: string;
  tone: 'primary' | 'accent' | 'muted';
};

export type BottomTabDefinition = {
  id: BottomTabId;
  label: string;
  href: string;
  primary?: boolean;
};

export type AppSettingRow = {
  key: string;
  value: unknown;
  updated_by: string | null;
  updated_at: string | null;
};

export type StoreSettings = {
  storeName: string;
  phone: string;
  businessNumber: string;
  representative: string;
  address: string;
  introduction: string;
  paymentNotice: string;
  settlementNotice: string;
  notificationNotice: string;
  deliveryNotice: string;
};

export type PolicySettings = {
  bookingOpenHoursBefore: number;
  bookingMaxDaysAhead: number;
  maxConcurrentBookings: number;
  noShowAutoCancelMinutes: number;
  noShowSuspensionDays: number;
  unpaidAutoCancelMinutes: number;
  suspendedLoginBlocked: boolean;
  storePickupRefundHours: number;
  stringingRefundHours: number;
  autoRefundEnabled: boolean;
  notifyBookingConfirmation: boolean;
  notifyPickupReady: boolean;
  notifyMarketing: boolean;
};

export type ShopScheduleRow = {
  day_of_week: number;
  open_time: string;
  close_time: string;
  is_closed: boolean;
  updated_at: string | null;
};

export type ShopScheduleViewRow = ShopScheduleRow & {
  label: string;
};

export type AuditActorRow = {
  nickname: string | null;
  username: string | null;
  email: string | null;
  role: AdminRole | null;
} | null;

export type AuditLogRow = {
  id: string;
  actor_id: string | null;
  action: string;
  target_table: string | null;
  target_id: string | null;
  before_value: unknown;
  after_value: unknown;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  actor: AuditActorRow;
};

export type AuditCategory = 'all' | 'permission' | 'sanction' | 'policy' | 'menu' | 'product';

export type AuditLogViewItem = {
  id: string;
  actorName: string;
  actorRole: string;
  action: string;
  target: string;
  detail: string;
  ip: string;
  time: string;
  severity: 'high' | 'medium' | 'low';
  category: AuditCategory;
};

export type MenuItemDefinition = {
  id: MenuId;
  label: string;
  description: string;
  locked: boolean;
};

export type MenuGroupDefinition = {
  section: string;
  items: MenuItemDefinition[];
};

export const permissionDefinitions: {
  key: AdminPermissionKey;
  label: string;
  description: string;
}[] = [
  {
    key: 'can_manage_strings',
    label: '스트링 목록 관리',
    description: '스트링 카탈로그 등록, 수정, 비활성화를 허용합니다.',
  },
  {
    key: 'can_manage_demo_rackets',
    label: '시타 라켓 관리',
    description: '시타 라켓 등록, 상태 변경, 노출 제어를 허용합니다.',
  },
  {
    key: 'can_manage_bookings',
    label: '예약 관리',
    description: '스트링 작업 및 시타 예약 승인, 거절, 상태 변경을 허용합니다.',
  },
  {
    key: 'can_ban_users',
    label: '고객 제재',
    description: '고객 상태를 정상 또는 정지로 변경할 수 있습니다.',
  },
  {
    key: 'can_manage_products',
    label: '상품 관리',
    description: '상품 노출, 재고, 판매 상태 변경을 허용합니다.',
  },
  {
    key: 'can_manage_orders',
    label: '주문 관리',
    description: '주문 상태와 정산 운영 처리를 허용합니다.',
  },
  {
    key: 'can_post_notice',
    label: '공지/알림 발송',
    description: '공지와 운영 알림 작성 및 발송을 허용합니다.',
  },
  {
    key: 'can_toggle_app_menu',
    label: '앱 메뉴 활성화',
    description: '사용자 앱과 관리자 콘솔 메뉴 노출 상태를 변경할 수 있습니다.',
  },
  {
    key: 'can_manage_admins',
    label: '관리자 권한 관리',
    description: '관리자 임명, 해임, 세부 권한 변경을 허용합니다.',
  },
];

export const adminNavItems: AdminNavItemDefinition[] = [
  {
    id: 'dashboard',
    label: '대시보드',
    href: '/admin',
    section: 'admin',
    permission: null,
    superOnly: true,
  },
  {
    id: 'bookings',
    label: '예약 관리',
    href: '/admin/bookings',
    section: 'admin',
    permission: 'can_manage_bookings',
    superOnly: false,
  },
  {
    id: 'queue',
    label: '작업 큐',
    href: '/admin/queue',
    section: 'admin',
    permission: 'can_manage_bookings',
    superOnly: false,
  },
  {
    id: 'demo',
    label: '시타 라켓',
    href: '/admin/demo',
    section: 'admin',
    permission: 'can_manage_demo_rackets',
    superOnly: false,
  },
  {
    id: 'products',
    label: '상품 관리',
    href: '/admin/products',
    section: 'admin',
    permission: 'can_manage_products',
    superOnly: false,
  },
  {
    id: 'inventory',
    label: '재고',
    href: '/admin/inventory',
    section: 'admin',
    permission: 'can_manage_products',
    superOnly: false,
  },
  {
    id: 'customers',
    label: '고객',
    href: '/admin/customers',
    section: 'admin',
    permission: 'can_ban_users',
    superOnly: false,
  },
  {
    id: 'orders',
    label: '주문/정산',
    href: '/admin/orders',
    section: 'admin',
    permission: 'can_manage_orders',
    superOnly: false,
  },
  {
    id: 'announcements',
    label: '공지/이벤트',
    href: '/admin/announcements',
    section: 'admin',
    permission: 'can_post_notice',
    superOnly: false,
  },
  {
    id: 'settings',
    label: '설정',
    href: '/admin/settings',
    section: 'admin',
    permission: 'can_toggle_app_menu',
    superOnly: false,
  },
  {
    id: 'admins',
    label: '관리자 관리',
    href: '/admin/super/admins',
    section: 'super',
    permission: null,
    superOnly: true,
  },
  {
    id: 'menus',
    label: '메뉴 활성화',
    href: '/admin/super/menus',
    section: 'super',
    permission: null,
    superOnly: true,
  },
  {
    id: 'policies',
    label: '정책 관리',
    href: '/admin/super/policies',
    section: 'super',
    permission: null,
    superOnly: true,
  },
  {
    id: 'audit',
    label: '감사 로그',
    href: '/admin/super/audit',
    section: 'super',
    permission: null,
    superOnly: true,
  },
];

export const menuGroups: MenuGroupDefinition[] = [
  {
    section: '사용자 앱',
    items: [
      {
        id: 'string-booking',
        label: '스트링 작업 예약',
        description: '사용자가 스트링 작업 예약 플로우에 접근할 수 있습니다.',
        locked: false,
      },
      {
        id: 'demo-booking',
        label: '시타 라켓 예약',
        description: '시타 라켓 예약과 반납 플로우를 노출합니다.',
        locked: false,
      },
      {
        id: 'shop',
        label: '상품 쇼핑',
        description: '라켓, 용품, 스트링 상품 구매 화면을 노출합니다.',
        locked: false,
      },
      {
        id: 'racket-library',
        label: '내 라켓 라이브러리',
        description: '사용자의 라켓 등록 및 관리 메뉴입니다.',
        locked: false,
      },
      {
        id: 'delivery',
        label: '배송/주소 서비스',
        description: '주소 등록과 배송 기반 예약 옵션을 노출합니다.',
        locked: false,
      },
      {
        id: 'community',
        label: '커뮤니티/매칭',
        description: 'MVP 이후 확장 기능입니다.',
        locked: false,
      },
      {
        id: 'subscription',
        label: '유료 멤버십',
        description: 'MVP 이후 확장 기능입니다.',
        locked: false,
      },
    ],
  },
  {
    section: '관리자 콘솔',
    items: [
      {
        id: 'queue-board',
        label: '작업 현황판',
        description: '스트링 작업 진행 보드를 노출합니다.',
        locked: false,
      },
      {
        id: 'auto-reorder',
        label: '자동 재주문 알림',
        description: '재고 임계치 기반 운영 알림 기능입니다.',
        locked: false,
      },
      {
        id: 'analytics',
        label: '고급 분석',
        description: '코호트, 리텐션, 매출 리포트 영역입니다.',
        locked: false,
      },
      {
        id: 'audit-log',
        label: '감사 로그',
        description: '민감 작업 기록 메뉴입니다. 보안을 위해 항상 활성화됩니다.',
        locked: true,
      },
    ],
  },
];

const defaultMenuSettings: MenuSettings = {
  'string-booking': true,
  'demo-booking': true,
  shop: true,
  'racket-library': true,
  delivery: false,
  community: false,
  subscription: false,
  'queue-board': true,
  'auto-reorder': true,
  analytics: false,
  'audit-log': true,
};

const defaultStoreSettings: StoreSettings = {
  storeName: '',
  phone: '',
  businessNumber: '',
  representative: '',
  address: '',
  introduction: '',
  paymentNotice: '',
  settlementNotice: '',
  notificationNotice: '',
  deliveryNotice: '',
};

const defaultPolicySettings: PolicySettings = {
  bookingOpenHoursBefore: 2,
  bookingMaxDaysAhead: 14,
  maxConcurrentBookings: 1,
  noShowAutoCancelMinutes: 20,
  noShowSuspensionDays: 14,
  unpaidAutoCancelMinutes: 10,
  suspendedLoginBlocked: true,
  storePickupRefundHours: 3,
  stringingRefundHours: 6,
  autoRefundEnabled: true,
  notifyBookingConfirmation: true,
  notifyPickupReady: true,
  notifyMarketing: false,
};

const dayLabels = ['일', '월', '화', '수', '목', '금', '토'];

export const auditCategoryDefinitions: {
  key: AuditCategory;
  label: string;
}[] = [
  { key: 'all', label: '전체' },
  { key: 'permission', label: '권한 변경' },
  { key: 'sanction', label: '제재' },
  { key: 'policy', label: '정책' },
  { key: 'menu', label: '메뉴' },
  { key: 'product', label: '상품' },
];

const menuIds = new Set<MenuId>(
  menuGroups.flatMap((group) => group.items.map((item) => item.id)),
);

export function createDefaultMenuSettings(): MenuSettings {
  return { ...defaultMenuSettings };
}

export function mergeMenuSettings(value: unknown): MenuSettings {
  const settings = createDefaultMenuSettings();
  const source =
    value && typeof value === 'object' && 'menus' in value
      ? (value as { menus?: unknown }).menus
      : value;

  if (!source || typeof source !== 'object') {
    return settings;
  }

  Object.entries(source as Record<string, unknown>).forEach(([key, enabled]) => {
    if (menuIds.has(key as MenuId) && typeof enabled === 'boolean') {
      settings[key as MenuId] = enabled;
    }
  });

  settings['audit-log'] = true;
  return settings;
}

export function createDefaultStoreSettings(): StoreSettings {
  return { ...defaultStoreSettings };
}

export function mergeStoreSettings(value: unknown): StoreSettings {
  const settings = createDefaultStoreSettings();

  if (!value || typeof value !== 'object') {
    return settings;
  }

  Object.keys(settings).forEach((key) => {
    const nextValue = (value as Record<string, unknown>)[key];
    if (typeof nextValue === 'string') {
      settings[key as keyof StoreSettings] = nextValue;
    }
  });

  return settings;
}

export function createDefaultPolicySettings(): PolicySettings {
  return { ...defaultPolicySettings };
}

export function mergePolicySettings(value: unknown): PolicySettings {
  const settings = createDefaultPolicySettings();

  if (!value || typeof value !== 'object') {
    return settings;
  }

  Object.entries(settings).forEach(([key, currentValue]) => {
    const nextValue = (value as Record<string, unknown>)[key];
    if (typeof currentValue === 'number' && typeof nextValue === 'number' && Number.isFinite(nextValue)) {
      settings[key as keyof PolicySettings] = nextValue as never;
    }

    if (typeof currentValue === 'boolean' && typeof nextValue === 'boolean') {
      settings[key as keyof PolicySettings] = nextValue as never;
    }
  });

  return settings;
}

function toTimeInputValue(value: string | null | undefined, fallback: string) {
  if (!value) {
    return fallback;
  }

  return value.slice(0, 5);
}

const timeInputPattern = /^([01]\d|2[0-3]):[0-5]\d$/;

function timeToMinutes(value: string) {
  if (!timeInputPattern.test(value)) {
    return null;
  }

  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(value: number) {
  const hours = Math.floor(value / 60);
  const minutes = value % 60;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function normalizeShopSchedule(rows: ShopScheduleRow[]): ShopScheduleViewRow[] {
  const rowMap = new Map(rows.map((row) => [row.day_of_week, row]));

  return dayLabels.map<ShopScheduleViewRow>((label, day) => {
    const row = rowMap.get(day);
    return {
      day_of_week: day,
      label,
      open_time: toTimeInputValue(row?.open_time, '09:00'),
      close_time: toTimeInputValue(row?.close_time, '18:00'),
      is_closed: row?.is_closed ?? false,
      updated_at: row?.updated_at ?? null,
    };
  });
}

export function getShopScheduleForDate(
  date: string,
  scheduleRows: ShopScheduleViewRow[],
) {
  const parsed = new Date(`${date}T00:00:00.000Z`);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  const day = parsed.getUTCDay();
  return scheduleRows.find((row) => row.day_of_week === day) ?? null;
}

export function buildBusinessHourTimeSlots(
  schedule: ShopScheduleViewRow | null,
  durationMinutes = 60,
) {
  if (!schedule || schedule.is_closed || !Number.isInteger(durationMinutes) || durationMinutes <= 0) {
    return [];
  }

  const openMinutes = timeToMinutes(schedule.open_time);
  const closeMinutes = timeToMinutes(schedule.close_time);

  if (openMinutes === null || closeMinutes === null || openMinutes >= closeMinutes) {
    return [];
  }

  const slots: string[] = [];

  for (let start = openMinutes; start + durationMinutes <= closeMinutes; start += durationMinutes) {
    slots.push(minutesToTime(start));
  }

  return slots;
}

export function normalizeAdminPermissions(
  adminId: string,
  row: Partial<AdminPermissionRow> | null | undefined,
): AdminPermissionRow {
  return permissionDefinitions.reduce<AdminPermissionRow>(
    (permissions, definition) => {
      permissions[definition.key] = row?.[definition.key] === true;
      return permissions;
    },
    { admin_id: adminId } as AdminPermissionRow,
  );
}

export function canUseAdminPermission(
  profile: Pick<ProfileRow, 'role'> | null,
  permissions: AdminPermissionRow | null,
  key: AdminPermissionKey,
) {
  if (!profile) {
    return false;
  }

  if (profile.role === 'super_admin') {
    return true;
  }

  if (profile.role !== 'admin') {
    return false;
  }

  return permissions?.[key] === true;
}

function canSeeAdminNavItem(
  item: AdminNavItemDefinition,
  profile: Pick<ProfileRow, 'role'> | null,
  permissions: AdminPermissionRow | null,
) {
  if (!profile) {
    return false;
  }

  if (profile.role === 'super_admin') {
    return true;
  }

  if (profile.role !== 'admin' || item.superOnly || !item.permission) {
    return false;
  }

  return canUseAdminPermission(profile, permissions, item.permission);
}

export function getVisibleAdminNavItems(
  profile: Pick<ProfileRow, 'role'> | null,
  permissions: AdminPermissionRow | null,
  section?: AdminNavSection,
) {
  return adminNavItems.filter(
    (item) =>
      (!section || item.section === section) &&
      canSeeAdminNavItem(item, profile, permissions),
  );
}

function getMatchingAdminNavItem(pathname: string) {
  const normalized = pathname.replace(/\/+$/, '') || '/admin';

  return [...adminNavItems]
    .sort((a, b) => b.href.length - a.href.length)
    .find((item) =>
      item.href === '/admin'
        ? normalized === '/admin'
        : normalized === item.href || normalized.startsWith(`${item.href}/`),
    );
}

export function canAccessAdminPath(
  pathname: string,
  profile: Pick<ProfileRow, 'role'> | null,
  permissions: AdminPermissionRow | null,
) {
  const normalized = pathname.replace(/\/+$/, '') || '/admin';

  if (normalized === '/admin/forbidden') {
    return profile?.role === 'admin' || profile?.role === 'super_admin';
  }

  const item = getMatchingAdminNavItem(normalized);
  if (!item) {
    return false;
  }

  return canSeeAdminNavItem(item, profile, permissions);
}

export function getDefaultAdminPath(
  profile: Pick<ProfileRow, 'role'> | null,
  permissions: AdminPermissionRow | null,
) {
  if (profile?.role === 'super_admin') {
    return '/admin';
  }

  const [firstItem] = getVisibleAdminNavItems(profile, permissions, 'admin');
  return firstItem?.href ?? '/admin/forbidden';
}

export function getProfileDisplayName(profile: Pick<ProfileRow, 'nickname' | 'username' | 'email'>) {
  return profile.nickname ?? profile.username ?? profile.email ?? '이름 없음';
}

export function getAdminDisplayInitial(
  profile: Pick<ProfileRow, 'nickname' | 'username' | 'email'>,
) {
  const displayName = getProfileDisplayName(profile).trim();
  const localName = displayName.includes('@') ? displayName.split('@')[0] : displayName;
  const parts = localName.split(/\s+/).filter(Boolean);

  if (parts.length >= 2 && /^[a-z]/i.test(parts[0]) && /^[a-z]/i.test(parts[1])) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return localName.slice(0, 1).toUpperCase() || 'A';
}

export function getRoleLabel(role: AdminRole) {
  if (role === 'super_admin') {
    return '슈퍼 관리자';
  }

  if (role === 'admin') {
    return '관리자';
  }

  return '일반 사용자';
}

function getAuditCategory(row: Pick<AuditLogRow, 'action' | 'target_table'>): AuditCategory {
  if (row.action.includes('menu')) {
    return 'menu';
  }

  if (row.action.includes('policy') || row.target_table === 'app_settings') {
    return 'policy';
  }

  if (row.action.includes('permission') || row.action.includes('admin.') || row.target_table === 'admin_permissions') {
    return 'permission';
  }

  if (row.action.includes('suspend') || row.action.includes('ban')) {
    return 'sanction';
  }

  if (['shop_products', 'string_catalog', 'demo_rackets'].includes(row.target_table ?? '')) {
    return 'product';
  }

  return 'all';
}

function getAuditSeverity(category: AuditCategory): AuditLogViewItem['severity'] {
  if (category === 'permission' || category === 'sanction') {
    return 'high';
  }

  if (category === 'policy' || category === 'menu') {
    return 'medium';
  }

  return 'low';
}

function stringifyAuditValue(value: unknown) {
  if (value === null || value === undefined) {
    return '값 없음';
  }

  if (typeof value === 'string') {
    return value;
  }

  return JSON.stringify(value).slice(0, 180);
}

function getAuditDetail(row: AuditLogRow) {
  return `이전: ${stringifyAuditValue(row.before_value)} / 이후: ${stringifyAuditValue(row.after_value)}`;
}

function getAuditTarget(row: AuditLogRow) {
  if (row.target_table && row.target_id) {
    return `${row.target_table} · ${row.target_id}`;
  }

  return row.target_table ?? '대상 없음';
}

export function toAuditLogViewItem(row: AuditLogRow): AuditLogViewItem {
  const category = getAuditCategory(row);
  const actorName = row.actor
    ? getProfileDisplayName({
        nickname: row.actor.nickname,
        username: row.actor.username,
        email: row.actor.email,
      })
    : '시스템';

  return {
    id: row.id,
    actorName,
    actorRole: row.actor?.role ? getRoleLabel(row.actor.role) : '역할 없음',
    action: row.action,
    target: getAuditTarget(row),
    detail: getAuditDetail(row),
    ip: row.ip_address ?? '-',
    time: row.created_at,
    severity: getAuditSeverity(category),
    category,
  };
}

export function filterAuditLogItems(
  items: AuditLogViewItem[],
  filters: { search?: string | null; category?: AuditCategory | null },
) {
  const search = filters.search?.trim().toLowerCase() ?? '';
  const category = filters.category ?? 'all';

  return items.filter((item) => {
    const categoryMatched = category === 'all' || item.category === category;
    const searchMatched =
      !search ||
      [item.actorName, item.actorRole, item.action, item.target, item.detail, item.ip]
        .join(' ')
        .toLowerCase()
        .includes(search);

    return categoryMatched && searchMatched;
  });
}

export function hasAnyBookingMenu(settings: MenuSettings) {
  return settings['string-booking'] || settings['demo-booking'];
}

export function getVisibleQuickServices(settings: MenuSettings): QuickServiceDefinition[] {
  const services: QuickServiceDefinition[] = [
    {
      menuId: 'string-booking',
      label: '스트링 작업',
      sub: '예약 · 결제',
      tone: 'primary',
    },
    {
      menuId: 'demo-booking',
      label: '라켓 시타',
      sub: '데모 대여',
      tone: 'accent',
    },
    {
      menuId: 'shop',
      label: '상품 쇼핑',
      sub: '테니스 · 피클볼',
      tone: 'muted',
    },
    {
      menuId: 'booking-history',
      label: '내 예약',
      sub: '진행 상태',
      tone: 'muted',
    },
  ];

  return services.filter((service) => {
    if (service.menuId === 'booking-history') {
      return hasAnyBookingMenu(settings);
    }

    return settings[service.menuId];
  });
}

export function getVisibleBottomTabs(settings: MenuSettings): BottomTabDefinition[] {
  const tabs: BottomTabDefinition[] = [
    { id: 'home', label: '홈', href: '/' },
    { id: 'bookings', label: '예약', href: '/booking' },
    { id: 'new', label: '', href: '/booking?new=1', primary: true },
    { id: 'shop', label: '샵', href: '/shop' },
    { id: 'me', label: '마이', href: '/me' },
  ];

  return tabs.filter((tab) => {
    if (tab.id === 'bookings' || tab.id === 'new') {
      return hasAnyBookingMenu(settings);
    }

    if (tab.id === 'shop') {
      return settings.shop;
    }

    return true;
  });
}

export function getVisibleHomeSections(settings: MenuSettings): HomeSectionId[] {
  const sections: HomeSectionId[] = ['shop-hours'];

  if (hasAnyBookingMenu(settings)) {
    sections.push('booking-status');
  }

  if (settings['racket-library']) {
    sections.push('my-rackets');
  }

  if (settings['demo-booking']) {
    sections.push('demo-rackets');
  }

  if (settings.shop) {
    sections.push('promo-banner', 'shop-categories');
  }

  if (settings['string-booking']) {
    sections.push('featured-strings');
  }

  return sections;
}

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.EXPO_PUBLIC_SUPABASE_URL;
const serviceRoleKey =
  process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

function assertAdminReadConfig() {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      '관리자 웹에서 실제 DB를 읽으려면 NEXT_PUBLIC_SUPABASE_URL과 NEXT_SUPABASE_SERVICE_ROLE_KEY가 필요합니다.',
    );
  }
}

async function fetchAdminRows<T>(path: string, params: Record<string, string>) {
  assertAdminReadConfig();

  const url = new URL(`/rest/v1/${path}`, supabaseUrl);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  const response = await fetch(url, {
    cache: 'no-store',
    headers: {
      apikey: serviceRoleKey!,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase DB 조회에 실패했습니다. (${path}: ${response.status} ${text})`);
  }

  return (await response.json()) as T[];
}

export async function loadAdminManagementPageData() {
  const [adminProfiles, permissions, userCandidates] = await Promise.all([
    fetchAdminRows<ProfileRow>('profiles', {
      select: 'id,username,nickname,email,phone,role,status,created_at,updated_at',
      role: 'in.(admin,super_admin)',
      order: 'created_at.desc',
    }),
    fetchAdminRows<AdminPermissionRow>('admin_permissions', {
      select: '*',
    }),
    fetchAdminRows<ProfileRow>('profiles', {
      select: 'id,username,nickname,email,phone,role,status,created_at,updated_at',
      role: 'eq.user',
      status: 'eq.active',
      order: 'created_at.desc',
      limit: '50',
    }),
  ]);

  const permissionMap = new Map(permissions.map((row) => [row.admin_id, row]));
  const admins = adminProfiles.map<AdminWithPermissions>((profile) => ({
    ...profile,
    permissions: normalizeAdminPermissions(profile.id, permissionMap.get(profile.id)),
  }));

  return {
    admins,
    userCandidates,
  };
}

export async function loadMenuSettingsPageData() {
  const [setting] = await fetchAdminRows<AppSettingRow>('app_settings', {
    select: 'key,value,updated_by,updated_at',
    key: `eq.${MENU_SETTINGS_KEY}`,
    limit: '1',
  });

  return {
    key: MENU_SETTINGS_KEY,
    settings: mergeMenuSettings(setting?.value ?? null),
    updatedAt: setting?.updated_at ?? null,
    updatedBy: setting?.updated_by ?? null,
  };
}

export async function loadAdminSettingsPageData() {
  const [settingRows, scheduleRows] = await Promise.all([
    fetchAdminRows<AppSettingRow>('app_settings', {
      select: 'key,value,updated_by,updated_at',
      key: `eq.${STORE_SETTINGS_KEY}`,
      limit: '1',
    }),
    fetchAdminRows<ShopScheduleRow>('shop_schedule', {
      select: 'day_of_week,open_time,close_time,is_closed,updated_at',
      order: 'day_of_week.asc',
    }),
  ]);
  const [setting] = settingRows;

  return {
    key: STORE_SETTINGS_KEY,
    settings: mergeStoreSettings(setting?.value ?? null),
    schedule: normalizeShopSchedule(scheduleRows),
    updatedAt: setting?.updated_at ?? null,
    updatedBy: setting?.updated_by ?? null,
  };
}

export async function loadPolicySettingsPageData() {
  const [setting] = await fetchAdminRows<AppSettingRow>('app_settings', {
    select: 'key,value,updated_by,updated_at',
    key: `eq.${POLICY_SETTINGS_KEY}`,
    limit: '1',
  });

  return {
    key: POLICY_SETTINGS_KEY,
    settings: mergePolicySettings(setting?.value ?? null),
    updatedAt: setting?.updated_at ?? null,
    updatedBy: setting?.updated_by ?? null,
  };
}

export async function loadAuditLogsPageData({
  search,
  category,
  limit = 30,
}: {
  search?: string | null;
  category?: AuditCategory | null;
  limit?: number;
} = {}) {
  const rows = await fetchAdminRows<AuditLogRow>('administrator_audit_logs', {
    select:
      'id,actor_id,action,target_table,target_id,before_value,after_value,ip_address,user_agent,created_at,actor:profiles!administrator_audit_logs_actor_id_fkey(nickname,username,email,role)',
    order: 'created_at.desc',
    limit: '200',
  });
  const items = rows.map(toAuditLogViewItem);
  const filtered = filterAuditLogItems(items, { search, category });

  return {
    logs: filtered.slice(0, limit),
    total: filtered.length,
    hasMore: filtered.length > limit,
  };
}

export async function loadAppMenuSettings() {
  try {
    const data = await loadMenuSettingsPageData();
    return data.settings;
  } catch (error) {
    console.error('[loadAppMenuSettings]', error);
    return createDefaultMenuSettings();
  }
}

/**
 * app_settings 테이블의 store_profile에서 매장 정보를 로드합니다.
 * 실패 시 빈 문자열을 반환하여 앱이 중단되지 않도록 합니다.
 */
export async function loadStoreProfile(): Promise<StoreSettings> {
  try {
    const data = await loadAdminSettingsPageData();
    return data.settings;
  } catch (error) {
    console.error('[loadStoreProfile]', error);
    return createDefaultStoreSettings();
  }
}
