import { NewStringBookingPageClient } from "./new-booking-page-client"
import { loadAdminSettingsPageData, normalizeShopSchedule } from "@/lib/super-admin-data"

export default async function NewStringBookingPage() {
  let scheduleRows = normalizeShopSchedule([])

  try {
    const pageData = await loadAdminSettingsPageData()
    scheduleRows = pageData.schedule
  } catch (error) {
    console.error("[NewStringBookingPage]", error)
  }

  return <NewStringBookingPageClient scheduleRows={scheduleRows} />
}
