import React, { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Button } from '@/components/Button';
import { ConfirmDialog, FeedbackDialog } from '@/components/FeedbackDialog';
import { Input } from '@/components/Input';
import { BackButton } from '@/components/MobileUI';
import { RefreshableScrollView } from '@/components/PageRefresh';
import { Typography } from '@/components/Typography';
import { lightColors, theme } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { useResetOnBlur } from '@/hooks/useResetOnBlur';
import { requestAccountDeletion } from '@/services/authService';

export default function AccountDeletionScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [message, setMessage] = useState<string>();
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const canSubmit = confirmText === '정말 탈퇴하시겠습니까?' && password.length > 0;

  const resetForm = useCallback(() => {
    setPassword('');
    setConfirmText('');
    setMessage(undefined);
    setIsDeleting(false);
    setConfirmOpen(false);
    setSuccessOpen(false);
  }, []);

  useResetOnBlur(resetForm);

  const handleDelete = async () => {
    if (!profile) {
      setMessage('로그인이 필요합니다.');
      return;
    }

    setIsDeleting(true);
    setMessage(undefined);

    try {
      await requestAccountDeletion(profile.id, password, profile);
      setSuccessOpen(true);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '탈퇴 요청 실패');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <RefreshableScrollView contentContainerStyle={styles.container}>
      <ConfirmDialog
        visible={confirmOpen}
        title="계정 탈퇴를 요청할까요?"
        message="요청 후 30일 대기 기간이 적용됩니다."
        confirmLabel="탈퇴 요청"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          handleDelete();
        }}
      />
      <FeedbackDialog
        visible={successOpen}
        title="탈퇴 요청이 접수되었습니다"
        message="확인을 누르면 로그인 화면으로 이동합니다."
        onConfirm={() => {
          setSuccessOpen(false);
          router.replace('/(auth)/login');
        }}
      />
      <View style={styles.titleRow}>
        <BackButton onPress={() => router.back()} />
        <Typography variant="h1">계정 탈퇴</Typography>
      </View>
      <View style={styles.notice}>
        <Typography variant="body">
          탈퇴하면 라켓, 예약 내역, 주소, 알림 설정 접근이 제한됩니다.
        </Typography>
        <Typography variant="body">
          진행 중인 예약이 있다면 매장 확인이 필요할 수 있습니다.
        </Typography>
        <Typography variant="body">
          탈퇴 요청 후 30일간 대기 기간이 적용되며, 30일 이후 개인정보(닉네임, 전화번호, 주소, 라켓, 알림 등)가 영구 삭제됩니다.
        </Typography>
        <Typography variant="body" style={styles.warningText}>
          ⚠️ 삭제된 데이터는 복구할 수 없습니다.
        </Typography>
      </View>
      <Input
        label="비밀번호 재입력"
        onChangeText={setPassword}
        secureTextEntry
        value={password}
      />
      <Input
        label="확인 문구"
        onChangeText={setConfirmText}
        placeholder="정말 탈퇴하시겠습니까?"
        value={confirmText}
      />
      <Button
        accessibilityLabel="계정 탈퇴 요청"
        disabled={!canSubmit}
        loading={isDeleting}
        onPress={() => setConfirmOpen(true)}
      >
        탈퇴 요청
      </Button>
      {message ? (
        <Typography accessibilityRole="alert" variant="caption" style={styles.error}>
          {message}
        </Typography>
      ) : null}
    </RefreshableScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: lightColors.background.hex,
    gap: theme.spacing[4],
    padding: theme.spacing[6],
    paddingTop: theme.spacing[12],
  },
  notice: {
    backgroundColor: lightColors.card.hex,
    borderColor: lightColors.border.hex,
    borderRadius: theme.borderRadius.lg,
    borderWidth: theme.borderWidth.hairline,
    gap: theme.spacing[2],
    padding: theme.spacing[4],
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing[2],
  },
  error: {
    color: lightColors.destructive.hex,
  },
  warningText: {
    color: lightColors.destructive.hex,
    fontWeight: theme.typography.fontWeight.semibold,
  },
});
