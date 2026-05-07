import { ChevronRight, Clock } from 'lucide-react';
import Link from 'next/link';

import type { AdminQueueColumn, DashboardTone } from '@/lib/admin-types';

const toneClass: Record<DashboardTone, string> = {
  primary: 'bg-primary text-primary-foreground',
  accent: 'bg-accent text-accent-foreground',
  neutral: 'bg-secondary text-secondary-foreground',
  danger: 'bg-destructive text-destructive-foreground',
};

export function AdminQueueBoard({ columns }: { columns: AdminQueueColumn[] }) {
  return (
    <section className="rounded-2xl border border-border bg-card">
      <header className="px-5 py-4 flex items-center justify-between border-b border-border">
        <div>
          <h2 className="font-display font-bold text-base text-foreground">
            스트링 작업 큐
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            실시간 작업 상태 관리
          </p>
        </div>
        <button className="text-xs font-semibold text-primary inline-flex items-center gap-0.5">
          전체 보기 <ChevronRight className="size-3.5" />
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
        {columns.map((col) => (
          <div key={col.title} className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${toneClass[col.tone]}`}
                >
                  {col.title}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {col.jobs.length}
                </span>
              </div>
            </div>
            {col.jobs.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-secondary/30 p-4 text-center text-xs text-muted-foreground">
                표시할 작업이 없습니다.
              </div>
            ) : (
              col.jobs.map((j) => (
                <Link
                  key={j.id}
                  href={`/admin/bookings/${j.bookingType}/${j.realId}`}
                  className="block rounded-xl bg-secondary/60 hover:bg-secondary transition border border-border p-3 cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-mono text-muted-foreground">
                      {j.id}
                    </p>
                    {j.priority ? (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-destructive text-destructive-foreground">
                        급행
                      </span>
                    ) : null}
                  </div>
                  <p className="text-sm font-semibold text-foreground mt-1">
                    {j.customer}
                  </p>
                  <p className="text-xs text-foreground mt-0.5">{j.racket}</p>
                  <p className="text-[11px] text-muted-foreground">{j.string}</p>
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-2 pt-2 border-t border-border">
                    <Clock className="size-3" />
                    {j.due}
                  </div>
                </Link>
              ))
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
