import Image from "next/image"
import Link from "next/link"
import { Plus, ChevronRight } from "lucide-react"

const rackets = [
  {
    brand: "Wilson",
    model: "Blade 98 v9",
    image: "/racket-wilson.jpg",
    isPrimary: true,
    string: "Hyper-G",
    tension: "48 / 46",
  },
  {
    brand: "Babolat",
    model: "Pure Aero",
    image: "/racket-babolat.jpg",
    isPrimary: false,
    string: "RPM Blast",
    tension: "52 / 50",
  },
]

export function MyRackets() {
  return (
    <section className="pt-2 pb-3">
      <div className="px-5 flex items-center justify-between mb-3">
        <div>
          <h2 className="font-display text-[15px] font-bold">내 라켓</h2>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            저장된 조합으로 빠르게 예약
          </p>
        </div>
        <button className="text-[12px] text-muted-foreground flex items-center gap-0.5 hover:text-foreground">
          관리 <ChevronRight className="size-3.5" />
        </button>
      </div>

      <div className="flex gap-3 overflow-x-auto no-scrollbar px-5 pb-1">
        {rackets.map((r) => (
          <article
            key={r.model}
            className="shrink-0 w-[210px] rounded-2xl bg-card border border-border p-3 hover:border-primary/40 transition-colors"
          >
            <div className="relative aspect-[4/3] rounded-xl bg-secondary overflow-hidden">
              <Image
                src={r.image || "/placeholder.svg"}
                alt={`${r.brand} ${r.model}`}
                fill
                className="object-cover"
                sizes="210px"
              />
              {r.isPrimary && (
                <span className="absolute top-2 left-2 inline-flex items-center text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary text-primary-foreground">
                  메인
                </span>
              )}
            </div>
            <div className="mt-3">
              <p className="text-[11px] text-muted-foreground">{r.brand}</p>
              <p className="text-[14px] font-semibold leading-tight mt-0.5">
                {r.model}
              </p>
              <div className="mt-2 flex items-center gap-1.5 text-[11px]">
                <span className="px-1.5 py-0.5 rounded-md bg-secondary text-secondary-foreground">
                  {r.string}
                </span>
                <span className="text-muted-foreground">{r.tension} lbs</span>
              </div>
            </div>
          </article>
        ))}

        {/* Add new */}
        <Link
          href="/me/rackets/new"
          className="shrink-0 w-[140px] rounded-2xl border-2 border-dashed border-border hover:border-primary/40 hover:bg-secondary/50 transition-colors flex flex-col items-center justify-center gap-2 text-muted-foreground"
        >
          <span className="size-9 rounded-full bg-secondary grid place-items-center">
            <Plus className="size-5" />
          </span>
          <span className="text-[12px] font-medium">라켓 추가</span>
        </Link>
      </div>
    </section>
  )
}
