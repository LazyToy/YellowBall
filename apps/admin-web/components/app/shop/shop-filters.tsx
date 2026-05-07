"use client"

import { useState } from "react"

const filters = [
  { id: "all", label: "전체" },
  { id: "racket", label: "라켓" },
  { id: "string", label: "스트링" },
  { id: "shoes", label: "신발" },
  { id: "bag", label: "가방" },
  { id: "ball", label: "공" },
  { id: "grip", label: "그립" },
  { id: "apparel", label: "의류" },
]

export function ShopFilters() {
  const [active, setActive] = useState("all")
  return (
    <div className="pt-4">
      <div className="no-scrollbar flex gap-2 overflow-x-auto px-5 pb-1">
        {filters.map((f) => {
          const a = active === f.id
          return (
            <button
              key={f.id}
              onClick={() => setActive(f.id)}
              className={`shrink-0 px-3.5 h-8 rounded-full text-xs font-medium transition border ${
                a
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-foreground border-border hover:border-primary/40"
              }`}
            >
              {f.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
