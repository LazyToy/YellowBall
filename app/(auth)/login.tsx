import React, { useCallback, useEffect, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { RefreshableScrollView } from '@/components/PageRefresh';
import { Typography } from '@/components/Typography';
import { lightColors, theme } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { useResetOnBlur } from '@/hooks/useResetOnBlur';
import { getAppContentBlock } from '@/services/appContentService';
import type { SocialAuthProvider } from '@/services/authService';
import { getAppAssetUrl } from '@/services/storageService';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, signInWithOAuthProvider } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [socialProvider, setSocialProvider] =
    useState<SocialAuthProvider | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>();
  const [brandLogoUrl, setBrandLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    getAppContentBlock('brand_assets')
      .then((assets) => {
        if (!isMounted) {
          return;
        }

        setBrandLogoUrl(
          getAppAssetUrl(
            assets?.login_logo_path ??
              assets?.login_logo_url ??
              assets?.logo_path ??
              assets?.logo_url,
          ),
        );
      })
      .catch(() => {
        if (isMounted) {
          setBrandLogoUrl(null);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const resetForm = useCallback(() => {
    setEmail('');
    setPassword('');
    setErrorMessage(undefined);
    setSocialProvider(null);
    setIsSubmitting(false);
  }, []);

  useResetOnBlur(resetForm);

  const handleSubmit = async () => {
    setErrorMessage(undefined);

    if (!email.trim() || !password) {
      setErrorMessage('이메일과 비밀번호를 입력해 주세요.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await signIn(email.trim(), password);

      if (result.error || !result.session) {
        setErrorMessage(result.error?.message ?? '로그인에 실패했습니다.');
        return;
      }

      router.replace('/(tabs)');
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : '로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSocialSignIn = async (provider: SocialAuthProvider) => {
    setErrorMessage(undefined);
    setSocialProvider(provider);

    try {
      const result = await signInWithOAuthProvider(provider);

      if (result.error || !result.session) {
        setErrorMessage(result.error?.message ?? '로그인에 실패했습니다.');
        return;
      }

      router.replace('/(tabs)');
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : '소셜 로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.',
      );
    } finally {
      setSocialProvider(null);
    }
  };

  const goToRegister = () => {
    router.replace('/(auth)/register');
  };

  const isBusy = isSubmitting || socialProvider !== null;
  const brandLogoSource = brandLogoUrl ? { uri: brandLogoUrl } : null;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.keyboardView}
    >
      <RefreshableScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <View style={styles.brandMark}>
            {brandLogoSource ? (
              <Image
                accessibilityIgnoresInvertColors
                source={brandLogoSource}
                style={styles.brandMarkImage}
              />
            ) : (
              <Text style={styles.brandMarkFallback}>Y</Text>
            )}
          </View>
          <View style={styles.brandCopy}>
            <Text style={styles.locationText}>YellowBall</Text>
            <Text style={styles.brandText}>Stringing & Court Shop</Text>
          </View>
        </View>

        <View style={styles.hero}>
          <View style={styles.heroMarkShell}>
            {brandLogoSource ? (
              <Image
                accessibilityIgnoresInvertColors
                source={brandLogoSource}
                style={styles.heroMarkImage}
              />
            ) : (
              <Text style={styles.heroMarkFallback}>Y</Text>
            )}
          </View>
          <Typography variant="caption" style={styles.eyebrow}>
            WELCOME BACK
          </Typography>
          <Typography variant="h1" style={styles.title}>
            내 예약을 이어서 관리하세요
          </Typography>
          <Typography variant="body" style={styles.description}>
            라켓, 스트링 작업, 주문 현황을 한 번에 확인할 수 있습니다.
          </Typography>
        </View>

        <View style={styles.formCard}>
          <View style={styles.formHeader}>
            <Typography variant="h2" style={styles.formTitle}>
              로그인
            </Typography>
            <Typography variant="caption" style={styles.formCaption}>
              이메일 계정으로 계속하기
            </Typography>
          </View>

          <Input
            accessibilityLabel="이메일"
            autoCapitalize="none"
            keyboardType="email-address"
            label="이메일"
            onChangeText={(value) => {
              setErrorMessage(undefined);
              setEmail(value);
            }}
            placeholder="yellow@example.com"
            textContentType="emailAddress"
            value={email}
          />
          <Input
            accessibilityLabel="비밀번호"
            label="비밀번호"
            onChangeText={(value) => {
              setErrorMessage(undefined);
              setPassword(value);
            }}
            placeholder="비밀번호"
            secureTextEntry
            textContentType="password"
            value={password}
          />

          {errorMessage ? (
            <Typography
              accessibilityRole="alert"
              variant="caption"
              style={styles.errorText}
            >
              {errorMessage}
            </Typography>
          ) : null}

          <Button
            accessibilityLabel="로그인"
            disabled={isBusy}
            loading={isSubmitting}
            onPress={handleSubmit}
            size="lg"
          >
            로그인
          </Button>

          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Typography variant="caption" style={styles.dividerText}>
              또는
            </Typography>
            <View style={styles.divider} />
          </View>

          <Button
            accessibilityLabel="Google로 로그인"
            disabled={isBusy}
            loading={socialProvider === 'google'}
            onPress={() => handleSocialSignIn('google')}
            size="lg"
            variant="outline"
          >
            Google로 계속하기
          </Button>
          <Button
            accessibilityLabel="카카오로 로그인"
            disabled={isBusy}
            loading={socialProvider === 'kakao'}
            onPress={() => handleSocialSignIn('kakao')}
            size="lg"
            variant="secondary"
          >
            카카오로 계속하기
          </Button>

          <View style={styles.registerRow}>
            <Typography variant="caption" style={styles.registerCaption}>
              아직 계정이 없나요?
            </Typography>
            <Pressable
              accessibilityRole="link"
              onPress={goToRegister}
              style={styles.registerLink}
            >
              <Typography variant="caption" style={styles.registerLinkText}>
                이메일로 회원가입
              </Typography>
            </Pressable>
          </View>
        </View>
      </RefreshableScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    backgroundColor: lightColors.background.hex,
    flex: 1,
  },
  container: {
    backgroundColor: lightColors.background.hex,
    flexGrow: 1,
    gap: theme.spacing[5],
    paddingBottom: theme.spacing[8],
    paddingHorizontal: theme.spacing[5],
    paddingTop: theme.spacing[6],
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing[2],
  },
  brandMark: {
    alignItems: 'center',
    backgroundColor: lightColors.card.hex,
    borderColor: lightColors.border.hex,
    borderWidth: theme.borderWidth.hairline,
    borderRadius: 999,
    height: 36,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 36,
  },
  brandMarkImage: {
    height: 32,
    width: 32,
  },
  brandMarkFallback: {
    color: lightColors.primary.hex,
    fontFamily: theme.typography.fontFamily.display,
    fontSize: 18,
    fontWeight: theme.typography.fontWeight.bold,
    lineHeight: 22,
  },
  brandCopy: {
    flex: 1,
    minWidth: 0,
  },
  locationText: {
    color: lightColors.foreground.hex,
    fontFamily: theme.typography.fontFamily.display,
    fontSize: 14,
    fontWeight: theme.typography.fontWeight.semibold,
    lineHeight: 18,
  },
  brandText: {
    color: lightColors.mutedForeground.hex,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 11,
    lineHeight: 15,
  },
  hero: {
    alignItems: 'center',
    gap: theme.spacing[2],
    paddingTop: theme.spacing[6],
  },
  heroMarkShell: {
    alignItems: 'center',
    backgroundColor: lightColors.card.hex,
    borderColor: lightColors.border.hex,
    borderRadius: 999,
    borderWidth: theme.borderWidth.hairline,
    height: 116,
    justifyContent: 'center',
    marginBottom: theme.spacing[3],
    overflow: 'hidden',
    width: 116,
  },
  heroMarkImage: {
    height: 108,
    width: 108,
  },
  heroMarkFallback: {
    color: lightColors.primary.hex,
    fontFamily: theme.typography.fontFamily.display,
    fontSize: 58,
    fontWeight: theme.typography.fontWeight.bold,
    lineHeight: 66,
  },
  title: {
    fontSize: 26,
    lineHeight: 34,
    textAlign: 'center',
  },
  eyebrow: {
    color: lightColors.primary.hex,
    fontWeight: theme.typography.fontWeight.semibold,
    textTransform: 'uppercase',
  },
  description: {
    color: lightColors.mutedForeground.hex,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  formCard: {
    backgroundColor: lightColors.card.hex,
    borderColor: lightColors.border.hex,
    borderRadius: theme.borderRadius.lg,
    borderWidth: theme.borderWidth.hairline,
    gap: theme.spacing[3],
    padding: theme.spacing[4],
  },
  formHeader: {
    gap: theme.spacing[1],
    marginBottom: theme.spacing[1],
  },
  formTitle: {
    fontSize: 20,
    lineHeight: 26,
  },
  formCaption: {
    color: lightColors.mutedForeground.hex,
  },
  dividerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing[3],
    paddingVertical: theme.spacing[1],
  },
  divider: {
    backgroundColor: lightColors.border.hex,
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  dividerText: {
    color: lightColors.mutedForeground.hex,
  },
  errorText: {
    color: lightColors.destructive.hex,
  },
  registerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing[2],
    justifyContent: 'center',
    paddingTop: theme.spacing[1],
  },
  registerCaption: {
    color: lightColors.mutedForeground.hex,
  },
  registerLink: {
    alignItems: 'center',
    minHeight: theme.controlHeights.sm,
    justifyContent: 'center',
  },
  registerLinkText: {
    color: lightColors.primary.hex,
    fontWeight: theme.typography.fontWeight.semibold,
  },
});
