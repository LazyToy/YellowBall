"use client"

export type BookingTab = "upcoming" | "past"

export function BookingTabs({
  value,
  onChange,
}: {
  value: BookingTab
  onChange: (v: BookingTab) => void
}) {
  const tabs: { id: BookingTab; label: string; count: number }[] = [
    { id: "upcoming", label: "진행 중", count: 2 },
    { id: "past", label: "지난 예약", count: 14 },
  ]

  return (
    <div className="px-5 pt-6">
      <div className="inline-flex gap-1 rounded-full bg-secondary p-1 max-w-full">
        {tabs.map((t) => {
          const active = value === t.id
          return (
            <button
              key={t.id}
              onClick={() => onChange(t.id)}
              className={`flex items-center gap-1.5 px-3 @sm:px-4 py-1.5 rounded-full text-sm font-medium transition whitespace-nowrap ${
                active
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span>{t.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  active ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground"
                }`}
              >
                {t.count}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
