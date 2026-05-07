"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  User,
  Lock,
  Phone,
  Mail,
  Bell,
  CalendarClock,
  Megaphone,
  Moon,
  Languages,
  CreditCard,
  MapPin,
  FileText,
  ShieldCheck,
  Download,
  Info,
  Sparkles,
  ChevronRight,
  type LucideIcon,
} from "lucide-react"
import { PageHeader } from "@/components/app/page-header"
import { ActionFeedbackDialog } from "@/components/admin/action-dialogs"

export default function SettingsPage() {
  const router = useRouter()
  const [pushOn, setPushOn] = useState(true)
  const [reminderOn, setReminderOn] = useState(true)
  const [marketingOn, setMarketingOn] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [settingsSaved, setSettingsSaved] = useState(false)

  return (
    <>
      <ActionFeedbackDialog
        open={settingsSaved}
        title="설정이 변경되었습니다"
        description="확인을 누르면 내 정보로 이동합니다."
        onConfirm={() => router.push("/me")}
      />
      <PageHeader title="설정" back="/me" />

      <div className="pb-24">
        {/* Account preview */}
        <section className="px-5 pt-4">
          <div className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3">
            <div className="size-12 shrink-0 rounded-full bg-primary text-primary-foreground grid place-items-center font-display font-bold">
              JM
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate">정민수</p>
              <p className="text-[11px] text-muted-foreground truncate">jungmin@rally.kr</p>
            </div>
            <button
              className="text-[11px] font-semibold text-primary px-3 py-1.5 rounded-full bg-primary/10 hover:bg-primary/15"
              type="button"
            >
              편집
            </button>
          </div>
        </section>

        {/* 계정 */}
        <SettingsGroup title="계정">
          <LinkRow icon={User} label="프로필 정보" />
          <LinkRow icon={Lock} label="비밀번호 변경" />
          <LinkRow icon={Phone} label="휴대폰 번호" value="010-3*** ***1" />
          <LinkRow icon={Mail} label="이메일" value="jungmin@rally.kr" />
        </SettingsGroup>

        {/* 알림 */}
        <SettingsGroup title="알림">
          <SwitchRow
            icon={Bell}
            label="푸시 알림"
            description="작업 진행 상황과 픽업 안내를 받습니다"
            checked={pushOn}
            onChange={setPushOn}
            onSaved={() => setSettingsSaved(true)}
          />
          <SwitchRow
            icon={CalendarClock}
            label="예약 리마인더"
            description="예약 1시간 전 알림을 보냅니다"
            checked={reminderOn}
            onChange={setReminderOn}
            onSaved={() => setSettingsSaved(true)}
          />
          <SwitchRow
            icon={Megaphone}
            label="이벤트·마케팅 정보"
            description="신상품 입고, 할인 소식을 받아봅니다"
            checked={marketingOn}
            onChange={setMarketingOn}
            onSaved={() => setSettingsSaved(true)}
          />
        </SettingsGroup>

        {/* 화면 */}
        <SettingsGroup title="화면">
          <SwitchRow
            icon={Moon}
            label="다크 모드"
            description="시스템 설정과 별개로 어둡게 표시"
            checked={darkMode}
            onChange={setDarkMode}
            onSaved={() => setSettingsSaved(true)}
          />
          <LinkRow icon={Languages} label="언어" value="한국어" />
        </SettingsGroup>

        {/* 결제 · 배송 */}
        <SettingsGroup title="결제 · 배송">
          <LinkRow icon={CreditCard} label="결제 수단" value="카드 2개" />
          <LinkRow icon={MapPin} label="배송지 관리" value="기본 1개" />
        </SettingsGroup>

        {/* 개인정보 */}
        <SettingsGroup title="개인정보">
          <LinkRow icon={ShieldCheck} label="개인정보 처리방침" />
          <LinkRow icon={FileText} label="이용약관" />
          <LinkRow icon={Download} label="내 데이터 내보내기" />
        </SettingsGroup>

        {/* 정보 */}
        <SettingsGroup title="정보">
          <ValueRow icon={Info} label="앱 버전" value="1.0.0" />
          <LinkRow icon={Sparkles} label="오픈소스 라이선스" />
        </SettingsGroup>

        {/* Danger zone */}
        <section className="px-5 pt-6 space-y-3">
          <button
            type="button"
            className="w-full rounded-2xl border border-border bg-card py-3.5 text-sm font-semibold text-destructive hover:bg-destructive/5 transition"
          >
            로그아웃
          </button>
          <button
            type="button"
            className="w-full text-center text-[11px] text-muted-foreground hover:text-destructive py-2"
          >
            회원 탈퇴
          </button>
        </section>
      </div>
    </>
  )
}

/* ---------- building blocks ---------- */

function SettingsGroup({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="px-5 pt-6">
      <p className="text-[11px] font-semibold text-muted-foreground tracking-wide uppercase mb-2 px-1">
        {title}
      </p>
      <div className="rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border">
        {children}
      </div>
    </section>
  )
}

function LinkRow({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon
  label: string
  value?: string
}) {
  return (
    <button
      type="button"
      className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-secondary/50 transition text-left"
    >
      <span className="size-9 shrink-0 rounded-xl bg-secondary grid place-items-center">
        <Icon className="size-4 text-muted-foreground" />
      </span>
      <span className="flex-1 text-sm text-foreground truncate">{label}</span>
      {value && (
        <span className="text-[12px] text-muted-foreground truncate max-w-[40%]">
          {value}
        </span>
      )}
      <ChevronRight className="size-4 text-muted-foreground shrink-0" />
    </button>
  )
}

function ValueRow({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon
  label: string
  value: string
}) {
  return (
    <div className="w-full flex items-center gap-3 px-4 py-3.5">
      <span className="size-9 shrink-0 rounded-xl bg-secondary grid place-items-center">
        <Icon className="size-4 text-muted-foreground" />
      </span>
      <span className="flex-1 text-sm text-foreground truncate">{label}</span>
      <span className="text-[12px] text-muted-foreground tabular-nums shrink-0">
        {value}
      </span>
    </div>
  )
}

function SwitchRow({
  icon: Icon,
  label,
  description,
  checked,
  onChange,
  onSaved,
}: {
  icon: LucideIcon
  label: string
  description?: string
  checked: boolean
  onChange: (next: boolean) => void
  onSaved?: () => void
}) {
  return (
    <div className="w-full flex items-center gap-3 px-4 py-3.5">
      <span className="size-9 shrink-0 rounded-xl bg-secondary grid place-items-center">
        <Icon className="size-4 text-muted-foreground" />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground truncate">{label}</p>
        {description && (
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
            {description}
          </p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => {
          onChange(!checked)
          onSaved?.()
        }}
        className={[
          "relative shrink-0 h-6 w-11 rounded-full transition-colors",
          checked ? "bg-primary" : "bg-secondary",
        ].join(" ")}
      >
        <span
          className={[
            "absolute top-0.5 size-5 rounded-full bg-card shadow ring-1 ring-border transition-transform",
            checked ? "translate-x-[1.375rem]" : "translate-x-0.5",
          ].join(" ")}
        />
      </button>
    </div>
  )
}
