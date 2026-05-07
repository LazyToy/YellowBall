import { PageHeader } from "@/components/app/page-header"
import { ShopSearch } from "@/components/app/shop/shop-search"
import { ShopFilters } from "@/components/app/shop/shop-filters"
import { ShopFeatured } from "@/components/app/shop/shop-featured"
import { ProductGrid } from "@/components/app/shop/product-grid"
import { ShoppingCart } from "lucide-react"

export default function ShopPage() {
  return (
    <>
      <PageHeader
        title="샵"
        back={false}
        right={
          <button className="relative size-9 grid place-items-center rounded-full hover:bg-secondary" aria-label="장바구니">
            <ShoppingCart className="size-5 text-foreground" />
            <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 grid place-items-center rounded-full bg-accent text-accent-foreground text-[10px] font-bold">
              2
            </span>
          </button>
        }
      />
      <ShopSearch />
      <ShopFilters />
      <ShopFeatured />
      <ProductGrid />
      <div className="h-6" />
    </>
  )
}
