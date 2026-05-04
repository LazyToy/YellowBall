import { Bell, MapPin } from "lucide-react"

export function TopBar() {
  return (
    <header className="px-5 pt-4 pb-3 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 min-w-0">
        <div className="size-9 shrink-0 rounded-full bg-primary text-primary-foreground grid place-items-center font-display font-bold">
          R
        </div>
        <div className="leading-tight min-w-0">
          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
            <MapPin className="size-3 shrink-0" />
            <span className="truncate">서울 성수점</span>
          </p>
          <p className="text-sm font-semibold truncate">RallyHub</p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          aria-label="알림"
          className="relative size-10 grid place-items-center rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
        >
          <Bell className="size-5" />
          <span className="absolute top-2 right-2 size-2 rounded-full bg-destructive ring-2 ring-background" />
        </button>
        <div className="size-10 rounded-full bg-accent/40 ring-1 ring-border grid place-items-center text-sm font-semibold text-accent-foreground">
          민
        </div>
      </div>
    </header>
  )
}
