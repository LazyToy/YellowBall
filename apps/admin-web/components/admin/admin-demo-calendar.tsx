import { Sparkles } from 'lucide-react';

import type { AdminDemoSlot } from '@/lib/admin-types';

export function AdminDemoCalendar({ slots }: { slots: AdminDemoSlot[] }) {
  return (
    <section className="rounded-2xl border border-border bg-card">
      <header className="px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" />
          <h2 className="font-display font-bold text-base text-foreground">
            오늘 시타 일정
          </h2>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          오늘 · {slots.length}건
        </p>
      </header>
      <ul className="divide-y divide-border">
        {slots.length === 0 ? (
          <li className="px-5 py-8 text-center text-xs text-muted-foreground">
            오늘 시타 예약이 없습니다.
          </li>
        ) : (
          slots.map((s, i) => (
            <li key={i} className="px-5 py-3 flex items-center gap-3">
              <p className="font-mono text-sm font-bold text-foreground w-12">
                {s.time}
              </p>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  {s.customer}
                </p>
                <p className="text-[11px] text-muted-foreground truncate">
                  {s.racket}
                </p>
              </div>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                  s.status === '대여 중'
                    ? 'bg-primary text-primary-foreground'
                    : s.status === '반납 지연'
                      ? 'bg-destructive text-destructive-foreground'
                      : 'bg-accent text-accent-foreground'
                }`}
              >
                {s.status}
              </span>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
