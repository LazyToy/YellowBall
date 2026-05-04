import Image from "next/image"
import Link from "next/link"
import { Plus, MoreHorizontal } from "lucide-react"

const rackets = [
  {
    name: "Wilson Pro Staff RF97 v14",
    string: "Luxilon ALU Power 1.25 / 50LB",
    lastService: "2026.04.18",
    main: true,
    img: "/racket-wilson.jpg",
  },
  {
    name: "Babolat Pure Aero 2024",
    string: "Solinco Hyper-G Soft / 52LB",
    lastService: "2026.03.27",
    main: false,
    img: "/racket-babolat.jpg",
  },
]

export function MeRackets() {
  return (
    <section className="px-5 pt-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display font-bold text-base">내 라켓</h2>
        <Link
          href="/me/rackets/new"
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
        >
          <Plus className="size-3.5" />
          추가
        </Link>
      </div>

      <div className="space-y-2">
        {rackets.map((r) => (
          <article
            key={r.name}
            className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3"
          >
            <div className="relative size-14 rounded-xl overflow-hidden bg-secondary shrink-0">
              <Image src={r.img} alt={r.name} fill className="object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-semibold text-foreground truncate">{r.name}</p>
                {r.main && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-accent text-accent-foreground">
                    메인
                  </span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground truncate mt-0.5">{r.string}</p>
              <p className="text-[10px] text-muted-foreground/70 mt-0.5">최근 작업 · {r.lastService}</p>
            </div>
            <button
              className="size-8 rounded-full grid place-items-center hover:bg-secondary"
              aria-label="더보기"
            >
              <MoreHorizontal className="size-4 text-muted-foreground" />
            </button>
          </article>
        ))}
      </div>
    </section>
  )
}
