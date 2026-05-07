import { AdminDemoCalendar } from '@/components/admin/admin-demo-calendar';
import { AdminKpis } from '@/components/admin/admin-kpis';
import { AdminLowStock } from '@/components/admin/admin-low-stock';
import { AdminQueueBoard } from '@/components/admin/admin-queue-board';
import { AdminRecentOrders } from '@/components/admin/admin-recent-orders';
import { AdminSalesChart } from '@/components/admin/admin-sales-chart';
import { hasAdminReadKey } from '@/lib/admin-data';
import { getAdminOperationalDashboardData } from '@/lib/admin-operational-data';

export default async function AdminDashboardPage() {
  const dashboard = await getAdminOperationalDashboardData();
  const todayLabel = new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'full',
  }).format(new Date());
  const inProgressCount =
    dashboard.queueColumns.find((column) => column.title === '작업중')?.jobs
      .length ?? 0;

  return (
    <div className="space-y-8">
      {/* 페이지 헤더 */}
      <div className="mb-2">
        <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-1">
          SHOP DASHBOARD
        </p>
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground tracking-tight">
              관리자 대시보드
            </h1>
            <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
              오늘은 {todayLabel}입니다. 진행 중인 작업 {inProgressCount}건을 확인하세요.
            </p>
          </div>
          {!hasAdminReadKey ? (
            <div className="hidden lg:block rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive shrink-0">
              보호 테이블 조회에는 NEXT_SUPABASE_SERVICE_ROLE_KEY가 필요합니다.
            </div>
          ) : null}
        </div>
        <div className="mt-6 border-b border-border" />
      </div>

      <AdminKpis kpis={dashboard.kpis} />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <AdminQueueBoard columns={dashboard.queueColumns} />
          <AdminSalesChart data={dashboard.salesData} />
        </div>
        <div className="space-y-6">
          <AdminDemoCalendar slots={dashboard.demoSlots} />
          <AdminLowStock items={dashboard.lowStockItems} />
        </div>
      </div>

      <AdminRecentOrders orders={dashboard.recentOrders} />
    </div>
  );
}
