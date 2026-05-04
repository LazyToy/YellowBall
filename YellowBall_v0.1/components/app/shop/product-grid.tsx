import Image from "next/image"
import { Heart, Star } from "lucide-react"

const products = [
  {
    id: 1,
    name: "Wilson Pro Staff RF97 v14",
    cat: "라켓",
    price: 389000,
    sale: 329000,
    rating: 4.9,
    reviews: 128,
    img: "/racket-wilson.jpg",
    tag: "BEST",
  },
  {
    id: 2,
    name: "Babolat Pure Aero 2024",
    cat: "라켓",
    price: 359000,
    sale: 309000,
    rating: 4.8,
    reviews: 96,
    img: "/racket-babolat.jpg",
    tag: "신상",
  },
  {
    id: 3,
    name: "Luxilon ALU Power 1.25",
    cat: "스트링",
    price: 32000,
    sale: 28000,
    rating: 4.9,
    reviews: 412,
    img: "/string-reel.jpg",
    tag: null,
  },
  {
    id: 4,
    name: "Selkirk Vanguard Power",
    cat: "피클볼",
    price: 269000,
    sale: 229000,
    rating: 4.7,
    reviews: 64,
    img: "/pickleball-paddle.jpg",
    tag: "HOT",
  },
  {
    id: 5,
    name: "Asics Court FF 3",
    cat: "신발",
    price: 219000,
    sale: 189000,
    rating: 4.8,
    reviews: 72,
    img: "/tennis-shoe.jpg",
    tag: null,
  },
  {
    id: 6,
    name: "Wilson Tour 9 Pack",
    cat: "가방",
    price: 159000,
    sale: 139000,
    rating: 4.7,
    reviews: 38,
    img: "/tennis-bag.jpg",
    tag: null,
  },
  {
    id: 7,
    name: "Tourna Grip Original",
    cat: "그립",
    price: 14000,
    sale: 12000,
    rating: 4.9,
    reviews: 588,
    img: "/overgrip.jpg",
    tag: "재입고",
  },
  {
    id: 8,
    name: "Wilson US Open Ball",
    cat: "공",
    price: 12000,
    sale: 9900,
    rating: 4.8,
    reviews: 244,
    img: "/ball-can.jpg",
    tag: null,
  },
]

const fmt = (n: number) => n.toLocaleString("ko-KR")

export function ProductGrid() {
  return (
    <section className="px-5 pt-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display font-bold text-base">전체 상품</h2>
        <p className="text-xs text-muted-foreground">{products.length}개</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {products.map((p) => {
          const off = Math.round((1 - p.sale / p.price) * 100)
          return (
            <article
              key={p.id}
              className="rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/40 hover:shadow-md hover:shadow-primary/5 transition"
            >
              <div className="relative aspect-square bg-secondary">
                <Image src={p.img} alt={p.name} fill className="object-cover" />
                <button
                  aria-label="찜"
                  className="absolute top-2 right-2 size-7 rounded-full grid place-items-center bg-card/90 backdrop-blur"
                >
                  <Heart className="size-3.5 text-muted-foreground" />
                </button>
                {p.tag && (
                  <span className="absolute top-2 left-2 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-primary text-primary-foreground">
                    {p.tag}
                  </span>
                )}
              </div>
              <div className="p-3">
                <p className="text-[10px] text-muted-foreground">{p.cat}</p>
                <p className="text-xs font-semibold text-foreground line-clamp-2 mt-0.5 leading-tight min-h-[2rem]">
                  {p.name}
                </p>
                <div className="mt-1.5 flex items-baseline gap-1.5">
                  <span className="text-[10px] font-bold text-destructive">{off}%</span>
                  <span className="text-sm font-bold text-foreground">{fmt(p.sale)}원</span>
                </div>
                <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Star className="size-3 fill-accent text-accent" />
                  <span className="font-semibold text-foreground">{p.rating}</span>
                  <span>({p.reviews})</span>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
