import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { StoreSettingsControls } from '@/components/admin/settings-controls';
import { loadAdminSettingsPageData } from '@/lib/super-admin-data';

export default async function AdminSettingsPage() {
  let pageData: Awaited<ReturnType<typeof loadAdminSettingsPageData>> | null = null;
  let errorMessage: string | null = null;

  try {
    pageData = await loadAdminSettingsPageData();
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : String(error);
  }

  return (
    <div>
      <AdminPageHeader
        label="STORE SETTINGS"
        title="설정"
        description="app_settings와 shop_schedule의 실제 DB 값을 기준으로 매장 정보와 영업시간을 관리합니다."
      />

      {errorMessage ? (
        <section className="bg-card rounded-xl border border-destructive/30 p-5 text-sm text-destructive">
          {errorMessage}
        </section>
      ) : pageData ? (
        <StoreSettingsControls
          initialSettings={pageData.settings}
          initialSchedule={pageData.schedule}
          updatedAt={pageData.updatedAt}
        />
      ) : null}
    </div>
  );
}
