"use client"

import {
  Receipt,
  MapPin,
  Bell,
  Gift,
  HelpCircle,
  FileText,
  ChevronRight,
} from "lucide-react"
import { useAppMenuSettings } from "@/components/app/app-menu-context"

const groups = [
  {
    title: "쇼핑",
    items: [
      { menuId: "shop" as const, label: "주문 내역", icon: Receipt, badge: "배송중 1건" },
      { menuId: "delivery" as const, label: "배송지 관리", icon: MapPin },
    ],
  },
  {
    title: "활동",
    items: [
      { menuId: "subscription" as const, label: "쿠폰 / 포인트", icon: Gift, badge: "3장" },
      { menuId: null, label: "알림 설정", icon: Bell },
    ],
  },
  {
    title: "고객지원",
    items: [
      { menuId: null, label: "공지사항", icon: FileText },
      { menuId: null, label: "문의하기", icon: HelpCircle },
    ],
  },
]

export function MeMenuList() {
  const settings = useAppMenuSettings()
  const visibleGroups = groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.menuId || settings[item.menuId]),
    }))
    .filter((group) => group.items.length > 0)

  return (
    <section className="px-5 pt-6 space-y-5">
      {visibleGroups.map((group) => (
        <div key={group.title}>
          <p className="text-[11px] font-semibold text-muted-foreground tracking-wide uppercase mb-2 px-1">
            {group.title}
          </p>
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            {group.items.map((item, index) => {
              const Icon = item.icon
              return (
                <button
                  key={item.label}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-secondary/50 transition ${
                    index !== group.items.length - 1 ? "border-b border-border" : ""
                  }`}
                >
                  <Icon className="size-4 text-muted-foreground" />
                  <span className="flex-1 text-left text-sm text-foreground">{item.label}</span>
                  {"badge" in item && item.badge && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-secondary text-secondary-foreground">
                      {item.badge}
                    </span>
                  )}
                  <ChevronRight className="size-4 text-muted-foreground" />
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </section>
  )
}
