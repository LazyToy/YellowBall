import type React from "react"
import { BottomNav } from "@/components/app/bottom-nav"

export default function MobileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-dvh bg-secondary/50">
      {/* Desktop frame label */}
      <div className="hidden md:block pt-10 pb-6">
        <div className="text-center">
          <p className="font-display text-2xl font-bold text-foreground">RallyHub</p>
          <p className="text-sm text-muted-foreground mt-1">
            테니스 & 피클볼 통합 예약 플랫폼 · MVP UI Preview
          </p>
        </div>
      </div>

      {/* Mobile-first centered app frame.
          `app-frame` registers it as a CSS container — child
          components use container queries to adapt to the
          frame's own width, so the same layout works from
          iPhone SE (320px) up to Pro Max (430px) and beyond. */}
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
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {children}
        </div>
        <BottomNav />
      </main>
    </div>
  )
}
