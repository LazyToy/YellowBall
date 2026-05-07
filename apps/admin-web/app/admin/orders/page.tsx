import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { OrderManagementTable } from '@/components/admin/order-management-table';
import { getAdminOrdersPageData, hasAdminReadKey, money } from '@/lib/admin-data';
import { Receipt, TrendingUp, Wallet } from 'lucide-react';

export default async function AdminOrdersPage() {
  const { orders, stats } = await getAdminOrdersPageData();

  return (
    <div>
      <AdminPageHeader
        label="ORDERS & SETTLEMENT"
        title="주문/정산"
        description="shop_orders, service_bookings, demo_bookings의 실제 데이터를 통합 관리합니다."
      />

      {!hasAdminReadKey ? (
        <div className="mb-5 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-xs text-destructive">
          주문/예약 테이블은 RLS 보호 대상입니다. 실제 데이터를 보려면
          NEXT_SUPABASE_SERVICE_ROLE_KEY를 서버 환경변수로 설정해야 합니다.
        </div>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <TrendingUp className="size-3.5" />
            오늘 매출
          </div>
          <p className="font-display text-3xl font-bold text-foreground mt-2">
            {money(stats.todaySales)}원
          </p>
          <p className="text-xs text-muted-foreground mt-1">물품 구매와 작업 매출 합계</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <Receipt className="size-3.5" />
            이번 달 누적
          </div>
          <p className="font-display text-3xl font-bold text-foreground mt-2">
            {money(stats.thisMonthSales)}원
          </p>
          <p className="text-xs text-muted-foreground mt-1">현재 조회 범위 합계</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <Wallet className="size-3.5" />
            정산 대기
          </div>
          <p className="font-display text-3xl font-bold text-foreground mt-2">
            {money(stats.pendingSettlement)}원
          </p>
          <p className="text-xs text-muted-foreground mt-1">진행 중 주문/작업 기준</p>
        </div>
      </div>

      <OrderManagementTable orders={orders} />
    </div>
  );
}
