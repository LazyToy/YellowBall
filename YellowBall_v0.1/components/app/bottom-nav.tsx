"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, CalendarCheck, Plus, ShoppingBag, User } from "lucide-react"

const tabs = [
  { id: "home", label: "홈", icon: Home, href: "/" },
  { id: "bookings", label: "예약", icon: CalendarCheck, href: "/booking" },
  { id: "new", label: "", icon: Plus, primary: true, href: "/booking?new=1" },
  { id: "shop", label: "샵", icon: ShoppingBag, href: "/shop" },
  { id: "me", label: "마이", icon: User, href: "/me" },
] as const

export function BottomNav() {
  const pathname = usePathname()

  const isActive = (href: string) => {
    const base = href.split("?")[0]
    if (base === "/") return pathname === "/"
    return pathname?.startsWith(base) ?? false
  }

  return (
    <nav className="shrink-0 bg-card/95 backdrop-blur border-t border-border pb-[env(safe-area-inset-bottom)]">
      <ul className="grid grid-cols-5 items-center px-2 @sm:px-3 pt-2 pb-3">
        {tabs.map((t) => {
          const Icon = t.icon
          if ("primary" in t && t.primary) {
            return (
              <li key={t.id} className="flex justify-center">
                <Link
                  href={t.href}
                  aria-label="새 예약"
                  className="-mt-7 size-14 rounded-full bg-primary text-primary-foreground grid place-items-center shadow-lg shadow-primary/30 hover:scale-105 transition-transform ring-4 ring-background"
                >
                  <Icon className="size-6" />
                </Link>
              </li>
            )
          }
          const active = isActive(t.href)
          return (
            <li key={t.id} className="flex justify-center">
              <Link
                href={t.href}
                className="flex flex-col items-center gap-0.5 px-2 py-1"
              >
                <Icon className={`size-5 ${active ? "text-primary" : "text-muted-foreground"}`} />
                <span
                  className={`text-[10px] font-medium ${
                    active ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {t.label}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
