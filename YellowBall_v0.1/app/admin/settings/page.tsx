import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { Store, Clock, CreditCard, Bell, MapPin } from "lucide-react"

export default function AdminSettingsPage() {
  return (
    <div>
      <AdminPageHeader title="설정" description="매장 정보, 영업시간, 결제, 알림" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-1 bg-card rounded-2xl border border-border p-5 h-fit">
          <h3 className="font-display font-bold text-foreground mb-3">설정 항목</h3>
          <ul className="space-y-1 text-sm">
            {[
              { icon: Store, label: "매장 정보", active: true },
              { icon: Clock, label: "영업시간/휴무" },
              { icon: CreditCard, label: "결제/정산" },
              { icon: Bell, label: "알림" },
              { icon: MapPin, label: "배송 옵션" },
            ].map((it) => {
              const Icon = it.icon
              return (
                <li key={it.label}>
                  <button
                    className={`w-full flex items-center gap-3 px-3 h-10 rounded-xl transition ${
                      it.active
                        ? "bg-primary text-primary-foreground font-semibold"
                        : "hover:bg-secondary text-foreground"
                    }`}
                  >
                    <Icon className="size-4" />
                    {it.label}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>

        <div className="lg:col-span-2 space-y-5">
          <section className="bg-card rounded-2xl border border-border p-6">
            <h3 className="font-display font-bold text-foreground mb-4">매장 정보</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="매장명" value="RallyHub 성수점" />
              <Field label="대표 전화" value="02-1234-5678" />
              <Field label="사업자번호" value="123-45-67890" />
              <Field label="대표자" value="정민수" />
              <Field label="주소" value="서울 성동구 성수이로 113" full />
              <Field label="소개" value="20년 경력 스트링거가 직접 작업하는 동네 라켓샵" full />
            </div>
          </section>

          <section className="bg-card rounded-2xl border border-border p-6">
            <h3 className="font-display font-bold text-foreground mb-4">영업시간</h3>
            <div className="space-y-2">
              {["월", "화", "수", "목", "금", "토", "일"].map((d, i) => (
                <div key={d} className="flex items-center gap-3">
                  <span className="w-6 text-sm font-semibold text-foreground">{d}</span>
                  <input
                    defaultValue={i === 6 ? "휴무" : "10:00 - 21:00"}
                    className="flex-1 h-9 rounded-lg bg-secondary px-3 text-sm focus:outline-none"
                  />
                  <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <input type="checkbox" defaultChecked={i !== 6} className="accent-primary" />
                    영업
                  </label>
                </div>
              ))}
            </div>
          </section>

          <div className="flex justify-end gap-2">
            <button className="h-10 px-4 rounded-lg border border-border text-sm font-semibold hover:bg-secondary">
              취소
            </button>
            <button className="h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90">
              저장
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({ label, value, full }: { label: string; value: string; full?: boolean }) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <label className="text-xs font-semibold text-muted-foreground">{label}</label>
      <input
        defaultValue={value}
        className="mt-1 w-full h-10 rounded-lg bg-secondary px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
    </div>
  )
}
