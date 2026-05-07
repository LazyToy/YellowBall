"use client"

import { useState } from "react"
import { Minus, Plus } from "lucide-react"

type StringOption = {
  id: string
  brand: string
  name: string
  type: "Poly" | "Multi" | "Synthetic" | "Hybrid"
  price: number
  popular?: boolean
}

const STRINGS: StringOption[] = [
  { id: "s1", brand: "Luxilon", name: "ALU Power 1.25", type: "Poly", price: 35000, popular: true },
  { id: "s2", brand: "Solinco", name: "Hyper-G Soft 1.25", type: "Poly", price: 32000 },
  { id: "s3", brand: "Babolat", name: "RPM Blast 1.25", type: "Poly", price: 33000 },
  { id: "s4", brand: "Wilson", name: "NXT 16", type: "Multi", price: 28000 },
  { id: "s5", brand: "BYOS", name: "내 스트링 사용", type: "Synthetic", price: 0 },
]

const MIN_TENSION = 35
const MAX_TENSION = 70

type Props = {
  stringId: string | null
  tensionMain: number
  tensionCross: number
  onSelectString: (id: string) => void
  onTensionMainChange: (n: number) => void
  onTensionCrossChange: (n: number) => void
}

type TensionFieldProps = {
  label: string
  hint: string
  value: number
  onChange: (n: number) => void
}

function clampTension(n: number) {
  if (Number.isNaN(n)) return MIN_TENSION
  return Math.min(MAX_TENSION, Math.max(MIN_TENSION, Math.round(n)))
}

function TensionField({ label, hint, value, onChange }: TensionFieldProps) {
  return (
    <div className="rounded-xl bg-secondary/60 p-3">
      <div className="flex items-center justify-between mb-2 px-1">
        <p className="text-[11px] font-bold text-foreground tracking-wide uppercase">{label}</p>
        <p className="text-[10px] text-muted-foreground">{hint}</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label={`${label} 텐션 감소`}
          onClick={() => onChange(clampTension(value - 1))}
          className="size-10 shrink-0 rounded-full bg-card border border-border grid place-items-center hover:bg-background active:scale-95 transition"
        >
          <Minus className="size-4" />
        </button>

        <div className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-card border border-border px-3 h-10">
          <input
            type="number"
            inputMode="numeric"
            min={MIN_TENSION}
            max={MAX_TENSION}
            value={value}
            onChange={(e) => {
              const next = e.target.value === "" ? MIN_TENSION : Number(e.target.value)
              onChange(clampTension(next))
            }}
            onFocus={(e) => e.currentTarget.select()}
            aria-label={`${label} 텐션 직접 입력`}
            className="w-12 bg-transparent text-center font-display text-2xl font-bold text-foreground tabular-nums focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span className="text-xs font-semibold text-muted-foreground">LB</span>
        </div>

        <button
          type="button"
          aria-label={`${label} 텐션 증가`}
          onClick={() => onChange(clampTension(value + 1))}
          className="size-10 shrink-0 rounded-full bg-card border border-border grid place-items-center hover:bg-background active:scale-95 transition"
        >
          <Plus className="size-4" />
        </button>
      </div>
    </div>
  )
}

export function StringPicker({
  stringId,
  tensionMain,
  tensionCross,
  onSelectString,
  onTensionMainChange,
  onTensionCrossChange,
}: Props) {
  // Mode is explicit user choice — it does NOT auto-toggle when values
  // happen to coincide. This lets users freely cross over the same number
  // (e.g. dragging cross up past main) without the UI collapsing into
  // uniform mode. Initial mode is derived from incoming props.
  const [mode, setMode] = useState<"uniform" | "hybrid">(
    tensionMain === tensionCross ? "uniform" : "hybrid",
  )
  const isHybrid = mode === "hybrid"

  function handleSelectUniform() {
    setMode("uniform")
    // Sync cross to main so values are equal
    if (tensionCross !== tensionMain) {
      onTensionCrossChange(tensionMain)
    }
  }

  function handleSelectHybrid() {
    setMode("hybrid")
    // No automatic nudging — keep whatever values the user already has.
    // If they want different main/cross they can adjust each field freely,
    // including passing through the same number.
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4 space-y-4">
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="font-display font-bold text-base">스트링 선택</p>
          <span className="text-[10px] text-muted-foreground">BYOS = Bring Your Own String</span>
        </div>
        <div className="space-y-2">
          {STRINGS.map((s) => {
            const isSelected = stringId === s.id
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => onSelectString(s.id)}
                className={[
                  "w-full flex items-center gap-3 rounded-xl border p-3 text-left transition",
                  isSelected
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border bg-background hover:border-primary/40",
                ].join(" ")}
              >
                <div
                  className={[
                    "size-5 rounded-full border-2 grid place-items-center shrink-0",
                    isSelected ? "border-primary" : "border-muted-foreground/40",
                  ].join(" ")}
                >
                  {isSelected && <span className="size-2.5 rounded-full bg-primary" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="font-semibold text-foreground text-sm">
                      {s.brand} {s.name}
                    </p>
                    <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground">
                      {s.type}
                    </span>
                    {s.popular && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-accent text-accent-foreground">
                        인기
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-sm font-bold text-foreground shrink-0">
                  {s.price === 0 ? "0원" : `${s.price.toLocaleString()}원`}
                </p>
              </button>
            )
          })}
        </div>
      </div>

      <div className="border-t border-border pt-4">
        <div className="mb-3">
          <p className="font-display font-bold text-base">텐션</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {MIN_TENSION}~{MAX_TENSION} LB · 직접 입력 또는 +/- 버튼으로 조정
          </p>
        </div>

        {/* Mode toggle: Uniform vs Hybrid */}
        <div
          role="tablist"
          aria-label="텐션 모드"
          className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-secondary mb-3"
        >
          <button
            type="button"
            role="tab"
            aria-selected={!isHybrid}
            onClick={handleSelectUniform}
            className={[
              "h-9 rounded-lg text-xs font-semibold transition",
              !isHybrid
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            ].join(" ")}
          >
            균일 텐션
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={isHybrid}
            onClick={handleSelectHybrid}
            className={[
              "h-9 rounded-lg text-xs font-semibold transition",
              isHybrid
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            ].join(" ")}
          >
            하이브리드 (메인/크로스)
          </button>
        </div>

        {!isHybrid ? (
          <TensionField
            label="텐션"
            hint="메인 · 크로스 동일"
            value={tensionMain}
            onChange={(n) => {
              onTensionMainChange(n)
              onTensionCrossChange(n)
            }}
          />
        ) : (
          <div className="space-y-2">
            <TensionField
              label="Main"
              hint="세로 스트링"
              value={tensionMain}
              onChange={onTensionMainChange}
            />
            <TensionField
              label="Cross"
              hint="가로 스트링"
              value={tensionCross}
              onChange={onTensionCrossChange}
            />
          </div>
        )}

        <div className="mt-3 flex items-center justify-between rounded-lg bg-secondary/40 px-3 py-2">
          <p className="text-[11px] text-muted-foreground">
            {isHybrid ? (
              <>
                하이브리드 ·{" "}
                <span className="font-semibold text-foreground tabular-nums">
                  메인 {tensionMain} / 크로스 {tensionCross} LB
                  {tensionMain === tensionCross && (
                    <span className="ml-1 text-muted-foreground font-normal">
                      (동일 값)
                    </span>
                  )}
                </span>
              </>
            ) : (
              <>
                균일 ·{" "}
                <span className="font-semibold text-foreground tabular-nums">
                  {tensionMain} LB
                </span>
              </>
            )}
          </p>
          <p className="text-[11px] font-medium text-muted-foreground">
            {tensionMain < 50 ? "파워 우선" : tensionMain > 55 ? "컨트롤 우선" : "표준"}
          </p>
        </div>
      </div>
    </div>
  )
}
