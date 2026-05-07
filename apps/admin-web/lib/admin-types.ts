export type DashboardTone = 'primary' | 'accent' | 'neutral' | 'danger';

export type AdminKpi = {
  label: string;
  value: string;
  sub: string;
  delta: string;
  tone: DashboardTone;
  up: boolean;
};

export type AdminQueueColumn = {
  title: string;
  tone: DashboardTone;
  jobs: {
    id: string;
    realId: string;
    bookingType: 'service';
    customer: string;
    racket: string;
    string: string;
    due: string;
    priority?: boolean;
  }[];
};

export type AdminSalesDatum = {
  day: string;
  string: number;
  shop: number;
  demo: number;
};

export type AdminDemoSlot = {
  time: string;
  customer: string;
  racket: string;
  status: string;
};

export type AdminLowStockItem = {
  name: string;
  stock: number;
  threshold: number;
};

export type AdminRecentOrder = {
  id: string;
  customer: string;
  items: string;
  total: number;
  status: string;
  time: string;
};

export type AdminQueueSummaryMetric = {
  label: string;
  value: string;
  tone: 'primary' | 'danger' | 'success';
  icon: 'timer' | 'alert' | 'check';
};
