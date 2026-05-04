import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSegments } from 'expo-router';

import {
  canUsePermission,
  getAdminPermissions,
  type PermissionKey,
} from '@/services/adminService';
import type { AdminPermission } from '@/types/database';

import { useAuth } from './useAuth';
import { useRoleGuard } from './useRoleGuard';

const routePermissionMap: Record<string, PermissionKey> = {
  strings: 'can_manage_strings',
  demo: 'can_manage_demo_rackets',
  'demo-rackets': 'can_manage_demo_rackets',
  bookings: 'can_manage_bookings',
  users: 'can_ban_users',
  products: 'can_manage_products',
  orders: 'can_manage_orders',
  notices: 'can_post_notice',
  settings: 'can_toggle_app_menu',
};

const superAdminOnlyRoutes = new Set(['manage-admins']);

export function getRequiredAdminPermission(
  segments: string[],
): PermissionKey | null {
  const leafSegment = segments[segments.length - 1];

  return leafSegment ? routePermissionMap[leafSegment] ?? null : null;
}

export function requiresSuperAdmin(segments: string[]) {
  const leafSegment = segments[segments.length - 1];

  return Boolean(leafSegment && superAdminOnlyRoutes.has(leafSegment));
}

export function useAdminPermissionGuard() {
  const router = useRouter();
  const roleGuard = useRoleGuard();
  const { profile } = useAuth();
  const segments = useSegments() as string[];
  const requiredPermission = useMemo(
    () => getRequiredAdminPermission(segments),
    [segments],
  );
  const superAdminOnly = useMemo(() => requiresSuperAdmin(segments), [segments]);
  const [permissions, setPermissions] = useState<AdminPermission | null>(null);
  const [isCheckingPermission, setIsCheckingPermission] = useState(false);

  useEffect(() => {
    let active = true;

    if (!requiredPermission || profile?.role !== 'admin') {
      setPermissions(null);
      setIsCheckingPermission(false);
      return () => {
        active = false;
      };
    }

    setIsCheckingPermission(true);
    getAdminPermissions(profile.id)
      .then((nextPermissions) => {
        if (active) {
          setPermissions(nextPermissions);
        }
      })
      .finally(() => {
        if (active) {
          setIsCheckingPermission(false);
        }
      });

    return () => {
      active = false;
    };
  }, [profile, requiredPermission]);

  const hasPermission =
    !requiredPermission ||
    canUsePermission(profile, permissions, requiredPermission);
  const hasSuperAdminAccess = !superAdminOnly || profile?.role === 'super_admin';

  useEffect(() => {
    if (
      roleGuard.isChecking ||
      isCheckingPermission ||
      !roleGuard.canAccess ||
      (hasPermission && hasSuperAdminAccess)
    ) {
      return;
    }

    router.replace('/(admin)');
  }, [
    hasPermission,
    hasSuperAdminAccess,
    isCheckingPermission,
    roleGuard.canAccess,
    roleGuard.isChecking,
    router,
  ]);

  return {
    canAccess: roleGuard.canAccess && hasPermission && hasSuperAdminAccess,
    isChecking: roleGuard.isChecking || isCheckingPermission,
    requiredPermission,
    superAdminOnly,
  };
}
