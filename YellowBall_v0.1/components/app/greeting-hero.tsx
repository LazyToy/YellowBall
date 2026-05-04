import { ArrowRight, Clock3 } from "lucide-react"

export function GreetingHero() {
  return (
    <section className="px-5 pt-2 pb-5">
      <p className="text-[13px] text-muted-foreground">안녕하세요, 민준님 👋</p>
      <h1 className="font-display text-2xl font-bold leading-snug text-balance mt-1">
        오늘은 어떤 라켓으로
        <br />
        <span className="text-primary">완벽한 한 게임</span> 할까요?
      </h1>

      <div className="mt-4 rounded-2xl bg-primary text-primary-foreground p-4 flex items-center justify-between gap-3 overflow-hidden relative">
        <div className="absolute -right-6 -bottom-8 size-32 rounded-full bg-accent/20 blur-2xl pointer-events-none" />
        <div className="relative min-w-0 flex-1">
          <div className="flex items-center gap-2 text-[11px] text-primary-foreground/70">
            <Clock3 className="size-3.5 shrink-0" />
            <span className="truncate">마지막 작업 · 32일 전</span>
          </div>
          <p className="mt-1 text-[15px] font-semibold leading-snug text-pretty">
            스트링 교체 시기예요.
            <br />
            지난 조합으로 다시 예약할까요?
          </p>
          <p className="mt-1 text-[12px] text-primary-foreground/60 truncate">
            Solinco Hyper-G · 48 / 46 lbs
          </p>
        </div>
        <button className="relative shrink-0 size-11 rounded-full bg-accent text-accent-foreground grid place-items-center hover:scale-105 transition-transform">
          <ArrowRight className="size-5" />
          <span className="sr-only">다시 예약하기</span>
        </button>
      </div>
    </section>
  )
}
