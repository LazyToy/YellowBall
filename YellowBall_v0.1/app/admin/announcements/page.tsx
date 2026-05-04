import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { Plus, Megaphone, Send, Calendar } from "lucide-react"

const items = [
  { title: "봄맞이 스트링 20% 할인 이벤트", type: "이벤트", status: "진행 중", audience: "전체", views: 1284, period: "2026.04.20 - 04.30" },
  { title: "5월 1일 근로자의 날 휴무 안내", type: "공지", status: "예약 발송", audience: "전체", views: 0, period: "2026.04.30 09:00 발송 예정" },
  { title: "신규 라켓 입고: Wilson Pro Staff v14", type: "공지", status: "발송 완료", audience: "VIP", views: 482, period: "2026.04.18" },
  { title: "피클볼 주말 클래스 오픈", type: "이벤트", status: "임시 저장", audience: "전체", views: 0, period: "-" },
]

const typeStyle: Record<string, string> = {
  공지: "bg-primary/10 text-primary",
  이벤트: "bg-accent text-accent-foreground",
}
const statusStyle: Record<string, string> = {
  "진행 중": "bg-chart-4/15 text-chart-4",
  "예약 발송": "bg-secondary text-foreground",
  "발송 완료": "bg-muted text-muted-foreground",
  "임시 저장": "bg-secondary text-muted-foreground",
}

export default function AdminAnnouncementsPage() {
  return (
    <div>
      <AdminPageHeader
        title="공지/이벤트"
        description="앱 푸시, 인앱 배너, 매장 공지 통합 관리"
        actions={
          <button className="h-9 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1.5 hover:opacity-90">
            <Plus className="size-3.5" />
            새 게시물
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-6">
        {[
          { icon: Megaphone, label: "활성 공지", value: "4" },
          { icon: Send, label: "이번 달 발송", value: "12" },
          { icon: Calendar, label: "예약 발송", value: "3" },
        ].map((s) => {
          const Icon = s.icon
          return (
            <div key={s.label} className="bg-card rounded-2xl border border-border p-4 flex items-center gap-3">
              <div className="size-10 rounded-xl bg-primary/10 text-primary grid place-items-center">
                <Icon className="size-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="font-display text-xl font-bold text-foreground">{s.value}</p>
              </div>
            </div>
          )
        })}
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary/60 text-muted-foreground text-xs">
            <tr>
              <th className="text-left font-semibold px-4 py-3">제목</th>
              <th className="text-left font-semibold px-4 py-3">유형</th>
              <th className="text-left font-semibold px-4 py-3">대상</th>
              <th className="text-left font-semibold px-4 py-3">기간/발송</th>
              <th className="text-right font-semibold px-4 py-3">조회</th>
              <th className="text-left font-semibold px-4 py-3">상태</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.title} className="border-t border-border hover:bg-secondary/40">
                <td className="px-4 py-3 font-semibold text-foreground">{it.title}</td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${typeStyle[it.type]}`}>
                    {it.type}
                  </span>
                </td>
                <td className="px-4 py-3 text-foreground">{it.audience}</td>
                <td className="px-4 py-3 text-muted-foreground">{it.period}</td>
                <td className="px-4 py-3 text-right text-foreground">{it.views.toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${statusStyle[it.status]}`}>
                    {it.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
