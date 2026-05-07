import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { DemoRacketDetailForm } from '@/components/admin/demo-racket-detail-form';
import { getStorageUrl, loadDemoRacketById, statusLabel } from '@/lib/admin-data';
import { ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminDemoRacketDetailPage({ params }: PageProps) {
  const { id } = await params;
  const racket = await loadDemoRacketById(id);

  if (!racket) {
    notFound();
  }

  const displayName = [racket.brand, racket.model].filter(Boolean).join(' ');
  const available =
    racket.status === 'active' && racket.is_demo_enabled === true && racket.is_active === true;
  const racketImageUrl = getStorageUrl(racket.photo_url);

  return (
    <div>
      <AdminPageHeader
        label="DEMO MANAGEMENT"
        title={displayName || '시타 라켓 상세'}
        description={`demo_rackets.id = ${racket.id}`}
        actions={
          <Link
            href="/admin/demo"
            className="h-9 px-3 rounded-lg border border-border text-xs font-semibold hover:bg-secondary flex items-center gap-1.5"
          >
            <ArrowLeft className="size-3.5" />
            목록으로
          </Link>
        }
      />

      {/* 현재 상태 요약 카드 */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {/* 이미지 미리보기 */}
        <div className="w-full sm:w-48 h-36 rounded-2xl bg-card border border-border overflow-hidden grid place-items-center shrink-0">
          {racketImageUrl ? (
            <Image
              src={racketImageUrl}
              alt={displayName}
              width={192}
              height={144}
              className="object-contain w-full h-full"
            />
          ) : (
            <span className="text-xs text-muted-foreground">이미지 없음</span>
          )}
        </div>

        {/* 요약 정보 */}
        <div className="flex-1 bg-card border border-border rounded-2xl p-4 grid grid-cols-2 sm:grid-cols-3 gap-4 content-start">
          <SummaryCard label="현재 상태" value={statusLabel(racket.status)} highlight={available} />
          <SummaryCard
            label="데모 활성화"
            value={racket.is_demo_enabled ? '활성' : '비활성'}
            highlight={racket.is_demo_enabled === true}
          />
          <SummaryCard
            label="앱 노출"
            value={racket.is_active ? '노출 중' : '숨김'}
            highlight={racket.is_active === true}
          />
          <SummaryCard
            label="무게"
            value={racket.weight ? `${racket.weight}g` : '-'}
          />
          <SummaryCard label="헤드 사이즈" value={racket.head_size ?? '-'} />
          <SummaryCard label="그립 사이즈" value={racket.grip_size ?? '-'} />
        </div>
      </div>

      {/* 편집 폼 */}
      <DemoRacketDetailForm racket={racket} />
    </div>
  );
}

function SummaryCard({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={`font-semibold text-sm ${highlight ? 'text-chart-4' : 'text-foreground'}`}
      >
        {value}
      </p>
    </div>
  );
}
