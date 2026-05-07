"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, CalendarCheck, Plus, ShoppingBag, User } from "lucide-react"
import { useAppMenuSettings } from "@/components/app/app-menu-context"
import { getVisibleBottomTabs, type BottomTabId } from "@/lib/super-admin-data"

const icons: Record<BottomTabId, typeof Home> = {
  home: Home,
  bookings: CalendarCheck,
  new: Plus,
  shop: ShoppingBag,
  me: User,
}

export function BottomNav() {
  const pathname = usePathname()
  const settings = useAppMenuSettings()
  const tabs = getVisibleBottomTabs(settings)

  const isActive = (href: string) => {
    const base = href.split("?")[0]
    if (base === "/") return pathname === "/"
    return pathname?.startsWith(base) ?? false
  }

  return (
    <nav className="shrink-0 bg-card/95 backdrop-blur border-t border-border pb-[env(safe-area-inset-bottom)]">
      <ul
        className="grid items-center px-2 @sm:px-3 pt-2 pb-3"
        style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
      >
        {tabs.map((tab) => {
          const Icon = icons[tab.id]
          if (tab.primary) {
            return (
              <li key={tab.id} className="flex justify-center">
                <Link
                  href={tab.href}
                  aria-label="새 예약"
                  className="-mt-7 size-14 rounded-full bg-primary text-primary-foreground grid place-items-center shadow-lg shadow-primary/30 hover:scale-105 transition-transform ring-4 ring-background"
                >
                  <Icon className="size-6" />
                </Link>
              </li>
            )
          }

          const active = isActive(tab.href)
          return (
            <li key={tab.id} className="flex justify-center">
              <Link
                href={tab.href}
                className="flex flex-col items-center gap-0.5 px-2 py-1"
              >
                <Icon className={`size-5 ${active ? "text-primary" : "text-muted-foreground"}`} />
                <span
                  className={`text-[10px] font-medium ${
                    active ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {tab.label}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
