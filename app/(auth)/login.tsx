import React, { useState } from 'react';
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
import { useAuth } from '@/hooks/useAuth';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();

  const handleSubmit = async () => {
    setErrorMessage(undefined);

    if (!phone.trim() || !password) {
      setErrorMessage('휴대폰 번호와 비밀번호를 입력해 주세요.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await signIn(phone.trim(), password);

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

  const goToRegister = () => {
    router.replace('/(auth)/register');
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
          <Typography variant="h1">로그인</Typography>
          <Typography variant="body" style={styles.description}>
            예약 현황과 샵 서비스를 이어서 이용해 보세요.
          </Typography>
        </View>

        <View style={styles.form}>
          <Input
            accessibilityLabel="휴대폰 번호"
            keyboardType="phone-pad"
            label="휴대폰 번호"
            onChangeText={(value) => {
              setErrorMessage(undefined);
              setPhone(value);
            }}
            placeholder="010-1234-5678"
            textContentType="telephoneNumber"
            value={phone}
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
            disabled={isSubmitting}
            loading={isSubmitting}
            onPress={handleSubmit}
            size="lg"
          >
            로그인
          </Button>
        </View>

        <Pressable
          accessibilityRole="link"
          onPress={goToRegister}
          style={styles.registerLink}
        >
          <Typography variant="caption" style={styles.registerLinkText}>
            회원가입으로 이동
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
  errorText: {
    color: lightColors.destructive.hex,
  },
  registerLink: {
    alignItems: 'center',
    paddingVertical: theme.spacing[2],
  },
  registerLinkText: {
    color: lightColors.primary.hex,
    fontWeight: theme.typography.fontWeight.semibold,
  },
});
