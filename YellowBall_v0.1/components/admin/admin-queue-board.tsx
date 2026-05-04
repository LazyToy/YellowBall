import { Clock, ChevronRight } from "lucide-react"

type Job = {
  id: string
  customer: string
  racket: string
  string: string
  due: string
  priority?: "rush"
}

const columns: { id: string; title: string; tone: string; jobs: Job[] }[] = [
  {
    id: "received",
    title: "접수",
    tone: "bg-secondary text-secondary-foreground",
    jobs: [
      {
        id: "RH-2645",
        customer: "김지훈",
        racket: "Wilson Blade 98 v9",
        string: "Polytour Pro 1.25 / 51LB",
        due: "오늘 17:00",
      },
      {
        id: "RH-2646",
        customer: "박서연",
        racket: "Babolat Pure Drive",
        string: "Hyper-G Soft / 52LB",
        due: "오늘 19:00",
        priority: "rush",
      },
    ],
  },
  {
    id: "working",
    title: "작업 중",
    tone: "bg-primary text-primary-foreground",
    jobs: [
      {
        id: "RH-2640",
        customer: "정민수",
        racket: "Wilson Pro Staff RF97",
        string: "ALU Power 1.25 / 50LB",
        due: "오늘 18:30",
      },
      {
        id: "RH-2643",
        customer: "이도윤",
        racket: "Yonex VCORE 100",
        string: "Polytour Strike / 50LB",
        due: "내일 12:00",
      },
    ],
  },
  {
    id: "ready",
    title: "픽업 대기",
    tone: "bg-accent text-accent-foreground",
    jobs: [
      {
        id: "RH-2632",
        customer: "최예린",
        racket: "Head Speed MP",
        string: "Lynx Tour / 53LB",
        due: "픽업 가능",
      },
      {
        id: "RH-2635",
        customer: "한우진",
        racket: "Wilson Clash 100 v3",
        string: "NXT 16 / 55LB",
        due: "픽업 가능",
      },
    ],
  },
]

export function AdminQueueBoard() {
  return (
    <section className="rounded-2xl border border-border bg-card">
      <header className="px-5 py-4 flex items-center justify-between border-b border-border">
        <div>
          <h2 className="font-display font-bold text-base text-foreground">스트링 작업 큐</h2>
          <p className="text-xs text-muted-foreground mt-0.5">실시간 작업 상태 관리</p>
        </div>
        <button className="text-xs font-semibold text-primary inline-flex items-center gap-0.5">
          전체 보기 <ChevronRight className="size-3.5" />
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
        {columns.map((col) => (
          <div key={col.id} className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${col.tone}`}>
                  {col.title}
                </span>
                <span className="text-[11px] text-muted-foreground">{col.jobs.length}</span>
              </div>
            </div>
            {col.jobs.map((j) => (
              <article
                key={j.id}
                className="rounded-xl bg-secondary/60 hover:bg-secondary transition border border-border p-3 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-mono text-muted-foreground">{j.id}</p>
                  {j.priority === "rush" && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-destructive text-destructive-foreground">
                      급행
                    </span>
                  )}
                </div>
                <p className="text-sm font-semibold text-foreground mt-1">{j.customer}</p>
                <p className="text-xs text-foreground mt-0.5">{j.racket}</p>
                <p className="text-[11px] text-muted-foreground">{j.string}</p>
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-2 pt-2 border-t border-border">
                  <Clock className="size-3" />
                  {j.due}
                </div>
              </article>
            ))}
          </div>
        ))}
      </div>
    </section>
  )
}
