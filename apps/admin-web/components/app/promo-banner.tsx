"use client"

import Image from "next/image"
import { ArrowRight } from "lucide-react"
import { useAppMenuSettings } from "@/components/app/app-menu-context"

export function PromoBanner() {
  const settings = useAppMenuSettings()

  if (!settings.shop) {
    return null
  }

  return (
    <section className="px-5 py-3">
      <article className="relative overflow-hidden rounded-2xl bg-[#2b2b2b] text-white">
        {/* YellowBall 로고를 오른쪽 배경 데코레이션으로 사용 */}
        <div className="absolute -right-4 -bottom-4 size-40 opacity-20 pointer-events-none">
          <Image
            src="/logo.png"
            alt=""
            fill
            className="object-contain"
            sizes="160px"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#2b2b2b] via-[#2b2b2b]/90 to-transparent" />
        <div className="relative p-5 flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <span className="inline-flex items-center text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-yellow-400 text-[#2b2b2b]">
              EVENT
            </span>
            <h3 className="mt-2 font-display text-[18px] font-bold leading-snug text-pretty">
              피클볼 패들
              <br />
              최대 30% 할인
            </h3>
            <p className="text-[11px] text-white/60 mt-1 truncate">
              5월 12일까지 · 신규 입고 라인업
            </p>
          </div>
          <button
            aria-label="이벤트 보기"
            className="shrink-0 size-11 rounded-full bg-yellow-400 text-[#2b2b2b] grid place-items-center hover:scale-105 transition-transform"
          >
            <ArrowRight className="size-5" />
          </button>
        </div>
      </article>
    </section>
  )
}
