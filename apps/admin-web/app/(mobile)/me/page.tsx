import Link from 'next/link';
import { PageHeader } from '@/components/app/page-header';
import { MeProfile } from '@/components/app/me/me-profile';
import { MeStats } from '@/components/app/me/me-stats';
import { MeMenuList } from '@/components/app/me/me-menu-list';
import { MeRackets } from '@/components/app/me/me-rackets';
import { Settings } from 'lucide-react';
import { loadStoreProfile } from '@/lib/super-admin-data';

export default async function MePage() {
  // DB에서 매장명 로드
  const storeProfile = await loadStoreProfile();
  const storeName = storeProfile.storeName || 'YellowBall';

  return (
    <>
      <PageHeader
        title="마이"
        back={false}
        right={
          <Link
            href="/me/settings"
            className="size-9 grid place-items-center rounded-full hover:bg-secondary"
            aria-label="설정"
          >
            <Settings className="size-5 text-foreground" />
          </Link>
        }
      />
      <MeProfile storeName={storeName} />
      <MeStats />
      <MeRackets />
      <MeMenuList />
      <div className="px-5 py-6 text-center">
        {/* DB에서 로드한 매장명으로 표시 */}
        <p className="text-[11px] text-muted-foreground">
          {storeName} v1.0.0 · MVP
        </p>
        <button className="mt-3 text-xs text-muted-foreground hover:text-destructive">
          로그아웃
        </button>
      </div>
    </>
  );
}
