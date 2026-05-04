import Image from "next/image"

export function ShopFeatured() {
  return (
    <section className="px-5 pt-4">
      <div className="relative overflow-hidden rounded-2xl bg-primary text-primary-foreground p-5">
        <div className="relative z-10 max-w-[60%]">
          <p className="text-[11px] font-semibold tracking-wide text-accent">SPRING SALE</p>
          <h3 className="font-display text-xl font-bold leading-tight mt-1 text-balance">
            봄맞이 라켓 최대 25% 할인
          </h3>
          <p className="text-xs text-primary-foreground/80 mt-2">
            성수점 단독 · 시타 후 구매 시 추가 5%
          </p>
          <button className="mt-4 inline-flex h-8 px-3.5 items-center text-xs font-semibold rounded-full bg-accent text-accent-foreground hover:scale-[1.02] transition">
            기획전 보기
          </button>
        </div>
        <div className="absolute -right-6 -bottom-6 w-40 h-40 opacity-90">
          <Image src="/racket-head.jpg" alt="" fill className="object-cover rounded-full" />
        </div>
      </div>
    </section>
  )
}
