import Image from "next/image"
import { Flame } from "lucide-react"

const strings = [
  {
    brand: "Solinco",
    name: "Hyper-G Soft",
    gauge: "1.20",
    price: "28,000",
    tag: "베스트셀러",
    color: "bg-accent text-accent-foreground",
  },
  {
    brand: "Luxilon",
    name: "ALU Power",
    gauge: "1.25",
    price: "34,000",
    tag: "프로 추천",
    color: "bg-primary text-primary-foreground",
  },
  {
    brand: "Babolat",
    name: "RPM Blast",
    gauge: "1.25",
    price: "26,000",
    tag: "신상",
    color: "bg-secondary text-secondary-foreground border border-border",
  },
]

export function FeaturedStrings() {
  return (
    <section className="pt-3 pb-3">
      <div className="px-5 flex items-end justify-between mb-3">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Flame className="size-3.5 text-destructive" />
            이번 주 인기
          </div>
          <h2 className="font-display text-[18px] font-bold mt-0.5">
            지금 많이 찾는 스트링
          </h2>
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto no-scrollbar px-5 pb-1">
        {strings.map((s) => (
          <article
            key={s.name}
            className="shrink-0 w-[160px] rounded-2xl bg-card border border-border overflow-hidden hover:border-primary/40 transition-colors"
          >
            <div className="relative aspect-square bg-secondary">
              <Image
                src="/string-reel.jpg"
                alt={s.name}
                fill
                className="object-cover"
                sizes="160px"
              />
              <span
                className={`absolute top-2 left-2 inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full ${s.color}`}
              >
                {s.tag}
              </span>
            </div>
            <div className="p-3">
              <p className="text-[11px] text-muted-foreground">{s.brand}</p>
              <p className="text-[13px] font-semibold leading-tight mt-0.5 truncate">
                {s.name}
              </p>
              <div className="mt-1.5 flex items-baseline justify-between">
                <span className="text-[14px] font-bold">₩{s.price}</span>
                <span className="text-[10px] text-muted-foreground">
                  {s.gauge}mm
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
