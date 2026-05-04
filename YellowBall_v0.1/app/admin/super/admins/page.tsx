import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { ShieldCheck, UserPlus, Crown, MoreVertical, Check } from "lucide-react"

const admins = [
  {
    name: "정민수",
    email: "minsu@rallyhub.kr",
    role: "Super Admin",
    store: "성수점",
    lastActive: "방금 전",
    permissions: ["all"],
  },
  {
    name: "한지혜",
    email: "jhhan@rallyhub.kr",
    role: "Admin",
    store: "성수점",
    lastActive: "5분 전",
    permissions: ["strings", "demos", "bookings", "products"],
  },
  {
    name: "이도현",
    email: "dohyun@rallyhub.kr",
    role: "Admin",
    store: "강남점",
    lastActive: "32분 전",
    permissions: ["bookings", "demos", "customers"],
  },
  {
    name: "박서연",
    email: "seoyeon@rallyhub.kr",
    role: "Admin",
    store: "성수점",
    lastActive: "어제",
    permissions: ["products", "orders", "announcements"],
  },
]

const permissionGroups = [
  { id: "strings", label: "스트링 목록 관리" },
  { id: "demos", label: "시타 라켓 관리" },
  { id: "bookings", label: "예약 승인/거절/변경" },
  { id: "queue", label: "작업 상태 변경" },
  { id: "customers", label: "유저 제재" },
  { id: "products", label: "상품 관리" },
  { id: "orders", label: "주문 관리" },
  { id: "announcements", label: "공지/이벤트 발송" },
  { id: "menus", label: "앱 메뉴 활성화/비활성화" },
  { id: "admins", label: "관리자 권한 관리" },
]

export default function SuperAdminsPage() {
  const selected = admins[1] // 한지혜

  return (
    <div>
      <AdminPageHeader
        title="관리자 관리"
        description="관리자 임명/해임 및 세부 권한 토글"
        badge={
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-accent text-accent-foreground">
            <ShieldCheck className="size-3" />
            SUPER ADMIN
          </span>
        }
        actions={
          <button className="h-9 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1.5 hover:opacity-90">
            <UserPlus className="size-3.5" />
            관리자 초대
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <section className="lg:col-span-2 bg-card rounded-2xl border border-border overflow-hidden h-fit">
          <header className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="font-display font-bold text-foreground">관리자 ({admins.length})</h2>
          </header>
          <ul className="divide-y divide-border">
            {admins.map((a) => {
              const isSuper = a.role === "Super Admin"
              const isSelected = a.email === selected.email
              return (
                <li
                  key={a.email}
                  className={`px-5 py-4 flex items-center gap-3 cursor-pointer ${
                    isSelected ? "bg-secondary/60" : "hover:bg-secondary/40"
                  }`}
                >
                  <div className="size-10 rounded-full bg-primary text-primary-foreground grid place-items-center font-bold text-sm">
                    {a.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground flex items-center gap-1.5">
                      {a.name}
                      {isSuper && <Crown className="size-3.5 text-accent" />}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{a.email}</p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                        isSuper ? "bg-accent text-accent-foreground" : "bg-primary/10 text-primary"
                      }`}
                    >
                      {a.role}
                    </span>
                    <p className="text-[10px] text-muted-foreground mt-1">{a.store} · {a.lastActive}</p>
                  </div>
                  <button className="size-7 grid place-items-center rounded-md hover:bg-card">
                    <MoreVertical className="size-4 text-muted-foreground" />
                  </button>
                </li>
              )
            })}
          </ul>
        </section>

        <section className="lg:col-span-3 bg-card rounded-2xl border border-border">
          <header className="px-6 py-5 border-b border-border flex items-center gap-4">
            <div className="size-12 rounded-full bg-primary text-primary-foreground grid place-items-center font-display font-bold">
              {selected.name[0]}
            </div>
            <div className="flex-1">
              <h2 className="font-display font-bold text-foreground text-lg">{selected.name}</h2>
              <p className="text-xs text-muted-foreground">
                {selected.email} · {selected.store} · 마지막 활동 {selected.lastActive}
              </p>
            </div>
            <button className="h-9 px-3 rounded-lg border border-destructive/30 text-destructive text-xs font-semibold hover:bg-destructive/10">
              관리자 해임
            </button>
          </header>

          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display font-bold text-foreground">권한 설정</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  토글로 개별 기능 접근을 부여합니다
                </p>
              </div>
              <div className="flex gap-1">
                <button className="text-xs font-semibold px-2.5 h-7 rounded-md hover:bg-secondary">
                  전체 해제
                </button>
                <button className="text-xs font-semibold px-2.5 h-7 rounded-md hover:bg-secondary">
                  전체 선택
                </button>
              </div>
            </div>

            <ul className="divide-y divide-border border border-border rounded-xl overflow-hidden">
              {permissionGroups.map((p) => {
                const enabled = selected.permissions.includes(p.id)
                const locked = p.id === "admins" || p.id === "menus"
                return (
                  <li
                    key={p.id}
                    className="flex items-center gap-3 px-4 py-3 bg-card hover:bg-secondary/40"
                  >
                    <span className="flex-1 text-sm font-medium text-foreground">
                      {p.label}
                      {locked && (
                        <span className="ml-2 text-[10px] font-bold text-accent-foreground bg-accent px-1.5 py-0.5 rounded">
                          SUPER ONLY
                        </span>
                      )}
                    </span>
                    <Toggle on={enabled && !locked} disabled={locked} />
                  </li>
                )
              })}
            </ul>

            <div className="mt-6 flex items-center gap-2 p-3 rounded-xl bg-accent/30 text-foreground text-xs">
              <ShieldCheck className="size-4 text-primary shrink-0" />
              관리자 권한 관리, 메뉴 활성화는 슈퍼 관리자만 사용할 수 있는 잠긴 기능입니다.
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button className="h-10 px-4 rounded-lg border border-border text-sm font-semibold hover:bg-secondary">
                취소
              </button>
              <button className="h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 inline-flex items-center gap-1.5">
                <Check className="size-4" />
                권한 저장
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

function Toggle({ on, disabled }: { on: boolean; disabled?: boolean }) {
  return (
    <button
      type="button"
      className={`relative w-10 h-6 rounded-full transition ${
        disabled
          ? "bg-muted cursor-not-allowed"
          : on
            ? "bg-primary"
            : "bg-secondary border border-border"
      }`}
      aria-pressed={on}
      disabled={disabled}
    >
      <span
        className={`absolute top-0.5 size-5 rounded-full bg-card shadow transition-all ${
          on ? "left-[18px]" : "left-0.5"
        }`}
      />
    </button>
  )
}
