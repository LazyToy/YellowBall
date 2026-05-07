import { loadStoreProfile } from "@/lib/super-admin-data"
import { BookingPageClient } from "./booking-page-client"

export default async function BookingPage() {
  // DB에서 매장명 로드 후 클라이언트 컴포넌트에 전달
  const storeProfile = await loadStoreProfile()
  const storeName = storeProfile.storeName || undefined

  return <BookingPageClient storeName={storeName} />
}
