"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowUpRight, Smartphone, RefreshCw } from "lucide-react"

const DEVICES = [
  { id: "se", name: "iPhone SE", width: 320, height: 568 },
  { id: "s24", name: "Galaxy S24", width: 360, height: 780 },
  { id: "ip15", name: "iPhone 15", width: 393, height: 720 },
  { id: "max", name: "iPhone 15 Pro Max", width: 430, height: 760 },
] as const

const ROUTES = [
  { id: "home", label: "홈", path: "/" },
  { id: "booking", label: "예약", path: "/booking" },
  { id: "new", label: "새 예약", path: "/booking/string/new" },
  { id: "shop", label: "샵", path: "/shop" },
  { id: "me", label: "마이", path: "/me" },
] as const

export default function PreviewPage() {
  const [route, setRoute] = useState<(typeof ROUTES)[number]["path"]>("/")
  const [reloadKey, setReloadKey] = useState(0)

  return (
    <div className="min-h-dvh bg-secondary/40 text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/90 backdrop-blur border-b border-border">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="size-9 rounded-xl bg-primary text-primary-foreground grid place-items-center">
              <Smartphone className="size-5" />
            </div>
            <div className="min-w-0">
              <h1 className="font-display font-bold text-base truncate">
                YellowBall · 디바이스 미리보기
              </h1>
              <p className="text-xs text-muted-foreground truncate">
                다양한 핸드폰 크기에서 동시에 확인하세요 (320 – 430px)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setReloadKey((k) => k + 1)}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 transition"
            >
              <RefreshCw className="size-3.5" />
              새로고침
            </button>
            <Link
              href={route}
              target="_blank"
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition"
            >
              실제 보기
              <ArrowUpRight className="size-3.5" />
            </Link>
          </div>
        </div>

        {/* Route tabs */}
        <div className="max-w-[1600px] mx-auto px-6 pb-3">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {ROUTES.map((r) => {
              const active = r.path === route
              return (
                <button
                  key={r.id}
                  onClick={() => setRoute(r.path)}
                  className={`shrink-0 px-3 h-8 rounded-full text-xs font-medium transition ${
                    active
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-card text-muted-foreground border border-border hover:text-foreground"
                  }`}
                >
                  {r.label}
                  <span
                    className={`ml-1.5 font-mono text-[10px] ${
                      active ? "text-primary-foreground/70" : "text-muted-foreground/70"
                    }`}
                  >
                    {r.path}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </header>

      {/* Devices */}
      <main className="max-w-[1600px] mx-auto px-6 py-8">
        <div className="flex flex-wrap items-start justify-center gap-8 lg:gap-10">
          {DEVICES.map((d) => (
            <DeviceFrame
              key={d.id}
              name={d.name}
              width={d.width}
              height={d.height}
              src={route}
              reloadKey={reloadKey}
            />
          ))}
        </div>

        <p className="mt-12 text-center text-xs text-muted-foreground">
          실제 디바이스 폭({DEVICES.map((d) => `${d.width}px`).join(" · ")})으로 동일한 앱을 렌더링합니다.
          <br />
          모바일 프레임이 컨테이너 쿼리 기반으로 자동 적응합니다.
        </p>
      </main>
    </div>
  )
}

function DeviceFrame({
  name,
  width,
  height,
  src,
  reloadKey,
}: {
  name: string
  width: number
  height: number
  src: string
  reloadKey: number
}) {
  return (
    <figure className="flex flex-col items-center gap-3">
      <figcaption className="flex items-baseline gap-2">
        <span className="font-display font-bold text-sm text-foreground">{name}</span>
        <span className="font-mono text-[11px] text-muted-foreground">
          {width} × {height}
        </span>
      </figcaption>

      {/* Phone bezel */}
      <div
        className="relative bg-foreground rounded-[2.2rem] p-2 shadow-2xl shadow-foreground/20 ring-1 ring-foreground/10"
        style={{ width: width + 16 }}
      >
        {/* Notch */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 h-5 w-24 rounded-b-2xl bg-foreground" />

        {/* Screen */}
        <div
          className="relative overflow-hidden rounded-[1.7rem] bg-background"
          style={{ width, height }}
        >
          <iframe
            key={reloadKey}
            src={src}
            title={`${name} preview`}
            className="block border-0"
            style={{ width, height }}
            // Prevent iframe from triggering scrolls outside
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
        </div>
      </div>
    </figure>
  )
}
