"use client"

import { useState } from "react"
import { PageHeader } from "@/components/app/page-header"
import { BookingTabs, type BookingTab } from "@/components/app/booking/booking-tabs"
import { UpcomingBookings } from "@/components/app/booking/upcoming-bookings"
import { PastBookings } from "@/components/app/booking/past-bookings"
import { NewBookingCTA } from "@/components/app/booking/new-booking-cta"

export default function BookingPage() {
  const [tab, setTab] = useState<BookingTab>("upcoming")

  return (
    <>
      <PageHeader title="내 예약" back={false} />
      <NewBookingCTA />
      <BookingTabs value={tab} onChange={setTab} />
      {tab === "upcoming" ? <UpcomingBookings /> : <PastBookings />}
      <div className="h-6" />
    </>
  )
}
