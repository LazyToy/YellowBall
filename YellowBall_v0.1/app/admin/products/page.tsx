import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { Plus, Search, MoreVertical } from "lucide-react"
import Image from "next/image"

const products = [
  { sku: "ST-001", name: "Babolat RPM Blast 1.25", category: "스트링", price: 32000, stock: 24, status: "판매중", img: "/string-reel.jpg" },
  { sku: "ST-002", name: "Luxilon ALU Power 1.25", category: "스트링", price: 38000, stock: 8, status: "판매중", img: "/string-reel.jpg" },
  { sku: "RK-101", name: "Wilson Pro Staff 97 v14", category: "라켓", price: 358000, stock: 3, status: "판매중", img: "/racket-wilson.jpg" },
  { sku: "RK-102", name: "Babolat Pure Aero 100", category: "라켓", price: 339000, stock: 0, status: "품절", img: "/racket-babolat.jpg" },
  { sku: "PB-201", name: "Joola Hyperion CFS 16", category: "피클볼", price: 189000, stock: 12, status: "판매중", img: "/pickleball-paddle.jpg" },
  { sku: "AC-301", name: "Wilson Pro Overgrip 3pk", category: "악세서리", price: 9000, stock: 56, status: "판매중", img: "/overgrip.jpg" },
  { sku: "AC-302", name: "Babolat Team 12R 가방", category: "가방", price: 159000, stock: 4, status: "판매중", img: "/tennis-bag.jpg" },
  { sku: "BL-401", name: "Wilson US Open 4볼", category: "공", price: 7500, stock: 120, status: "판매중", img: "/ball-can.jpg" },
]

const statusStyle: Record<string, string> = {
  판매중: "bg-chart-4/15 text-chart-4",
  품절: "bg-destructive/10 text-destructive",
  비활성: "bg-muted text-muted-foreground",
}

export default function AdminProductsPage() {
  return (
    <div>
      <AdminPageHeader
        title="상품 관리"
        description="라켓, 스트링, 악세서리 등 판매 상품 관리"
        actions={
          <>
            <button className="h-9 px-3 rounded-lg border border-border text-xs font-semibold hover:bg-secondary">
              가져오기
            </button>
            <button className="h-9 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1.5 hover:opacity-90">
              <Plus className="size-3.5" />
              상품 등록
            </button>
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="flex-1 min-w-64 h-9 rounded-lg bg-card border border-border px-3 flex items-center gap-2">
          <Search className="size-4 text-muted-foreground" />
          <input placeholder="SKU, 상품명 검색" className="flex-1 bg-transparent text-sm focus:outline-none" />
        </div>
        {["전체", "스트링", "라켓", "피클볼", "악세서리", "가방", "공"].map((c, i) => (
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
        <table className="w-full text-sm">
          <thead className="bg-secondary/60 text-muted-foreground text-xs">
            <tr>
              <th className="text-left font-semibold px-4 py-3 w-12">
                <input type="checkbox" className="accent-primary" />
              </th>
              <th className="text-left font-semibold px-4 py-3">상품</th>
              <th className="text-left font-semibold px-4 py-3">SKU</th>
              <th className="text-left font-semibold px-4 py-3">카테고리</th>
              <th className="text-right font-semibold px-4 py-3">가격</th>
              <th className="text-right font-semibold px-4 py-3">재고</th>
              <th className="text-left font-semibold px-4 py-3">상태</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.sku} className="border-t border-border hover:bg-secondary/40">
                <td className="px-4 py-3">
                  <input type="checkbox" className="accent-primary" />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-lg bg-secondary overflow-hidden grid place-items-center shrink-0">
                      <Image src={p.img || "/placeholder.svg"} alt={p.name} width={40} height={40} className="object-cover" />
                    </div>
                    <span className="font-semibold text-foreground">{p.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{p.sku}</td>
                <td className="px-4 py-3 text-foreground">{p.category}</td>
                <td className="px-4 py-3 text-right font-semibold text-foreground">
                  ₩{p.price.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right">
                  <span
                    className={`font-semibold ${
                      p.stock === 0 ? "text-destructive" : p.stock < 10 ? "text-chart-4" : "text-foreground"
                    }`}
                  >
                    {p.stock}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`text-[10px] font-bold px-2 py-1 rounded-full ${statusStyle[p.status]}`}
                  >
                    {p.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button className="size-7 grid place-items-center rounded-md hover:bg-secondary">
                    <MoreVertical className="size-4 text-muted-foreground" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
