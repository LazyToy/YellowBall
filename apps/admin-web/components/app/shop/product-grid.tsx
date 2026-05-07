import Image from "next/image"
import { Heart, Star } from "lucide-react"

type ShopProductRow = {
  id: string
  name: string
  category: string
  image_path: string | null
  image_url: string | null
  price: number
  sale_price: number
  rating_average: number
  review_count: number
  tag: string | null
}

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.EXPO_PUBLIC_SUPABASE_URL
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY ??
  process.env.SUPABASE_SERVICE_ROLE_KEY

const fmt = (n: number) => n.toLocaleString("ko-KR")

const getStorageUrl = (value?: string | null) => {
  const trimmed = value?.trim()

  if (!trimmed) {
    return null
  }

  if (/^(https?:|data:|blob:)/i.test(trimmed) || !supabaseUrl) {
    return trimmed
  }

  const path = trimmed
    .replace(/^\/+/, "")
    .replace(/^app-assets\//, "")
    .split("/")
    .filter(Boolean)
    .map(encodeURIComponent)
    .join("/")

  return `${supabaseUrl.replace(/\/+$/, "")}/storage/v1/object/public/app-assets/${path}`
}

async function getProducts() {
  if (!supabaseUrl || !supabaseKey) {
    return []
  }

  const url = new URL("/rest/v1/shop_products", supabaseUrl)
  url.searchParams.set("select", "*")
  url.searchParams.set("is_active", "eq.true")
  url.searchParams.set("order", "sort_order.asc,created_at.desc")

  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    },
  })

  if (!response.ok) {
    return []
  }

  return (await response.json()) as ShopProductRow[]
}

export async function ProductGrid() {
  const products = await getProducts()

  return (
    <section className="px-5 pt-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-base font-bold">전체 상품</h2>
        <p className="text-xs text-muted-foreground">{products.length}개</p>
      </div>
      {products.length === 0 ? (
        <p className="rounded-lg border border-border bg-card px-4 py-6 text-center text-xs text-muted-foreground">
          등록된 상품이 없습니다.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {products.map((p) => {
            const off = Math.round((1 - p.sale_price / p.price) * 100)
            const imageUrl = getStorageUrl(p.image_path ?? p.image_url)

            return (
              <article
                key={p.id}
                className="overflow-hidden rounded-2xl border border-border bg-card transition hover:border-primary/40 hover:shadow-md hover:shadow-primary/5"
              >
                <div className="relative aspect-square bg-secondary">
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={p.name}
                      fill
                      className="object-cover"
                      sizes="50vw"
                    />
                  ) : null}
                  <button
                    aria-label="찜하기"
                    className="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-card/90 backdrop-blur"
                  >
                    <Heart className="size-3.5 text-muted-foreground" />
                  </button>
                  {p.tag ? (
                    <span className="absolute left-2 top-2 rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                      {p.tag}
                    </span>
                  ) : null}
                </div>
                <div className="p-3">
                  <p className="text-[10px] text-muted-foreground">
                    {p.category}
                  </p>
                  <p className="mt-0.5 min-h-[2rem] text-xs font-semibold leading-tight text-foreground line-clamp-2">
                    {p.name}
                  </p>
                  <div className="mt-1.5 flex items-baseline gap-1.5">
                    <span className="text-[10px] font-bold text-destructive">
                      {off}%
                    </span>
                    <span className="text-sm font-bold text-foreground">
                      {fmt(p.sale_price)}원
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Star className="size-3 fill-accent text-accent" />
                    <span className="font-semibold text-foreground">
                      {Number(p.rating_average).toFixed(1)}
                    </span>
                    <span>({p.review_count})</span>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
