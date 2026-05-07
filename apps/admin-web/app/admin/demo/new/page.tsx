import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { NewDemoRacketForm } from '@/components/admin/new-demo-racket-form';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AdminNewDemoRacketPage() {
  return (
    <div>
      <AdminPageHeader
        label="DEMO MANAGEMENT"
        title="시타 라켓 등록"
        description="새 시타 라켓을 등록합니다. 등록 완료 후 상세 편집 페이지로 자동 이동됩니다."
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
      <NewDemoRacketForm />
    </div>
  );
}
