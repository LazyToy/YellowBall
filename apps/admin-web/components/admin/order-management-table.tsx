'use client';

import { useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { BookingStatusMenu } from './booking-status-menu';
import { OrderStatusMenu } from './order-status-menu';
import type { AdminSettlementOrderItem } from '@/lib/admin-data';

const money = (value: number) => value.toLocaleString('ko-KR');

const statusStyle: Record<string, string> = {
  approved: 'bg-primary/10 text-primary',
  cancelled: 'bg-destructive/10 text-destructive',
  cancelled_admin: 'bg-destructive/10 text-destructive',
  cancelled_user: 'bg-destructive/10 text-destructive',
  completed: 'bg-chart-4/15 text-chart-4',
  delivered: 'bg-muted text-muted-foreground',
  done: 'bg-muted text-muted-foreground',
  in_progress: 'bg-accent text-accent-foreground',
  in_use: 'bg-accent text-accent-foreground',
  paid: 'bg-chart-4/15 text-chart-4',
  pending: 'bg-secondary text-foreground',
  preparing: 'bg-accent text-accent-foreground',
  refunded: 'bg-muted text-muted-foreground',
  requested: 'bg-secondary text-foreground',
  returned: 'bg-muted text-muted-foreground',
  shipping: 'bg-primary/10 text-primary',
};

const filters = [
  { label: '전체', value: 'all' },
  { label: '물품 구매', value: 'shop' },
  { label: '스트링 작업', value: 'service' },
  { label: '라켓 시타', value: 'demo' },
] as const;

export function OrderManagementTable({
  orders,
}: {
  orders: AdminSettlementOrderItem[];
}) {
  const [filter, setFilter] = useState<(typeof filters)[number]['value']>('all');
  const filteredOrders = useMemo(
    () =>
      filter === 'all'
        ? orders
        : orders.filter((order) => order.source === filter),
    [filter, orders],
  );

  const downloadReport = () => {
    const header = ['구분', '번호', '고객', '상품/작업', '상태', '금액', '일시'];
    const rows = filteredOrders.map((order) => [
      order.sourceLabel,
      order.id,
      order.customer,
      order.itemSummary,
      order.statusLabel,
      String(order.total),
      order.date,
    ]);
    const csv = [header, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(','),
      )
      .join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `yellowball-settlement-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <header className="px-5 py-4 border-b border-border flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <h2 className="font-display font-bold text-foreground">통합 주문/정산</h2>
        <div className="flex flex-wrap gap-2">
          {filters.map((item) => (
            <button
              key={item.value}
              className={`h-8 px-3 rounded-md text-xs font-semibold ${
                filter === item.value
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-secondary border border-border'
              }`}
              onClick={() => setFilter(item.value)}
              type="button"
            >
              {item.label}
            </button>
          ))}
          <button
            className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1.5 hover:opacity-90"
            onClick={downloadReport}
            type="button"
          >
            <Download className="size-3.5" />
            정산 리포트
          </button>
        </div>
      </header>
      <table className="w-full text-sm">
        <thead className="bg-secondary/60 text-muted-foreground text-xs">
          <tr>
            <th className="text-left font-semibold px-4 py-3">구분</th>
            <th className="text-left font-semibold px-4 py-3">번호</th>
            <th className="text-left font-semibold px-4 py-3">고객</th>
            <th className="text-right font-semibold px-4 py-3">수량</th>
            <th className="text-left font-semibold px-4 py-3">상품/작업</th>
            <th className="text-right font-semibold px-4 py-3">금액</th>
            <th className="text-left font-semibold px-4 py-3">상태</th>
            <th className="text-left font-semibold px-4 py-3">일시</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {filteredOrders.length === 0 ? (
            <tr>
              <td
                className="px-4 py-8 text-center text-xs text-muted-foreground"
                colSpan={9}
              >
                주문/정산 데이터가 없습니다.
              </td>
            </tr>
          ) : (
            filteredOrders.map((order) => (
              <tr
                key={`${order.source}:${order.realId}`}
                className="border-t border-border hover:bg-secondary/40"
              >
                <td className="px-4 py-3 text-foreground">{order.sourceLabel}</td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                  {order.id}
                </td>
                <td className="px-4 py-3 font-semibold text-foreground">
                  {order.customer}
                </td>
                <td className="px-4 py-3 text-right text-foreground">{order.items}</td>
                <td className="px-4 py-3 text-foreground">{order.itemSummary}</td>
                <td className="px-4 py-3 text-right font-bold text-foreground">
                  {order.total > 0 ? `${money(order.total)}원` : '-'}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                      statusStyle[order.status] ?? 'bg-secondary text-foreground'
                    }`}
                  >
                    {order.statusLabel}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{order.date}</td>
                <td className="px-4 py-3 text-right">
                  {order.source === 'shop' ? (
                    <OrderStatusMenu orderId={order.realId} currentStatus={order.status} />
                  ) : order.bookingType ? (
                    <BookingStatusMenu
                      realId={order.realId}
                      bookingType={order.bookingType}
                      currentStatus={order.status}
                    />
                  ) : null}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      <div className="px-4 py-3 border-t border-border text-xs text-muted-foreground">
        총 {filteredOrders.length}건
      </div>
    </div>
  );
}
