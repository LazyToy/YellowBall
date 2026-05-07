import { Bell, LogOut, Plus, Search, ShieldCheck } from 'lucide-react';

import { logoutAdminFromWeb } from '@/lib/admin-auth-actions';
import {
  getAdminDisplayInitial,
  getProfileDisplayName,
  getRoleLabel,
  type ProfileRow,
} from '@/lib/super-admin-data';

export function AdminTopbar({
  profile,
  storeName,
}: {
  profile: ProfileRow;
  storeName?: string;
}) {
  const displayName = getProfileDisplayName(profile);
  const initial = getAdminDisplayInitial(profile);
  const isSuperAdmin = profile.role === 'super_admin';
  const roleBadge = isSuperAdmin ? 'SUPER' : 'ADMIN';

  return (
    <header className="h-16 shrink-0 bg-card border-b border-border flex items-center gap-4 px-6">
      <div className="md:hidden font-display font-bold text-foreground">
        {storeName || 'Admin'}
      </div>

      <div className="hidden md:flex flex-1 max-w-md items-center gap-2 h-10 rounded-full bg-secondary px-4">
        <Search className="size-4 text-muted-foreground" />
        <input
          placeholder="예약 번호, 고객명, 상품 검색"
          className="flex-1 bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
        />
        <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-card border border-border text-muted-foreground">
          ⌘K
        </kbd>
      </div>

      <div className="flex-1 md:flex-none" />

      <button className="hidden md:inline-flex items-center gap-1.5 h-9 px-3 rounded-full bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition">
        <Plus className="size-3.5" />
        새 예약
      </button>

      <button
        className="relative size-9 grid place-items-center rounded-full hover:bg-secondary"
        aria-label="알림"
      >
        <Bell className="size-4 text-foreground" />
        <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-destructive ring-2 ring-card" />
      </button>

      <div className="flex items-center gap-2 pl-3 border-l border-border h-9">
        <div className="size-8 rounded-full bg-primary text-primary-foreground grid place-items-center font-bold text-xs">
          {initial}
        </div>
        <div className="hidden md:block leading-tight">
          <p className="text-xs font-semibold text-foreground flex items-center gap-1">
            {displayName}
            <span
              className={`inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                isSuperAdmin
                  ? 'bg-accent text-accent-foreground'
                  : 'bg-primary/10 text-primary'
              }`}
            >
              <ShieldCheck className="size-2.5" />
              {roleBadge}
            </span>
          </p>
          <p className="text-[10px] text-muted-foreground">
            {profile.email ?? profile.username ?? getRoleLabel(profile.role)}
          </p>
        </div>
      </div>

      <form action={logoutAdminFromWeb}>
        <button
          type="submit"
          className="size-9 grid place-items-center rounded-full hover:bg-secondary"
          aria-label="로그아웃"
        >
          <LogOut className="size-4 text-muted-foreground" />
        </button>
      </form>
    </header>
  );
}
