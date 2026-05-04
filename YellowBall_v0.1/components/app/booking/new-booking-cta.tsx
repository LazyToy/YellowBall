import Link from "next/link"
import { Wrench, Sparkles, ChevronRight } from "lucide-react"

const items = [
  {
    title: "스트링 작업 예약",
    desc: "내 라켓에 맞는 스트링·텐션 선택",
    icon: Wrench,
    badge: "평균 24시간",
    tone: "primary" as const,
    href: "/booking/string/new",
  },
  {
    title: "라켓 시타 예약",
    desc: "샵에서 신상 라켓 직접 사용해보기",
    icon: Sparkles,
    badge: "1회 무료",
    tone: "accent" as const,
    href: "#",
  },
]

export function NewBookingCTA() {
  return (
    <section className="px-5 pt-4">
      <h2 className="font-display font-bold text-base mb-3">새 예약 만들기</h2>
      <div className="grid grid-cols-1 gap-3">
        {items.map((it) => {
          const Icon = it.icon
          const tone =
            it.tone === "primary"
              ? "bg-primary text-primary-foreground"
              : "bg-accent text-accent-foreground"
          return (
            <Link
              key={it.title}
              href={it.href}
              className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-4 text-left hover:border-primary/40 hover:shadow-md hover:shadow-primary/5 transition"
            >
              <div className={`size-12 rounded-xl grid place-items-center shrink-0 ${tone}`}>
                <Icon className="size-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-foreground">{it.title}</p>
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-secondary text-secondary-foreground">
                    {it.badge}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{it.desc}</p>
              </div>
              <ChevronRight className="size-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition" />
            </Link>
          )
        })}
      </div>
    </section>
  )
}
