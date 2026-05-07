import Image from "next/image"
import { Bell, MapPin } from "lucide-react"

export function TopBar() {
  return (
    <header className="px-5 pt-4 pb-3 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 min-w-0">
        {/* YellowBall 로고 이미지 */}
        <div className="size-9 shrink-0 rounded-full overflow-hidden bg-[#2b2b2b] ring-1 ring-yellow-400/30">
          <Image
            src="/logo.png"
            alt="YellowBall 로고"
            width={36}
            height={36}
            className="object-contain p-0.5"
          />
        </div>
        <div className="leading-tight min-w-0">
          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
            <MapPin className="size-3 shrink-0" />
            <span className="truncate">원주 옐로볼</span>
          </p>
          <p className="text-sm font-semibold truncate">Yellow Ball</p>
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
        <div className="size-10 rounded-full bg-yellow-400/20 ring-1 ring-yellow-400/40 grid place-items-center text-sm font-semibold text-yellow-700 dark:text-yellow-400">
          민
        </div>
      </div>
    </header>
  )
}
