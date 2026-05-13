import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';

import { Text } from '@/components/AppText';
import { Input } from '@/components/Input';
import { AppScrollView } from '@/components/MobileUI';
import { Typography } from '@/components/Typography';
import { sharedTextStyles } from '@/constants/componentStyles';
import { lightColors, theme } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { useResetOnBlur } from '@/hooks/useResetOnBlur';
import {
  checkEmailAvailable,
  checkUsernameAvailable,
  signUp,
} from '@/services/authService';
import type { SocialAuthProvider } from '@/services/authService';
import {
  validateEmail,
  validateNickname,
  validatePassword,
  validateUsername,
} from '@/utils/validation';

type FormState = {
  emailLocal: string;
  emailDomain: string;
  username: string;
  nickname: string;
  password: string;
  passwordConfirm: string;
};

const initialForm: FormState = {
  emailLocal: '',
  emailDomain: 'naver.com',
  username: '',
  nickname: '',
  password: '',
  passwordConfirm: '',
};

const initialTouched: Record<keyof FormState, boolean> = {
  emailLocal: false,
  emailDomain: false,
  username: false,
  nickname: false,
  password: false,
  passwordConfirm: false,
};

const USERNAME_CHECK_DELAY_MS = 350;
const EMAIL_CHECK_DELAY_MS = 350;
const EMAIL_CONFIRMATION_ALERT_TITLE = '이메일 인증 안내';
const CUSTOM_EMAIL_DOMAIN = 'custom';
const screenHorizontalPadding = theme.spacing[6];
const formHorizontalPadding = theme.spacing[5];
const emailAtSignWidth = 18;
const emailRowGap = theme.spacing[2];
const emailControlHeight = theme.controlHeights.md + theme.spacing[1] * 2;
const emailDomainMenuTop =
  theme.typography.lineHeight.sm +
  theme.spacing[2] +
  emailControlHeight +
  theme.spacing[1];
const minEmailFieldWidth = 104;
const emailDomainOptions = [
  { label: 'naver.com', value: 'naver.com' },
  { label: 'gmail.com', value: 'gmail.com' },
  { label: 'daum.net', value: 'daum.net' },
  { label: 'hanmail.net', value: 'hanmail.net' },
  { label: 'kakao.com', value: 'kakao.com' },
  { label: '직접 입력', value: CUSTOM_EMAIL_DOMAIN },
] as const;

const clampNumber = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export const getEmailDomainMenuMetrics = (
  windowWidth: number,
  windowHeight: number,
) => {
  const shortestWindowSide = Math.max(0, Math.min(windowWidth, windowHeight));
  const optionHeight = clampNumber(
    Math.round(shortestWindowSide * 0.19),
    72,
    84,
  );
  const optionTextLineHeight = optionHeight >= 80 ? 24 : 22;
  const optionVerticalPadding = Math.max(
    theme.spacing[4],
    Math.floor((optionHeight - optionTextLineHeight) / 2),
  );

  return {
    menuHeight:
      optionHeight * emailDomainOptions.length +
      theme.borderWidth.hairline * (emailDomainOptions.length - 1),
    optionHeight,
    optionTextLineHeight,
    optionVerticalPadding,
  };
};

type EmailDomainValue = (typeof emailDomainOptions)[number]['value'];

const commonEmailDomainValues = emailDomainOptions
  .filter((option) => option.value !== CUSTOM_EMAIL_DOMAIN)
  .map((option) => option.value);

const toEmailAddress = (form: FormState) =>
  `${form.emailLocal.trim()}@${form.emailDomain.trim().toLowerCase()}`;

const passwordConfirmError = (
  password: string,
  passwordConfirm: string,
  required: boolean,
) => {
  if (!passwordConfirm && required) {
    return '비밀번호 확인을 입력해 주세요.';
  }

  if (!passwordConfirm || password === passwordConfirm) {
    return undefined;
  }

  return '비밀번호가 일치하지 않습니다.';
};

export default function RegisterScreen() {
  const router = useRouter();
  const { signInWithOAuthProvider } = useAuth();
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();
  const [form, setForm] = useState<FormState>(initialForm);
  const [touched, setTouched] =
    useState<Record<keyof FormState, boolean>>(initialTouched);
  const [submitted, setSubmitted] = useState(false);
  const [emailDomainSelection, setEmailDomainSelection] =
    useState<EmailDomainValue>('naver.com');
  const [domainMenuOpen, setDomainMenuOpen] = useState(false);
  const [emailDuplicated, setEmailDuplicated] = useState(false);
  const [emailCheckError, setEmailCheckError] = useState<string>();
  const [emailAvailable, setEmailAvailable] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [usernameDuplicated, setUsernameDuplicated] = useState(false);
  const [usernameCheckError, setUsernameCheckError] = useState<string>();
  const [usernameAvailable, setUsernameAvailable] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [socialProvider, setSocialProvider] =
    useState<SocialAuthProvider | null>(null);
  const [submitError, setSubmitError] = useState<string>();
  const [successMessage, setSuccessMessage] = useState<string>();

  const resetForm = useCallback(() => {
    setForm(initialForm);
    setTouched(initialTouched);
    setSubmitted(false);
    setEmailDomainSelection('naver.com');
    setDomainMenuOpen(false);
    setEmailDuplicated(false);
    setEmailCheckError(undefined);
    setEmailAvailable(false);
    setIsCheckingEmail(false);
    setUsernameDuplicated(false);
    setUsernameCheckError(undefined);
    setUsernameAvailable(false);
    setIsCheckingUsername(false);
    setIsSubmitting(false);
    setSocialProvider(null);
    setSubmitError(undefined);
    setSuccessMessage(undefined);
  }, []);

  useResetOnBlur(resetForm);

  const closeDomainMenu = useCallback(() => {
    setDomainMenuOpen(false);
  }, []);

  const email = useMemo(() => toEmailAddress(form), [form]);
  const emailValidation = useMemo(
    () => validateEmail(email, emailDuplicated),
    [email, emailDuplicated],
  );
  const passwordValidation = useMemo(
    () => validatePassword(form.password),
    [form.password],
  );
  const usernameValidation = useMemo(
    () => validateUsername(form.username, usernameDuplicated),
    [form.username, usernameDuplicated],
  );
  const nicknameValidation = useMemo(
    () => validateNickname(form.nickname),
    [form.nickname],
  );
  const passwordConfirmValidationError = passwordConfirmError(
    form.password,
    form.passwordConfirm,
    submitted || touched.passwordConfirm,
  );

  useEffect(() => {
    let active = true;
    const normalizedEmail = email.trim().toLowerCase();
    const formatValidation = validateEmail(normalizedEmail);

    setEmailDuplicated(false);
    setEmailCheckError(undefined);
    setEmailAvailable(false);

    if (!normalizedEmail || !formatValidation.valid) {
      setIsCheckingEmail(false);
      return () => {
        active = false;
      };
    }

    setIsCheckingEmail(true);

    const checkTimer = setTimeout(() => {
      checkEmailAvailable(normalizedEmail)
        .then((available) => {
          if (!active) {
            return;
          }

          setEmailDuplicated(!available);
          setEmailAvailable(available);
        })
        .catch(() => {
          if (!active) {
            return;
          }

          setEmailAvailable(false);
          setEmailCheckError(
            '이메일 중복 확인에 실패했습니다. 잠시 후 다시 시도해 주세요.',
          );
        })
        .finally(() => {
          if (active) {
            setIsCheckingEmail(false);
          }
        });
    }, EMAIL_CHECK_DELAY_MS);

    return () => {
      active = false;
      clearTimeout(checkTimer);
    };
  }, [email]);

  useEffect(() => {
    let active = true;
    const username = form.username.trim();
    const formatValidation = validateUsername(username);

    setUsernameDuplicated(false);
    setUsernameCheckError(undefined);
    setUsernameAvailable(false);

    if (!username || !formatValidation.valid) {
      setIsCheckingUsername(false);
      return () => {
        active = false;
      };
    }

    setIsCheckingUsername(true);

    const checkTimer = setTimeout(() => {
      checkUsernameAvailable(username)
        .then((available) => {
          if (!active) {
            return;
          }

          setUsernameDuplicated(!available);
          setUsernameAvailable(available);
        })
        .catch(() => {
          if (!active) {
            return;
          }

          setUsernameAvailable(false);
          setUsernameCheckError(
            '아이디 중복 확인에 실패했습니다. 잠시 후 다시 시도해 주세요.',
          );
        })
        .finally(() => {
          if (active) {
            setIsCheckingUsername(false);
          }
        });
    }, USERNAME_CHECK_DELAY_MS);

    return () => {
      active = false;
      clearTimeout(checkTimer);
    };
  }, [form.username]);

  const updateField = (field: keyof FormState) => (value: string) => {
    setSubmitError(undefined);
    setSuccessMessage(undefined);
    setTouched((current) => ({ ...current, [field]: true }));
    setForm((current) => ({ ...current, [field]: value }));
  };

  const updateEmailLocal = (value: string) => {
    setSubmitError(undefined);
    setSuccessMessage(undefined);
    setTouched((current) => ({
      ...current,
      emailDomain: true,
      emailLocal: true,
    }));

    if (value.includes('@')) {
      const [local, ...domainParts] = value.split('@');
      const pastedDomain = domainParts.join('@').trim().toLowerCase();
      const domainSelection = commonEmailDomainValues.includes(
        pastedDomain as (typeof commonEmailDomainValues)[number],
      )
        ? (pastedDomain as EmailDomainValue)
        : CUSTOM_EMAIL_DOMAIN;

      setEmailDomainSelection(domainSelection);
      setForm((current) => ({
        ...current,
        emailDomain: pastedDomain,
        emailLocal: local,
      }));
      return;
    }

    setForm((current) => ({ ...current, emailLocal: value }));
  };

  const selectEmailDomain = (value: EmailDomainValue) => {
    setSubmitError(undefined);
    setSuccessMessage(undefined);
    setTouched((current) => ({ ...current, emailDomain: true }));
    setEmailDomainSelection(value);
    setDomainMenuOpen(false);
    setForm((current) => ({
      ...current,
      emailDomain: value === CUSTOM_EMAIL_DOMAIN ? '' : value,
    }));
  };

  const updateCustomEmailDomain = (value: string) => {
    setSubmitError(undefined);
    setSuccessMessage(undefined);
    setTouched((current) => ({ ...current, emailDomain: true }));
    setForm((current) => ({
      ...current,
      emailDomain: value.replace(/^@/, '').trim().toLowerCase(),
    }));
  };

  const markTouched = (field: keyof FormState) => () => {
    setTouched((current) => ({ ...current, [field]: true }));
  };

  const shouldShowError = (field: keyof FormState) => submitted || touched[field];
  const shouldShowEmailError =
    submitted || touched.emailLocal || touched.emailDomain;

  const isFormValid =
    emailValidation.valid &&
    usernameValidation.valid &&
    nicknameValidation.valid &&
    passwordValidation.valid &&
    !passwordConfirmValidationError &&
    Boolean(form.passwordConfirm) &&
    !emailCheckError &&
    !usernameCheckError &&
    !isCheckingEmail &&
    !isCheckingUsername;

  const handleSubmit = async () => {
    setSubmitted(true);
    setSubmitError(undefined);
    setSuccessMessage(undefined);

    if (!isFormValid) {
      setSubmitError('입력값을 다시 확인해 주세요.');
      return;
    }

    setIsSubmitting(true);

    try {
      await signUp(
        email.trim(),
        form.password,
        form.username.trim(),
        form.nickname.trim(),
      );
      const message = `${email.trim()} 주소로 인증 이메일을 보냈습니다. 메일함에서 인증을 완료한 뒤 로그인해 주세요.`;

      setSuccessMessage(message);
      Alert.alert(EMAIL_CONFIRMATION_ALERT_TITLE, message, [
        {
          text: '확인',
          onPress: () => router.replace('/(auth)/login'),
        },
      ]);
    } catch (error) {
      if (error instanceof Error) {
        setSubmitError(error.message);
      } else {
        setSubmitError('회원가입에 실패했습니다. 잠시 후 다시 시도해 주세요.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSocialSignIn = async (provider: SocialAuthProvider) => {
    setSubmitError(undefined);
    setSuccessMessage(undefined);
    setSocialProvider(provider);

    try {
      const result = await signInWithOAuthProvider(provider);

      if (result.error || !result.session) {
        setSubmitError(result.error?.message ?? '소셜 로그인에 실패했습니다.');
        return;
      }

      router.replace('/(tabs)');
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : '소셜 로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.',
      );
    } finally {
      setSocialProvider(null);
    }
  };

  const goToLogin = useCallback(() => {
    router.replace('/(auth)/login');
  }, [router]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        goToLogin();
        return true;
      },
    );

    return () => subscription.remove();
  }, [goToLogin]);

  const isBusy = isSubmitting || socialProvider !== null;
  const hasAvailabilityCheckError = Boolean(emailCheckError || usernameCheckError);
  const isSubmitDisabled =
    isBusy || isCheckingEmail || isCheckingUsername || hasAvailabilityCheckError;
  const emailFieldWidth = useMemo(() => {
    const contentWidth = Math.max(
      0,
      Math.floor(windowWidth - screenHorizontalPadding * 2 - formHorizontalPadding * 2),
    );
    const fieldWidth = Math.floor(
      (contentWidth - emailAtSignWidth - emailRowGap * 2) / 2,
    );

    return Math.max(minEmailFieldWidth, fieldWidth);
  }, [windowWidth]);
  const emailDomainMenuMetrics = useMemo(
    () => getEmailDomainMenuMetrics(windowWidth, windowHeight),
    [windowHeight, windowWidth],
  );

  return (
    <AppScrollView
      contentContainerStyle={styles.container}
      testID="register-scroll-view"
    >
      {domainMenuOpen ? (
        <Pressable
          accessibilityLabel="이메일 도메인 메뉴 닫기"
          accessibilityRole="button"
          onPress={closeDomainMenu}
          style={styles.domainScreenDismissLayer}
          testID="domain-screen-dismiss-layer"
        />
      ) : null}
        <View style={styles.header}>
          <Typography variant="caption" style={styles.eyebrow}>
            YellowBall account
          </Typography>
          <Typography variant="h1">회원가입</Typography>
          <Typography variant="body" style={styles.description}>
            이메일 계정을 만들거나 소셜 계정으로 바로 시작하세요.
          </Typography>
        </View>

        <View style={styles.form}>
          {domainMenuOpen ? (
            <Pressable
              accessibilityLabel="이메일 도메인 메뉴 닫기"
              accessibilityRole="button"
              onPress={closeDomainMenu}
              style={styles.domainMenuDismissLayer}
              testID="domain-menu-dismiss-layer"
            />
          ) : null}
          <View
            pointerEvents={domainMenuOpen ? 'box-none' : 'auto'}
            style={[
              styles.emailGroup,
              domainMenuOpen
                ? {
                    marginBottom: -emailDomainMenuMetrics.menuHeight,
                    paddingBottom: emailDomainMenuMetrics.menuHeight,
                  }
                : null,
            ]}
          >
            <View style={styles.emailLabelRow} testID="email-label-row">
              <Text
                style={[
                  styles.emailLabel,
                  {
                    marginRight: emailRowGap,
                    width: emailFieldWidth,
                  },
                ]}
                testID="email-local-label"
              >
                이메일
              </Text>
              <View style={styles.emailAtSignLabelSpacer} />
              <Text
                style={[
                  styles.emailDomainLabel,
                  {
                    width: emailFieldWidth,
                  },
                ]}
                testID="email-domain-label"
              >
                도메인
              </Text>
            </View>
            <View style={[styles.emailRow]} testID="email-row">
              <View
                style={[
                  styles.emailLocalField,
                  {
                    flexBasis: emailFieldWidth,
                    marginRight: emailRowGap,
                    maxWidth: emailFieldWidth,
                    width: emailFieldWidth,
                  },
                ]}
                testID="email-local-field"
              >
                <Input
                  accessibilityLabel="이메일 아이디"
                  autoCapitalize="none"
                  containerStyle={styles.emailInput}
                  keyboardType="email-address"
                  onChangeText={updateEmailLocal}
                  onBlur={markTouched('emailLocal')}
                  onFocus={closeDomainMenu}
                  placeholder="yellow"
                  textContentType="emailAddress"
                  value={form.emailLocal}
                />
              </View>
              <View style={styles.atSignBox} testID="email-at-sign">
                <Text style={styles.atSign}>@</Text>
              </View>
              <View
                style={[
                  styles.emailDomainField,
                  {
                    flexBasis: emailFieldWidth,
                    maxWidth: emailFieldWidth,
                    width: emailFieldWidth,
                  },
              ]}
                testID="email-domain-field"
              >
                <View
                  style={styles.domainSelectSurface}
                  testID="email-domain-select-surface"
                >
                  <Pressable
                    accessibilityLabel="이메일 도메인 선택"
                    accessibilityRole="button"
                    hitSlop={4}
                    onPress={() => setDomainMenuOpen((open) => !open)}
                    style={({ pressed }) => [
                      styles.domainSelectPressable,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text
                      allowFontScaling={false}
                      numberOfLines={1}
                      style={[
                        styles.domainSelectText,
                        emailDomainSelection === CUSTOM_EMAIL_DOMAIN &&
                          !form.emailDomain &&
                          styles.domainSelectPlaceholder,
                      ]}
                    >
                      {emailDomainSelection === CUSTOM_EMAIL_DOMAIN
                        ? form.emailDomain || '직접 입력'
                        : emailDomainSelection}
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>
            {domainMenuOpen ? (
              <View
                style={[
                  styles.domainMenuAnchor,
                  {
                    left:
                      emailFieldWidth + emailRowGap + emailAtSignWidth + emailRowGap,
                    top: emailDomainMenuTop,
                    width: emailFieldWidth,
                  },
                ]}
                testID="domain-menu-anchor"
              >
                <View style={styles.domainMenu}>
                  {emailDomainOptions.map((option, index) => (
                    <React.Fragment key={option.value}>
                      <Pressable
                        accessibilityLabel={`이메일 도메인 ${option.label}`}
                        accessibilityRole="button"
                        onPress={() => selectEmailDomain(option.value)}
                        style={({ pressed }) => [
                          styles.domainOption,
                          {
                            minHeight: emailDomainMenuMetrics.optionHeight,
                            paddingVertical:
                              emailDomainMenuMetrics.optionVerticalPadding,
                          },
                          option.value === emailDomainSelection &&
                            styles.domainOptionSelected,
                          pressed && styles.pressed,
                        ]}
                      >
                        <Text
                          allowFontScaling={false}
                          style={[
                            styles.domainOptionText,
                            {
                              lineHeight:
                                emailDomainMenuMetrics.optionTextLineHeight,
                            },
                            option.value === emailDomainSelection &&
                              styles.domainOptionTextSelected,
                          ]}
                        >
                          {option.label}
                        </Text>
                      </Pressable>
                      {index < emailDomainOptions.length - 1 ? (
                        <View
                          pointerEvents="none"
                          style={styles.domainOptionSeparator}
                          testID={`email-domain-option-separator-${index}`}
                        />
                      ) : null}
                    </React.Fragment>
                  ))}
                </View>
              </View>
            ) : null}
            {emailDomainSelection === CUSTOM_EMAIL_DOMAIN ? (
              <Input
                accessibilityLabel="이메일 도메인 직접 입력"
                autoCapitalize="none"
                containerStyle={styles.customDomainInput}
                keyboardType="email-address"
                onChangeText={updateCustomEmailDomain}
                onBlur={markTouched('emailDomain')}
                onFocus={closeDomainMenu}
                placeholder="example.com"
                value={form.emailDomain}
              />
            ) : null}
            {shouldShowEmailError && emailValidation.error ? (
              <Typography
                accessibilityRole="alert"
                variant="caption"
                style={styles.errorText}
              >
                {emailValidation.error}
              </Typography>
            ) : null}
            {isCheckingEmail ? (
              <Typography variant="caption" style={styles.helperText}>
                이메일 중복 확인 중입니다.
              </Typography>
            ) : null}
            {!isCheckingEmail && emailCheckError ? (
              <Typography variant="caption" style={styles.warningText}>
                {emailCheckError}
              </Typography>
            ) : null}
            {!isCheckingEmail && !emailCheckError && emailAvailable ? (
              <Typography variant="caption" style={styles.availabilitySuccessText}>
                가입 가능한 이메일입니다.
              </Typography>
            ) : null}
          </View>
          <Input
            accessibilityLabel="아이디"
            autoCapitalize="none"
            error={
              shouldShowError('username')
                ? usernameValidation.error
                : undefined
            }
            label="아이디"
            onChangeText={updateField('username')}
            onBlur={markTouched('username')}
            onFocus={closeDomainMenu}
            placeholder="yellow_01"
            value={form.username}
          />
          {isCheckingUsername ? (
            <Typography variant="caption" style={styles.helperText}>
              아이디 중복 확인 중입니다.
            </Typography>
          ) : null}
          {!isCheckingUsername && usernameCheckError ? (
            <Typography variant="caption" style={styles.warningText}>
              {usernameCheckError}
            </Typography>
          ) : null}
          {!isCheckingUsername && !usernameCheckError && usernameAvailable ? (
            <Typography variant="caption" style={styles.availabilitySuccessText}>
              가입 가능한 아이디입니다.
            </Typography>
          ) : null}
          <Input
            accessibilityLabel="닉네임"
            error={
              shouldShowError('nickname') ? nicknameValidation.error : undefined
            }
            label="닉네임"
            onChangeText={updateField('nickname')}
            onBlur={markTouched('nickname')}
            onFocus={closeDomainMenu}
            placeholder="옐로볼"
            value={form.nickname}
          />
          <Input
            accessibilityLabel="비밀번호"
            error={
              shouldShowError('password') ? passwordValidation.error : undefined
            }
            label="비밀번호"
            onChangeText={updateField('password')}
            onBlur={markTouched('password')}
            onFocus={closeDomainMenu}
            placeholder="8자 이상"
            secureTextEntry
            textContentType="newPassword"
            value={form.password}
          />
          <Input
            accessibilityLabel="비밀번호 확인"
            error={
              shouldShowError('passwordConfirm')
                ? passwordConfirmValidationError
                : undefined
            }
            label="비밀번호 확인"
            onChangeText={updateField('passwordConfirm')}
            onBlur={markTouched('passwordConfirm')}
            onFocus={closeDomainMenu}
            placeholder="비밀번호 재입력"
            secureTextEntry
            textContentType="newPassword"
            value={form.passwordConfirm}
          />

          {submitError ? (
            <Typography
              accessibilityRole="alert"
              variant="caption"
              style={styles.errorText}
            >
              {submitError}
            </Typography>
          ) : null}
          {successMessage ? (
            <Typography variant="caption" style={styles.successText}>
              {successMessage}
            </Typography>
          ) : null}

          <Pressable
            accessibilityLabel="가입하기"
            accessibilityRole="button"
            accessibilityState={{
              busy: isSubmitting,
              disabled: isSubmitDisabled,
            }}
            disabled={isSubmitDisabled}
            onPress={handleSubmit}
            style={[
              styles.authButton,
              styles.nativeAuthButton,
              isSubmitDisabled ? styles.nativeAuthButtonDisabled : null,
            ]}
            testID="signup-submit-button"
          >
            {isSubmitting ? (
              <ActivityIndicator
                color={lightColors.primaryForeground.hex}
                size="small"
              />
            ) : null}
            <Text
              style={styles.nativeAuthButtonText}
              testID="signup-submit-label"
            >
              가입하기
            </Text>
          </Pressable>

          <View style={styles.divider} />

          <SocialSignupButton
            accessibilityLabel="Google로 가입"
            disabled={isBusy}
            loading={socialProvider === 'google'}
            onPress={() => handleSocialSignIn('google')}
            provider="google"
            testID="google-social-signup-button"
            title="Google로 계속하기"
          />
          <SocialSignupButton
            accessibilityLabel="카카오톡으로 가입"
            disabled={isBusy}
            loading={socialProvider === 'kakao'}
            onPress={() => handleSocialSignIn('kakao')}
            provider="kakao"
            testID="kakao-social-signup-button"
            title="카카오톡으로 계속하기"
          />
        </View>

        <Pressable
          accessibilityRole="link"
          onPress={goToLogin}
          style={styles.loginLink}
        >
          <Typography variant="caption" style={styles.loginLinkText}>
            로그인으로 이동
          </Typography>
        </Pressable>
    </AppScrollView>
  );
}

function SocialSignupButton({
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
      testID={isGoogle ? 'google-social-signup-surface' : 'kakao-social-signup-surface'}
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
            testID={isGoogle ? 'google-social-signup-label' : 'kakao-social-signup-label'}
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
    gap: theme.spacing[8],
    justifyContent: 'flex-start',
    paddingHorizontal: screenHorizontalPadding,
    paddingBottom: theme.spacing[12],
    paddingTop: theme.spacing[6],
    position: 'relative',
  },
  header: {
    gap: theme.spacing[2],
  },
  eyebrow: {
    color: lightColors.primary.hex,
    fontWeight: theme.typography.fontWeight.semibold,
    textTransform: 'uppercase',
  },
  description: {
    color: lightColors.mutedForeground.hex,
  },
  form: {
    backgroundColor: lightColors.card.hex,
    borderColor: lightColors.border.hex,
    borderRadius: theme.borderRadius.xl,
    borderWidth: theme.borderWidth.hairline,
    gap: theme.spacing[4],
    overflow: 'visible',
    padding: formHorizontalPadding,
    position: 'relative',
    zIndex: 10,
    ...theme.shadow.card,
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
  nativeAuthButtonText: {
    color: lightColors.primaryForeground.hex,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 16,
    fontWeight: theme.typography.fontWeight.semibold,
    lineHeight: 20,
  },
  emailGroup: {
    elevation: 20,
    gap: theme.spacing[2],
    position: 'relative',
    zIndex: 20,
  },
  emailLabelRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  emailLabel: {
    ...sharedTextStyles.control,
    color: lightColors.foreground.hex,
  },
  emailRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  emailLocalField: {
    flexGrow: 0,
    flexShrink: 0,
    minWidth: 0,
  },
  emailInput: {
    width: '100%',
  },
  atSignBox: {
    alignItems: 'center',
    height: emailControlHeight,
    justifyContent: 'center',
    marginRight: emailRowGap,
    width: emailAtSignWidth,
  },
  emailAtSignLabelSpacer: {
    marginRight: emailRowGap,
    width: emailAtSignWidth,
  },
  atSign: {
    color: lightColors.mutedForeground.hex,
    fontFamily: theme.typography.fontFamily.display,
    fontSize: 18,
    fontWeight: theme.typography.fontWeight.semibold,
    lineHeight: 22,
  },
  emailDomainField: {
    flexGrow: 0,
    flexShrink: 0,
    minWidth: 0,
  },
  emailDomainLabel: {
    ...sharedTextStyles.control,
    color: lightColors.foreground.hex,
  },
  domainSelectSurface: {
    backgroundColor: lightColors.card.hex,
    borderColor: lightColors.input.hex,
    borderRadius: theme.borderRadius.md,
    borderWidth: theme.borderWidth.hairline,
    height: emailControlHeight,
    justifyContent: 'center',
    minHeight: emailControlHeight,
    minWidth: 0,
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
  },
  domainSelectPressable: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  domainSelectText: {
    color: lightColors.foreground.hex,
    flexShrink: 1,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.fontSize.sm,
    includeFontPadding: false,
    lineHeight: theme.typography.lineHeight.sm,
    paddingHorizontal: theme.spacing[3],
    width: '100%',
  },
  domainSelectPlaceholder: {
    color: lightColors.mutedForeground.hex,
  },
  domainMenuAnchor: {
    elevation: 20,
    position: 'absolute',
    zIndex: 10,
  },
  domainScreenDismissLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    zIndex: 5,
  },
  domainMenuDismissLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    zIndex: 0,
  },
  domainMenu: {
    backgroundColor: lightColors.card.hex,
    borderColor: lightColors.border.hex,
    borderRadius: theme.borderRadius.md,
    borderWidth: theme.borderWidth.hairline,
    elevation: 4,
    overflow: 'hidden',
  },
  domainOption: {
    alignSelf: 'stretch',
    justifyContent: 'center',
    width: '100%',
  },
  domainOptionSelected: {
    backgroundColor: lightColors.secondary.hex,
  },
  domainOptionSeparator: {
    backgroundColor: lightColors.input.hex,
    height: theme.borderWidth.hairline,
    width: '100%',
  },
  domainOptionText: {
    color: lightColors.foreground.hex,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.fontSize.sm,
    includeFontPadding: false,
    paddingHorizontal: theme.spacing[3],
  },
  domainOptionTextSelected: {
    color: lightColors.primary.hex,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  customDomainInput: {
    marginTop: -theme.spacing[1],
  },
  nativeAuthButtonDisabled: {
    opacity: theme.opacity.disabled,
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
  divider: {
    backgroundColor: lightColors.border.hex,
    height: StyleSheet.hairlineWidth,
  },
  helperText: {
    color: lightColors.mutedForeground.hex,
    marginTop: -theme.spacing[2],
  },
  errorText: {
    color: lightColors.destructive.hex,
  },
  successText: {
    color: lightColors.primary.hex,
  },
  availabilitySuccessText: {
    color: lightColors.primary.hex,
    marginTop: -theme.spacing[2],
  },
  warningText: {
    color: lightColors.mutedForeground.hex,
    marginTop: -theme.spacing[2],
  },
  loginLink: {
    alignItems: 'center',
    paddingVertical: theme.spacing[2],
  },
  loginLinkText: {
    color: lightColors.primary.hex,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  pressed: {
    opacity: theme.opacity.pressed,
  },
});
