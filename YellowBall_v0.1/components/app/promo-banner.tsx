import Image from "next/image"
import { ArrowRight } from "lucide-react"

export function PromoBanner() {
  return (
    <section className="px-5 py-3">
      <article className="relative overflow-hidden rounded-2xl bg-primary text-primary-foreground">
        <div className="absolute inset-0">
          <Image
            src="/court-hero.jpg"
            alt=""
            fill
            className="object-cover opacity-30"
            sizes="(max-width: 480px) 100vw, 480px"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/80 to-primary/40" />
        </div>
        <div className="relative p-5 flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <span className="inline-flex items-center text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-accent text-accent-foreground">
              EVENT
            </span>
            <h3 className="mt-2 font-display text-[18px] font-bold leading-snug text-pretty">
              피클볼 패들
              <br />
              최대 30% 할인
            </h3>
            <p className="text-[11px] text-primary-foreground/70 mt-1 truncate">
              5월 12일까지 · 신규 입고 라인업
            </p>
          </div>
          <button
            aria-label="이벤트 보기"
            className="shrink-0 size-11 rounded-full bg-accent text-accent-foreground grid place-items-center hover:scale-105 transition-transform"
          >
            <ArrowRight className="size-5" />
          </button>
        </div>
      </article>
    </section>
  )
}
