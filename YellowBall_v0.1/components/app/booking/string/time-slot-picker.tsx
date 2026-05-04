"use client"

import { Clock } from "lucide-react"

type Props = {
  date: string
  selected: string | null
  onSelect: (slot: string) => void
}

// Mocked available slots — in real app fetched per date
const ALL_SLOTS = [
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
  "18:30",
  "19:00",
  "19:30",
]

// Pseudo "booked" slots — vary slightly by date for realism
function getBookedSlots(date: string) {
  const day = parseInt(date.slice(-2), 10)
  if (day % 3 === 0) return ["13:00", "14:30", "16:00", "18:30"]
  if (day % 3 === 1) return ["11:30", "15:00", "17:00"]
  return ["10:30", "13:30", "16:30", "19:30"]
}

function formatLabel(iso: string) {
  const d = new Date(iso)
  const days = ["일", "월", "화", "수", "목", "금", "토"]
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${days[d.getDay()]})`
}

export function TimeSlotPicker({ date, selected, onSelect }: Props) {
  const booked = getBookedSlots(date)
  const available = ALL_SLOTS.filter((s) => !booked.includes(s))

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="font-display font-bold text-base">{formatLabel(date)}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            예약 가능 {available.length}개 / 마감 {booked.length}개
          </p>
        </div>
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-md bg-secondary text-secondary-foreground">
          <Clock className="size-3" />
          영업 10:30 - 20:00
        </span>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {ALL_SLOTS.map((slot) => {
          const isBooked = booked.includes(slot)
          const isSelected = selected === slot
          return (
            <button
              key={slot}
              type="button"
              disabled={isBooked}
              onClick={() => onSelect(slot)}
              className={[
                "rounded-xl py-2.5 text-sm font-semibold transition border",
                isSelected
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : isBooked
                    ? "bg-secondary/40 text-muted-foreground/50 border-transparent line-through cursor-not-allowed"
                    : "bg-background text-foreground border-border hover:border-primary/50 hover:bg-secondary",
              ].join(" ")}
            >
              {slot}
            </button>
          )
        })}
      </div>
    </div>
  )
}
