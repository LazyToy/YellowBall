import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { ShieldCheck, AlertCircle } from "lucide-react"

export default function SuperPoliciesPage() {
  return (
    <div>
      <AdminPageHeader
        title="정책 관리"
        description="예약, 제재, 환불, 알림 등 앱 전역 운영 정책"
        badge={
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-accent text-accent-foreground">
            <ShieldCheck className="size-3" />
            SUPER ADMIN
          </span>
        }
      />

      <div className="space-y-5 max-w-3xl">
        <Section title="예약 정책">
          <Numeric label="예약 가능 시작 시간" suffix="시간 후부터" value="2" />
          <Numeric label="최대 예약 가능 일수" suffix="일까지" value="14" />
          <Numeric label="동시 예약 가능 슬롯" suffix="건" value="1" />
          <Numeric label="노쇼 자동 취소" suffix="분 경과 시" value="20" />
        </Section>

        <Section title="제재 정책">
          <Numeric label="3회 노쇼 시 자동 제재" suffix="일" value="14" />
          <Numeric label="결제 미완료 자동 취소" suffix="분" value="10" />
          <div className="flex items-center gap-3 py-3 border-t border-border">
            <span className="flex-1 text-sm font-medium text-foreground">
              제재 사용자 로그인 차단
              <span className="block text-xs text-muted-foreground mt-0.5">
                OFF 시 로그인은 가능하나 예약/구매만 제한
              </span>
            </span>
            <Toggle on />
          </div>
        </Section>

        <Section title="환불 정책">
          <Numeric label="시타 예약 환불 가능" suffix="시간 전" value="3" />
          <Numeric label="스트링 작업 환불 가능" suffix="시간 전" value="6" />
          <div className="flex items-center gap-3 py-3 border-t border-border">
            <span className="flex-1 text-sm font-medium text-foreground">
              자동 환불 처리
              <span className="block text-xs text-muted-foreground mt-0.5">
                정책 시간 내 취소 시 PG 자동 환불 호출
              </span>
            </span>
            <Toggle on />
          </div>
        </Section>

        <Section title="알림 정책">
          <div className="flex items-center gap-3 py-3">
            <span className="flex-1 text-sm font-medium text-foreground">예약 확정 푸시</span>
            <Toggle on />
          </div>
          <div className="flex items-center gap-3 py-3 border-t border-border">
            <span className="flex-1 text-sm font-medium text-foreground">픽업 가능 알림</span>
            <Toggle on />
          </div>
          <div className="flex items-center gap-3 py-3 border-t border-border">
            <span className="flex-1 text-sm font-medium text-foreground">마케팅 푸시 (사용자 동의 필요)</span>
            <Toggle on={false} />
          </div>
        </Section>

        <div className="flex items-start gap-2 p-4 rounded-xl bg-destructive/5 border border-destructive/20 text-foreground text-xs">
          <AlertCircle className="size-4 text-destructive shrink-0 mt-0.5" />
          <p>
            모든 정책 변경은 audit_logs에 기록되며, 변경 즉시 사용자 앱에 반영됩니다. 안전한 시간대에 변경하세요.
          </p>
        </div>

        <div className="flex justify-end gap-2">
          <button className="h-10 px-4 rounded-lg border border-border text-sm font-semibold hover:bg-secondary">
            기본값 복원
          </button>
          <button className="h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90">
            정책 저장
          </button>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-card rounded-2xl border border-border">
      <header className="px-6 py-4 border-b border-border">
        <h2 className="font-display font-bold text-foreground">{title}</h2>
      </header>
      <div className="px-6">{children}</div>
    </section>
  )
}

function Numeric({ label, suffix, value }: { label: string; suffix: string; value: string }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-border last:border-0">
      <span className="flex-1 text-sm font-medium text-foreground">{label}</span>
      <input
        defaultValue={value}
        className="w-20 h-9 rounded-lg bg-secondary px-3 text-sm text-right font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
      <span className="text-xs text-muted-foreground w-24">{suffix}</span>
    </div>
  )
}

function Toggle({ on }: { on: boolean }) {
  return (
    <button
      type="button"
      className={`relative w-11 h-6 rounded-full transition ${
        on ? "bg-primary" : "bg-secondary border border-border"
      }`}
    >
      <span
        className={`absolute top-0.5 size-5 rounded-full bg-card shadow transition-all ${
          on ? "left-[22px]" : "left-0.5"
        }`}
      />
    </button>
  )
}
