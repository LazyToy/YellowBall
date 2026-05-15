import type React from "react"
import { redirect } from "next/navigation"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminTopbar } from "@/components/admin/admin-topbar"
import { buildAdminLoginPath } from "@/lib/admin-auth-core"
import { getCurrentAdmin } from "@/lib/admin-auth"
import { loadStoreProfile } from "@/lib/super-admin-data"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await getCurrentAdmin()

  if (!admin) {
    redirect(buildAdminLoginPath('/admin'))
  }

  // 매장 정보를 DB에서 로드 (실패 시 빈 문자열로 폴백)
  const storeProfile = await loadStoreProfile()
  const storeName = storeProfile.storeName || undefined

  return (
    <div className="min-h-dvh bg-secondary/40 flex">
      <AdminSidebar
        permissions={admin.permissions}
        profile={admin.profile}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminTopbar profile={admin.profile} storeName={storeName} />
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </div>
  )
}
