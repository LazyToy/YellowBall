"use client"

import Image from "next/image"
import { Star, ChevronRight } from "lucide-react"
import { useAppMenuSettings } from "@/components/app/app-menu-context"

const demos = [
  {
    brand: "Wilson",
    model: "Pro Staff 97 v14",
    image: "/racket-wilson.jpg",
    rating: 4.8,
    weight: "315g",
    available: true,
    spec: "헤드 97 · 그립 2",
  },
  {
    brand: "Babolat",
    model: "Pure Drive 2024",
    image: "/racket-babolat.jpg",
    rating: 4.6,
    weight: "300g",
    available: false,
    spec: "헤드 100 · 그립 2",
  },
]

export function DemoRackets() {
  const settings = useAppMenuSettings()

  if (!settings["demo-booking"]) {
    return null
  }

  return (
    <section className="pt-3 pb-4">
      <div className="px-5 flex items-end justify-between mb-3">
        <div>
          <span className="inline-flex items-center text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-accent text-accent-foreground">
            DEMO
          </span>
          <h2 className="font-display text-[18px] font-bold mt-1.5">
            오늘 시타 가능한 라켓
          </h2>
        </div>
        <button className="text-[12px] text-muted-foreground flex items-center gap-0.5 hover:text-foreground">
          전체 <ChevronRight className="size-3.5" />
        </button>
      </div>

      <div className="px-5 grid grid-cols-2 gap-3">
        {demos.map((d) => (
          <article
            key={d.model}
            className="rounded-2xl bg-card border border-border overflow-hidden hover:border-primary/40 transition-colors"
          >
            <div className="relative aspect-square bg-secondary">
              <Image
                src={d.image || "/placeholder.svg"}
                alt={`${d.brand} ${d.model}`}
                fill
                className="object-cover"
                sizes="160px"
              />
              <span
                className={`absolute top-2 left-2 inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  d.available
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {d.available ? "예약 가능" : "대여 중"}
              </span>
            </div>
            <div className="p-3">
              <div className="flex items-center justify-between gap-1">
                <p className="text-[11px] text-muted-foreground">{d.brand}</p>
                <span className="flex items-center gap-0.5 text-[11px] font-medium">
                  <Star className="size-3 fill-accent text-accent" />
                  {d.rating}
                </span>
              </div>
              <p className="text-[13px] font-semibold leading-tight mt-0.5 truncate">
                {d.model}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {d.spec} · {d.weight}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
