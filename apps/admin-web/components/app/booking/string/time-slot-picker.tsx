"use client"

import { Clock } from "lucide-react"
import { toKstDateKey } from "@/lib/kst-time"
import {
  buildBusinessHourTimeSlots,
  getShopScheduleForDate,
  type ShopScheduleViewRow,
} from "@/lib/super-admin-data"

type Props = {
  date: string
  scheduleRows: ShopScheduleViewRow[]
  selected: string | null
  onSelect: (slot: string) => void
}

function getBookedSlots(date: string) {
  const day = parseInt(date.slice(-2), 10)
  if (day % 3 === 0) return ["13:00", "14:00", "16:00", "18:00"]
  if (day % 3 === 1) return ["11:00", "15:00", "17:00"]
  return ["10:00", "13:00", "16:00", "19:00"]
}

function formatLabel(iso: string) {
  const date = new Date(iso)
  const days = ["일", "월", "화", "수", "목", "금", "토"]

  return `${date.getMonth() + 1}월 ${date.getDate()}일(${days[date.getDay()]})`
}

export function TimeSlotPicker({ date, scheduleRows, selected, onSelect }: Props) {
  const schedule = getShopScheduleForDate(date, scheduleRows)
  const slots = buildBusinessHourTimeSlots(schedule)
  const booked = getBookedSlots(date)
  const now = new Date()
  const currentTime = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    timeZone: "Asia/Seoul",
  }).format(now)
  const isToday = date === toKstDateKey(now)
  const visibleSlots = slots.filter((slot) => !isToday || slot > currentTime)
  const available = visibleSlots.filter((slot) => !booked.includes(slot))
  const hoursLabel = schedule?.is_closed
    ? "휴무"
    : schedule
      ? `영업 ${schedule.open_time} - ${schedule.close_time}`
      : "영업시간 없음"

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="font-display text-base font-bold">{formatLabel(date)}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            예약 가능 {available.length}개 / 마감 {booked.length}개
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-secondary px-2 py-1 text-[10px] font-semibold text-secondary-foreground">
          <Clock className="size-3" />
          {hoursLabel}
        </span>
      </div>

      {visibleSlots.length > 0 ? (
        <div className="grid grid-cols-4 gap-2">
          {visibleSlots.map((slot) => {
            const isBooked = booked.includes(slot)
            const isSelected = selected === slot

            return (
              <button
                key={slot}
                type="button"
                disabled={isBooked}
                onClick={() => onSelect(slot)}
                className={[
                  "rounded-xl border py-2.5 text-sm font-semibold transition",
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : isBooked
                      ? "cursor-not-allowed border-transparent bg-secondary/40 text-muted-foreground/50 line-through"
                      : "border-border bg-background text-foreground hover:border-primary/50 hover:bg-secondary",
                ].join(" ")}
              >
                {slot}
              </button>
            )
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-secondary/40 px-3 py-5 text-center text-xs text-muted-foreground">
          선택 가능한 시간이 없습니다.
        </div>
      )}
    </div>
  )
}
