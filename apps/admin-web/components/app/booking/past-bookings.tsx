import { Wrench, Sparkles, RotateCcw, Star } from "lucide-react"

const past = [
  {
    id: "RH-2598",
    type: "string" as const,
    racket: "Wilson Pro Staff RF97",
    detail: "Luxilon ALU Power 1.25 / 50LB",
    date: "2026.04.18",
    rated: true,
  },
  {
    id: "RH-2570",
    type: "demo" as const,
    racket: "Yonex VCORE 100 (시타)",
    detail: "성수점 · 1시간 30분",
    date: "2026.04.10",
    rated: false,
  },
  {
    id: "RH-2552",
    type: "string" as const,
    racket: "Babolat Pure Drive",
    detail: "Solinco Hyper-G Soft / 52LB",
    date: "2026.03.27",
    rated: true,
  },
  {
    id: "RH-2510",
    type: "string" as const,
    racket: "Wilson Blade 98 v9",
    detail: "Polytour Pro 1.25 / 51LB",
    date: "2026.03.05",
    rated: true,
  },
]

export function PastBookings() {
  return (
    <section className="px-5 pt-4 space-y-2">
      {past.map((p) => {
        const Icon = p.type === "string" ? Wrench : Sparkles
        return (
          <article
            key={p.id}
            className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
          >
            <div className="size-9 rounded-lg grid place-items-center bg-secondary shrink-0">
              <Icon className="size-4 text-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-foreground truncate">{p.racket}</p>
                {p.rated && (
                  <Star className="size-3 fill-accent text-accent" aria-label="후기 작성됨" />
                )}
              </div>
              <p className="text-[11px] text-muted-foreground truncate">{p.detail}</p>
              <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                {p.date} · {p.id}
              </p>
            </div>
            <button className="shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold text-primary border border-primary/30 rounded-full px-2.5 py-1 hover:bg-primary hover:text-primary-foreground transition">
              <RotateCcw className="size-3" />
              재예약
            </button>
          </article>
        )
      })}
    </section>
  )
}
