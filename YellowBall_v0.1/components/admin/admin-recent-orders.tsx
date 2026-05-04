import { ChevronRight } from "lucide-react"

const orders = [
  {
    id: "ORD-91204",
    customer: "정민수",
    items: "Wilson RF97 + ALU Power 1.25",
    total: 421000,
    status: "결제완료" as const,
    time: "10분 전",
  },
  {
    id: "ORD-91203",
    customer: "박서연",
    items: "Hyper-G Soft 1.20 ×2",
    total: 56000,
    status: "배송준비" as const,
    time: "32분 전",
  },
  {
    id: "ORD-91202",
    customer: "이도윤",
    items: "Asics Court FF 3 (270mm)",
    total: 189000,
    status: "배송중" as const,
    time: "1시간 전",
  },
  {
    id: "ORD-91201",
    customer: "한우진",
    items: "Babolat Pure Aero",
    total: 309000,
    status: "결제완료" as const,
    time: "2시간 전",
  },
  {
    id: "ORD-91200",
    customer: "최예린",
    items: "Tourna Grip Original ×3",
    total: 36000,
    status: "취소" as const,
    time: "3시간 전",
  },
]

const statusStyle: Record<string, string> = {
  결제완료: "bg-primary text-primary-foreground",
  배송준비: "bg-accent text-accent-foreground",
  배송중: "bg-chart-3 text-primary-foreground",
  취소: "bg-secondary text-muted-foreground",
}

const fmt = (n: number) => n.toLocaleString("ko-KR")

export function AdminRecentOrders() {
  return (
    <section className="rounded-2xl border border-border bg-card">
      <header className="px-5 py-4 flex items-center justify-between border-b border-border">
        <div>
          <h2 className="font-display font-bold text-base text-foreground">최근 주문</h2>
          <p className="text-xs text-muted-foreground mt-0.5">샵 + 앱 통합 주문</p>
        </div>
        <button className="text-xs font-semibold text-primary inline-flex items-center gap-0.5">
          전체 주문 <ChevronRight className="size-3.5" />
        </button>
      </header>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] text-muted-foreground uppercase tracking-wide">
              <th className="px-5 py-3 font-semibold">주문 번호</th>
              <th className="py-3 font-semibold">고객</th>
              <th className="py-3 font-semibold">상품</th>
              <th className="py-3 font-semibold text-right">금액</th>
              <th className="py-3 font-semibold">상태</th>
              <th className="px-5 py-3 font-semibold text-right">시간</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {orders.map((o) => (
              <tr key={o.id} className="hover:bg-secondary/40 transition">
                <td className="px-5 py-3.5 font-mono text-[11px] text-muted-foreground">{o.id}</td>
                <td className="py-3.5 font-semibold text-foreground">{o.customer}</td>
                <td className="py-3.5 text-foreground/80 max-w-xs truncate">{o.items}</td>
                <td className="py-3.5 text-right tabular-nums font-semibold text-foreground">
                  ₩{fmt(o.total)}
                </td>
                <td className="py-3.5">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${statusStyle[o.status]}`}
                  >
                    {o.status}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-right text-[11px] text-muted-foreground">
                  {o.time}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
