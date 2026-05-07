"use client"

import Link from "next/link"
import { Wrench, Sparkles, ChevronRight } from "lucide-react"
import { useAppMenuSettings } from "@/components/app/app-menu-context"

const items = [
  {
    menuId: "string-booking" as const,
    title: "스트링 작업 예약",
    desc: "내 라켓에 맞는 스트링과 텐션을 선택",
    icon: Wrench,
    badge: "평균 24시간",
    tone: "primary" as const,
    href: "/booking/string/new",
  },
  {
    menuId: "demo-booking" as const,
    title: "라켓 시타 예약",
    desc: "매장에서 관심 라켓을 직접 사용해보기",
    icon: Sparkles,
    badge: "1일 무료",
    tone: "accent" as const,
    href: "#",
  },
]

export function NewBookingCTA() {
  const settings = useAppMenuSettings()
  const visibleItems = items.filter((item) => settings[item.menuId])

  if (visibleItems.length === 0) {
    return null
  }

  return (
    <section className="px-5 pt-4">
      <h2 className="font-display font-bold text-base mb-3">새 예약 만들기</h2>
      <div className="grid grid-cols-1 gap-3">
        {visibleItems.map((item) => {
          const Icon = item.icon
          const tone =
            item.tone === "primary"
              ? "bg-primary text-primary-foreground"
              : "bg-accent text-accent-foreground"
          return (
            <Link
              key={item.menuId}
              href={item.href}
              className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-4 text-left hover:border-primary/40 hover:shadow-md hover:shadow-primary/5 transition"
            >
              <div className={`size-12 rounded-xl grid place-items-center shrink-0 ${tone}`}>
                <Icon className="size-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-foreground">{item.title}</p>
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-secondary text-secondary-foreground">
                    {item.badge}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.desc}</p>
              </div>
              <ChevronRight className="size-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition" />
            </Link>
          )
        })}
      </div>
    </section>
  )
}
