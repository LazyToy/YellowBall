"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { useMemo, useState } from "react"

type Props = {
  selected: string | null
  onSelect: (iso: string) => void
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"]

function pad(n: number) {
  return n.toString().padStart(2, "0")
}
function toIso(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// Mock availability:
// - past dates: closed
// - Sundays: closed (정기 휴무)
// - some randomized busy dates: full
function availability(date: Date) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (date < today) return "past" as const
  if (date.getDay() === 0) return "closed" as const
  // pseudo-busy days
  const busy = [3, 11, 19, 27]
  if (busy.includes(date.getDate())) return "full" as const
  // limited slots
  const limited = [5, 12, 22]
  if (limited.includes(date.getDate())) return "limited" as const
  return "open" as const
}

export function BookingCalendar({ selected, onSelect }: Props) {
  const today = new Date()
  const [view, setView] = useState({ y: today.getFullYear(), m: today.getMonth() })

  const cells = useMemo(() => {
    const first = new Date(view.y, view.m, 1)
    const startWeekday = first.getDay()
    const daysInMonth = new Date(view.y, view.m + 1, 0).getDate()
    const arr: Array<{ date: Date | null; iso: string | null }> = []
    for (let i = 0; i < startWeekday; i++) arr.push({ date: null, iso: null })
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(view.y, view.m, d)
      arr.push({ date, iso: toIso(date) })
    }
    while (arr.length % 7 !== 0) arr.push({ date: null, iso: null })
    return arr
  }, [view])

  const todayIso = toIso(today)

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          aria-label="이전 달"
          onClick={() => setView((v) => ({ y: v.m === 0 ? v.y - 1 : v.y, m: (v.m + 11) % 12 }))}
          className="size-8 grid place-items-center rounded-lg hover:bg-secondary"
        >
          <ChevronLeft className="size-4" />
        </button>
        <p className="font-display font-bold text-base">
          {view.y}년 {view.m + 1}월
        </p>
        <button
          type="button"
          aria-label="다음 달"
          onClick={() => setView((v) => ({ y: v.m === 11 ? v.y + 1 : v.y, m: (v.m + 1) % 12 }))}
          className="size-8 grid place-items-center rounded-lg hover:bg-secondary"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 mb-1.5">
        {WEEKDAYS.map((w, i) => (
          <div
            key={w}
            className={`text-center text-[10px] font-semibold ${
              i === 0 ? "text-destructive" : i === 6 ? "text-primary" : "text-muted-foreground"
            }`}
          >
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((c, i) => {
          if (!c.date || !c.iso) return <div key={`e${i}`} className="aspect-square" />
          const status = availability(c.date)
          const isSelected = selected === c.iso
          const isToday = c.iso === todayIso
          const disabled = status === "past" || status === "closed" || status === "full"

          const dotColor =
            status === "open"
              ? "bg-primary"
              : status === "limited"
                ? "bg-accent"
                : status === "full"
                  ? "bg-destructive/60"
                  : "bg-transparent"

          return (
            <button
              key={c.iso}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(c.iso!)}
              className={[
                "relative aspect-square rounded-xl text-sm font-medium transition flex flex-col items-center justify-center gap-0.5",
                isSelected
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : disabled
                    ? "text-muted-foreground/40 cursor-not-allowed"
                    : "text-foreground hover:bg-secondary",
                isToday && !isSelected ? "ring-1 ring-primary/40" : "",
              ].join(" ")}
            >
              <span>{c.date.getDate()}</span>
              <span
                className={`size-1 rounded-full ${
                  isSelected ? "bg-primary-foreground/80" : dotColor
                }`}
              />
            </button>
          )
        })}
      </div>

      <div className="mt-4 flex items-center justify-between text-[10px] text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <span className="size-1.5 rounded-full bg-primary" /> 예약 가능
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="size-1.5 rounded-full bg-accent" /> 일부 가능
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="size-1.5 rounded-full bg-destructive/60" /> 마감
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="size-1.5 rounded-full bg-muted-foreground/30" /> 휴무
        </span>
      </div>
    </div>
  )
}
