import React, { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Typography } from '@/components/Typography';
import { lightColors, theme } from '@/constants/theme';
import { checkUsernameAvailable, signUp } from '@/services/authService';
import {
  validateNickname,
  validatePassword,
  validatePhone,
  validateUsername,
} from '@/utils/validation';

type FormState = {
  phone: string;
  username: string;
  nickname: string;
  password: string;
  passwordConfirm: string;
};

const initialForm: FormState = {
  phone: '',
  username: '',
  nickname: '',
  password: '',
  passwordConfirm: '',
};

const initialTouched: Record<keyof FormState, boolean> = {
  phone: false,
  username: false,
  nickname: false,
  password: false,
  passwordConfirm: false,
};

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
  const [form, setForm] = useState<FormState>(initialForm);
  const [touched, setTouched] =
    useState<Record<keyof FormState, boolean>>(initialTouched);
  const [submitted, setSubmitted] = useState(false);
  const [usernameDuplicated, setUsernameDuplicated] = useState(false);
  const [usernameCheckError, setUsernameCheckError] = useState<string>();
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>();
  const [successMessage, setSuccessMessage] = useState<string>();

  const phoneValidation = useMemo(
    () => validatePhone(form.phone),
    [form.phone],
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
    const formatValidation = validateUsername(form.username);

    setUsernameDuplicated(false);
    setUsernameCheckError(undefined);

    if (!form.username || !formatValidation.valid) {
      setIsCheckingUsername(false);
      return () => {
        active = false;
      };
    }

    setIsCheckingUsername(true);

    checkUsernameAvailable(form.username)
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

        setUsernameCheckError('아이디 중복 확인에 실패했습니다.');
      })
      .finally(() => {
        if (active) {
          setIsCheckingUsername(false);
        }
      });

    return () => {
      active = false;
    };
  }, [form.username]);

  const updateField = (field: keyof FormState) => (value: string) => {
    setSubmitError(undefined);
    setSuccessMessage(undefined);
    setTouched((current) => ({ ...current, [field]: true }));
    setForm((current) => ({ ...current, [field]: value }));
  };

  const markTouched = (field: keyof FormState) => () => {
    setTouched((current) => ({ ...current, [field]: true }));
  };

  const shouldShowError = (field: keyof FormState) => submitted || touched[field];

  const isFormValid =
    phoneValidation.valid &&
    usernameValidation.valid &&
    nicknameValidation.valid &&
    passwordValidation.valid &&
    !passwordConfirmValidationError &&
    Boolean(form.passwordConfirm) &&
    !isCheckingUsername &&
    !usernameCheckError;

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
        form.phone.trim(),
        form.password,
        form.username.trim(),
        form.nickname.trim(),
      );
      setSuccessMessage('회원가입이 완료되었습니다. 로그인해 주세요.');
      router.replace('/(auth)/login');
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

  const goToLogin = () => {
    router.replace('/(auth)/login');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.keyboardView}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Typography variant="caption" style={styles.eyebrow}>
            YellowBall account
          </Typography>
          <Typography variant="h1">회원가입</Typography>
          <Typography variant="body" style={styles.description}>
            예약과 샵 이용을 위해 사용할 계정을 만들어 주세요.
          </Typography>
        </View>

        <View style={styles.form}>
          <Input
            accessibilityLabel="휴대폰 번호"
            error={shouldShowError('phone') ? phoneValidation.error : undefined}
            keyboardType="phone-pad"
            label="휴대폰 번호"
            onChangeText={updateField('phone')}
            onBlur={markTouched('phone')}
            placeholder="010-1234-5678"
            textContentType="telephoneNumber"
            value={form.phone}
          />
          <Input
            accessibilityLabel="아이디"
            autoCapitalize="none"
            error={
              shouldShowError('username')
                ? usernameValidation.error ?? usernameCheckError
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
            disabled={isSubmitting || isCheckingUsername}
            loading={isSubmitting}
            onPress={handleSubmit}
            size="lg"
          >
            가입하기
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
      </ScrollView>
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
    justifyContent: 'center',
    padding: theme.spacing[6],
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
    padding: theme.spacing[5],
    ...theme.shadow.card,
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
  loginLink: {
    alignItems: 'center',
    paddingVertical: theme.spacing[2],
  },
  loginLinkText: {
    color: lightColors.primary.hex,
    fontWeight: theme.typography.fontWeight.semibold,
  },
});
