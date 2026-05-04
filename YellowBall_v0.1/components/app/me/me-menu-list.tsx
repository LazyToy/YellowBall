import {
  Receipt,
  MapPin,
  Bell,
  Gift,
  HelpCircle,
  FileText,
  ChevronRight,
} from "lucide-react"

const groups = [
  {
    title: "쇼핑",
    items: [
      { label: "주문 내역", icon: Receipt, badge: "배송중 1건" },
      { label: "배송지 관리", icon: MapPin },
    ],
  },
  {
    title: "활동",
    items: [
      { label: "쿠폰 / 포인트", icon: Gift, badge: "3장" },
      { label: "알림 설정", icon: Bell },
    ],
  },
  {
    title: "고객지원",
    items: [
      { label: "공지사항", icon: FileText },
      { label: "문의하기", icon: HelpCircle },
    ],
  },
]

export function MeMenuList() {
  return (
    <section className="px-5 pt-6 space-y-5">
      {groups.map((g) => (
        <div key={g.title}>
          <p className="text-[11px] font-semibold text-muted-foreground tracking-wide uppercase mb-2 px-1">
            {g.title}
          </p>
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            {g.items.map((it, i) => {
              const Icon = it.icon
              return (
                <button
                  key={it.label}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-secondary/50 transition ${
                    i !== g.items.length - 1 ? "border-b border-border" : ""
                  }`}
                >
                  <Icon className="size-4 text-muted-foreground" />
                  <span className="flex-1 text-left text-sm text-foreground">{it.label}</span>
                  {"badge" in it && it.badge && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-secondary text-secondary-foreground">
                      {it.badge}
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
