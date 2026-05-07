import type React from "react"
import { BottomNav } from "@/components/app/bottom-nav"
import { AppMenuProvider } from "@/components/app/app-menu-context"
import { loadAppMenuSettings, loadStoreProfile } from "@/lib/super-admin-data"

export const dynamic = "force-dynamic"

export default async function MobileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // 메뉴 설정과 매장 정보를 병렬로 로드
  const [menuSettings, storeProfile] = await Promise.all([
    loadAppMenuSettings(),
    loadStoreProfile(),
  ])
  const storeName = storeProfile.storeName || 'YellowBall'

  return (
    <div className="min-h-dvh bg-secondary/50">
      {/* 데스크탑 프레임 레이블 */}
      <div className="hidden md:block pt-10 pb-6">
        <div className="text-center">
          <p className="font-display text-2xl font-bold text-foreground">{storeName}</p>
          <p className="text-sm text-muted-foreground mt-1">
            테니스 &amp; 피클볼 통합 예약 플랫폼 · MVP UI Preview
          </p>
        </div>
      </div>

      {/* 모바일 앱 프레임 */}
      <main
        className="
          app-frame @container
          relative mx-auto w-full max-w-md bg-background flex flex-col
          min-h-dvh
          md:h-[calc(100dvh-7rem)] md:min-h-0 md:rounded-[2.5rem]
          md:shadow-2xl md:shadow-primary/10 md:ring-1 md:ring-border md:overflow-hidden
          md:mb-10
        "
      >
        <AppMenuProvider settings={menuSettings}>
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            {children}
          </div>
          <BottomNav />
        </AppMenuProvider>
      </main>
    </div>
  )
}
