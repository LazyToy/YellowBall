"use client"

import Link from "next/link"
import { Plus } from "lucide-react"

type Racket = {
  id: string
  brand: string
  model: string
  weight: string
  primary: boolean
}

const RACKETS: Racket[] = [
  { id: "r1", brand: "Wilson", model: "Pro Staff RF97 v14", weight: "340g", primary: true },
  { id: "r2", brand: "Babolat", model: "Pure Aero 2024", weight: "300g", primary: false },
  { id: "r3", brand: "Yonex", model: "VCORE 98", weight: "305g", primary: false },
]

type Props = {
  selectedId: string | null
  onSelect: (id: string) => void
}

export function RacketSelector({ selectedId, onSelect }: Props) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="font-display font-bold text-base">라켓 선택</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            내 라켓 라이브러리에서 선택
          </p>
        </div>
        <Link
          href="/me/rackets/new"
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
        >
          <Plus className="size-3.5" />
          라켓 추가
        </Link>
      </div>

      <div className="space-y-2">
        {RACKETS.map((r) => {
          const isSelected = selectedId === r.id
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => onSelect(r.id)}
              className={[
                "w-full flex items-center gap-3 rounded-xl border p-3 text-left transition",
                isSelected
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border bg-background hover:border-primary/40",
              ].join(" ")}
            >
              <div
                className={[
                  "size-5 rounded-full border-2 grid place-items-center shrink-0",
                  isSelected ? "border-primary" : "border-muted-foreground/40",
                ].join(" ")}
              >
                {isSelected && <span className="size-2.5 rounded-full bg-primary" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="font-semibold text-foreground text-sm truncate">
                    {r.brand} {r.model}
                  </p>
                  {r.primary && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-accent text-accent-foreground shrink-0">
                      MAIN
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">{r.weight}</p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
