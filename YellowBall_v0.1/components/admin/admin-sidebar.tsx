"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  CalendarDays,
  Wrench,
  Sparkles,
  Package,
  Boxes,
  Users,
  Receipt,
  Settings,
  ArrowLeft,
  ShieldCheck,
  UserCog,
  ToggleRight,
  ScrollText,
  Megaphone,
} from "lucide-react"

const adminNav = [
  { id: "dashboard", label: "대시보드", icon: LayoutDashboard, href: "/admin" },
  { id: "bookings", label: "예약 관리", icon: CalendarDays, href: "/admin/bookings", badge: 8 },
  { id: "queue", label: "작업 큐", icon: Wrench, href: "/admin/queue", badge: 4 },
  { id: "demo", label: "시타 라켓", icon: Sparkles, href: "/admin/demo" },
  { id: "products", label: "상품 관리", icon: Package, href: "/admin/products" },
  { id: "inventory", label: "재고", icon: Boxes, href: "/admin/inventory", badge: 3 },
  { id: "customers", label: "고객", icon: Users, href: "/admin/customers" },
  { id: "orders", label: "주문/정산", icon: Receipt, href: "/admin/orders" },
  { id: "announcements", label: "공지/이벤트", icon: Megaphone, href: "/admin/announcements" },
  { id: "settings", label: "설정", icon: Settings, href: "/admin/settings" },
]

const superNav = [
  { id: "admins", label: "관리자 관리", icon: UserCog, href: "/admin/super/admins" },
  { id: "menus", label: "메뉴 활성화", icon: ToggleRight, href: "/admin/super/menus" },
  { id: "policies", label: "정책 관리", icon: ShieldCheck, href: "/admin/super/policies" },
  { id: "audit", label: "감사 로그", icon: ScrollText, href: "/admin/super/audit" },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname?.startsWith(href)

  return (
    <aside className="hidden md:flex w-64 shrink-0 bg-primary text-primary-foreground flex-col">
      <div className="px-5 h-16 flex items-center gap-2 border-b border-primary-foreground/10">
        <div className="size-8 rounded-xl bg-accent text-accent-foreground grid place-items-center font-display font-bold">
          R
        </div>
        <div className="leading-tight">
          <p className="font-display font-bold">RallyHub</p>
          <p className="text-[10px] text-primary-foreground/70 -mt-0.5">Admin Console</p>
        </div>
      </div>

      <div className="px-3 py-4">
        <div className="px-2 pb-2 text-[10px] font-semibold text-primary-foreground/50 tracking-wider uppercase">
          매장
        </div>
        <button className="w-full flex items-center gap-2 rounded-xl bg-primary-foreground/10 hover:bg-primary-foreground/15 transition px-3 py-2.5 text-left">
          <div className="size-7 rounded-md bg-accent text-accent-foreground grid place-items-center text-xs font-bold">
            성
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">RallyHub 성수점</p>
            <p className="text-[10px] text-primary-foreground/60">슈퍼 관리자 · 정민수</p>
          </div>
        </button>
      </div>

      <nav className="px-3 flex-1 overflow-y-auto">
        <div className="px-2 pb-1.5 text-[10px] font-semibold text-primary-foreground/50 tracking-wider uppercase">
          운영
        </div>
        <ul className="space-y-0.5">
          {adminNav.map((n) => {
            const Icon = n.icon
            const a = isActive(n.href)
            return (
              <li key={n.id}>
                <Link
                  href={n.href}
                  className={`flex items-center gap-3 px-3 h-10 rounded-xl text-sm transition ${
                    a
                      ? "bg-accent text-accent-foreground font-semibold"
                      : "text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground"
                  }`}
                >
                  <Icon className="size-4" />
                  <span className="flex-1">{n.label}</span>
                  {"badge" in n && n.badge && (
                    <span
                      className={`text-[10px] font-bold min-w-5 h-5 px-1.5 grid place-items-center rounded-full ${
                        a ? "bg-accent-foreground text-accent" : "bg-accent text-accent-foreground"
                      }`}
                    >
                      {n.badge}
                    </span>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>

        <div className="px-2 pt-5 pb-1.5 text-[10px] font-semibold text-accent tracking-wider uppercase flex items-center gap-1.5">
          <ShieldCheck className="size-3" />
          슈퍼 관리자
        </div>
        <ul className="space-y-0.5">
          {superNav.map((n) => {
            const Icon = n.icon
            const a = isActive(n.href)
            return (
              <li key={n.id}>
                <Link
                  href={n.href}
                  className={`flex items-center gap-3 px-3 h-10 rounded-xl text-sm transition ${
                    a
                      ? "bg-accent text-accent-foreground font-semibold"
                      : "text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground"
                  }`}
                >
                  <Icon className="size-4" />
                  <span className="flex-1">{n.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="p-3 border-t border-primary-foreground/10">
        <Link
          href="/me"
          className="flex items-center gap-2 px-3 h-10 rounded-xl text-xs text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground transition"
        >
          <ArrowLeft className="size-3.5" />
          앱으로 돌아가기
        </Link>
      </div>
    </aside>
  )
}
