import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AdminQueueBoard } from "@/components/admin/admin-queue-board"
import { Timer, AlertTriangle, CheckCircle2 } from "lucide-react"

export default function AdminQueuePage() {
  return (
    <div>
      <AdminPageHeader
        title="작업 큐"
        description="스트링 작업의 진행 상태를 칸반으로 추적합니다"
        actions={
          <button className="h-9 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90">
            큐 새로고침
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <div className="bg-card rounded-2xl border border-border p-4 flex items-center gap-3">
          <div className="size-10 rounded-xl bg-primary/10 text-primary grid place-items-center">
            <Timer className="size-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">평균 작업 시간</p>
            <p className="font-display text-xl font-bold text-foreground">23분</p>
          </div>
        </div>
        <div className="bg-card rounded-2xl border border-border p-4 flex items-center gap-3">
          <div className="size-10 rounded-xl bg-destructive/10 text-destructive grid place-items-center">
            <AlertTriangle className="size-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">급행 대기</p>
            <p className="font-display text-xl font-bold text-foreground">2건</p>
          </div>
        </div>
        <div className="bg-card rounded-2xl border border-border p-4 flex items-center gap-3">
          <div className="size-10 rounded-xl bg-chart-4/15 text-chart-4 grid place-items-center">
            <CheckCircle2 className="size-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">오늘 완료</p>
            <p className="font-display text-xl font-bold text-foreground">12건</p>
          </div>
        </div>
      </div>

      <AdminQueueBoard />
    </div>
  )
}
