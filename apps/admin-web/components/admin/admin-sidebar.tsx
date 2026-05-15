'use client';

import type { ComponentType } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
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
}: {
  permissions: AdminPermissionRow | null;
  profile: ProfileRow;
}) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname?.startsWith(href);
  const adminNav = getVisibleAdminNavItems(profile, permissions, 'admin');
  const superNav = getVisibleAdminNavItems(profile, permissions, 'super');

  return (
    <aside className="hidden md:flex w-64 shrink-0 bg-primary text-primary-foreground flex-col">
      <nav className="px-3 py-4 flex-1 overflow-y-auto">
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
    </aside>
  );
}
