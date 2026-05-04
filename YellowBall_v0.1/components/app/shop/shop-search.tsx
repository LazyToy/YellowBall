import { Search, SlidersHorizontal } from "lucide-react"

export function ShopSearch() {
  return (
    <div className="px-5 pt-4">
      <div className="flex items-center gap-2">
        <div className="flex-1 flex items-center gap-2 h-11 rounded-full bg-secondary px-4">
          <Search className="size-4 text-muted-foreground" />
          <input
            placeholder="라켓, 스트링, 신발 검색"
            className="flex-1 bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
          />
        </div>
        <button
          className="size-11 rounded-full grid place-items-center bg-card border border-border"
          aria-label="필터"
        >
          <SlidersHorizontal className="size-4 text-foreground" />
        </button>
      </div>
    </div>
  )
}
