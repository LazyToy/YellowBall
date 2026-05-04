import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { Download, TrendingUp, Wallet, Receipt } from "lucide-react"

const orders = [
  { id: "ORD-10241", customer: "김민지", items: 3, total: 84000, method: "카드", status: "결제 완료", date: "오늘 14:23" },
  { id: "ORD-10240", customer: "박성훈", items: 1, total: 358000, method: "카드", status: "배송 중", date: "오늘 11:02" },
  { id: "ORD-10239", customer: "이수진", items: 2, total: 47000, method: "현장", status: "픽업 완료", date: "어제 18:45" },
  { id: "ORD-10238", customer: "정도윤", items: 5, total: 612000, method: "카드", status: "환불", date: "어제 15:12" },
  { id: "ORD-10237", customer: "최유진", items: 1, total: 9000, method: "현장", status: "결제 완료", date: "어제 12:30" },
  { id: "ORD-10236", customer: "강태오", items: 2, total: 73000, method: "카드", status: "취소", date: "2일 전" },
]

const statusStyle: Record<string, string> = {
  "결제 완료": "bg-chart-4/15 text-chart-4",
  "배송 중": "bg-primary/10 text-primary",
  "픽업 완료": "bg-accent text-accent-foreground",
  환불: "bg-destructive/10 text-destructive",
  취소: "bg-muted text-muted-foreground",
}

export default function AdminOrdersPage() {
  return (
    <div>
      <AdminPageHeader
        title="주문/정산"
        description="모든 주문 내역과 정산 리포트"
        actions={
          <button className="h-9 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1.5 hover:opacity-90">
            <Download className="size-3.5" />
            정산 리포트
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <TrendingUp className="size-3.5" />
            오늘 매출
          </div>
          <p className="font-display text-3xl font-bold text-foreground mt-2">₩1,284,000</p>
          <p className="text-xs text-chart-4 font-semibold mt-1">+18% vs 어제</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <Receipt className="size-3.5" />
            이번 달 누적
          </div>
          <p className="font-display text-3xl font-bold text-foreground mt-2">₩28.4M</p>
          <p className="text-xs text-chart-4 font-semibold mt-1">목표 대비 78%</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <Wallet className="size-3.5" />
            정산 대기
          </div>
          <p className="font-display text-3xl font-bold text-foreground mt-2">₩5,420,000</p>
          <p className="text-xs text-muted-foreground mt-1">D+2 정산 예정</p>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <header className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-display font-bold text-foreground">최근 주문</h2>
          <div className="flex gap-2">
            {["전체", "결제 완료", "배송 중", "환불"].map((t, i) => (
              <button
                key={t}
                className={`h-7 px-2.5 rounded-md text-xs font-semibold ${
                  i === 0 ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </header>
        <table className="w-full text-sm">
          <thead className="bg-secondary/60 text-muted-foreground text-xs">
            <tr>
              <th className="text-left font-semibold px-4 py-3">주문번호</th>
              <th className="text-left font-semibold px-4 py-3">고객</th>
              <th className="text-right font-semibold px-4 py-3">상품수</th>
              <th className="text-right font-semibold px-4 py-3">금액</th>
              <th className="text-left font-semibold px-4 py-3">결제</th>
              <th className="text-left font-semibold px-4 py-3">상태</th>
              <th className="text-left font-semibold px-4 py-3">일시</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-t border-border hover:bg-secondary/40">
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{o.id}</td>
                <td className="px-4 py-3 font-semibold text-foreground">{o.customer}</td>
                <td className="px-4 py-3 text-right text-foreground">{o.items}</td>
                <td className="px-4 py-3 text-right font-bold text-foreground">
                  ₩{o.total.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-foreground">{o.method}</td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${statusStyle[o.status]}`}>
                    {o.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{o.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
