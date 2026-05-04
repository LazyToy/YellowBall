import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { Plus, MoreVertical } from "lucide-react"
import Image from "next/image"

const rackets = [
  { name: "Wilson Pro Staff 97 v14", spec: "315g · 헤드 97", string: "Luxilon ALU Power 1.25", tension: "52lbs", available: true, bookings: 12, img: "/racket-wilson.jpg" },
  { name: "Babolat Pure Aero 100", spec: "300g · 헤드 100", string: "RPM Blast 1.25", tension: "54lbs", available: false, bookings: 18, img: "/racket-babolat.jpg" },
  { name: "Yonex EZONE 100", spec: "300g · 헤드 100", string: "Poly Tour Pro", tension: "50lbs", available: true, bookings: 9, img: "/racket-head.jpg" },
  { name: "Head Speed MP", spec: "300g · 헤드 100", string: "Hawk Touch 1.25", tension: "52lbs", available: true, bookings: 7, img: "/racket-wilson.jpg" },
  { name: "Tecnifibre TF-X1", spec: "285g · 헤드 105", string: "Triax 1.28", tension: "48lbs", available: true, bookings: 5, img: "/racket-babolat.jpg" },
  { name: "Wilson Blade 98 v8", spec: "305g · 헤드 98", string: "Hyper-G 1.20", tension: "55lbs", available: false, bookings: 14, img: "/racket-head.jpg" },
]

export default function AdminDemoPage() {
  return (
    <div>
      <AdminPageHeader
        title="시타 라켓 관리"
        description="시타용 라켓 등록, 스트링/텐션 관리, 예약 가능 상태 토글"
        actions={
          <button className="h-9 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1.5 hover:opacity-90">
            <Plus className="size-3.5" />
            라켓 등록
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {rackets.map((r) => (
          <div key={r.name} className="bg-card rounded-2xl border border-border p-4 flex flex-col">
            <div className="flex items-start justify-between mb-2">
              <span
                className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                  r.available ? "bg-chart-4/15 text-chart-4" : "bg-muted text-muted-foreground"
                }`}
              >
                {r.available ? "시타 가능" : "시타 중"}
              </span>
              <button className="size-7 grid place-items-center rounded-md hover:bg-secondary">
                <MoreVertical className="size-4 text-muted-foreground" />
              </button>
            </div>
            <div className="bg-secondary rounded-xl aspect-[4/3] grid place-items-center mb-3 overflow-hidden">
              <Image src={r.img || "/placeholder.svg"} alt={r.name} width={240} height={180} className="object-contain w-full h-full" />
            </div>
            <h3 className="font-display font-bold text-foreground leading-tight">{r.name}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{r.spec}</p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
              <div className="rounded-lg bg-secondary/60 px-2 py-1.5">
                <p className="text-muted-foreground">스트링</p>
                <p className="font-semibold text-foreground truncate">{r.string}</p>
              </div>
              <div className="rounded-lg bg-secondary/60 px-2 py-1.5">
                <p className="text-muted-foreground">텐션</p>
                <p className="font-semibold text-foreground">{r.tension}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">누적 예약 {r.bookings}회</span>
              <button className="font-semibold text-primary hover:underline">상세 →</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
