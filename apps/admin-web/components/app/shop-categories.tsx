"use client"

import Image from "next/image"
import { useAppMenuSettings } from "@/components/app/app-menu-context"

const categories = [
  { label: "테니스 라켓", count: 142, image: "/racket-wilson.jpg" },
  { label: "피클볼 패들", count: 38, image: "/pickleball-paddle.jpg" },
  { label: "스트링", count: 87, image: "/string-reel.jpg" },
  { label: "그립 · 댐퍼", count: 64, image: "/racket-babolat.jpg" },
]

export function ShopCategories() {
  const settings = useAppMenuSettings()

  if (!settings.shop) {
    return null
  }

  return (
    <section className="pt-2 pb-4">
      <div className="px-5 mb-3">
        <h2 className="font-display text-[18px] font-bold">카테고리별 쇼핑</h2>
        <p className="text-[12px] text-muted-foreground mt-0.5">
          테니스부터 피클볼까지, 한 곳에서
        </p>
      </div>

      <div className="px-5 grid grid-cols-2 gap-3">
        {categories.map((c) => (
          <button
            key={c.label}
            className="group relative aspect-[4/3] rounded-2xl overflow-hidden bg-secondary text-left"
          >
            <Image
              src={c.image || "/placeholder.svg"}
              alt={c.label}
              fill
              className="object-cover opacity-90 group-hover:scale-105 transition-transform"
              sizes="180px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/20 to-transparent" />
            <div className="absolute inset-0 p-3 flex flex-col justify-end text-primary-foreground">
              <p className="text-[10px] uppercase tracking-wider opacity-80">
                {c.count} items
              </p>
              <p className="text-[14px] font-bold leading-tight">{c.label}</p>
            </div>
          </button>
        ))}
      </div>
    </section>
  )
}
