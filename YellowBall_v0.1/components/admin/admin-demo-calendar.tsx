import { Sparkles } from "lucide-react"

const slots = [
  { time: "10:00", customer: "김지훈", racket: "Wilson Pro Staff", status: "예정" as const },
  { time: "11:30", customer: "박서연", racket: "Babolat Pure Aero", status: "예정" as const },
  { time: "14:00", customer: "이도윤", racket: "Yonex VCORE 100", status: "체크인" as const },
  { time: "15:30", customer: "—", racket: "비어있음", status: "공실" as const },
  { time: "17:00", customer: "한우진", racket: "Head Speed MP", status: "예정" as const },
]

export function AdminDemoCalendar() {
  return (
    <section className="rounded-2xl border border-border bg-card">
      <header className="px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" />
          <h2 className="font-display font-bold text-base text-foreground">오늘 시타 일정</h2>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">4월 29일 · 5건</p>
      </header>
      <ul className="divide-y divide-border">
        {slots.map((s, i) => (
          <li key={i} className="px-5 py-3 flex items-center gap-3">
            <p className="font-mono text-sm font-bold text-foreground w-12">{s.time}</p>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{s.customer}</p>
              <p className="text-[11px] text-muted-foreground truncate">{s.racket}</p>
            </div>
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                s.status === "체크인"
                  ? "bg-primary text-primary-foreground"
                  : s.status === "공실"
                  ? "bg-secondary text-muted-foreground"
                  : "bg-accent text-accent-foreground"
              }`}
            >
              {s.status}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
