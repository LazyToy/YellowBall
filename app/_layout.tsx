import React, { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { LoadingSpinner } from '@/components/LoadingSpinner';
import {
  PageRefreshProvider,
  usePageRefreshVersion,
} from '@/components/PageRefresh';
import { lightColors } from '@/constants/theme';
import { syncAuthSession, useAuth } from '@/hooks/useAuth';
import { supabase } from '@/services/supabase';

const isSessionExpired = (expiresAt?: number) =>
  typeof expiresAt === 'number' && expiresAt <= Math.floor(Date.now() / 1000);

function RootNavigator() {
  const router = useRouter();
  const segments = useSegments();
  const refreshVersion = usePageRefreshVersion();
  const { session, isLoading } = useAuth();
  const rootSegment = segments[0];
  const routeSegments = segments as unknown as string[];
  const isAuthCallback =
    rootSegment === 'auth' && routeSegments[1] === 'callback';

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

    if (!session && rootSegment !== '(auth)' && !isAuthCallback) {
      router.replace('/(auth)/login');
      return;
    }

    if (
      session &&
      (rootSegment === '(auth)' || isAuthCallback || !rootSegment)
    ) {
      router.replace('/(tabs)');
    }
  }, [isAuthCallback, isLoading, rootSegment, router, session]);

  if (isLoading) {
    return <LoadingSpinner fullScreen label="인증 상태 확인 중" />;
  }

  return (
    <Stack key={refreshVersion} screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="auth/callback" />
      <Stack.Screen name="(tabs)" />
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
      <PageRefreshProvider>
        <SafeAreaProvider>
          <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
            <RootNavigator />
          </SafeAreaView>
          <StatusBar style="auto" />
        </SafeAreaProvider>
      </PageRefreshProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: lightColors.background.hex,
    flex: 1,
  },
});
