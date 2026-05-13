import React from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { Typography } from '@/components/Typography';
import { lightColors, theme } from '@/constants/theme';

type NotificationOptInDialogProps = {
  /** 다이얼로그 표시 여부 */
  visible: boolean;
  /** 알림 허용 버튼 클릭 시 호출 */
  onAllow: () => void;
  /** 나중에 버튼 클릭 시 호출 */
  onDismiss: () => void;
};

/**
 * 푸시 알림 권한 요청 전에 표시하는 opt-in 다이얼로그.
 * 사용자에게 알림이 필요한 이유를 설명하고 동의를 구합니다.
 */
export function NotificationOptInDialog({
  visible,
  onAllow,
  onDismiss,
}: NotificationOptInDialogProps) {
  return (
    <Modal
      animationType="fade"
      onRequestClose={onDismiss}
      transparent
      visible={visible}
    >
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <View style={styles.iconContainer}>
            <Typography variant="h1" style={styles.icon}>
              🔔
            </Typography>
          </View>

          <Typography variant="h2" style={styles.title}>
            알림을 켜시겠어요?
          </Typography>

          <View style={styles.reasonList}>
            <Typography variant="body" style={styles.reason}>
              ✅ 예약 승인·변경·완료 알림
            </Typography>
            <Typography variant="body" style={styles.reason}>
              ✅ 시타 라켓 반납 리마인더
            </Typography>
            <Typography variant="body" style={styles.reason}>
              ✅ 매장 운영 공지 및 이벤트
            </Typography>
          </View>

          <Typography variant="caption" style={styles.note}>
            알림은 언제든 설정에서 변경할 수 있어요.
          </Typography>

          <View style={styles.actions}>
            <Button onPress={onAllow} testID="notification-opt-in-allow-button">
              알림 허용
            </Button>
            <Pressable
              accessibilityLabel="알림 나중에 설정"
              onPress={onDismiss}
              style={styles.dismissButton}
            >
              <Typography variant="caption" style={styles.dismissText}>
                나중에 할게요
              </Typography>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flex: 1,
    justifyContent: 'center',
    padding: theme.spacing[6],
  },
  dialog: {
    alignItems: 'center',
    backgroundColor: lightColors.card.hex,
    borderRadius: theme.borderRadius.xl,
    gap: theme.spacing[3],
    maxWidth: 340,
    padding: theme.spacing[6],
    width: '100%',
    ...theme.shadow.card,
  },
  iconContainer: {
    alignItems: 'center',
    backgroundColor: lightColors.accent.hex,
    borderRadius: 32,
    height: 64,
    justifyContent: 'center',
    width: 64,
  },
  icon: {
    fontSize: 32,
    lineHeight: 40,
  },
  title: {
    textAlign: 'center',
  },
  reasonList: {
    alignSelf: 'stretch',
    backgroundColor: lightColors.background.hex,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing[2],
    padding: theme.spacing[4],
  },
  reason: {
    color: lightColors.foreground.hex,
  },
  note: {
    color: lightColors.mutedForeground.hex,
    textAlign: 'center',
  },
  actions: {
    alignItems: 'center',
    alignSelf: 'stretch',
    gap: theme.spacing[2],
    marginTop: theme.spacing[1],
  },
  dismissButton: {
    paddingVertical: theme.spacing[2],
  },
  dismissText: {
    color: lightColors.mutedForeground.hex,
    textAlign: 'center',
  },
});
