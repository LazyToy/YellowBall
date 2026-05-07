import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { CustomerRowActions } from '@/components/admin/customer-row-actions';
import { Search } from 'lucide-react';
import { loadProfiles } from '@/lib/admin-actions';
import Link from 'next/link';

/** 가입일 포맷 (YYYY-MM-DD) */
function formatDate(iso: string) {
  return iso.slice(0, 10);
}

/** 고객 이름 표시 (닉네임 > 유저명 > 이메일 순) */
function displayName(profile: {
  nickname: string | null;
  username: string | null;
  email: string | null;
}) {
  return profile.nickname ?? profile.username ?? profile.email ?? '알 수 없음';
}

export default async function AdminCustomersPage() {
  const profiles = await loadProfiles(200);

  const totalCount = profiles.length;
  const suspendedCount = profiles.filter((p) => p.status === 'suspended').length;

  // 이번 달 신규 가입자
  const thisMonth = new Date().toISOString().slice(0, 7);
  const newThisMonthCount = profiles.filter((p) => p.created_at.startsWith(thisMonth)).length;

  // 관리자/슈퍼 어드민 수
  const adminCount = profiles.filter((p) => ['admin', 'super_admin'].includes(p.role)).length;

  return (
    <div>
      <AdminPageHeader
        label="CUSTOMER MANAGEMENT"
        title="고객"
        description="profiles 테이블의 실제 회원 데이터를 표시합니다."
        actions={
          <>
            <button className="h-9 px-3 rounded-lg border border-border text-xs font-semibold hover:bg-secondary">
              내보내기
            </button>
          </>
        }
      />

      {/* KPI 카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {[
          { label: '전체 회원', value: totalCount.toLocaleString() },
          { label: '이번 달 신규', value: `+${newThisMonthCount}` },
          { label: '관리자', value: `${adminCount}` },
          { label: '제재 중', value: `${suspendedCount}` },
        ].map((s) => (
          <div key={s.label} className="bg-card rounded-2xl border border-border p-4">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="font-display text-2xl font-bold text-foreground mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* 검색 (UI만 - 실제 필터는 클라이언트 컴포넌트로 분리 가능) */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex-1 h-9 rounded-lg bg-card border border-border px-3 flex items-center gap-2">
          <Search className="size-4 text-muted-foreground" />
          <input
            placeholder="이름, 전화번호, 이메일 검색"
            className="flex-1 bg-transparent text-sm focus:outline-none"
          />
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary/60 text-muted-foreground text-xs">
            <tr>
              <th className="text-left font-semibold px-4 py-3">고객</th>
              <th className="text-left font-semibold px-4 py-3">가입일</th>
              <th className="text-left font-semibold px-4 py-3">연락처</th>
              <th className="text-left font-semibold px-4 py-3">역할</th>
              <th className="text-left font-semibold px-4 py-3">상태</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {profiles.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-xs text-muted-foreground">
                  고객 데이터가 없습니다.
                </td>
              </tr>
            ) : (
              profiles.map((c) => {
                const name = displayName(c);
                return (
                  <tr key={c.id} className="border-t border-border hover:bg-secondary/40 cursor-pointer">
                    <td className="px-4 py-3">
                      <Link href={`/admin/customers/${c.id}`} className="flex items-center gap-3">
                        <div className="size-9 rounded-full bg-primary text-primary-foreground grid place-items-center font-bold text-xs shrink-0">
                          {name.slice(0, 1)}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{name}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                            {c.email ?? c.username ?? '-'}
                          </p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      <Link href={`/admin/customers/${c.id}`} className="block">
                        {formatDate(c.created_at)}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      <Link href={`/admin/customers/${c.id}`} className="block">
                        {c.phone ?? '-'}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/customers/${c.id}`} className="block">
                        <span
                          className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                            c.role === 'super_admin'
                              ? 'bg-primary text-primary-foreground'
                              : c.role === 'admin'
                                ? 'bg-accent text-accent-foreground'
                                : 'bg-secondary text-foreground'
                          }`}
                        >
                          {c.role === 'super_admin'
                            ? '슈퍼어드민'
                            : c.role === 'admin'
                              ? '관리자'
                              : '일반'}
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/customers/${c.id}`} className="block">
                        <span
                          className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                            c.status === 'suspended'
                              ? 'bg-destructive/10 text-destructive'
                              : c.status === 'active'
                                ? 'bg-chart-4/15 text-chart-4'
                                : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {c.status === 'suspended'
                            ? '제재 중'
                            : c.status === 'active'
                              ? '정상'
                              : c.status}
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <CustomerRowActions
                        profileId={c.id}
                        currentStatus={c.status}
                        role={c.role}
                        name={name}
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        <div className="px-4 py-3 border-t border-border text-xs text-muted-foreground">
          총 {profiles.length}명
        </div>
      </div>
    </div>
  );
}
