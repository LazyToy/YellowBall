import { AdminKpis } from "@/components/admin/admin-kpis"
import { AdminQueueBoard } from "@/components/admin/admin-queue-board"
import { AdminSalesChart } from "@/components/admin/admin-sales-chart"
import { AdminDemoCalendar } from "@/components/admin/admin-demo-calendar"
import { AdminLowStock } from "@/components/admin/admin-low-stock"
import { AdminRecentOrders } from "@/components/admin/admin-recent-orders"

export default function AdminDashboardPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-semibold text-primary tracking-wide">SHOP DASHBOARD</p>
          <h1 className="font-display text-2xl font-bold text-foreground mt-1">
            안녕하세요, 정민수 매니저님
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            오늘은 2026년 4월 29일 수요일입니다. 진행 중인 작업 4건을 확인하세요.
          </p>
        </div>
        <div className="hidden lg:flex items-center gap-2 text-xs text-muted-foreground">
          <span className="size-2 rounded-full bg-emerald-500" />
          영업 중 · 10:00 - 21:00
        </div>
      </div>

      <AdminKpis />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <AdminQueueBoard />
          <AdminSalesChart />
        </div>
        <div className="space-y-6">
          <AdminDemoCalendar />
          <AdminLowStock />
        </div>
      </div>

      <AdminRecentOrders />
    </div>
  )
}
