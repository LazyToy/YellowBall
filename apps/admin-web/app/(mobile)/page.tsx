import { TopBar } from "@/components/app/top-bar"
import { GreetingHero } from "@/components/app/greeting-hero"
import { QuickServices } from "@/components/app/quick-services"
import { BookingStatus } from "@/components/app/booking-status"
import { MyRackets } from "@/components/app/my-rackets"
import { ShopHours } from "@/components/app/shop-hours"
import { DemoRackets } from "@/components/app/demo-rackets"
import { PromoBanner } from "@/components/app/promo-banner"
import { FeaturedStrings } from "@/components/app/featured-strings"
import { ShopCategories } from "@/components/app/shop-categories"

export default function HomePage() {
  return (
    <>
      <TopBar />
      <GreetingHero />
      <QuickServices />
      <BookingStatus />
      <MyRackets />
      <ShopHours />
      <DemoRackets />
      <PromoBanner />
      <FeaturedStrings />
      <ShopCategories />

      <div className="px-5 pt-4 pb-6">
        <p className="text-center text-[11px] text-muted-foreground">Yellow Ball · 원주 테니스 스트링 & 피클볼</p>
        <p className="text-center text-[10px] text-muted-foreground/70 mt-0.5">© 2026 Yellow Ball Korea · Wonju</p>
      </div>
    </>
  )
}
