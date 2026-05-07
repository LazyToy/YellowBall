import { Clock, Phone } from "lucide-react"

export function ShopHours() {
  return (
    <section className="px-5 pb-4">
      <div className="rounded-2xl bg-secondary p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Clock className="size-3.5 shrink-0" />
              영업 정보
            </div>
            <p className="mt-1 text-[14px] font-semibold leading-snug">
              오늘 영업 중 ·{" "}
              <span className="text-primary">11:00 – 21:00</span>
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              스트링 작업 마감 20:00 · 일요일 정기 휴무
            </p>
          </div>
          <button
            aria-label="매장 전화"
            className="size-11 rounded-full bg-card border border-border grid place-items-center hover:bg-card/80"
          >
            <Phone className="size-4" />
          </button>
        </div>
      </div>
    </section>
  )
}
