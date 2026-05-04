import { Wrench, Sparkles, Wallet, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react"

const kpis = [
  {
    label: "오늘 작업 예약",
    value: "12",
    sub: "진행 중 4 · 완료 8",
    icon: Wrench,
    delta: "+3",
    up: true,
    tone: "primary" as const,
  },
  {
    label: "오늘 시타 예약",
    value: "5",
    sub: "다음 슬롯 11:00",
    icon: Sparkles,
    delta: "+2",
    up: true,
    tone: "accent" as const,
  },
  {
    label: "오늘 매출",
    value: "₩1,842,000",
    sub: "주문 14건",
    icon: Wallet,
    delta: "+12%",
    up: true,
    tone: "neutral" as const,
  },
  {
    label: "재고 알림",
    value: "3",
    sub: "임계치 미만",
    icon: AlertTriangle,
    delta: "-1",
    up: false,
    tone: "danger" as const,
  },
]

export function AdminKpis() {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {kpis.map((k) => {
        const Icon = k.icon
        const iconBg =
          k.tone === "primary"
            ? "bg-primary text-primary-foreground"
            : k.tone === "accent"
            ? "bg-accent text-accent-foreground"
            : k.tone === "danger"
            ? "bg-destructive/10 text-destructive"
            : "bg-secondary text-foreground"
        return (
          <article
            key={k.label}
            className="rounded-2xl border border-border bg-card p-5 hover:shadow-md hover:shadow-primary/5 transition"
          >
            <div className="flex items-center justify-between">
              <div className={`size-10 rounded-xl grid place-items-center ${iconBg}`}>
                <Icon className="size-5" />
              </div>
              <span
                className={`inline-flex items-center gap-0.5 text-[11px] font-semibold ${
                  k.up ? "text-emerald-600" : "text-destructive"
                }`}
              >
                {k.up ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                {k.delta}
              </span>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">{k.label}</p>
            <p className="font-display text-2xl font-bold text-foreground mt-1">{k.value}</p>
            <p className="text-[11px] text-muted-foreground mt-1">{k.sub}</p>
          </article>
        )
      })}
    </section>
  )
}
