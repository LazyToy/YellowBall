import { useEffect, useState } from 'react';

import {
  canUsePermission,
  getAdminPermissions,
  type PermissionKey,
} from '@/services/adminService';
import type { AdminPermission } from '@/types/database';

import { useAuth } from './useAuth';

export type PermissionState = {
  allowed: boolean;
  isChecking: boolean;
  permissions: AdminPermission | null;
};

export function usePermission(key: PermissionKey): PermissionState {
  const { profile } = useAuth();
  const [permissions, setPermissions] = useState<AdminPermission | null>(null);
  const [isChecking, setIsChecking] = useState(profile?.role === 'admin');

  useEffect(() => {
    let active = true;

    if (!profile || profile.role !== 'admin') {
      setPermissions(null);
      setIsChecking(false);
      return () => {
        active = false;
      };
    }

    setIsChecking(true);

    getAdminPermissions(profile.id)
      .then((nextPermissions) => {
        if (active) {
          setPermissions(nextPermissions);
        }
      })
      .finally(() => {
        if (active) {
          setIsChecking(false);
        }
      });

    return () => {
      active = false;
    };
  }, [profile]);

  return {
    allowed: canUsePermission(profile, permissions, key),
    isChecking,
    permissions,
  };
}
