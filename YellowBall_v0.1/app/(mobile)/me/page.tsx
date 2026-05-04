import Link from "next/link"
import { PageHeader } from "@/components/app/page-header"
import { MeProfile } from "@/components/app/me/me-profile"
import { MeStats } from "@/components/app/me/me-stats"
import { MeMenuList } from "@/components/app/me/me-menu-list"
import { MeRackets } from "@/components/app/me/me-rackets"
import { MeAdminEntry } from "@/components/app/me/me-admin-entry"
import { Settings } from "lucide-react"

export default function MePage() {
  return (
    <>
      <PageHeader
        title="마이"
        back={false}
        right={
          <Link
            href="/me/settings"
            className="size-9 grid place-items-center rounded-full hover:bg-secondary"
            aria-label="설정"
          >
            <Settings className="size-5 text-foreground" />
          </Link>
        }
      />
      <MeProfile />
      <MeStats />
      <MeRackets />
      <MeMenuList />
      <MeAdminEntry />
      <div className="px-5 py-6 text-center">
        <p className="text-[11px] text-muted-foreground">RallyHub v1.0.0 · MVP</p>
        <button className="mt-3 text-xs text-muted-foreground hover:text-destructive">
          로그아웃
        </button>
      </div>
    </>
  )
}
