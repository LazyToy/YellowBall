import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { Search, MoreVertical, Ban } from "lucide-react"

const customers = [
  { name: "김민지", phone: "010-3214-5678", joined: "2024-08-12", visits: 24, spent: 1240000, tier: "VIP", status: "정상" },
  { name: "박성훈", phone: "010-9821-3344", joined: "2024-11-03", visits: 8, spent: 432000, tier: "Gold", status: "정상" },
  { name: "이수진", phone: "010-4412-7788", joined: "2025-01-19", visits: 15, spent: 689000, tier: "Gold", status: "정상" },
  { name: "정도윤", phone: "010-2298-1100", joined: "2024-05-21", visits: 38, spent: 2103000, tier: "VIP", status: "정상" },
  { name: "최유진", phone: "010-7766-2244", joined: "2025-03-08", visits: 3, spent: 87000, tier: "Basic", status: "정상" },
  { name: "강태오", phone: "010-1023-9988", joined: "2024-09-15", visits: 12, spent: 521000, tier: "Silver", status: "제재" },
]

const tierStyle: Record<string, string> = {
  VIP: "bg-primary text-primary-foreground",
  Gold: "bg-accent text-accent-foreground",
  Silver: "bg-muted text-muted-foreground",
  Basic: "bg-secondary text-foreground",
}

export default function AdminCustomersPage() {
  return (
    <div>
      <AdminPageHeader
        title="고객"
        description="회원 관리, 등급, 제재 처리"
        actions={
          <>
            <button className="h-9 px-3 rounded-lg border border-border text-xs font-semibold hover:bg-secondary">
              세그먼트 보내기
            </button>
            <button className="h-9 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90">
              내보내기
            </button>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {[
          { label: "전체 회원", value: "1,284" },
          { label: "이번 달 신규", value: "+47" },
          { label: "VIP", value: "82" },
          { label: "제재 중", value: "3" },
        ].map((s) => (
          <div key={s.label} className="bg-card rounded-2xl border border-border p-4">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="font-display text-2xl font-bold text-foreground mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 mb-4">
        <div className="flex-1 h-9 rounded-lg bg-card border border-border px-3 flex items-center gap-2">
          <Search className="size-4 text-muted-foreground" />
          <input placeholder="이름, 전화번호 검색" className="flex-1 bg-transparent text-sm focus:outline-none" />
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary/60 text-muted-foreground text-xs">
            <tr>
              <th className="text-left font-semibold px-4 py-3">고객</th>
              <th className="text-left font-semibold px-4 py-3">가입일</th>
              <th className="text-right font-semibold px-4 py-3">방문</th>
              <th className="text-right font-semibold px-4 py-3">누적 결제</th>
              <th className="text-left font-semibold px-4 py-3">등급</th>
              <th className="text-left font-semibold px-4 py-3">상태</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.phone} className="border-t border-border hover:bg-secondary/40">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-full bg-primary text-primary-foreground grid place-items-center font-bold text-xs">
                      {c.name[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.phone}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-foreground">{c.joined}</td>
                <td className="px-4 py-3 text-right text-foreground">{c.visits}</td>
                <td className="px-4 py-3 text-right font-semibold text-foreground">
                  ₩{c.spent.toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${tierStyle[c.tier]}`}>
                    {c.tier}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {c.status === "제재" ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-destructive/10 text-destructive">
                      <Ban className="size-3" />
                      제재
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-chart-4/15 text-chart-4">
                      정상
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <button className="size-7 grid place-items-center rounded-md hover:bg-secondary">
                    <MoreVertical className="size-4 text-muted-foreground" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
