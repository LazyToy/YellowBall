import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
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
const EMAIL_FIELD_HEIGHT =
  theme.typography.lineHeight.sm + theme.spacing[2] + theme.controlHeights.md;
const EMAIL_DOMAIN_MENU_TOP = EMAIL_FIELD_HEIGHT + theme.spacing[1];
const CUSTOM_EMAIL_DOMAIN = 'custom';
const emailDomainOptions = [
  { label: 'naver.com', value: 'naver.com' },
  { label: 'gmail.com', value: 'gmail.com' },
  { label: 'daum.net', value: 'daum.net' },
  { label: 'hanmail.net', value: 'hanmail.net' },
  { label: 'kakao.com', value: 'kakao.com' },
  { label: '직접 입력', value: CUSTOM_EMAIL_DOMAIN },
] as const;

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
  const [form, setForm] = useState<FormState>(initialForm);
  const [touched, setTouched] =
    useState<Record<keyof FormState, boolean>>(initialTouched);
  const [submitted, setSubmitted] = useState(false);
  const [emailDomainSelection, setEmailDomainSelection] =
    useState<EmailDomainValue>('naver.com');
  const [domainMenuOpen, setDomainMenuOpen] = useState(false);
  const [emailDuplicated, setEmailDuplicated] = useState(false);
  const [emailCheckError, setEmailCheckError] = useState<string>();
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [usernameDuplicated, setUsernameDuplicated] = useState(false);
  const [usernameCheckError, setUsernameCheckError] = useState<string>();
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
    setIsCheckingEmail(false);
    setUsernameDuplicated(false);
    setUsernameCheckError(undefined);
    setIsCheckingUsername(false);
    setIsSubmitting(false);
    setSocialProvider(null);
    setSubmitError(undefined);
    setSuccessMessage(undefined);
  }, []);

  useResetOnBlur(resetForm);

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
        })
        .catch(() => {
          if (!active) {
            return;
          }

          setEmailCheckError(
            '이메일 중복 확인을 건너뛰었습니다. 가입 시 다시 확인합니다.',
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
        })
        .catch(() => {
          if (!active) {
            return;
          }

          setUsernameCheckError(
            '아이디 중복 확인을 건너뛰었습니다. 가입 시 다시 확인합니다.',
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

  const goToLogin = () => {
    router.replace('/(auth)/login');
  };

  const isBusy = isSubmitting || socialProvider !== null;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardView}
      testID="register-keyboard-view"
    >
      <RefreshableScrollView
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={styles.container}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        testID="register-scroll-view"
      >
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
          <View style={styles.emailGroup}>
            <View style={[styles.emailRow]} testID="email-row">
              <View style={[styles.emailLocalField]} testID="email-local-field">
                <Input
                  accessibilityLabel="이메일 아이디"
                  autoCapitalize="none"
                  containerStyle={styles.emailInput}
                  keyboardType="email-address"
                  label="이메일"
                  onChangeText={updateEmailLocal}
                  onBlur={markTouched('emailLocal')}
                  placeholder="yellow"
                  textContentType="emailAddress"
                  value={form.emailLocal}
                />
              </View>
              <View style={styles.atSignBox} testID="email-at-sign">
                <Text style={styles.atSign}>@</Text>
              </View>
              <View
                style={[styles.emailDomainField]}
                testID="email-domain-field"
              >
                <Typography variant="caption" style={styles.emailDomainLabel}>
                  도메인
                </Typography>
                <Pressable
                  accessibilityLabel="이메일 도메인 선택"
                  accessibilityRole="button"
                  onPress={() => setDomainMenuOpen((open) => !open)}
                  style={({ pressed }) => [
                    styles.domainSelect,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text
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
                  <Text style={styles.domainSelectChevron}>
                    {domainMenuOpen ? '^' : 'v'}
                  </Text>
                </Pressable>
              </View>
            </View>
            {domainMenuOpen ? (
              <View
                style={[styles.domainMenuAnchor]}
                testID="domain-menu-anchor"
              >
                <View style={styles.domainMenu}>
                  {emailDomainOptions.map((option, index) => (
                    <Pressable
                      accessibilityLabel={`이메일 도메인 ${option.label}`}
                      accessibilityRole="button"
                      key={option.value}
                      onPress={() => selectEmailDomain(option.value)}
                      style={({ pressed }) => [
                        styles.domainOption,
                        index === emailDomainOptions.length - 1 &&
                          styles.domainOptionLast,
                        option.value === emailDomainSelection &&
                          styles.domainOptionSelected,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Text
                        style={[
                          styles.domainOptionText,
                          option.value === emailDomainSelection &&
                            styles.domainOptionTextSelected,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
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
          <Input
            accessibilityLabel="닉네임"
            error={
              shouldShowError('nickname') ? nicknameValidation.error : undefined
            }
            label="닉네임"
            onChangeText={updateField('nickname')}
            onBlur={markTouched('nickname')}
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

          <Button
            accessibilityLabel="가입하기"
            disabled={isBusy || isCheckingEmail || isCheckingUsername}
            loading={isSubmitting}
            onPress={handleSubmit}
            size="lg"
          >
            가입하기
          </Button>

          <View style={styles.divider} />

          <Button
            accessibilityLabel="Google로 가입"
            disabled={isBusy}
            loading={socialProvider === 'google'}
            onPress={() => handleSocialSignIn('google')}
            size="lg"
            variant="outline"
          >
            Google로 계속하기
          </Button>
          <Button
            accessibilityLabel="카카오로 가입"
            disabled={isBusy}
            loading={socialProvider === 'kakao'}
            onPress={() => handleSocialSignIn('kakao')}
            size="lg"
            variant="secondary"
          >
            카카오로 계속하기
          </Button>
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
    gap: theme.spacing[8],
    justifyContent: 'flex-start',
    paddingHorizontal: theme.spacing[6],
    paddingBottom: theme.spacing[12],
    paddingTop: theme.spacing[6],
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
    padding: theme.spacing[5],
    ...theme.shadow.card,
  },
  emailGroup: {
    gap: theme.spacing[2],
    position: 'relative',
    zIndex: 2,
  },
  emailRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: theme.spacing[2],
  },
  emailLocalField: {
    flex: 1,
    minWidth: 0,
  },
  emailInput: {
    width: '100%',
  },
  atSignBox: {
    alignItems: 'center',
    height: theme.controlHeights.md,
    justifyContent: 'center',
    marginBottom: 1,
    width: 18,
  },
  atSign: {
    color: lightColors.mutedForeground.hex,
    fontFamily: theme.typography.fontFamily.display,
    fontSize: 18,
    fontWeight: theme.typography.fontWeight.semibold,
    lineHeight: 22,
  },
  emailDomainField: {
    flex: 1,
    gap: theme.spacing[2],
    minWidth: 0,
  },
  emailDomainLabel: {
    color: lightColors.foreground.hex,
    fontWeight: theme.typography.fontWeight.medium,
  },
  domainSelect: {
    alignItems: 'center',
    backgroundColor: lightColors.card.hex,
    borderColor: lightColors.input.hex,
    borderRadius: theme.borderRadius.md,
    borderWidth: theme.borderWidth.hairline,
    flexDirection: 'row',
    gap: theme.spacing[2],
    minHeight: theme.controlHeights.md,
    paddingHorizontal: theme.spacing[3],
  },
  domainSelectText: {
    color: lightColors.foreground.hex,
    flex: 1,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  domainSelectPlaceholder: {
    color: lightColors.mutedForeground.hex,
  },
  domainSelectChevron: {
    color: lightColors.mutedForeground.hex,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.fontSize.caption,
    fontWeight: theme.typography.fontWeight.bold,
  },
  domainMenuAnchor: {
    alignSelf: 'flex-end',
    elevation: 8,
    position: 'absolute',
    right: 0,
    top: EMAIL_DOMAIN_MENU_TOP,
    width: '47%',
    zIndex: 10,
  },
  domainMenu: {
    backgroundColor: lightColors.card.hex,
    borderColor: lightColors.border.hex,
    borderRadius: theme.borderRadius.md,
    borderWidth: theme.borderWidth.hairline,
    overflow: 'hidden',
  },
  domainOption: {
    borderBottomColor: lightColors.border.hex,
    borderBottomWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    minHeight: theme.controlHeights.md,
    paddingHorizontal: theme.spacing[3],
  },
  domainOptionLast: {
    borderBottomWidth: 0,
  },
  domainOptionSelected: {
    backgroundColor: lightColors.secondary.hex,
  },
  domainOptionText: {
    color: lightColors.foreground.hex,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.fontSize.sm,
  },
  domainOptionTextSelected: {
    color: lightColors.primary.hex,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  customDomainInput: {
    marginTop: -theme.spacing[1],
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
