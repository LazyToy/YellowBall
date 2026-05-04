import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { Boxes, AlertTriangle, TrendingDown, Package } from "lucide-react"

const stockMovements = [
  { date: "오늘 14:23", item: "Babolat RPM Blast 1.25", type: "출고", qty: -1, by: "예약 RB-2401" },
  { date: "오늘 11:08", item: "Wilson Pro Overgrip 3pk", type: "입고", qty: 30, by: "발주 PO-118" },
  { date: "어제 17:45", item: "Luxilon ALU Power 1.25", type: "출고", qty: -2, by: "예약 RB-2398" },
  { date: "어제 09:12", item: "Wilson US Open 4볼", type: "입고", qty: 60, by: "발주 PO-117" },
  { date: "2일 전", item: "Babolat Team 12R 가방", type: "조정", qty: -1, by: "재고 실사" },
]

const lowStock = [
  { name: "Luxilon ALU Power 1.25", stock: 8, min: 15, status: "재주문 필요" },
  { name: "Wilson Pro Staff 97 v14", stock: 3, min: 5, status: "긴급" },
  { name: "Babolat Team 12R 가방", stock: 4, min: 6, status: "재주문 필요" },
  { name: "Solinco Hyper-G 1.20", stock: 2, min: 10, status: "긴급" },
]

export default function AdminInventoryPage() {
  return (
    <div>
      <AdminPageHeader
        title="재고"
        description="실시간 재고 추적, 입출고, 자동 발주 알림"
        actions={
          <>
            <button className="h-9 px-3 rounded-lg border border-border text-xs font-semibold hover:bg-secondary">
              재고 실사
            </button>
            <button className="h-9 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90">
              발주 생성
            </button>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { icon: Boxes, label: "총 SKU", value: "184", tone: "bg-primary/10 text-primary" },
          { icon: AlertTriangle, label: "재주문 필요", value: "12", tone: "bg-chart-4/15 text-chart-4" },
          { icon: TrendingDown, label: "품절", value: "3", tone: "bg-destructive/10 text-destructive" },
          { icon: Package, label: "이번주 입고", value: "8건", tone: "bg-accent text-accent-foreground" },
        ].map((s) => {
          const Icon = s.icon
          return (
            <div key={s.label} className="bg-card rounded-2xl border border-border p-4">
              <div className={`size-9 rounded-lg grid place-items-center ${s.tone}`}>
                <Icon className="size-4" />
              </div>
              <p className="text-xs text-muted-foreground mt-3">{s.label}</p>
              <p className="font-display text-2xl font-bold text-foreground">{s.value}</p>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <section className="bg-card rounded-2xl border border-border">
          <header className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="font-display font-bold text-foreground">재주문 알림</h2>
            <span className="text-xs text-destructive font-semibold">{lowStock.length}건</span>
          </header>
          <ul className="divide-y divide-border">
            {lowStock.map((it) => (
              <li key={it.name} className="px-5 py-3 flex items-center gap-3">
                <div className="flex-1">
                  <p className="font-semibold text-foreground text-sm">{it.name}</p>
                  <p className="text-xs text-muted-foreground">
                    재고 {it.stock} · 최소 {it.min}
                  </p>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                    it.status === "긴급"
                      ? "bg-destructive/10 text-destructive"
                      : "bg-chart-4/15 text-chart-4"
                  }`}
                >
                  {it.status}
                </span>
                <button className="text-xs font-semibold text-primary hover:underline">발주</button>
              </li>
            ))}
          </ul>
        </section>

        <section className="bg-card rounded-2xl border border-border">
          <header className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="font-display font-bold text-foreground">최근 입출고</h2>
            <button className="text-xs text-muted-foreground hover:text-foreground">전체 보기</button>
          </header>
          <ul className="divide-y divide-border">
            {stockMovements.map((m, i) => (
              <li key={i} className="px-5 py-3 flex items-center gap-3">
                <div
                  className={`size-8 rounded-lg grid place-items-center text-xs font-bold ${
                    m.type === "입고"
                      ? "bg-chart-4/15 text-chart-4"
                      : m.type === "출고"
                        ? "bg-primary/10 text-primary"
                        : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {m.type[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-sm truncate">{m.item}</p>
                  <p className="text-xs text-muted-foreground">
                    {m.date} · {m.by}
                  </p>
                </div>
                <span
                  className={`font-mono font-bold text-sm ${m.qty > 0 ? "text-chart-4" : "text-destructive"}`}
                >
                  {m.qty > 0 ? "+" : ""}
                  {m.qty}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
