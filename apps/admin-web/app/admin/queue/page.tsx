import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { AdminQueueBoard } from '@/components/admin/admin-queue-board';
import { hasAdminReadKey } from '@/lib/admin-data';
import { getAdminOperationalDashboardData } from '@/lib/admin-operational-data';
import { AlertTriangle, CheckCircle2, Timer } from 'lucide-react';

const iconByName = {
  timer: Timer,
  alert: AlertTriangle,
  check: CheckCircle2,
} as const;

const toneClass = {
  primary: 'bg-primary/10 text-primary',
  danger: 'bg-destructive/10 text-destructive',
  success: 'bg-chart-4/15 text-chart-4',
} as const;

export default async function AdminQueuePage() {
  const dashboard = await getAdminOperationalDashboardData();

  return (
    <div>
      <AdminPageHeader
        label="OPERATIONS"
        title="작업 큐"
        description="service_bookings의 스트링 작업 진행 상태를 칸반으로 추적합니다."
        actions={
          <button className="h-9 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90">
            새로고침
          </button>
        }
      />

      {!hasAdminReadKey ? (
        <div className="mb-5 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-xs text-destructive">
          예약/작업 큐 조회에는 서버 전용 Supabase service role 키가 필요합니다.
        </div>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        {dashboard.queueSummary.map((metric) => {
          const Icon = iconByName[metric.icon];

          return (
            <div
              className="bg-card rounded-2xl border border-border p-4 flex items-center gap-3"
              key={metric.label}
            >
              <div
                className={`size-10 rounded-xl grid place-items-center ${toneClass[metric.tone]}`}
              >
                <Icon className="size-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{metric.label}</p>
                <p className="font-display text-xl font-bold text-foreground">
                  {metric.value}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <AdminQueueBoard columns={dashboard.queueColumns} />
    </div>
  );
}
