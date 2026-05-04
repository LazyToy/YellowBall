import { Wrench, Sparkles, MapPin, Clock, ChevronRight, AlertCircle } from "lucide-react"

type Status = "예약 대기" | "접수" | "작업중" | "완료" | "예정"

const bookings = [
  {
    id: "RH-2742",
    type: "string" as const,
    title: "스트링 작업",
    racket: "Wilson Pro Staff RF97",
    string: "Luxilon ALU Power 1.25 / 52LB",
    pickup: "11/8(금) 14:30 방문 신청",
    location: "서울 성수점",
    status: "예약 대기" as Status,
    progress: -1,
  },
  {
    id: "RH-2640",
    type: "string" as const,
    title: "스트링 작업",
    racket: "Wilson Pro Staff RF97",
    string: "Luxilon ALU Power 1.25 / 50LB",
    pickup: "오늘 18:30 픽업",
    location: "서울 성수점",
    status: "작업중" as Status,
    progress: 2,
  },
  {
    id: "RH-2641",
    type: "demo" as const,
    title: "라켓 시타",
    racket: "Babolat Pure Aero 2024",
    string: "Solinco Hyper-G Soft / 52LB",
    pickup: "내일 10:00 - 11:30",
    location: "서울 성수점",
    status: "예정" as Status,
    progress: 0,
  },
]

const steps = ["접수", "분해", "작업", "완료"] as const

function statusStyle(status: Status) {
  switch (status) {
    case "예약 대기":
      return "bg-accent text-accent-foreground"
    case "작업중":
      return "bg-primary text-primary-foreground"
    default:
      return "bg-secondary text-secondary-foreground"
  }
}

export function UpcomingBookings() {
  return (
    <section className="px-5 pt-4 space-y-3">
      {bookings.map((b) => {
        const Icon = b.type === "string" ? Wrench : Sparkles
        const isPending = b.status === "예약 대기"
        return (
          <article
            key={b.id}
            className={`rounded-2xl border bg-card p-4 hover:shadow-md hover:shadow-primary/5 transition ${
              isPending ? "border-accent/50" : "border-border hover:border-primary/40"
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`size-10 rounded-xl grid place-items-center shrink-0 ${
                  b.type === "string"
                    ? "bg-primary text-primary-foreground"
                    : "bg-accent text-accent-foreground"
                }`}
              >
                <Icon className="size-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-foreground">{b.title}</p>
                  <span
                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${statusStyle(
                      b.status,
                    )}`}
                  >
                    {b.status}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{b.id}</p>
              </div>
              <ChevronRight className="size-5 text-muted-foreground" />
            </div>

            <div className="mt-4 space-y-2 rounded-xl bg-secondary/60 p-3">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">라켓</span>
                <span className="font-medium text-foreground">{b.racket}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">{b.type === "string" ? "스트링" : "옵션"}</span>
                <span className="font-medium text-foreground text-right">{b.string}</span>
              </div>
              <div className="flex justify-between text-xs items-center pt-1 border-t border-border">
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                  <Clock className="size-3" />
                  {b.pickup}
                </span>
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                  <MapPin className="size-3" />
                  {b.location}
                </span>
              </div>
            </div>

            {isPending && (
              <div className="mt-3 flex items-center gap-2 rounded-xl bg-accent/15 border border-accent/30 px-3 py-2">
                <AlertCircle className="size-4 text-accent-foreground/80 shrink-0" />
                <p className="text-[11px] text-foreground">
                  관리자 확인 중 · 통상 30분 이내 응답
                </p>
              </div>
            )}

            {b.type === "string" && b.progress >= 0 && (
              <div className="mt-3">
                <div className="flex items-center gap-1.5">
                  {steps.map((s, i) => {
                    const filled = i <= b.progress
                    return (
                      <div key={s} className="flex-1 flex flex-col items-center gap-1">
                        <div
                          className={`h-1.5 w-full rounded-full ${
                            filled ? "bg-primary" : "bg-secondary"
                          }`}
                        />
                        <span
                          className={`text-[10px] ${
                            filled ? "text-primary font-semibold" : "text-muted-foreground"
                          }`}
                        >
                          {s}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </article>
        )
      })}
    </section>
  )
}
