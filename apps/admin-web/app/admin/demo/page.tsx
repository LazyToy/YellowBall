import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { getAdminDemoRacketsPageData, hasAdminReadKey } from '@/lib/admin-data';
import { Plus } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default async function AdminDemoPage() {
  const rackets = await getAdminDemoRacketsPageData();

  return (
    <div>
      <AdminPageHeader
        label="DEMO MANAGEMENT"
        title="시타 라켓 관리"
        description="demo_rackets 테이블의 실제 시타 라켓 데이터를 표시합니다. 카드를 클릭하면 상세 편집 페이지로 이동합니다."
        actions={
          <Link href="/admin/demo/new" className="h-9 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1.5 hover:opacity-90">
            <Plus className="size-3.5" />
            라켓 등록
          </Link>
        }
      />

      {!hasAdminReadKey ? (
        <div className="mb-5 rounded-lg border border-border bg-secondary/40 px-4 py-3 text-xs text-muted-foreground">
          서비스 키가 없어서 공개 정책으로 읽을 수 있는 활성 시타 라켓만 표시합니다.
        </div>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {rackets.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-border bg-card px-5 py-10 text-center text-xs text-muted-foreground">
            등록된 시타 라켓이 없습니다.
          </div>
        ) : (
          rackets.map((r) => (
            /* 카드 전체를 상세 페이지 링크로 감쌈 */
            <Link
              key={r.id}
              href={`/admin/demo/${r.id}`}
              className="bg-card rounded-2xl border border-border p-4 flex flex-col hover:border-primary/50 hover:shadow-lg transition-all group cursor-pointer"
            >
              <div className="flex items-start justify-between mb-2">
                <span
                  className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                    r.available
                      ? 'bg-chart-4/15 text-chart-4'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {r.statusLabel}
                </span>
                {/* 상세 버튼 표시 (호버 시) */}
                <span className="text-[10px] font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  상세 편집 →
                </span>
              </div>
              <div className="bg-secondary rounded-xl aspect-[4/3] grid place-items-center mb-3 overflow-hidden">
                {r.imageUrl ? (
                  <Image
                    src={r.imageUrl}
                    alt={r.name}
                    width={240}
                    height={180}
                    className="object-contain w-full h-full"
                  />
                ) : (
                  <span className="text-xs text-muted-foreground">이미지 없음</span>
                )}
              </div>
              <h3 className="font-display font-bold text-foreground leading-tight">
                {r.name}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {r.spec || '스펙 정보 없음'}
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                <div className="rounded-lg bg-secondary/60 px-2 py-1.5">
                  <p className="text-muted-foreground">현재 상태</p>
                  <p className="font-semibold text-foreground truncate">{r.statusLabel}</p>
                </div>
                <div className="rounded-lg bg-secondary/60 px-2 py-1.5">
                  <p className="text-muted-foreground">누적 예약</p>
                  <p className="font-semibold text-foreground">{r.bookings}건</p>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
