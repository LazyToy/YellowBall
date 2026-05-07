import { ChevronRight } from 'lucide-react';

import type { AdminRecentOrder } from '@/lib/admin-types';

const statusStyle: Record<string, string> = {
  '결제 완료': 'bg-primary text-primary-foreground',
  '준비 중': 'bg-accent text-accent-foreground',
  '배송 중': 'bg-chart-3 text-primary-foreground',
  '취소': 'bg-secondary text-muted-foreground',
  '환불': 'bg-muted text-muted-foreground',
};

const fmt = (n: number) => n.toLocaleString('ko-KR');

export function AdminRecentOrders({ orders }: { orders: AdminRecentOrder[] }) {
  return (
    <section className="rounded-2xl border border-border bg-card">
      <header className="px-5 py-4 flex items-center justify-between border-b border-border">
        <div>
          <h2 className="font-display font-bold text-base text-foreground">
            최근 주문
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            shop_orders 기준
          </p>
        </div>
        <button className="text-xs font-semibold text-primary inline-flex items-center gap-0.5">
          전체 주문 <ChevronRight className="size-3.5" />
        </button>
      </header>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] text-muted-foreground uppercase tracking-wide">
              <th className="px-5 py-3 font-semibold">주문 번호</th>
              <th className="py-3 font-semibold">고객</th>
              <th className="py-3 font-semibold">상품</th>
              <th className="py-3 font-semibold text-right">금액</th>
              <th className="py-3 font-semibold">상태</th>
              <th className="px-5 py-3 font-semibold text-right">시간</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {orders.length === 0 ? (
              <tr>
                <td
                  className="px-5 py-8 text-center text-xs text-muted-foreground"
                  colSpan={6}
                >
                  주문 데이터가 없습니다.
                </td>
              </tr>
            ) : (
              orders.map((o) => (
                <tr key={o.id} className="hover:bg-secondary/40 transition">
                  <td className="px-5 py-3.5 font-mono text-[11px] text-muted-foreground">
                    {o.id}
                  </td>
                  <td className="py-3.5 font-semibold text-foreground">
                    {o.customer}
                  </td>
                  <td className="py-3.5 text-foreground/80 max-w-xs truncate">
                    {o.items}
                  </td>
                  <td className="py-3.5 text-right tabular-nums font-semibold text-foreground">
                    {fmt(o.total)}원
                  </td>
                  <td className="py-3.5">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        statusStyle[o.status] ?? 'bg-secondary text-muted-foreground'
                      }`}
                    >
                      {o.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right text-[11px] text-muted-foreground">
                    {o.time}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
