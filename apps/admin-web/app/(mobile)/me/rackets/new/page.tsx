"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Camera, Star, Check } from "lucide-react"
import { PageHeader } from "@/components/app/page-header"
import { ActionFeedbackDialog } from "@/components/admin/action-dialogs"

const BRANDS = [
  "Wilson",
  "Babolat",
  "Yonex",
  "Head",
  "Prince",
  "Tecnifibre",
  "Dunlop",
  "기타",
]
const HEAD_SIZES = ["95", "98", "100", "104+"] as const
const WEIGHTS = ["285g", "300g", "315g", "330g", "기타"] as const
const GRIPS = ["1", "2", "3", "4"] as const
const PURPOSES = ["올라운드", "단식", "복식"] as const

export default function NewRacketPage() {
  const router = useRouter()

  const [brand, setBrand] = useState<string | null>(null)
  const [model, setModel] = useState("")
  const [headSize, setHeadSize] = useState<string | null>(null)
  const [weight, setWeight] = useState<string | null>(null)
  const [grip, setGrip] = useState<string | null>(null)
  const [purpose, setPurpose] = useState<string | null>("올라운드")
  const [setPrimary, setSetPrimary] = useState(false)
  const [memo, setMemo] = useState("")
  const [showSuccess, setShowSuccess] = useState(false)

  const canSave = brand !== null && model.trim().length > 0

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!canSave) return
    setShowSuccess(true)
  }

  return (
    <>
      <ActionFeedbackDialog
        open={showSuccess}
        title="라켓 정보가 저장되었습니다"
        description="확인을 누르면 내 정보로 이동합니다."
        onConfirm={() => router.push("/me")}
      />
      <PageHeader title="라켓 추가" back="/me" />

      <form onSubmit={handleSave} className="pb-32">
        {/* Photo upload */}
        <section className="px-5 pt-4">
          <button
            type="button"
            className="relative w-full aspect-[4/3] rounded-2xl border-2 border-dashed border-border bg-secondary/40 hover:bg-secondary/70 transition flex flex-col items-center justify-center gap-2 text-muted-foreground"
          >
            <span className="size-12 rounded-full bg-card grid place-items-center ring-1 ring-border">
              <Camera className="size-5" />
            </span>
            <span className="text-[13px] font-medium">사진 추가</span>
            <span className="text-[11px] text-muted-foreground/80">
              라켓 식별을 위해 한 장 권장
            </span>
          </button>
        </section>

        {/* 브랜드 */}
        <FormSection
          title="브랜드"
          required
          hint={brand ?? "라켓 브랜드를 선택"}
        >
          <ChipGrid
            options={BRANDS}
            value={brand}
            onChange={setBrand}
            cols={3}
          />
        </FormSection>

        {/* 모델명 */}
        <FormSection title="모델명" required>
          <input
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="예: Pro Staff RF97 v14"
            className="w-full h-11 rounded-xl border border-border bg-card px-3 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </FormSection>

        {/* 헤드 사이즈 */}
        <FormSection title="헤드 사이즈 (sq.in)">
          <ChipGrid
            options={[...HEAD_SIZES]}
            value={headSize}
            onChange={setHeadSize}
            cols={4}
          />
        </FormSection>

        {/* 무게 */}
        <FormSection title="무게">
          <ChipGrid
            options={[...WEIGHTS]}
            value={weight}
            onChange={setWeight}
            cols={3}
          />
        </FormSection>

        {/* 그립 사이즈 */}
        <FormSection title="그립 사이즈">
          <ChipGrid
            options={[...GRIPS]}
            value={grip}
            onChange={setGrip}
            cols={4}
          />
        </FormSection>

        {/* 사용 용도 */}
        <FormSection title="주 사용 용도">
          <ChipGrid
            options={[...PURPOSES]}
            value={purpose}
            onChange={setPurpose}
            cols={3}
          />
        </FormSection>

        {/* 메인 라켓 토글 */}
        <section className="px-5 pt-6">
          <div className="w-full flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3.5">
            <span className="size-9 shrink-0 rounded-xl bg-accent/30 grid place-items-center text-accent-foreground">
              <Star
                className={`size-4 ${setPrimary ? "fill-accent-foreground" : ""}`}
              />
            </span>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-semibold">메인 라켓으로 설정</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                예약 시 기본으로 선택됩니다
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={setPrimary}
              aria-label="메인 라켓으로 설정"
              onClick={() => setSetPrimary(!setPrimary)}
              className={[
                "relative shrink-0 h-6 w-11 rounded-full transition-colors",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-card",
                setPrimary ? "bg-primary" : "bg-secondary",
              ].join(" ")}
            >
              <span
                className={[
                  "absolute top-0.5 size-5 rounded-full bg-card shadow ring-1 ring-border transition-transform",
                  setPrimary ? "translate-x-[1.375rem]" : "translate-x-0.5",
                ].join(" ")}
              />
            </button>
          </div>
        </section>

        {/* 메모 */}
        <FormSection
          title="메모"
          hint="개별 그립 두께, 진동 흡수재 등"
        >
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="선호 텐션, 그립 변경 이력 등을 적어두세요"
            rows={3}
            className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
          />
        </FormSection>

        {/* Sticky bottom action */}
        <div className="fixed bottom-0 left-0 right-0 z-10 mx-auto max-w-md w-full bg-background/95 backdrop-blur border-t border-border px-5 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="h-11 px-4 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-secondary"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={!canSave}
              className="flex-1 h-11 rounded-xl bg-primary text-primary-foreground text-sm font-semibold inline-flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition"
            >
              <Check className="size-4" />
              라켓 저장
            </button>
          </div>
        </div>
      </form>
    </>
  )
}

/* ---------- building blocks ---------- */

function FormSection({
  title,
  hint,
  required,
  children,
}: {
  title: string
  hint?: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <section className="px-5 pt-6">
      <div className="flex items-baseline justify-between mb-2 px-1">
        <p className="text-[12px] font-semibold text-foreground">
          {title}
          {required && <span className="text-destructive ml-0.5">*</span>}
        </p>
        {hint && (
          <p className="text-[10px] text-muted-foreground truncate ml-2">
            {hint}
          </p>
        )}
      </div>
      {children}
    </section>
  )
}

function ChipGrid<T extends string>({
  options,
  value,
  onChange,
  cols,
}: {
  options: T[]
  value: T | null
  onChange: (v: T) => void
  cols: 3 | 4
}) {
  return (
    <div
      className={`grid gap-2 ${
        cols === 3 ? "grid-cols-3" : "grid-cols-4"
      }`}
    >
      {options.map((opt) => {
        const active = value === opt
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={[
              "h-11 rounded-xl border text-sm font-medium transition",
              active
                ? "border-primary bg-primary text-primary-foreground shadow-sm"
                : "border-border bg-card text-foreground hover:border-primary/40",
            ].join(" ")}
          >
            {opt}
          </button>
        )
      })}
    </div>
  )
}
