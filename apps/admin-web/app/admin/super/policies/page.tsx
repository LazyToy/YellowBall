import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { PolicySettingsControls } from '@/components/admin/settings-controls';
import { loadPolicySettingsPageData } from '@/lib/super-admin-data';
import { ShieldCheck } from 'lucide-react';

export default async function SuperPoliciesPage() {
  let pageData: Awaited<ReturnType<typeof loadPolicySettingsPageData>> | null = null;
  let errorMessage: string | null = null;

  try {
    pageData = await loadPolicySettingsPageData();
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : String(error);
  }

  return (
    <div>
      <AdminPageHeader
        label="SUPER ADMIN"
        title="정책 관리"
        description="app_settings의 운영 정책 DB 값을 기준으로 예약, 제재, 환불, 알림 정책을 변경합니다."
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
      ) : pageData ? (
        <PolicySettingsControls
          initialSettings={pageData.settings}
          updatedAt={pageData.updatedAt}
        />
      ) : null}
    </div>
  );
}
