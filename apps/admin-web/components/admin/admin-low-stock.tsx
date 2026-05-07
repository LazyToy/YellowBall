import { AlertTriangle } from 'lucide-react';

import type { AdminLowStockItem } from '@/lib/admin-types';

export function AdminLowStock({ items }: { items: AdminLowStockItem[] }) {
  return (
    <section className="rounded-2xl border border-border bg-card">
      <header className="px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <AlertTriangle className="size-4 text-destructive" />
          <h2 className="font-display font-bold text-base text-foreground">
            재고 부족 알림
          </h2>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          shop_products 재고 기준
        </p>
      </header>
      <ul className="divide-y divide-border">
        {items.length === 0 ? (
          <li className="px-5 py-8 text-center text-xs text-muted-foreground">
            재고 부족 상품이 없습니다.
          </li>
        ) : (
          items.map((it) => {
            const pct = Math.min(100, (it.stock / it.threshold) * 100);
            return (
              <li key={it.name} className="px-5 py-3 flex items-center gap-3">
                <div className="size-10 rounded-lg bg-secondary grid place-items-center shrink-0">
                  <AlertTriangle className="size-4 text-destructive" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {it.name}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full bg-destructive"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground tabular-nums">
                      {it.stock} / {it.threshold}
                    </p>
                  </div>
                </div>
                <button className="text-[11px] font-semibold text-primary border border-primary/30 rounded-full px-2.5 py-1 hover:bg-primary hover:text-primary-foreground transition shrink-0">
                  발주
                </button>
              </li>
            );
          })
        )}
      </ul>
    </section>
  );
}
