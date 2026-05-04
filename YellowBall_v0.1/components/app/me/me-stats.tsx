import { Wrench, Sparkles, ShoppingBag, Heart } from "lucide-react"

const items = [
  { label: "스트링 작업", value: 14, icon: Wrench },
  { label: "시타", value: 6, icon: Sparkles },
  { label: "주문", value: 9, icon: ShoppingBag },
  { label: "찜", value: 23, icon: Heart },
]

export function MeStats() {
  return (
    <section className="px-5 pt-4">
      <div className="grid grid-cols-4 gap-2 rounded-2xl border border-border bg-card p-3">
        {items.map((it) => {
          const Icon = it.icon
          return (
            <button
              key={it.label}
              className="flex flex-col items-center justify-center py-2 rounded-xl hover:bg-secondary/70 transition"
            >
              <Icon className="size-4 text-primary" />
              <p className="font-display font-bold text-base text-foreground mt-1">{it.value}</p>
              <p className="text-[10px] text-muted-foreground">{it.label}</p>
            </button>
          )
        })}
      </div>
    </section>
  )
}
