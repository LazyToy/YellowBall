import { ChevronRight } from "lucide-react"

const steps = [
  { label: "접수", done: true },
  { label: "승인", done: true },
  { label: "수령", done: true },
  { label: "작업중", done: true, current: true },
  { label: "완료", done: false },
]

export function BookingStatus() {
  return (
    <section className="px-5 py-3">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-[15px] font-bold">진행 중인 예약</h2>
        <button className="text-[12px] text-muted-foreground flex items-center gap-0.5 hover:text-foreground">
          전체 보기 <ChevronRight className="size-3.5" />
        </button>
      </div>

      <article className="rounded-2xl bg-card border border-border p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-accent text-accent-foreground">
                작업 중
              </span>
              <span className="text-[11px] text-muted-foreground truncate">예약 #2841</span>
            </div>
            <h3 className="mt-1.5 text-[15px] font-semibold truncate">
              Wilson Blade 98 v9
            </h3>
            <p className="text-[12px] text-muted-foreground mt-0.5 truncate">
              Solinco Hyper-G · 메인 48 / 크로스 46 lbs
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[11px] text-muted-foreground">픽업 예정</p>
            <p className="text-[13px] font-semibold mt-0.5 whitespace-nowrap">오늘 18:00</p>
          </div>
        </div>

        {/* Progress */}
        <div className="mt-4">
          <div className="relative">
            <div className="absolute top-2.5 left-2 right-2 h-0.5 bg-border" />
            <div
              className="absolute top-2.5 left-2 h-0.5 bg-primary"
              style={{ width: "calc(75% - 16px)" }}
            />
            <ol className="relative flex justify-between">
              {steps.map((s) => (
                <li key={s.label} className="flex flex-col items-center gap-1.5 z-10">
                  <span
                    className={`size-5 rounded-full grid place-items-center border-2 transition-colors ${
                      s.current
                        ? "bg-accent border-primary"
                        : s.done
                          ? "bg-primary border-primary"
                          : "bg-background border-border"
                    }`}
                  >
                    {s.current && (
                      <span className="size-1.5 rounded-full bg-primary animate-pulse" />
                    )}
                  </span>
                  <span
                    className={`text-[10px] ${
                      s.current
                        ? "font-semibold text-foreground"
                        : s.done
                          ? "text-foreground"
                          : "text-muted-foreground"
                    }`}
                  >
                    {s.label}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button className="h-10 rounded-xl text-[13px] font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors">
            상세 보기
          </button>
          <button className="h-10 rounded-xl text-[13px] font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
            매장 위치 안내
          </button>
        </div>
      </article>
    </section>
  )
}
