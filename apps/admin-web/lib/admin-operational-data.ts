import type {
  AdminDemoSlot,
  AdminKpi,
  AdminLowStockItem,
  AdminQueueColumn,
  AdminQueueSummaryMetric,
  AdminRecentOrder,
  AdminSalesDatum,
} from '@/lib/admin-types';
import {
  activeDemoStatuses,
  activeServiceStatuses,
  formatDateTime,
  formatTime,
  getAdminInventoryPageData,
  getCustomerName,
  getRacketName,
  getStringName,
  hasAdminReadKey,
  loadDemoBookings,
  loadServiceBookings,
  loadShopOrders,
  statusLabel,
  terminalServiceStatuses,
  toLocalDateKey,
  type DemoBookingRow,
  type ServiceBookingRow,
  type ShopOrderRow,
} from '@/lib/admin-data';
import { toKstDateKey } from '@/lib/kst-time';

export type AdminOperationalDashboardData = {
  kpis: AdminKpi[];
  queueColumns: AdminQueueColumn[];
  queueSummary: AdminQueueSummaryMetric[];
  salesData: AdminSalesDatum[];
  demoSlots: AdminDemoSlot[];
  lowStockItems: AdminLowStockItem[];
  recentOrders: AdminRecentOrder[];
  openStatus: {
    label: string;
    open: boolean;
  } | null;
};

const getBookingCode = (id: string) => `YB-${id.slice(0, 8).toUpperCase()}`;

function buildQueueColumns(bookings: ServiceBookingRow[]): AdminQueueColumn[] {
  const toJob = (booking: ServiceBookingRow) => {
    const slotTime = booking.booking_slots?.start_time;

    return {
      bookingType: 'service' as const,
      customer: getCustomerName(booking.profiles),
      due: slotTime ? formatDateTime(slotTime) : '일정 미정',
      id: getBookingCode(booking.id),
      priority:
        slotTime != null &&
        activeServiceStatuses.includes(booking.status) &&
        new Date(slotTime).getTime() - Date.now() < 4 * 60 * 60 * 1000,
      racket: getRacketName(booking.user_rackets),
      realId: booking.id,
      string: `${getStringName(booking.main_string)} / ${booking.tension_main}LB`,
    };
  };

  return [
    {
      jobs: bookings
        .filter((booking) =>
          [
            'requested',
            'reschedule_requested',
            'cancelled_user',
            'cancelled_admin',
            'rejected',
            'no_show',
          ].includes(booking.status),
        )
        .map(toJob),
      title: '접수',
      tone: 'neutral',
    },
    {
      jobs: bookings
        .filter((booking) => ['approved', 'visit_pending'].includes(booking.status))
        .map(toJob),
      title: '승인',
      tone: 'neutral',
    },
    {
      jobs: bookings
        .filter((booking) =>
          ['racket_received', 'in_progress'].includes(booking.status),
        )
        .map(toJob),
      title: '작업중',
      tone: 'primary',
    },
    {
      jobs: bookings
        .filter((booking) =>
          [
            'completed',
            'pickup_ready',
            'delivered',
            'done',
            'refund_pending',
            'refund_done',
          ].includes(booking.status),
        )
        .map(toJob),
      title: '완료',
      tone: 'accent',
    },
  ];
}

function buildDemoSlots(bookings: DemoBookingRow[]): AdminDemoSlot[] {
  return bookings
    .filter((booking) => activeDemoStatuses.includes(booking.status))
    .map((booking) => ({
      customer: getCustomerName(booking.profiles),
      racket: getRacketName(booking.demo_rackets),
      status: statusLabel(booking.status),
      time: formatTime(booking.start_time),
    }));
}

function buildKpis(
  serviceBookings: ServiceBookingRow[],
  demoBookings: DemoBookingRow[],
  orders: ShopOrderRow[],
  lowStockItems: AdminLowStockItem[],
): AdminKpi[] {
  const today = toLocalDateKey(new Date());
  const todayServiceBookings = serviceBookings.filter(
    (booking) =>
      booking.booking_slots?.start_time
        ? toKstDateKey(booking.booking_slots.start_time) === today
        : false,
  );
  const todayDemoBookings = demoBookings.filter((booking) =>
    toKstDateKey(booking.start_time) === today,
  );
  const inProgress = serviceBookings.filter((booking) =>
    ['racket_received', 'in_progress'].includes(booking.status),
  ).length;
  const doneToday = serviceBookings.filter(
    (booking) =>
      terminalServiceStatuses.includes(booking.status) &&
      booking.updated_at != null &&
      toKstDateKey(booking.updated_at) === today,
  ).length;
  const todaySales = orders
    .filter((order) => toKstDateKey(order.created_at) === today)
    .reduce((sum, order) => sum + order.total_amount, 0);

  return [
    {
      delta: hasAdminReadKey ? '실시간' : '서비스 키 필요',
      label: '오늘 작업 예약',
      sub: `진행 중 ${inProgress} · 완료 ${doneToday}`,
      tone: 'primary',
      up: true,
      value: `${todayServiceBookings.length}`,
    },
    {
      delta: hasAdminReadKey ? '실시간' : '서비스 키 필요',
      label: '오늘 시타 예약',
      sub: todayDemoBookings[0]
        ? `다음 예약 ${formatTime(todayDemoBookings[0].start_time)}`
        : '오늘 예약 없음',
      tone: 'accent',
      up: true,
      value: `${todayDemoBookings.length}`,
    },
    {
      delta: hasAdminReadKey ? '실시간' : '주문 0건',
      label: '오늘 매출',
      sub: 'shop_orders 기준',
      tone: 'neutral',
      up: true,
      value: `${todaySales.toLocaleString('ko-KR')}원`,
    },
    {
      delta: '실시간',
      label: '재고 알림',
      sub: 'shop_products 기준',
      tone: 'danger',
      up: lowStockItems.length === 0,
      value: `${lowStockItems.length}`,
    },
  ];
}

function buildQueueSummary(
  bookings: ServiceBookingRow[],
): AdminQueueSummaryMetric[] {
  const rushCount = bookings.filter(
    (booking) =>
      booking.booking_slots?.start_time != null &&
      activeServiceStatuses.includes(booking.status) &&
      new Date(booking.booking_slots.start_time).getTime() - Date.now() <
        4 * 60 * 60 * 1000,
  ).length;
  const today = toLocalDateKey(new Date());
  const completedToday = bookings.filter(
    (booking) =>
      ['completed', 'pickup_ready', 'delivered', 'done'].includes(
        booking.status,
      ) &&
      booking.updated_at != null &&
      toKstDateKey(booking.updated_at) === today,
  ).length;

  return [
    { icon: 'timer', label: '평균 작업 시간', tone: 'primary', value: '-' },
    {
      icon: 'alert',
      label: '급행 대기',
      tone: 'danger',
      value: `${rushCount}건`,
    },
    {
      icon: 'check',
      label: '오늘 완료',
      tone: 'success',
      value: `${completedToday}건`,
    },
  ];
}

function buildSalesData(orders: ShopOrderRow[]): AdminSalesDatum[] {
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));

    return {
      day: new Intl.DateTimeFormat('ko-KR', { weekday: 'short' }).format(date),
      key: toLocalDateKey(date),
      shop: 0,
      string: 0,
      demo: 0,
    };
  });

  orders.forEach((order) => {
    const key = toKstDateKey(order.created_at);
    const bucket = days.find((day) => day.key === key);

    if (bucket) {
      bucket.shop += Math.round(order.total_amount / 1000);
    }
  });

  return days.map(({ day, shop, string, demo }) => ({ day, shop, string, demo }));
}

function buildRecentOrders(orders: ShopOrderRow[]): AdminRecentOrder[] {
  return orders.slice(0, 6).map((order) => {
    const items = Array.isArray(order.items) ? order.items : [];
    const itemNames = items
      .map((item) => {
        if (item && typeof item === 'object' && 'name' in item) {
          return String(item.name);
        }
        return null;
      })
      .filter(Boolean);

    return {
      customer: getCustomerName(order.profiles),
      id: order.order_number,
      items: itemNames.join(', ') || `${items.length}개 상품`,
      status: statusLabel(order.status),
      time: formatDateTime(order.created_at),
      total: order.total_amount,
    };
  });
}

export async function getAdminOperationalDashboardData(): Promise<AdminOperationalDashboardData> {
  const [serviceBookings, demoBookings, orders, inventory] = await Promise.all([
    loadServiceBookings(),
    loadDemoBookings(),
    loadShopOrders(),
    getAdminInventoryPageData(),
  ]);

  const lowStockItems = inventory.lowStock.map((item) => ({
    name: item.name,
    stock: item.stock,
    threshold: item.threshold,
  }));

  return {
    demoSlots: buildDemoSlots(demoBookings),
    kpis: buildKpis(serviceBookings, demoBookings, orders, lowStockItems),
    lowStockItems,
    openStatus: null,
    queueColumns: buildQueueColumns(serviceBookings),
    queueSummary: buildQueueSummary(serviceBookings),
    recentOrders: buildRecentOrders(orders),
    salesData: buildSalesData(orders),
  };
}
