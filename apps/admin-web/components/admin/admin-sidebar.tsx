'use client';

import type { ComponentType } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ArrowLeft,
  Boxes,
  CalendarDays,
  LayoutDashboard,
  Megaphone,
  Package,
  Receipt,
  ScrollText,
  Settings,
  ShieldCheck,
  Sparkles,
  ToggleRight,
  UserCog,
  Users,
  Wrench,
} from 'lucide-react';
import {
  getRoleLabel,
  getVisibleAdminNavItems,
  type AdminNavItemId,
  type AdminPermissionRow,
  type ProfileRow,
} from '@/lib/super-admin-data';

const navIcons: Record<AdminNavItemId, ComponentType<{ className?: string }>> = {
  dashboard: LayoutDashboard,
  bookings: CalendarDays,
  queue: Wrench,
  demo: Sparkles,
  products: Package,
  inventory: Boxes,
  customers: Users,
  orders: Receipt,
  announcements: Megaphone,
  settings: Settings,
  admins: UserCog,
  menus: ToggleRight,
  policies: ShieldCheck,
  audit: ScrollText,
};

export function AdminSidebar({
  permissions,
  profile,
  storeName,
}: {
  permissions: AdminPermissionRow | null;
  profile: ProfileRow;
  storeName?: string;
}) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname?.startsWith(href);
  const adminNav = getVisibleAdminNavItems(profile, permissions, 'admin');
  const superNav = getVisibleAdminNavItems(profile, permissions, 'super');

  /** 매장명에서 첫 글자를 뽑아 아이콘에 사용 */
  const storeInitial = (storeName ?? 'S').slice(0, 1).toUpperCase();
  /** 브랜드명 — "매장명 Admin" 형태로 표시, 없으면 'Admin Console' */
  const brandLabel = storeName || 'Admin';

  return (
    <aside className="hidden md:flex w-64 shrink-0 bg-primary text-primary-foreground flex-col">
      <div className="px-5 h-16 flex items-center gap-2 border-b border-primary-foreground/10">
        <div className="size-8 rounded-xl bg-accent text-accent-foreground grid place-items-center font-display font-bold">
          {storeInitial}
        </div>
        <div className="leading-tight">
          <p className="font-display font-bold">{brandLabel}</p>
          <p className="text-[10px] text-primary-foreground/70 -mt-0.5">
            Admin Console
          </p>
        </div>
      </div>

      <div className="px-3 py-4">
        <div className="px-2 pb-2 text-[10px] font-semibold text-primary-foreground/50 tracking-wider uppercase">
          매장
        </div>
        <button className="w-full flex items-center gap-2 rounded-xl bg-primary-foreground/10 hover:bg-primary-foreground/15 transition px-3 py-2.5 text-left">
          <div className="size-7 rounded-md bg-accent text-accent-foreground grid place-items-center text-xs font-bold">
            {storeInitial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{brandLabel}</p>
            <p className="text-[10px] text-primary-foreground/60">
              {getRoleLabel(profile.role)}
            </p>
          </div>
        </button>
      </div>

      <nav className="px-3 flex-1 overflow-y-auto">
        <div className="px-2 pb-1.5 text-[10px] font-semibold text-primary-foreground/50 tracking-wider uppercase">
          운영
        </div>
        <ul className="space-y-0.5">
          {adminNav.map((n) => {
            const Icon = navIcons[n.id];
            const active = isActive(n.href);
            return (
              <li key={n.id}>
                <Link
                  href={n.href}
                  className={`flex items-center gap-3 px-3 h-10 rounded-xl text-sm transition ${
                    active
                      ? 'bg-accent text-accent-foreground font-semibold'
                      : 'text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground'
                  }`}
                >
                  <Icon className="size-4" />
                  <span className="flex-1">{n.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        {superNav.length > 0 ? (
          <>
            <div className="px-2 pt-5 pb-1.5 text-[10px] font-semibold text-accent tracking-wider uppercase flex items-center gap-1.5">
              <ShieldCheck className="size-3" />
              슈퍼 관리자
            </div>
            <ul className="space-y-0.5">
              {superNav.map((n) => {
                const Icon = navIcons[n.id];
                const active = isActive(n.href);
                return (
                  <li key={n.id}>
                    <Link
                      href={n.href}
                      className={`flex items-center gap-3 px-3 h-10 rounded-xl text-sm transition ${
                        active
                          ? 'bg-accent text-accent-foreground font-semibold'
                          : 'text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground'
                      }`}
                    >
                      <Icon className="size-4" />
                      <span className="flex-1">{n.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </>
        ) : null}
      </nav>

      <div className="p-3 border-t border-primary-foreground/10">
        <Link
          href="/me"
          className="flex items-center gap-2 px-3 h-10 rounded-xl text-xs text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground transition"
        >
          <ArrowLeft className="size-3.5" />
          앱으로 돌아가기
        </Link>
      </div>
    </aside>
  );
}
