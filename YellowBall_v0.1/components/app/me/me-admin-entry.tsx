import Link from "next/link"
import { Shield, ChevronRight, Smartphone } from "lucide-react"

export function MeAdminEntry() {
  return (
    <section className="px-5 pt-6 space-y-3">
      <Link
        href="/admin"
        className="flex items-center gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-4 hover:bg-primary/10 transition"
      >
        <div className="size-10 rounded-xl grid place-items-center bg-primary text-primary-foreground shrink-0">
          <Shield className="size-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-sm font-semibold text-foreground">관리자 모드</p>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-primary text-primary-foreground shrink-0">
              샵 매니저
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
            서울 성수점 운영 대시보드로 이동
          </p>
        </div>
        <ChevronRight className="size-4 text-muted-foreground shrink-0" />
      </Link>

      <Link
        href="/preview"
        target="_blank"
        className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 hover:bg-secondary/60 transition"
      >
        <div className="size-10 rounded-xl grid place-items-center bg-accent text-accent-foreground shrink-0">
          <Smartphone className="size-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">디바이스 미리보기</p>
          <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
            여러 폰 크기에서 한 번에 확인 (320 – 430px)
          </p>
        </div>
        <ChevronRight className="size-4 text-muted-foreground shrink-0" />
      </Link>
    </section>
  )
}
