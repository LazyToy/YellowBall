import {
  formatKstDateTime,
  formatKstTime,
  toKstDateKey,
} from '@/lib/kst-time';

export type RestProfile = {
  nickname?: string | null;
  username?: string | null;
  phone?: string | null;
  email?: string | null;
};

export type RestRacket = {
  brand?: string | null;
  model?: string | null;
};

export type RestString = {
  brand?: string | null;
  name?: string | null;
  price?: number | null;
};

export type RestBookingSlot = {
  start_time?: string | null;
  end_time?: string | null;
};

export type ServiceBookingRow = {
  id: string;
  status: string;
  tension_main: number;
  tension_cross: number;
  delivery_method?: string | null;
  user_notes?: string | null;
  admin_notes?: string | null;
  created_at: string;
  updated_at?: string | null;
  profiles?: RestProfile | null;
  user_rackets?: RestRacket | null;
  main_string?: RestString | null;
  cross_string?: RestString | null;
  booking_slots?: RestBookingSlot | null;
  has_cancel_request?: boolean;
  cancel_requested_at?: string | null;
};

export type BookingStatusLogRow = {
  booking_id: string;
  changed_at: string;
  new_status: string;
};

export type DemoBookingRow = {
  id: string;
  status: string;
  start_time: string;
  expected_return_time: string;
  actual_return_time?: string | null;
  user_notes?: string | null;
  admin_notes?: string | null;
  created_at: string;
  updated_at?: string | null;
  profiles?: RestProfile | null;
  demo_rackets?: RestRacket | null;
};

export type ShopProductRow = {
  id: string;
  name: string;
  category: string;
  image_path: string | null;
  image_url: string | null;
  price: number;
  sale_price: number;
  rating_average: number;
  review_count: number;
  tag: string | null;
  stock_quantity: number;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
};

export type StringCatalogRow = {
  id: string;
  brand: string;
  name: string;
  gauge: string | null;
  color: string | null;
  image_url: string | null;
  description: string | null;
  price: number | null;
  recommended_style: string | null;
  is_active: boolean | null;
  deactivation_reason: string | null;
  deactivated_at: string | null;
  /** 장기: shop_products FK 연결 ID */
  shop_product_id: string | null;
  created_at: string;
  updated_at: string | null;
  /** FK 조인 시 포함되는 연결된 상품 정보 */
  shop_products?: {
    id: string;
    name: string;
    stock_quantity: number;
    sale_price: number;
  } | null;
};

export type AdminStringCatalogItem = {
  id: string;
  brand: string;
  name: string;
  gauge: string | null;
  price: number | null;
  isActive: boolean;
  /** shop_products에 연결된 재고 수량 (null = 연결 없음) */
  linkedStock: number | null;
  deactivationReason: string | null;
};

export type AdminInventoryCategoryGroup = {
  category: string;
  totalStock: number;
  skuCount: number;
  outOfStock: number;
  lowStock: number;
  items: AdminProductItem[];
};

export type DemoRacketRow = {
  id: string;
  brand: string;
  model: string;
  grip_size: string | null;
  weight: number | null;
  head_size: string | null;
  photo_url: string | null;
  description: string | null;
  status: string | null;
  is_demo_enabled: boolean | null;
  is_active: boolean | null;
  created_at: string;
  updated_at: string | null;
};

export type ShopOrderRow = {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  items: unknown;
  created_at: string;
  updated_at: string | null;
  profiles?: RestProfile | null;
};

export type AppContentBlockRow = {
  key: string;
  payload: unknown;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type AnnouncementType = 'notice' | 'event';
export type AnnouncementStatus = 'published' | 'draft' | 'archived';

export type AdminAnnouncementItem = {
  key: string;
  title: string;
  body: string;
  type: AnnouncementType;
  typeLabel: string;
  status: AnnouncementStatus;
  statusLabel: string;
  audience: string;
  views: number;
  period: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
};

export type AdminBookingListItem = {
  /** 화면 표시용 YB-XXXXXXXX 코드 */
  id: string;
  /** 실제 DB UUID (Server Action 전달용) */
  realId: string;
  /** 예약 종류 (상태 변경 API 분기용) */
  bookingType: 'service' | 'demo';
  customer: string;
  phone: string;
  type: '스트링' | '시타';
  detail: string;
  racket: string;
  visit: string;
  requested: string;
  estimated: number;
  status: string;
  statusLabel: string;
  hasCancelRequest?: boolean;
  cancelRequestedAt?: string | null;
  urgent: boolean;
};

export type AdminProductItem = {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  salePrice: number;
  stock: number;
  status: string;
  imageUrl: string | null;
  isActive: boolean;
};

export type AdminDemoRacketItem = {
  id: string;
  name: string;
  spec: string;
  status: string;
  statusLabel: string;
  available: boolean;
  bookings: number;
  imageUrl: string | null;
};

export type AdminOrderItem = {
  /** order_number (화면 표시용) */
  id: string;
  /** 실제 DB UUID (상태 변경 용) */
  realId: string;
  customer: string;
  items: number;
  itemSummary: string;
  total: number;
  method: string;
  status: string;
  statusLabel: string;
  date: string;
};

export type AdminSettlementOrderItem = {
  id: string;
  realId: string;
  source: 'shop' | 'service' | 'demo';
  sourceLabel: string;
  bookingType?: 'service' | 'demo';
  customer: string;
  itemSummary: string;
  items: number;
  total: number;
  status: string;
  statusLabel: string;
  date: string;
  dateValue: string;
};

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey =
  process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY ??
  process.env.SUPABASE_SERVICE_ROLE_KEY;

export const hasAdminReadKey = Boolean(serviceRoleKey);

const publicReadKey = serviceRoleKey || anonKey;

export const serviceStatuses = [
  'requested',
  'approved',
  'visit_pending',
  'racket_received',
  'in_progress',
  'completed',
  'pickup_ready',
  'delivered',
  'done',
  'cancelled_user',
  'cancelled_admin',
  'rejected',
  'reschedule_requested',
  'no_show',
  'refund_pending',
  'refund_done',
];

export const activeServiceStatuses = [
  'requested',
  'approved',
  'visit_pending',
  'racket_received',
  'in_progress',
  'completed',
  'pickup_ready',
];

export const terminalServiceStatuses = [
  'delivered',
  'done',
  'cancelled_user',
  'cancelled_admin',
  'rejected',
  'no_show',
  'refund_done',
];

export const activeDemoStatuses = ['requested', 'approved', 'in_use', 'overdue'];

const statusLabels: Record<string, string> = {
  requested: '접수',
  approved: '승인',
  visit_pending: '승인',
  racket_received: '작업중',
  in_progress: '작업중',
  completed: '완료',
  pickup_ready: '완료',
  delivered: '완료',
  done: '완료',
  cancelled_user: '접수',
  cancelled_admin: '관리자 취소',
  rejected: '접수',
  reschedule_requested: '접수',
  no_show: '노쇼',
  refund_pending: '완료',
  refund_done: '완료',
  in_use: '대여 중',
  returned: '반납 완료',
  overdue: '반납 지연',
  active: '시타 가능',
  inactive: '비활성',
  maintenance: '정비 중',
  damaged: '파손',
  sold: '판매 완료',
  hidden: '숨김',
  pending: '결제 대기',
  paid: '결제 완료',
  preparing: '준비 중',
  shipping: '배송 중',
  cancelled: '취소',
  refunded: '환불',
};

const announcementTypeLabels: Record<AnnouncementType, string> = {
  event: '이벤트',
  notice: '공지',
};

const announcementStatusLabels: Record<AnnouncementStatus, string> = {
  archived: '보관',
  draft: '임시 저장',
  published: '게시 중',
};

export const money = (value: number) => value.toLocaleString('ko-KR');

export const toLocalDateKey = (date: Date) => toKstDateKey(date);

export const formatDateTime = (value?: string | null) =>
  formatKstDateTime(value);

export const formatTime = (value?: string | null) =>
  formatKstTime(value);

export const statusLabel = (status?: string | null) =>
  status ? statusLabels[status] ?? status : '-';

export const getCustomerName = (profile?: RestProfile | null) =>
  profile?.nickname ?? profile?.username ?? profile?.email ?? '알 수 없음';

export const getRacketName = (racket?: RestRacket | null) =>
  [racket?.brand, racket?.model].filter(Boolean).join(' ') || '라켓 정보 없음';

export const getStringName = (item?: RestString | null) =>
  [item?.brand, item?.name].filter(Boolean).join(' ') || '스트링 정보 없음';

export const getBookingCode = (id: string) => `YB-${id.slice(0, 8).toUpperCase()}`;

export const getStorageUrl = (value?: string | null) => {
  const trimmed = value?.trim();

  if (!trimmed) {
    return null;
  }

  if (/^(https?:|data:|blob:)/i.test(trimmed) || !supabaseUrl) {
    return trimmed;
  }

  const path = trimmed
    .replace(/^\/+/, '')
    .replace(/^app-assets\//, '')
    .split('/')
    .filter(Boolean)
    .map(encodeURIComponent)
    .join('/');

  return `${supabaseUrl.replace(/\/+$/, '')}/storage/v1/object/public/app-assets/${path}`;
};

async function fetchRows<T>(
  path: string,
  params: Record<string, string>,
  options: { requireAdminKey?: boolean } = {},
) {
  const key = options.requireAdminKey ? serviceRoleKey : publicReadKey;

  if (!supabaseUrl || !key) {
    return [];
  }

  const url = new URL(`/rest/v1/${path}`, supabaseUrl);
  Object.entries(params).forEach(([paramKey, value]) => {
    url.searchParams.set(paramKey, value);
  });

  const response = await fetch(url, {
    cache: 'no-store',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
  });

  if (!response.ok) {
    console.error(`Supabase admin read failed: ${path}`, response.status);
    return [];
  }

  return (await response.json()) as T[];
}

export function toAdminBookingItem(booking: ServiceBookingRow): AdminBookingListItem {
  const slotTime = booking.booking_slots?.start_time ?? booking.created_at;
  const hasCancelRequest =
    booking.has_cancel_request === true &&
    activeServiceStatuses.includes(booking.status);
  const price =
    (booking.main_string?.price ?? 0) +
    (booking.cross_string?.name && booking.cross_string?.name !== booking.main_string?.name
      ? booking.cross_string?.price ?? 0
      : 0);

  return {
    bookingType: 'service',
    customer: getCustomerName(booking.profiles),
    detail: `${getStringName(booking.main_string)} / ${booking.tension_main}LB`,
    estimated: price,
    id: getBookingCode(booking.id),
    realId: booking.id,
    phone: booking.profiles?.phone ?? '-',
    racket: getRacketName(booking.user_rackets),
    requested: formatDateTime(booking.created_at),
    status: booking.status,
    statusLabel: hasCancelRequest ? '취소 요청' : statusLabel(booking.status),
    hasCancelRequest,
    cancelRequestedAt: hasCancelRequest ? booking.cancel_requested_at ?? null : null,
    type: '스트링',
    urgent:
      activeServiceStatuses.includes(booking.status) &&
      new Date(slotTime).getTime() - Date.now() < 4 * 60 * 60 * 1000,
    visit: formatDateTime(slotTime),
  };
}

export function toAdminDemoBookingItem(booking: DemoBookingRow): AdminBookingListItem {
  return {
    bookingType: 'demo',
    customer: getCustomerName(booking.profiles),
    detail: getRacketName(booking.demo_rackets),
    estimated: 0,
    id: getBookingCode(booking.id),
    realId: booking.id,
    phone: booking.profiles?.phone ?? '-',
    racket: getRacketName(booking.demo_rackets),
    requested: formatDateTime(booking.created_at),
    status: booking.status,
    statusLabel: statusLabel(booking.status),
    type: '시타',
    urgent:
      activeDemoStatuses.includes(booking.status) &&
      new Date(booking.start_time).getTime() - Date.now() < 4 * 60 * 60 * 1000,
    visit: formatDateTime(booking.start_time),
  };
}

export function toAdminProduct(product: ShopProductRow): AdminProductItem {
  return {
    category: product.category,
    id: product.id,
    imageUrl: getStorageUrl(product.image_path ?? product.image_url),
    isActive: product.is_active,
    name: product.name,
    price: product.price,
    salePrice: product.sale_price,
    sku: product.id,
    status: !product.is_active
      ? '비활성'
      : product.stock_quantity === 0
        ? '품절'
        : '판매 중',
    stock: product.stock_quantity,
  };
}

export function toAdminOrder(order: ShopOrderRow): AdminOrderItem {
  const items = Array.isArray(order.items) ? order.items : [];
  const itemSummary =
    items
      .map((item) => {
        if (item && typeof item === 'object' && 'name' in item) {
          return String(item.name);
        }
        return null;
      })
      .filter(Boolean)
      .join(', ') || `${items.length}개 상품`;

  return {
    customer: getCustomerName(order.profiles),
    date: formatDateTime(order.created_at),
    id: order.order_number,
    realId: order.id,
    itemSummary,
    items: items.length,
    method: '-',
    status: order.status,
    statusLabel: statusLabel(order.status),
    total: order.total_amount,
  };
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const getStringField = (
  payload: Record<string, unknown>,
  key: string,
  fallback = '',
) => {
  const value = payload[key];

  return typeof value === 'string' && value.trim().length > 0
    ? value.trim()
    : fallback;
};

const getNumberField = (
  payload: Record<string, unknown>,
  key: string,
  fallback = 0,
) => {
  const value = payload[key];

  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
};

const normalizeAnnouncementType = (value: string): AnnouncementType =>
  value === 'event' ? 'event' : 'notice';

const normalizeAnnouncementStatus = (value: string): AnnouncementStatus => {
  if (value === 'draft' || value === 'archived') {
    return value;
  }

  return 'published';
};

export function toAnnouncementItem(row: AppContentBlockRow): AdminAnnouncementItem {
  const payload = isRecord(row.payload) ? row.payload : {};
  const type = normalizeAnnouncementType(getStringField(payload, 'type', 'notice'));
  const status = normalizeAnnouncementStatus(
    getStringField(payload, 'status', row.is_active ? 'published' : 'archived'),
  );
  const startsAt = getStringField(payload, 'startsAt');
  const endsAt = getStringField(payload, 'endsAt');
  const publishedAt = getStringField(payload, 'publishedAt', row.created_at);
  const period =
    startsAt && endsAt
      ? `${startsAt.slice(0, 10)} - ${endsAt.slice(0, 10)}`
      : publishedAt
        ? formatDateTime(publishedAt)
        : '-';

  return {
    audience: getStringField(payload, 'audience', '전체'),
    body: getStringField(payload, 'body'),
    createdAt: row.created_at,
    isActive: row.is_active,
    key: row.key,
    period,
    status,
    statusLabel: announcementStatusLabels[status],
    title: getStringField(payload, 'title', '제목 없음'),
    type,
    typeLabel: announcementTypeLabels[type],
    updatedAt: row.updated_at,
    views: getNumberField(payload, 'views', 0),
  };
}

export function toSettlementShopOrder(order: ShopOrderRow): AdminSettlementOrderItem {
  const item = toAdminOrder(order);

  return {
    customer: item.customer,
    date: item.date,
    dateValue: order.created_at,
    id: item.id,
    itemSummary: item.itemSummary,
    items: item.items,
    realId: item.realId,
    source: 'shop',
    sourceLabel: '물품 구매',
    status: item.status,
    statusLabel: item.statusLabel,
    total: item.total,
  };
}

export function toSettlementServiceOrder(
  booking: ServiceBookingRow,
): AdminSettlementOrderItem {
  const item = toAdminBookingItem(booking);

  return {
    bookingType: 'service',
    customer: item.customer,
    date: item.requested,
    dateValue: booking.created_at,
    id: item.id,
    itemSummary: `${item.racket} · ${item.detail}`,
    items: 1,
    realId: item.realId,
    source: 'service',
    sourceLabel: '스트링 작업',
    status: item.status,
    statusLabel: item.statusLabel,
    total: item.estimated,
  };
}

export function toSettlementDemoOrder(booking: DemoBookingRow): AdminSettlementOrderItem {
  const item = toAdminDemoBookingItem(booking);

  return {
    bookingType: 'demo',
    customer: item.customer,
    date: item.requested,
    dateValue: booking.created_at,
    id: item.id,
    itemSummary: item.racket,
    items: 1,
    realId: item.realId,
    source: 'demo',
    sourceLabel: '라켓 시타',
    status: item.status,
    statusLabel: item.statusLabel,
    total: item.estimated,
  };
}

export async function loadServiceBookings(limit = 100) {
  return fetchRows<ServiceBookingRow>(
    'service_bookings',
    {
      limit: `${limit}`,
      order: 'created_at.desc',
      select:
        'id,status,tension_main,tension_cross,delivery_method,user_notes,admin_notes,created_at,updated_at,profiles(nickname,username,phone,email),user_rackets(brand,model),booking_slots(start_time,end_time),main_string:string_catalog!service_bookings_main_string_id_fkey(brand,name,price),cross_string:string_catalog!service_bookings_cross_string_id_fkey(brand,name,price)',
    },
    { requireAdminKey: true },
  );
}

export async function loadServiceCancelRequestLogs(limit = 200) {
  return fetchRows<BookingStatusLogRow>(
    'booking_status_logs',
    {
      booking_type: 'eq.service',
      limit: `${limit}`,
      new_status: 'eq.cancel_requested',
      order: 'changed_at.desc',
      select: 'booking_id,changed_at,new_status',
    },
    { requireAdminKey: true },
  );
}

export async function loadServiceCancelRequestLogsForBooking(bookingId: string) {
  return fetchRows<BookingStatusLogRow>(
    'booking_status_logs',
    {
      booking_id: `eq.${bookingId}`,
      booking_type: 'eq.service',
      limit: '1',
      new_status: 'eq.cancel_requested',
      order: 'changed_at.desc',
      select: 'booking_id,changed_at,new_status',
    },
    { requireAdminKey: true },
  );
}

function attachServiceCancelRequests(
  bookings: ServiceBookingRow[],
  logs: BookingStatusLogRow[],
) {
  const latestByBookingId = new Map<string, string>();

  logs.forEach((log) => {
    if (!latestByBookingId.has(log.booking_id)) {
      latestByBookingId.set(log.booking_id, log.changed_at);
    }
  });

  return bookings.map((booking) => ({
    ...booking,
    cancel_requested_at: latestByBookingId.get(booking.id) ?? null,
    has_cancel_request:
      latestByBookingId.has(booking.id) &&
      activeServiceStatuses.includes(booking.status),
  }));
}

export async function loadDemoBookings(limit = 100) {
  return fetchRows<DemoBookingRow>(
    'demo_bookings',
    {
      limit: `${limit}`,
      order: 'created_at.desc',
      select:
        'id,status,start_time,expected_return_time,actual_return_time,user_notes,admin_notes,created_at,updated_at,profiles(nickname,username,phone,email),demo_rackets(brand,model)',
    },
    { requireAdminKey: true },
  );
}

export async function loadServiceBookingById(id: string) {
  const rows = await fetchRows<ServiceBookingRow>(
    'service_bookings',
    {
      id: `eq.${id}`,
      limit: '1',
      select:
        'id,status,tension_main,tension_cross,delivery_method,user_notes,admin_notes,created_at,updated_at,profiles(nickname,username,phone,email),user_rackets(brand,model),booking_slots(start_time,end_time),main_string:string_catalog!service_bookings_main_string_id_fkey(brand,name,price),cross_string:string_catalog!service_bookings_cross_string_id_fkey(brand,name,price)',
    },
    { requireAdminKey: true },
  );

  const booking = rows[0] ?? null;

  if (!booking) {
    return null;
  }

  const logs = await loadServiceCancelRequestLogsForBooking(id);
  return attachServiceCancelRequests([booking], logs)[0] ?? null;
}

export async function loadDemoBookingById(id: string) {
  const rows = await fetchRows<DemoBookingRow>(
    'demo_bookings',
    {
      id: `eq.${id}`,
      limit: '1',
      select:
        'id,status,start_time,expected_return_time,actual_return_time,user_notes,admin_notes,created_at,updated_at,profiles(nickname,username,phone,email),demo_rackets(brand,model)',
    },
    { requireAdminKey: true },
  );

  return rows[0] ?? null;
}

export async function loadShopProducts(includeInactive = true) {
  const params: Record<string, string> = {
    order: 'sort_order.asc,created_at.desc',
    select: '*',
  };

  if (!includeInactive || !serviceRoleKey) {
    params.is_active = 'eq.true';
  }

  return fetchRows<ShopProductRow>('shop_products', params);
}

export async function loadDemoRackets() {
  const params: Record<string, string> = {
    order: 'created_at.desc',
    select: '*',
  };

  if (!serviceRoleKey) {
    params.status = 'eq.active';
    params.is_demo_enabled = 'eq.true';
    params.is_active = 'eq.true';
  }

  return fetchRows<DemoRacketRow>('demo_rackets', params);
}

export async function loadStringCatalog(activeOnly = false) {
  const params: Record<string, string> = {
    order: 'brand.asc,name.asc',
    // FK 조인: 연결된 shop_products의 재고 정보 함께 조회
    select: '*,shop_products(id,name,stock_quantity,sale_price)',
  };

  if (activeOnly) {
    params.is_active = 'eq.true';
  }

  return fetchRows<StringCatalogRow>('string_catalog', params, { requireAdminKey: true });
}

export async function loadShopOrders(limit = 100) {
  return fetchRows<ShopOrderRow>(
    'shop_orders',
    {
      limit: `${limit}`,
      order: 'created_at.desc',
      select: 'id,order_number,status,total_amount,items,created_at,updated_at,profiles(nickname,username,phone,email)',
    },
    { requireAdminKey: true },
  );
}

export async function loadAnnouncements(limit = 100) {
  const rows = await fetchRows<AppContentBlockRow>(
    'app_content_blocks',
    {
      key: 'like.announcement:%',
      limit: `${limit}`,
      order: 'created_at.desc',
      select: 'key,payload,description,is_active,created_at,updated_at',
    },
    { requireAdminKey: true },
  );

  return rows.map(toAnnouncementItem);
}

export async function getAdminBookingsPageData() {
  const [serviceBookings, demoBookings, cancelRequestLogs] = await Promise.all([
    loadServiceBookings(),
    loadDemoBookings(),
    loadServiceCancelRequestLogs(),
  ]);
  const serviceBookingsWithCancelRequests = attachServiceCancelRequests(
    serviceBookings,
    cancelRequestLogs,
  );
  const bookings = [
    ...serviceBookingsWithCancelRequests.map(toAdminBookingItem),
    ...demoBookings.map(toAdminDemoBookingItem),
  ].sort((a, b) => b.requested.localeCompare(a.requested));

  return {
    bookings,
    pendingRequests: bookings.filter((booking) =>
      ['requested', 'reschedule_requested'].includes(booking.status) ||
      booking.hasCancelRequest === true,
    ),
  };
}

export async function getAdminProductsPageData() {
  const rows = await loadShopProducts(true);
  return rows.map(toAdminProduct);
}

export async function getAdminInventoryPageData() {
  const [products, stringCatalogRows] = await Promise.all([
    getAdminProductsPageData(),
    loadStringCatalog(false),
  ]);
  const lowStockThreshold = 10;

  // 카테고리별 그룹핑
  const categoryOrder = ['라켓', '스트링', '신발', '가방', '피클볼'];
  const groupMap = new Map<string, AdminProductItem[]>();

  for (const product of products) {
    const list = groupMap.get(product.category) ?? [];
    list.push(product);
    groupMap.set(product.category, list);
  }

  const categories: AdminInventoryCategoryGroup[] = [
    ...categoryOrder,
    // DB에 있지만 categoryOrder에 없는 카테고리도 포함
    ...Array.from(groupMap.keys()).filter((c) => !categoryOrder.includes(c)),
  ]
    .filter((c) => groupMap.has(c))
    .map((category) => {
      const items = groupMap.get(category) ?? [];
      return {
        category,
        items,
        skuCount: items.length,
        totalStock: items.reduce((sum, it) => sum + it.stock, 0),
        outOfStock: items.filter((it) => it.stock === 0).length,
        lowStock: items.filter((it) => it.stock > 0 && it.stock <= lowStockThreshold).length,
      } satisfies AdminInventoryCategoryGroup;
    });

  // 서비스 스트링 현황 (string_catalog) - FK 링크 기반 전환
  const serviceCatalog: AdminStringCatalogItem[] = stringCatalogRows.map((row) => {
    const linked = row.shop_products ?? null;
    return {
      id: row.id,
      brand: row.brand,
      name: row.name,
      gauge: row.gauge,
      price: row.price,
      isActive: row.is_active ?? true,
      linkedStock: linked ? linked.stock_quantity : null,
      deactivationReason: row.deactivation_reason,
    };
  });

  // 연결되지 않은 서비스 스트링 (재고 추적 불가 항목)
  const unlinkedServiceStrings = serviceCatalog.filter((s) => s.linkedStock === null && s.isActive);

  return {
    categories,
    serviceCatalog,
    unlinkedServiceStrings,
    lowStock: products
      .filter((product) => product.stock <= lowStockThreshold)
      .map((product) => ({
        ...product,
        threshold: lowStockThreshold,
        critical: product.stock <= Math.floor(lowStockThreshold / 2),
      })),
    movements: [],
    stats: {
      activeSku: products.filter((product) => product.isActive).length,
      inboundThisWeek: 0,
      lowStock: products.filter((product) => product.stock <= lowStockThreshold).length,
      outOfStock: products.filter((product) => product.stock === 0).length,
      totalSku: products.length,
      serviceStringCount: serviceCatalog.filter((s) => s.isActive).length,
      unlinkedCount: unlinkedServiceStrings.length,
    },
  };
}

export async function getAdminDemoRacketsPageData() {
  const [rackets, demoBookings] = await Promise.all([
    loadDemoRackets(),
    loadDemoBookings(),
  ]);
  const bookingCounts = demoBookings.reduce<Record<string, number>>((acc, booking) => {
    const name = getRacketName(booking.demo_rackets);
    acc[name] = (acc[name] ?? 0) + 1;
    return acc;
  }, {});

  return rackets.map((racket) => {
    const name = getRacketName(racket);
    const available =
      racket.status === 'active' && racket.is_demo_enabled === true && racket.is_active === true;

    return {
      available,
      bookings: bookingCounts[name] ?? 0,
      id: racket.id,
      imageUrl: getStorageUrl(racket.photo_url),
      name,
      spec: [
        racket.weight ? `${racket.weight}g` : null,
        racket.head_size,
        racket.grip_size ? `그립 ${racket.grip_size}` : null,
      ]
        .filter(Boolean)
        .join(' · '),
      status: racket.status ?? 'inactive',
      statusLabel: available ? '시타 가능' : statusLabel(racket.status),
    } satisfies AdminDemoRacketItem;
  });
}

export async function getAdminOrdersPageData() {
  const [shopRows, serviceRows, demoRows] = await Promise.all([
    loadShopOrders(),
    loadServiceBookings(),
    loadDemoBookings(),
  ]);
  const orders = [
    ...shopRows.map(toSettlementShopOrder),
    ...serviceRows.map(toSettlementServiceOrder),
    ...demoRows.map(toSettlementDemoOrder),
  ].sort((a, b) => b.dateValue.localeCompare(a.dateValue));
  const today = toLocalDateKey(new Date());
  const month = today.slice(0, 7);

  return {
    orders,
    stats: {
      pendingSettlement: orders
        .filter((order) =>
          ['paid', 'preparing', 'shipping', 'approved', 'in_progress', 'completed'].includes(
            order.status,
          ),
        )
        .reduce((sum, order) => sum + order.total, 0),
      thisMonthSales: orders
        .filter((order) => toKstDateKey(order.dateValue).startsWith(month))
        .reduce((sum, order) => sum + order.total, 0),
      todaySales: orders
        .filter((order) => toKstDateKey(order.dateValue) === today)
        .reduce((sum, order) => sum + order.total, 0),
    },
  };
}

/** 데모 라켓 단건 조회 (상세 페이지용) */
export async function loadDemoRacketById(id: string): Promise<DemoRacketRow | null> {
  const rows = await fetchRows<DemoRacketRow>(
    'demo_rackets',
    { select: '*', id: `eq.${id}`, limit: '1' },
    { requireAdminKey: true },
  );
  return rows[0] ?? null;
}

/** 상품 단건 조회 (상세 페이지용) */
export async function loadShopProductById(id: string): Promise<ShopProductRow | null> {
  const rows = await fetchRows<ShopProductRow>(
    'shop_products',
    { select: '*', id: `eq.${id}`, limit: '1' },
  );
  return rows[0] ?? null;
}
