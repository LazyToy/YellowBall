import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import { Text } from '@/components/AppText';
import { Input } from '@/components/Input';
import { AppScrollView } from '@/components/MobileUI';
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
    <AppScrollView contentContainerStyle={styles.container}>
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

          <Pressable
            accessibilityLabel="로그인"
            accessibilityRole="button"
            accessibilityState={{ disabled: isBusy, busy: isSubmitting }}
            disabled={isBusy}
            onPress={handleSubmit}
            style={[
              styles.authButton,
              styles.nativeAuthButton,
              isBusy ? styles.nativeAuthButtonDisabled : null,
            ]}
          >
            {isSubmitting ? (
              <ActivityIndicator
                color={lightColors.primaryForeground.hex}
                size="small"
              />
            ) : null}
            <Text style={styles.nativeAuthButtonText}>
            로그인
            </Text>
          </Pressable>

          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Typography variant="caption" style={styles.dividerText}>
              또는
            </Typography>
            <View style={styles.divider} />
          </View>

          <SocialLoginButton
            accessibilityLabel="Google로 로그인"
            disabled={isBusy}
            loading={socialProvider === 'google'}
            onPress={() => handleSocialSignIn('google')}
            provider="google"
            testID="google-social-login-button"
            title="Google로 계속하기"
          />
          <SocialLoginButton
            accessibilityLabel="카카오톡으로 로그인"
            disabled={isBusy}
            loading={socialProvider === 'kakao'}
            onPress={() => handleSocialSignIn('kakao')}
            provider="kakao"
            testID="kakao-social-login-button"
            title="카카오톡으로 계속하기"
          />

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
    </AppScrollView>
  );
}

function SocialLoginButton({
  accessibilityLabel,
  disabled,
  loading,
  onPress,
  provider,
  testID,
  title,
}: {
  accessibilityLabel: string;
  disabled: boolean;
  loading: boolean;
  onPress: () => void;
  provider: 'google' | 'kakao';
  testID: string;
  title: string;
}) {
  const isGoogle = provider === 'google';

  return (
    <View
      style={[
        styles.socialButtonOuter,
        isGoogle ? styles.googleButton : styles.kakaoButton,
        disabled ? styles.nativeAuthButtonDisabled : null,
      ]}
      testID={isGoogle ? 'google-social-login-surface' : 'kakao-social-login-surface'}
    >
      <Pressable
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        accessibilityState={{ disabled, busy: loading }}
        android_ripple={{ color: 'rgba(0,0,0,0.08)', borderless: false }}
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => [
          styles.socialButtonPressable,
          pressed ? styles.pressed : null,
        ]}
        testID={testID}
      >
        {/* Android에서 Pressable의 flexDirection이 무시되므로 View로 레이아웃 처리 */}
        <View style={styles.socialButtonRow}>
          <View style={styles.socialIconSlot}>
            <View
              style={[styles.socialIcon, isGoogle ? styles.googleIcon : styles.kakaoIcon]}
            >
              <Text style={isGoogle ? styles.googleIconText : styles.kakaoIconText}>
                {isGoogle ? 'G' : 'K'}
              </Text>
            </View>
          </View>
          <Text
            adjustsFontSizeToFit
            minimumFontScale={0.86}
            numberOfLines={1}
            style={isGoogle ? styles.googleButtonText : styles.kakaoButtonText}
            testID={isGoogle ? 'google-social-login-label' : 'kakao-social-login-label'}
          >
            {title}
          </Text>
          <View style={styles.socialSpinnerSlot}>
            {loading ? (
              <ActivityIndicator
                color={isGoogle ? lightColors.foreground.hex : '#000000'}
                size="small"
              />
            ) : null}
          </View>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
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
  authButton: {
    width: '100%',
  },
  nativeAuthButton: {
    alignItems: 'center',
    backgroundColor: lightColors.primary.hex,
    borderColor: lightColors.primary.hex,
    borderRadius: theme.borderRadius.md,
    borderWidth: theme.borderWidth.hairline,
    elevation: 0,
    flexDirection: 'row',
    gap: theme.spacing[2],
    height: 48,
    justifyContent: 'center',
    minHeight: 48,
    overflow: 'hidden',
    zIndex: 1,
  },
  nativeAuthButtonDisabled: {
    opacity: theme.opacity.disabled,
  },
  nativeAuthButtonText: {
    color: lightColors.primaryForeground.hex,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 16,
    fontWeight: theme.typography.fontWeight.semibold,
    lineHeight: 20,
  },
  socialButtonOuter: {
    borderRadius: theme.borderRadius.md,
    borderWidth: theme.borderWidth.hairline,
    height: 48,
    minHeight: 48,
    overflow: 'hidden',
    width: '100%',
    zIndex: 1,
  },
  socialButtonPressable: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    minHeight: 48,
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
  },
  socialButtonRow: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    height: '100%',
    minHeight: 48,
    paddingHorizontal: theme.spacing[3],
    width: '100%',
  },
  googleButton: {
    backgroundColor: '#FFFFFF',
    borderColor: '#DADCE0',
  },
  kakaoButton: {
    backgroundColor: '#FEE500',
    borderColor: '#FEE500',
  },
  socialIconSlot: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
  },
  socialIcon: {
    alignItems: 'center',
    borderRadius: 6,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  googleIcon: {
    backgroundColor: '#FFFFFF',
  },
  kakaoIcon: {
    backgroundColor: '#000000',
  },
  googleIconText: {
    color: '#4285F4',
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 18,
    fontWeight: theme.typography.fontWeight.bold,
    includeFontPadding: false,
    lineHeight: 22,
  },
  kakaoIconText: {
    color: '#FEE500',
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 14,
    fontWeight: theme.typography.fontWeight.bold,
    includeFontPadding: false,
    lineHeight: 18,
  },
  googleButtonText: {
    color: '#3C4043',
    flex: 1,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 15,
    fontWeight: theme.typography.fontWeight.semibold,
    includeFontPadding: false,
    lineHeight: 20,
    maxWidth: '76%',
    textAlign: 'center',
  },
  kakaoButtonText: {
    color: '#000000',
    flex: 1,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 15,
    fontWeight: theme.typography.fontWeight.semibold,
    includeFontPadding: false,
    lineHeight: 20,
    maxWidth: '76%',
    textAlign: 'center',
  },
  socialSpinnerSlot: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
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
  pressed: {
    opacity: theme.opacity.pressed,
  },
});
