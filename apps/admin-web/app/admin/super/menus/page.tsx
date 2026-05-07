import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { MenuSettingsControls } from '@/components/admin/super-admin-controls';
import { loadMenuSettingsPageData } from '@/lib/super-admin-data';
import { ShieldCheck } from 'lucide-react';

export default async function SuperMenusPage() {
  let pageData: Awaited<ReturnType<typeof loadMenuSettingsPageData>> | null = null;
  let errorMessage: string | null = null;

  try {
    pageData = await loadMenuSettingsPageData();
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : String(error);
  }

  return (
    <div>
      <AdminPageHeader
        label="SUPER ADMIN"
        title="메뉴 활성화"
        description="app_settings의 실제 DB 값을 기준으로 사용자 앱과 관리자 콘솔 메뉴 노출 상태를 변경합니다."
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
        <MenuSettingsControls
          initialSettings={pageData.settings}
          updatedAt={pageData.updatedAt}
        />
      ) : null}
    </div>
  );
}
