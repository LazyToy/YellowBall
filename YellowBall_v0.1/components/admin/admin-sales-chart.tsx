"use client"

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

const data = [
  { day: "월", string: 320, shop: 480, demo: 0 },
  { day: "화", string: 280, shop: 410, demo: 80 },
  { day: "수", string: 410, shop: 520, demo: 60 },
  { day: "목", string: 360, shop: 390, demo: 120 },
  { day: "금", string: 480, shop: 610, demo: 90 },
  { day: "토", string: 720, shop: 980, demo: 220 },
  { day: "일", string: 540, shop: 760, demo: 180 },
]

export function AdminSalesChart() {
  return (
    <section className="rounded-2xl border border-border bg-card">
      <header className="px-5 py-4 flex items-end justify-between border-b border-border">
        <div>
          <h2 className="font-display font-bold text-base text-foreground">주간 매출</h2>
          <p className="text-xs text-muted-foreground mt-0.5">최근 7일 · 단위 1,000원</p>
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-primary" />
            <span className="text-muted-foreground">스트링</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-accent" />
            <span className="text-muted-foreground">샵</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-chart-3" />
            <span className="text-muted-foreground">시타</span>
          </span>
        </div>
      </header>
      <div className="p-4 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              tickLine={false}
              axisLine={false}
              width={32}
            />
            <Tooltip
              cursor={{ fill: "var(--secondary)" }}
              contentStyle={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                fontSize: 12,
              }}
            />
            <Bar dataKey="string" stackId="a" fill="var(--primary)" radius={[0, 0, 0, 0]} />
            <Bar dataKey="shop" stackId="a" fill="var(--accent)" />
            <Bar dataKey="demo" stackId="a" fill="var(--chart-3)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}
