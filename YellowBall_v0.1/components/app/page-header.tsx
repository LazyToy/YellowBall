import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import type { ReactNode } from "react"

export function PageHeader({
  title,
  back,
  right,
}: {
  title: string
  back?: string | false
  right?: ReactNode
}) {
  return (
    <header className="sticky top-0 z-20 bg-background/90 backdrop-blur border-b border-border">
      <div className="flex items-center gap-2 px-4 h-14">
        {back !== false ? (
          <Link
            href={typeof back === "string" ? back : "/"}
            className="-ml-2 size-9 grid place-items-center rounded-full hover:bg-secondary"
            aria-label="뒤로"
          >
            <ChevronLeft className="size-5 text-foreground" />
          </Link>
        ) : (
          <div className="w-1" />
        )}
        <h1 className="font-display font-bold text-lg text-foreground flex-1 truncate">{title}</h1>
        {right}
      </div>
    </header>
  )
}
