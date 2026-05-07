import type { Metadata } from "next"
import { Geist, Manrope } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const pretendard = Geist({
  subsets: ["latin"],
  variable: "--font-pretendard",
})

const display = Manrope({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700", "800"],
})

export const metadata: Metadata = {
  title: "Yellow Ball — 테니스 스트링 & 피클볼 패들",
  description: "스트링 작업·라켓 시타·피클볼 패들을 한 번에. 원주 옐로볼 통합 예약 플랫폼.",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko" className={`${pretendard.variable} ${display.variable} bg-background`}>
      <body className="font-sans antialiased">
        {children}
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  )
}
