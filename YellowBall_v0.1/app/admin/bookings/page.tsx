import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { Calendar, Filter, Download, Plus, Phone, MoreVertical, Check, X, Clock, Bell } from "lucide-react"

const pendingRequests = [
  {
    id: "RB-2742",
    customer: "이서연",
    phone: "010-3214-2742",
    racket: "Wilson Pro Staff RF97",
    detail: "Luxilon ALU Power 1.25 / 52LB",
    visit: "11/8 (금) 14:30",
    requested: "방금 전",
    estimated: 50000,
  },
  {
    id: "RB-2743",
    customer: "박지훈",
    phone: "010-9821-2743",
    racket: "Babolat Pure Aero 2024",
    detail: "Solinco Hyper-G Soft / 50LB",
    visit: "11/8 (금) 16:00",
    requested: "8분 전",
    estimated: 47000,
  },
  {
    id: "RB-2744",
    customer: "정유나",
    phone: "010-4412-2744",
    racket: "Yonex VCORE 98",
    detail: "BYOS · 텐션 54LB · 그로멧 교체 요청",
    visit: "11/9 (토) 11:30",
    requested: "21분 전",
    estimated: 18000,
  },
]

const bookings = [
  { id: "RB-2401", customer: "김민지", phone: "010-3214", type: "스트링", detail: "Babolat RPM Blast 1.25 / 52lbs", date: "오늘 14:00", status: "접수", urgent: true },
  { id: "RB-2402", customer: "박성훈", phone: "010-9821", type: "시타", detail: "Wilson Pro Staff 97 v14", date: "오늘 15:30", status: "확정", urgent: false },
  { id: "RB-2403", customer: "이수진", phone: "010-4412", type: "스트링", detail: "Luxilon ALU Power / 50lbs", date: "오늘 16:00", status: "작업 중", urgent: false },
  { id: "RB-2404", customer: "정도윤", phone: "010-2298", type: "스트링", detail: "Tecnifibre X-One / 48lbs (하이브리드)", date: "오늘 17:30", status: "픽업 대기", urgent: false },
  { id: "RB-2405", customer: "최유진", phone: "010-7766", type: "시타", detail: "Yonex EZONE 100", date: "내일 10:00", status: "확정", urgent: false },
  { id: "RB-2406", customer: "강태오", phone: "010-1023", type: "스트링", detail: "Solinco Hyper-G 1.20 / 54lbs", date: "내일 11:30", status: "접수", urgent: false },
  { id: "RB-2407", customer: "한지원", phone: "010-5544", type: "스트링", detail: "Babolat VS Touch / 56lbs", date: "내일 14:00", status: "변경 요청", urgent: false },
]

const statusStyle: Record<string, string> = {
  접수: "bg-secondary text-foreground",
  확정: "bg-primary/10 text-primary",
  "작업 중": "bg-accent text-accent-foreground",
  "픽업 대기": "bg-chart-4/15 text-chart-4",
  완료: "bg-muted text-muted-foreground",
  "변경 요청": "bg-destructive/10 text-destructive",
}

export default function AdminBookingsPage() {
  return (
    <div>
      <AdminPageHeader
        title="예약 관리"
        description="스트링 작업과 시타 예약을 한 곳에서 관리합니다"
        actions={
          <>
            <button className="h-9 px-3 rounded-lg border border-border text-xs font-semibold flex items-center gap-1.5 hover:bg-secondary">
              <Calendar className="size-3.5" />
              날짜 범위
            </button>
            <button className="h-9 px-3 rounded-lg border border-border text-xs font-semibold flex items-center gap-1.5 hover:bg-secondary">
              <Filter className="size-3.5" />
              필터
            </button>
            <button className="h-9 px-3 rounded-lg border border-border text-xs font-semibold flex items-center gap-1.5 hover:bg-secondary">
              <Download className="size-3.5" />
              내보내기
            </button>
            <button className="h-9 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1.5 hover:opacity-90">
              <Plus className="size-3.5" />새 예약
            </button>
          </>
        }
      />

      {/* Pending approval queue */}
      <section className="mb-6 rounded-2xl border-2 border-accent/40 bg-card overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-3.5 bg-accent/15 border-b border-accent/30">
          <div className="size-8 rounded-lg bg-accent text-accent-foreground grid place-items-center">
            <Bell className="size-4" />
          </div>
          <div className="flex-1">
            <p className="font-display font-bold text-sm text-foreground">
              예약 승인 대기
              <span className="ml-2 inline-flex size-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold items-center justify-center">
                {pendingRequests.length}
              </span>
            </p>
            <p className="text-[11px] text-muted-foreground">
              고객이 신청한 예약입니다. 수락 시 푸시 알림이 발송됩니다.
            </p>
          </div>
          <button className="text-xs font-semibold text-primary hover:underline">
            모두 보기
          </button>
        </div>
        <ul className="divide-y divide-border">
          {pendingRequests.map((r) => (
            <li
              key={r.id}
              className="flex items-center gap-4 px-5 py-3.5 hover:bg-secondary/40 transition"
            >
              <div className="size-9 rounded-full bg-secondary text-foreground grid place-items-center text-xs font-bold shrink-0">
                {r.customer[0]}
              </div>
              <div className="grid grid-cols-12 gap-4 flex-1 min-w-0">
                <div className="col-span-3 min-w-0">
                  <p className="font-semibold text-sm text-foreground truncate">{r.customer}</p>
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Phone className="size-3" />
                    {r.phone}
                  </p>
                </div>
                <div className="col-span-4 min-w-0">
                  <p className="text-sm text-foreground truncate">{r.racket}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{r.detail}</p>
                </div>
                <div className="col-span-3 min-w-0">
                  <p className="text-sm font-semibold text-foreground inline-flex items-center gap-1">
                    <Clock className="size-3.5 text-primary" />
                    {r.visit}
                  </p>
                  <p className="text-[11px] text-muted-foreground">신청 {r.requested}</p>
                </div>
                <div className="col-span-2 text-right">
                  <p className="text-sm font-bold text-foreground tabular-nums">
                    {r.estimated.toLocaleString()}원
                  </p>
                  <p className="text-[10px] text-muted-foreground">예상 결제</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  className="h-9 px-3 rounded-lg border border-destructive/40 text-destructive text-xs font-semibold inline-flex items-center gap-1 hover:bg-destructive/10"
                  aria-label="거절"
                >
                  <X className="size-3.5" />
                  거절
                </button>
                <button
                  className="h-9 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-semibold inline-flex items-center gap-1 hover:opacity-90"
                  aria-label="수락"
                >
                  <Check className="size-3.5" />
                  수락
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <div className="flex flex-wrap gap-2 mb-4">
        {["전체 24", "예약 대기 3", "접수 8", "확정 6", "작업 중 4", "픽업 대기 3", "완료 2", "변경 요청 1"].map(
          (t, i) => (
            <button
              key={t}
              className={`h-8 px-3 rounded-full text-xs font-semibold transition ${
                i === 0
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border text-foreground hover:bg-secondary"
              }`}
            >
              {t}
            </button>
          ),
        )}
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/60 text-muted-foreground text-xs">
              <tr>
                <th className="text-left font-semibold px-4 py-3">예약번호</th>
                <th className="text-left font-semibold px-4 py-3">고객</th>
                <th className="text-left font-semibold px-4 py-3">유형</th>
                <th className="text-left font-semibold px-4 py-3">상세</th>
                <th className="text-left font-semibold px-4 py-3">일시</th>
                <th className="text-left font-semibold px-4 py-3">상태</th>
                <th className="text-right font-semibold px-4 py-3">작업</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id} className="border-t border-border hover:bg-secondary/40">
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{b.id}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="size-7 rounded-full bg-secondary text-foreground grid place-items-center text-[10px] font-bold">
                        {b.customer[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{b.customer}</p>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Phone className="size-3" />
                          {b.phone}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-[10px] font-bold px-2 py-1 rounded-md ${
                        b.type === "스트링" ? "bg-primary/10 text-primary" : "bg-accent/30 text-foreground"
                      }`}
                    >
                      {b.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-foreground">{b.detail}</td>
                  <td className="px-4 py-3 text-foreground">
                    {b.date}
                    {b.urgent && (
                      <span className="ml-1.5 text-[10px] font-bold text-destructive">급행</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-[10px] font-bold px-2 py-1 rounded-full ${statusStyle[b.status]}`}
                    >
                      {b.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button className="size-7 inline-grid place-items-center rounded-md hover:bg-secondary">
                      <MoreVertical className="size-4 text-muted-foreground" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-border text-xs text-muted-foreground">
          <span>총 24건 중 1-7</span>
          <div className="flex gap-1">
            <button className="size-7 rounded-md hover:bg-secondary">‹</button>
            <button className="size-7 rounded-md bg-primary text-primary-foreground font-semibold">1</button>
            <button className="size-7 rounded-md hover:bg-secondary">2</button>
            <button className="size-7 rounded-md hover:bg-secondary">3</button>
            <button className="size-7 rounded-md hover:bg-secondary">›</button>
          </div>
        </div>
      </div>
    </div>
  )
}
