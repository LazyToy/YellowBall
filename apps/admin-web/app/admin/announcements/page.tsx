import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { AnnouncementManager } from '@/components/admin/announcement-manager';
import { loadAnnouncements, hasAdminReadKey } from '@/lib/admin-data';

export default async function AdminAnnouncementsPage() {
  const announcements = await loadAnnouncements();

  return (
    <div>
      <AdminPageHeader
        label="ANNOUNCEMENTS"
        title="공지/이벤트"
        description="app_content_blocks와 notifications 테이블 기반으로 게시물과 알림을 관리합니다."
      />

      {!hasAdminReadKey ? (
        <div className="mb-5 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-xs text-destructive">
          공지 작성과 전체 사용자 알림 생성에는 서버 전용 Supabase service role 키가 필요합니다.
        </div>
      ) : null}

      <AnnouncementManager announcements={announcements} />
    </div>
  );
}
