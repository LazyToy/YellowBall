import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { ShieldCheck, Search, Download, UserCog, Ban, RefreshCw, ToggleRight, ShieldAlert } from "lucide-react"

const logs = [
  {
    actor: "정민수",
    role: "Super Admin",
    action: "관리자 권한 변경",
    target: "한지혜 (Admin)",
    detail: "권한 추가: 상품 관리, 공지/이벤트 발송",
    ip: "121.131.42.18",
    time: "2026-04-29 14:23:08",
    severity: "high",
    icon: UserCog,
  },
  {
    actor: "한지혜",
    role: "Admin",
    action: "유저 제재",
    target: "강태오 (010-1023)",
    detail: "사유: 3회 노쇼 / 14일 예약/구매 제한",
    ip: "211.47.222.10",
    time: "2026-04-29 11:48:32",
    severity: "high",
    icon: Ban,
  },
  {
    actor: "정민수",
    role: "Super Admin",
    action: "정책 변경",
    target: "예약 정책",
    detail: "노쇼 자동 취소: 30분 → 20분",
    ip: "121.131.42.18",
    time: "2026-04-29 09:15:01",
    severity: "medium",
    icon: ShieldAlert,
  },
  {
    actor: "이도현",
    role: "Admin",
    action: "예약 강제 취소",
    target: "RB-2390",
    detail: "사유: 매장 사정으로 작업 불가",
    ip: "118.235.10.4",
    time: "2026-04-28 18:02:55",
    severity: "medium",
    icon: RefreshCw,
  },
  {
    actor: "정민수",
    role: "Super Admin",
    action: "메뉴 활성화 변경",
    target: "배송/퀵 서비스",
    detail: "OFF → ON",
    ip: "121.131.42.18",
    time: "2026-04-28 10:30:11",
    severity: "low",
    icon: ToggleRight,
  },
  {
    actor: "박서연",
    role: "Admin",
    action: "상품 비활성화",
    target: "Babolat Pure Aero 100 (RK-102)",
    detail: "재고 0, 판매 일시 중단",
    ip: "210.91.66.21",
    time: "2026-04-27 16:44:09",
    severity: "low",
    icon: ShieldAlert,
  },
]

const severityStyle: Record<string, string> = {
  high: "bg-destructive/10 text-destructive",
  medium: "bg-chart-4/15 text-chart-4",
  low: "bg-secondary text-muted-foreground",
}

export default function SuperAuditPage() {
  return (
    <div>
      <AdminPageHeader
        title="감사 로그"
        description="민감 행동 (관리자 권한 변경, 제재, 정책 변경) 추적"
        badge={
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-accent text-accent-foreground">
            <ShieldCheck className="size-3" />
            SUPER ADMIN
          </span>
        }
        actions={
          <button className="h-9 px-3 rounded-lg border border-border text-xs font-semibold flex items-center gap-1.5 hover:bg-secondary">
            <Download className="size-3.5" />
            CSV 내보내기
          </button>
        }
      />

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="flex-1 min-w-64 h-9 rounded-lg bg-card border border-border px-3 flex items-center gap-2">
          <Search className="size-4 text-muted-foreground" />
          <input
            placeholder="작업자, 대상, 액션 검색"
            className="flex-1 bg-transparent text-sm focus:outline-none"
          />
        </div>
        {["전체", "권한 변경", "제재", "정책", "메뉴", "상품"].map((c, i) => (
          <button
            key={c}
            className={`h-9 px-3 rounded-lg text-xs font-semibold ${
              i === 0
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-border hover:bg-secondary"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <ul className="divide-y divide-border">
          {logs.map((l, i) => {
            const Icon = l.icon
            return (
              <li key={i} className="px-5 py-4 flex items-start gap-4 hover:bg-secondary/40">
                <div
                  className={`size-10 rounded-xl grid place-items-center shrink-0 ${
                    l.severity === "high"
                      ? "bg-destructive/10 text-destructive"
                      : l.severity === "medium"
                        ? "bg-chart-4/15 text-chart-4"
                        : "bg-secondary text-muted-foreground"
                  }`}
                >
                  <Icon className="size-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-foreground">{l.actor}</span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        l.role === "Super Admin"
                          ? "bg-accent text-accent-foreground"
                          : "bg-primary/10 text-primary"
                      }`}
                    >
                      {l.role}
                    </span>
                    <span className="text-sm text-muted-foreground">→</span>
                    <span className="text-sm font-semibold text-foreground">{l.action}</span>
                    <span className="text-sm text-muted-foreground">·</span>
                    <span className="text-sm text-foreground">{l.target}</span>
                    <span
                      className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full ${severityStyle[l.severity]}`}
                    >
                      {l.severity.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{l.detail}</p>
                  <p className="text-[11px] text-muted-foreground mt-1.5 font-mono">
                    {l.time} · IP {l.ip}
                  </p>
                </div>
              </li>
            )
          })}
        </ul>
        <div className="px-5 py-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
          <span>최근 30일 · 총 142건</span>
          <button className="font-semibold text-primary hover:underline">더 보기</button>
        </div>
      </div>
    </div>
  )
}
