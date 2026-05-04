import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { ShieldCheck, Smartphone, ToggleRight } from "lucide-react"

const menuGroups = [
  {
    section: "사용자 앱",
    icon: Smartphone,
    items: [
      { id: "string-booking", label: "스트링 작업 예약", desc: "F4. 라켓 스트링 작업 예약 플로우", on: true, locked: false },
      { id: "demo-booking", label: "라켓 시타 예약", desc: "F5. 시타 라켓 예약 및 반납", on: true, locked: false },
      { id: "shop", label: "용품 쇼핑", desc: "F6. 라켓샵 e-commerce", on: true, locked: false },
      { id: "racket-library", label: "내 라켓 라이브러리", desc: "F2. 다중 라켓 등록 및 관리", on: true, locked: false },
      { id: "delivery", label: "배송/퀵 서비스", desc: "주소 등록 사용자 대상", on: false, locked: false },
      { id: "community", label: "커뮤니티/매칭", desc: "MVP 제외 기능 (베타)", on: false, locked: false },
      { id: "subscription", label: "유료 멤버십", desc: "MVP 제외 기능", on: false, locked: false },
    ],
  },
  {
    section: "관리자 콘솔",
    icon: ToggleRight,
    items: [
      { id: "queue-board", label: "작업 큐 칸반", desc: "스트링 작업 진행 보드", on: true, locked: false },
      { id: "auto-reorder", label: "자동 재주문 알림", desc: "재고 임계치 알림", on: true, locked: false },
      { id: "analytics", label: "고급 분석", desc: "코호트, 리텐션 리포트", on: false, locked: false },
      { id: "audit-log", label: "감사 로그", desc: "민감 행위 기록 (필수)", on: true, locked: true },
    ],
  },
]

export default function SuperMenusPage() {
  return (
    <div>
      <AdminPageHeader
        title="메뉴 활성화"
        description="앱 전체에 노출되는 기능을 ON/OFF 합니다. 변경 즉시 모든 사용자에게 반영됩니다."
        badge={
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-accent text-accent-foreground">
            <ShieldCheck className="size-3" />
            SUPER ADMIN
          </span>
        }
      />

      <div className="space-y-5">
        {menuGroups.map((g) => {
          const Icon = g.icon
          return (
            <section key={g.section} className="bg-card rounded-2xl border border-border overflow-hidden">
              <header className="px-6 py-4 border-b border-border flex items-center gap-2">
                <Icon className="size-4 text-primary" />
                <h2 className="font-display font-bold text-foreground">{g.section}</h2>
                <span className="text-xs text-muted-foreground ml-auto">
                  {g.items.filter((i) => i.on).length}/{g.items.length} 활성
                </span>
              </header>
              <ul className="divide-y divide-border">
                {g.items.map((it) => (
                  <li key={it.id} className="px-6 py-4 flex items-center gap-4 hover:bg-secondary/40">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground flex items-center gap-2">
                        {it.label}
                        {it.locked && (
                          <span className="text-[10px] font-bold bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                            잠금
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{it.desc}</p>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                        it.on ? "bg-chart-4/15 text-chart-4" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {it.on ? "ON" : "OFF"}
                    </span>
                    <button
                      type="button"
                      disabled={it.locked}
                      className={`relative w-11 h-6 rounded-full transition ${
                        it.locked
                          ? "bg-muted cursor-not-allowed"
                          : it.on
                            ? "bg-primary"
                            : "bg-secondary border border-border"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 size-5 rounded-full bg-card shadow transition-all ${
                          it.on ? "left-[22px]" : "left-0.5"
                        }`}
                      />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )
        })}
      </div>
    </div>
  )
}
