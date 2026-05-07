import { ChevronRight, Crown } from "lucide-react"

export function MeProfile({ storeName }: { storeName?: string }) {
  const displayStoreName = storeName || 'YellowBall'

  return (
    <section className="px-5 pt-4">
      <div className="rounded-2xl bg-primary text-primary-foreground p-5 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 size-40 rounded-full bg-accent/15" />
        <div className="absolute right-8 bottom-2 size-20 rounded-full bg-accent/10" />

        <div className="relative flex items-center gap-3">
          <div className="size-14 rounded-full bg-accent text-accent-foreground grid place-items-center font-display font-bold text-xl ring-2 ring-primary-foreground/20">
            JM
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="font-display font-bold text-lg truncate">정민수</p>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-accent text-accent-foreground shrink-0">
                <Crown className="size-3" />
                VIP
              </span>
            </div>
            <p className="text-xs text-primary-foreground/80 mt-0.5 truncate">jungmin@rally.kr</p>
            {/* DB에서 로드한 매장명으로 표시 */}
            <p className="text-[11px] text-primary-foreground/60 mt-1 truncate">{displayStoreName} · 가입 2024.06</p>

          </div>
          <button
            className="size-8 rounded-full grid place-items-center bg-primary-foreground/10 hover:bg-primary-foreground/20"
            aria-label="프로필 수정"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>

        <div className="relative mt-5 grid grid-cols-3 gap-2 rounded-xl bg-primary-foreground/10 p-3">
          <div className="text-center">
            <p className="text-[10px] text-primary-foreground/70">포인트</p>
            <p className="font-display font-bold text-base mt-0.5">12,400</p>
          </div>
          <div className="text-center border-x border-primary-foreground/15">
            <p className="text-[10px] text-primary-foreground/70">쿠폰</p>
            <p className="font-display font-bold text-base mt-0.5">3장</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-primary-foreground/70">스탬프</p>
            <p className="font-display font-bold text-base mt-0.5">7 / 10</p>
          </div>
        </div>
      </div>
    </section>
  )
}
