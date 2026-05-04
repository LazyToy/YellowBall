import { useEffect } from 'react';
import { useRouter } from 'expo-router';

import { useAuth } from './useAuth';

export type RoleGuardResult = {
  canAccess: boolean;
  isChecking: boolean;
};

export function useRoleGuard(): RoleGuardResult {
  const router = useRouter();
  const { session, isLoading, isAdmin } = useAuth();
  const canAccess = !isLoading && isAdmin;

  useEffect(() => {
    if (isLoading || canAccess) {
      return;
    }

    if (!session) {
      router.replace('/(auth)/login');
      return;
    }

    router.replace('/(tabs)');
  }, [canAccess, isLoading, router, session]);

  return {
    canAccess,
    isChecking: isLoading,
  };
}
