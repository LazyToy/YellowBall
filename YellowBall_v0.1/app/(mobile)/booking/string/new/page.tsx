"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { ArrowLeft, ChevronDown, Info } from "lucide-react"
import { BookingCalendar } from "@/components/app/booking/string/booking-calendar"
import { TimeSlotPicker } from "@/components/app/booking/string/time-slot-picker"
import { RacketSelector } from "@/components/app/booking/string/racket-selector"
import { StringPicker } from "@/components/app/booking/string/string-picker"

const STRING_PRICES: Record<string, number> = {
  s1: 35000,
  s2: 32000,
  s3: 33000,
  s4: 28000,
  s5: 0,
}
const LABOR_FEE = 15000

export default function NewStringBookingPage() {
  const router = useRouter()
  const [date, setDate] = useState<string | null>(null)
  const [slot, setSlot] = useState<string | null>(null)
  const [racketId, setRacketId] = useState<string | null>("r1")
  const [stringId, setStringId] = useState<string | null>("s1")
  const [tensionMain, setTensionMain] = useState<number>(52)
  const [tensionCross, setTensionCross] = useState<number>(52)
  const [memo, setMemo] = useState<string>("")

  const stringPrice = stringId ? STRING_PRICES[stringId] ?? 0 : 0
  const total = stringPrice + LABOR_FEE
  const canSubmit = date && slot && racketId && stringId

  const handleSubmit = () => {
    if (!canSubmit) return
    const params = new URLSearchParams({
      date: date!,
      slot: slot!,
      total: total.toString(),
    })
    router.push(`/booking/string/success?${params.toString()}`)
  }

  return (
    <div className="flex-1 flex flex-col">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="flex items-center gap-3 px-5 py-4">
          <Link
            href="/booking"
            aria-label="뒤로"
            className="size-9 -ml-2 grid place-items-center rounded-lg hover:bg-secondary"
          >
            <ArrowLeft className="size-5" />
          </Link>
          <div className="flex-1">
            <p className="font-display font-bold text-base text-foreground">스트링 작업 예약</p>
            <p className="text-[11px] text-muted-foreground">
              방문 일시와 옵션을 선택해주세요
            </p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto pb-32">
        <div className="px-5 pt-4 space-y-4">
          {/* Step 1 - Date */}
          <section>
            <div className="flex items-center gap-2 mb-2">
              <span className="size-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold grid place-items-center">
                1
              </span>
              <p className="text-xs font-semibold text-foreground">방문 날짜</p>
            </div>
            <BookingCalendar selected={date} onSelect={(d) => { setDate(d); setSlot(null) }} />
          </section>

          {/* Step 2 - Time slot */}
          <section>
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`size-5 rounded-full text-[10px] font-bold grid place-items-center ${
                  date ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                }`}
              >
                2
              </span>
              <p
                className={`text-xs font-semibold ${
                  date ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                방문 시간
              </p>
            </div>
            {date ? (
              <TimeSlotPicker date={date} selected={slot} onSelect={setSlot} />
            ) : (
              <div className="rounded-2xl border border-dashed border-border bg-card/40 p-6 text-center">
                <ChevronDown className="size-5 text-muted-foreground mx-auto mb-1.5" />
                <p className="text-xs text-muted-foreground">날짜를 먼저 선택해주세요</p>
              </div>
            )}
          </section>

          {/* Step 3 - Racket */}
          <section>
            <div className="flex items-center gap-2 mb-2">
              <span className="size-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold grid place-items-center">
                3
              </span>
              <p className="text-xs font-semibold text-foreground">라켓</p>
            </div>
            <RacketSelector selectedId={racketId} onSelect={setRacketId} />
          </section>

          {/* Step 4 - String + Tension */}
          <section>
            <div className="flex items-center gap-2 mb-2">
              <span className="size-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold grid place-items-center">
                4
              </span>
              <p className="text-xs font-semibold text-foreground">스트링 / 텐션</p>
            </div>
            <StringPicker
              stringId={stringId}
              tensionMain={tensionMain}
              tensionCross={tensionCross}
              onSelectString={setStringId}
              onTensionMainChange={setTensionMain}
              onTensionCrossChange={setTensionCross}
            />
          </section>

          {/* Memo */}
          <section>
            <div className="flex items-center gap-2 mb-2">
              <span className="size-5 rounded-full bg-secondary text-muted-foreground text-[10px] font-bold grid place-items-center">
                5
              </span>
              <p className="text-xs font-semibold text-muted-foreground">요청사항 (선택)</p>
            </div>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              rows={3}
              placeholder="예) 그로멧 교체 필요, 손잡이 교체 추가 등"
              className="w-full rounded-2xl border border-border bg-card p-4 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/50 resize-none"
            />
          </section>

          {/* Approval notice */}
          <section className="rounded-2xl bg-accent/15 border border-accent/30 p-4">
            <div className="flex gap-3">
              <Info className="size-5 text-accent-foreground/80 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-xs font-semibold text-foreground">관리자 확인 후 확정</p>
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  예약 신청 시 <b className="text-foreground">예약 대기</b> 상태로 접수되며,
                  매장 관리자 확인 후 알림으로 확정 여부를 안내드립니다. 통상 영업시간 기준
                  30분 이내 응답.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Sticky bottom CTA */}
      <div className="sticky bottom-0 left-0 right-0 z-10 bg-background/95 backdrop-blur border-t border-border">
        <div className="px-5 py-3 flex items-center gap-3">
          <div className="flex-1">
            <p className="text-[10px] text-muted-foreground">예상 결제금액</p>
            <p className="font-display font-bold text-lg text-foreground tabular-nums">
              {total.toLocaleString()}
              <span className="text-xs text-muted-foreground font-normal">원</span>
            </p>
          </div>
          <button
            type="button"
            disabled={!canSubmit}
            onClick={handleSubmit}
            className="flex-1 h-12 rounded-full bg-primary text-primary-foreground font-display font-bold text-sm hover:bg-primary/90 transition disabled:bg-secondary disabled:text-muted-foreground"
          >
            예약 신청
          </button>
        </div>
      </div>
    </div>
  )
}
