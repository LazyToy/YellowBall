import { Stack } from 'expo-router';

import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useAdminPermissionGuard } from '@/hooks/useAdminPermissionGuard';

export default function AdminLayout() {
  const { canAccess, isChecking } = useAdminPermissionGuard();

  if (isChecking || !canAccess) {
    return <LoadingSpinner fullScreen label="권한 확인 중" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="manage-admins" />
      <Stack.Screen name="strings" />
      <Stack.Screen name="demo-rackets" />
      <Stack.Screen name="schedule" />
      <Stack.Screen name="slots" />
      <Stack.Screen name="users" />
      <Stack.Screen name="bookings" />
      <Stack.Screen name="demo-bookings" />
      <Stack.Screen name="notifications" />
    </Stack>
  );
}
