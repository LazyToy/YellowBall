"use client"

import { useState } from "react"
import { PageHeader } from "@/components/app/page-header"
import { BookingTabs, type BookingTab } from "@/components/app/booking/booking-tabs"
import { UpcomingBookings } from "@/components/app/booking/upcoming-bookings"
import { PastBookings } from "@/components/app/booking/past-bookings"
import { NewBookingCTA } from "@/components/app/booking/new-booking-cta"

/** 상위 서버 컴포넌트(BookingPage)에서 storeName을 props로 받아 처리 */
export function BookingPageClient({ storeName }: { storeName?: string }) {
  const [tab, setTab] = useState<BookingTab>("upcoming")

  return (
    <>
      <PageHeader title="내 예약" back={false} />
      <NewBookingCTA />
      <BookingTabs value={tab} onChange={setTab} />
      {tab === "upcoming" ? <UpcomingBookings storeName={storeName} /> : <PastBookings />}
      <div className="h-6" />
    </>
  )
}
