import { Wrench, Sparkles, ShoppingBag, CalendarCheck } from "lucide-react"

const services = [
  {
    icon: Wrench,
    label: "스트링 작업",
    sub: "예약 · 결제",
    tone: "primary" as const,
  },
  {
    icon: Sparkles,
    label: "라켓 시타",
    sub: "데모 대여",
    tone: "accent" as const,
  },
  {
    icon: ShoppingBag,
    label: "용품 쇼핑",
    sub: "테니스 · 피클볼",
    tone: "muted" as const,
  },
  {
    icon: CalendarCheck,
    label: "내 예약",
    sub: "진행 상태",
    tone: "muted" as const,
  },
]

export function QuickServices() {
  return (
    <section className="px-5 pb-2">
      <div className="grid grid-cols-4 gap-2">
        {services.map((s) => {
          const Icon = s.icon
          const bg =
            s.tone === "primary"
              ? "bg-primary text-primary-foreground"
              : s.tone === "accent"
                ? "bg-accent text-accent-foreground"
                : "bg-card text-foreground border border-border"
          return (
            <button
              key={s.label}
              className="min-w-0 flex flex-col items-center gap-2 group"
              aria-label={s.label}
            >
              <span
                className={`size-12 @sm:size-14 rounded-2xl ${bg} grid place-items-center group-hover:scale-105 transition-transform shadow-sm`}
              >
                <Icon className="size-5 @sm:size-6" />
              </span>
              <span className="text-[11px] font-medium leading-tight text-center w-full">
                <span className="block truncate">{s.label}</span>
                <span className="block text-[10px] text-muted-foreground font-normal truncate">
                  {s.sub}
                </span>
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
