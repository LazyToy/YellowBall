import React, { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { LoadingSpinner } from '@/components/LoadingSpinner';
import { syncAuthSession, useAuth } from '@/hooks/useAuth';
import { supabase } from '@/services/supabase';

const isSessionExpired = (expiresAt?: number) =>
  typeof expiresAt === 'number' && expiresAt <= Math.floor(Date.now() / 1000);

function RootNavigator() {
  const router = useRouter();
  const segments = useSegments();
  const { session, isLoading } = useAuth();
  const rootSegment = segments[0];

  useEffect(() => {
    let isMounted = true;

    supabase.auth
      .getSession()
      .then(async ({ data, error }) => {
        if (error) {
          throw error;
        }

        if (data.session && isSessionExpired(data.session.expires_at)) {
          const { data: refreshedData, error: refreshError } =
            await supabase.auth.refreshSession();

          if (refreshError) {
            throw refreshError;
          }

          if (isMounted) {
            void syncAuthSession(refreshedData.session);
          }
          return;
        }

        if (isMounted) {
          void syncAuthSession(data.session);
        }
      })
      .catch(() => {
        if (isMounted) {
          void syncAuthSession(null);
        }
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void syncAuthSession(session);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!session && rootSegment !== '(auth)') {
      router.replace('/(auth)/login');
      return;
    }

    if (session && (rootSegment === '(auth)' || !rootSegment)) {
      router.replace('/(tabs)');
    }
  }, [isLoading, rootSegment, router, session]);

  if (isLoading) {
    return <LoadingSpinner fullScreen label="인증 상태 확인 중" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(admin)" />
    </Stack>
  );
}

export default function RootLayout() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <RootNavigator />
      <StatusBar style="auto" />
    </QueryClientProvider>
  );
}
