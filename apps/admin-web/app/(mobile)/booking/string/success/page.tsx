import Link from "next/link"
import { CheckCircle2, Clock, MapPin, Bell, ArrowRight } from "lucide-react"
import { loadStoreProfile } from "@/lib/super-admin-data"

type Props = {
  searchParams: Promise<{ date?: string; slot?: string; total?: string }>
}

function formatDate(iso?: string) {
  if (!iso) return ""
  const d = new Date(iso)
  const days = ["일", "월", "화", "수", "목", "금", "토"]
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${days[d.getDay()]})`
}

export default async function StringBookingSuccessPage({ searchParams }: Props) {
  const [sp, storeProfile] = await Promise.all([
    searchParams,
    loadStoreProfile(),
  ])
  const dateLabel = formatDate(sp.date)
  const slot = sp.slot ?? "--:--"
  const total = sp.total ? parseInt(sp.total, 10) : 0
  const requestId = `RH-${Math.floor(2700 + Math.random() * 99)}`
  const storeName = storeProfile.storeName || '매장'

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-5 pt-10 pb-6 text-center">
        <div className="inline-flex size-16 rounded-full bg-accent/30 grid place-items-center mb-4">
          <Clock className="size-8 text-primary" />
        </div>
        <h1 className="font-display font-bold text-xl text-foreground">예약 신청 완료</h1>
        <p className="text-sm text-muted-foreground mt-1.5">
          관리자 확인 후 예약이 확정됩니다
        </p>
      </div>

      <div className="px-5 space-y-3">
        {/* Status pill */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 bg-accent/15 border-b border-border">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-accent opacity-75 animate-ping" />
              <span className="relative inline-flex size-2 rounded-full bg-accent" />
            </span>
            <p className="text-xs font-bold text-foreground">예약 대기</p>
            <span className="ml-auto text-[10px] text-muted-foreground">{requestId}</span>
          </div>

          <div className="p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground inline-flex items-center gap-1.5">
                <Clock className="size-3.5" />
                방문 일시
              </span>
              <span className="font-semibold text-foreground">
                {dateLabel} {slot}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground inline-flex items-center gap-1.5">
                <MapPin className="size-3.5" />
                매장
              </span>
              {/* DB에서 로드한 매장명 표시 */}
              <span className="font-semibold text-foreground">{storeName}</span>
            </div>
            <div className="flex justify-between text-sm pt-3 border-t border-border">
              <span className="text-muted-foreground">예상 결제금액</span>
              <span className="font-display font-bold text-base text-foreground tabular-nums">
                {total.toLocaleString()}원
              </span>
            </div>
          </div>
        </div>

        {/* Approval flow */}
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs font-semibold text-foreground mb-3">처리 단계</p>
          <ol className="space-y-3">
            {[
              { label: "예약 신청", desc: "지금", done: true, active: false },
              { label: "관리자 확인", desc: "30분 이내 응답", done: false, active: true },
              { label: "예약 확정", desc: "푸시 알림 발송", done: false, active: false },
              { label: "방문 및 작업", desc: dateLabel, done: false, active: false },
            ].map((step, i, arr) => (
              <li key={step.label} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span
                    className={`size-6 rounded-full grid place-items-center text-[10px] font-bold ${
                      step.done
                        ? "bg-primary text-primary-foreground"
                        : step.active
                          ? "bg-accent text-accent-foreground"
                          : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {step.done ? <CheckCircle2 className="size-3.5" /> : i + 1}
                  </span>
                  {i < arr.length - 1 && (
                    <span
                      className={`w-px flex-1 mt-1 ${step.done ? "bg-primary/40" : "bg-border"}`}
                    />
                  )}
                </div>
                <div className="pb-2">
                  <p
                    className={`text-sm ${
                      step.active
                        ? "font-bold text-foreground"
                        : step.done
                          ? "font-medium text-foreground"
                          : "font-medium text-muted-foreground"
                    }`}
                  >
                    {step.label}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{step.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* Notification card */}
        <div className="rounded-2xl bg-secondary/60 p-4 flex items-start gap-3">
          <Bell className="size-5 text-primary shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            <b className="text-foreground">알림 설정 완료.</b> 관리자가 예약을 수락하거나 거절하면
            앱 푸시 알림으로 즉시 안내해드려요.
          </p>
        </div>
      </div>

      <div className="px-5 py-4 mt-2 flex flex-col gap-2">
        <Link
          href="/booking"
          className="h-12 rounded-full bg-primary text-primary-foreground font-display font-bold text-sm grid place-items-center hover:bg-primary/90 transition"
        >
          내 예약 확인하기
        </Link>
        <Link
          href="/"
          className="h-11 rounded-full text-muted-foreground text-sm font-medium grid place-items-center hover:text-foreground transition"
        >
          홈으로
          <ArrowRight className="size-4 ml-1 inline-block" />
        </Link>
      </div>
    </div>
  )
}
