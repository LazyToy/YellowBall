import React, { useEffect, useMemo, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { useRouter } from 'expo-router';

import { Button } from '@/components/Button';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Typography } from '@/components/Typography';
import { lightColors, theme } from '@/constants/theme';
import { syncAuthSession } from '@/hooks/useAuth';
import { supabase } from '@/services/supabase';

type CallbackParams = {
  accessToken: string | null;
  refreshToken: string | null;
  code: string | null;
  error: string | null;
};

const getCurrentUrl = (linkingUrl: string | null) => {
  if (Platform.OS === 'web') {
    const href = (globalThis as { location?: { href?: string } }).location?.href;

    if (href) {
      return href;
    }
  }

  return linkingUrl;
};

const parseCallbackUrl = (callbackUrl: string | null): CallbackParams => {
  if (!callbackUrl) {
    return {
      accessToken: null,
      refreshToken: null,
      code: null,
      error: 'OAuth 콜백 주소를 찾지 못했습니다.',
    };
  }

  const parsedUrl = new URL(callbackUrl);
  const params = new URLSearchParams(parsedUrl.search);

  if (parsedUrl.hash) {
    const hashParams = new URLSearchParams(parsedUrl.hash.slice(1));
    hashParams.forEach((value, key) => {
      params.set(key, value);
    });
  }

  return {
    accessToken: params.get('access_token'),
    refreshToken: params.get('refresh_token'),
    code: params.get('code'),
    error: params.get('error_description') ?? params.get('error'),
  };
};

const isWebPopupCallback = () => {
  if (Platform.OS !== 'web') {
    return false;
  }

  return Boolean((globalThis as { opener?: unknown }).opener);
};

const completeWebPopupCallback = () => {
  WebBrowser.maybeCompleteAuthSession();
  (globalThis as { close?: () => void }).close?.();
};

export default function AuthCallbackScreen() {
  const router = useRouter();
  const linkingUrl = Linking.useURL();
  const callbackUrl = useMemo(() => getCurrentUrl(linkingUrl), [linkingUrl]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const completeOAuthSignIn = async () => {
      try {
        if (isWebPopupCallback()) {
          completeWebPopupCallback();
          return;
        }

        const callbackParams = parseCallbackUrl(callbackUrl);

        if (callbackParams.error) {
          throw new Error(callbackParams.error);
        }

        const authResult =
          callbackParams.accessToken && callbackParams.refreshToken
            ? await supabase.auth.setSession({
                access_token: callbackParams.accessToken,
                refresh_token: callbackParams.refreshToken,
              })
            : callbackParams.code
              ? await supabase.auth.exchangeCodeForSession(callbackParams.code)
              : {
                  data: { session: null },
                  error: new Error('OAuth 콜백에서 세션 정보를 찾지 못했습니다.'),
                };

        if (authResult.error) {
          throw authResult.error;
        }

        await syncAuthSession(authResult.data.session);

        if (isMounted) {
          router.replace('/(tabs)');
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : '소셜 로그인 처리에 실패했습니다.',
          );
        }
      }
    };

    void completeOAuthSignIn();

    return () => {
      isMounted = false;
    };
  }, [callbackUrl, router]);

  if (!errorMessage) {
    return <LoadingSpinner fullScreen label="로그인 처리 중" />;
  }

  return (
    <View style={styles.container}>
      <Typography variant="h1">로그인 실패</Typography>
      <Typography accessibilityRole="alert" variant="body" style={styles.message}>
        {errorMessage}
      </Typography>
      <Button onPress={() => router.replace('/(auth)/login')} size="lg">
        로그인으로 돌아가기
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'stretch',
    backgroundColor: lightColors.background.hex,
    flex: 1,
    gap: theme.spacing[4],
    justifyContent: 'center',
    padding: theme.spacing[6],
  },
  message: {
    color: lightColors.destructive.hex,
  },
});
