import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { loadProfileById } from '@/lib/admin-actions';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ id: string }>;
}

const formatDateTime = (value: string | null) =>
  value ? new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Seoul',
  }).format(new Date(value)) : '-';

const getDisplayName = (profile: {
  nickname: string | null;
  username: string | null;
  email: string | null;
}) => profile.nickname ?? profile.username ?? profile.email ?? '알 수 없음';

const roleLabel = (role: string) => {
  if (role === 'super_admin') return '슈퍼어드민';
  if (role === 'admin') return '관리자';
  return '일반';
};

const statusLabel = (status: string) => {
  if (status === 'active') return '정상';
  if (status === 'suspended') return '제재 중';
  return status;
};

export default async function AdminCustomerDetailPage({ params }: PageProps) {
  const { id } = await params;
  const profile = await loadProfileById(id).catch(() => null);

  if (!profile) {
    notFound();
  }

  const name = getDisplayName(profile);

  return (
    <div>
      <AdminPageHeader
        label="CUSTOMER DETAIL"
        title={name}
        description={`profiles.id = ${profile.id}`}
        actions={
          <Link
            href="/admin/customers"
            className="h-9 px-3 rounded-lg border border-border text-xs font-semibold hover:bg-secondary flex items-center gap-1.5"
          >
            <ArrowLeft className="size-3.5" />
            목록으로
          </Link>
        }
      />

      <section className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center gap-4 mb-6">
          <div className="size-14 rounded-full bg-primary text-primary-foreground grid place-items-center font-display text-xl font-bold">
            {name.slice(0, 1)}
          </div>
          <div>
            <p className="font-display text-xl font-bold text-foreground">{name}</p>
            <p className="text-xs text-muted-foreground">{profile.email ?? '-'}</p>
          </div>
        </div>

        <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Info label="닉네임" value={profile.nickname ?? '-'} />
          <Info label="사용자명" value={profile.username ?? '-'} />
          <Info label="이메일" value={profile.email ?? '-'} />
          <Info label="전화번호" value={profile.phone ?? '-'} />
          <Info label="역할" value={roleLabel(profile.role)} />
          <Info label="상태" value={statusLabel(profile.status)} />
          <Info label="가입일" value={formatDateTime(profile.created_at)} />
          <Info label="수정일" value={formatDateTime(profile.updated_at)} />
        </dl>
      </section>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-secondary/25 px-4 py-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-foreground break-words">{value}</dd>
    </div>
  );
}
