"use client"

import { Wrench, Sparkles, ShoppingBag, CalendarCheck } from "lucide-react"
import { useAppMenuSettings } from "@/components/app/app-menu-context"
import {
  getVisibleQuickServices,
  type QuickServiceDefinition,
} from "@/lib/super-admin-data"

const icons: Record<QuickServiceDefinition["menuId"], typeof Wrench> = {
  "string-booking": Wrench,
  "demo-booking": Sparkles,
  shop: ShoppingBag,
  "booking-history": CalendarCheck,
}

export function QuickServices() {
  const settings = useAppMenuSettings()
  const services = getVisibleQuickServices(settings)

  if (services.length === 0) {
    return null
  }

  return (
    <section className="px-5 pb-2">
      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${services.length}, minmax(0, 1fr))` }}
      >
        {services.map((service) => {
          const Icon = icons[service.menuId]
          const bg =
            service.tone === "primary"
              ? "bg-primary text-primary-foreground"
              : service.tone === "accent"
                ? "bg-accent text-accent-foreground"
                : "bg-card text-foreground border border-border"
          return (
            <button
              key={service.menuId}
              className="min-w-0 flex flex-col items-center gap-2 group"
              aria-label={service.label}
            >
              <span
                className={`size-12 @sm:size-14 rounded-2xl ${bg} grid place-items-center group-hover:scale-105 transition-transform shadow-sm`}
              >
                <Icon className="size-5 @sm:size-6" />
              </span>
              <span className="text-[11px] font-medium leading-tight text-center w-full">
                <span className="block truncate">{service.label}</span>
                <span className="block text-[10px] text-muted-foreground font-normal truncate">
                  {service.sub}
                </span>
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
