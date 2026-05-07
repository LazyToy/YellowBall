import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { AdminManagementControls } from '@/components/admin/super-admin-controls';
import { loadAdminManagementPageData } from '@/lib/super-admin-data';
import { ShieldCheck } from 'lucide-react';

export default async function SuperAdminsPage() {
  let pageData: Awaited<ReturnType<typeof loadAdminManagementPageData>> | null = null;
  let errorMessage: string | null = null;

  try {
    pageData = await loadAdminManagementPageData();
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : String(error);
  }

  return (
    <div>
      <AdminPageHeader
        label="SUPER ADMIN"
        title="관리자 관리"
        description="profiles와 admin_permissions의 실제 DB 값을 기준으로 관리자 임명, 해임, 권한 변경을 수행합니다."
        badge={
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-accent text-accent-foreground">
            <ShieldCheck className="size-3" />
            SUPER ADMIN
          </span>
        }
      />

      {errorMessage ? (
        <section className="bg-card rounded-xl border border-destructive/30 p-5 text-sm text-destructive">
          {errorMessage}
        </section>
      ) : (
        <AdminManagementControls
          admins={pageData?.admins ?? []}
          userCandidates={pageData?.userCandidates ?? []}
        />
      )}
    </div>
  );
}
