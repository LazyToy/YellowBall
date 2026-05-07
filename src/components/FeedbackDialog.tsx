import React from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { lightColors, theme } from '@/constants/theme';
import { Button } from './Button';
import { Typography } from './Typography';

type FeedbackTone = 'success' | 'danger';

interface FeedbackDialogProps {
  visible: boolean;
  title: string;
  message?: string;
  tone?: FeedbackTone;
  onConfirm: () => void;
}

export function FeedbackDialog({
  visible,
  title,
  message,
  tone = 'success',
  onConfirm,
}: FeedbackDialogProps) {
  return (
    <Modal animationType="fade" transparent visible={visible}>
      <View style={styles.backdrop}>
        <View style={styles.dialog}>
          <View
            style={[
              styles.icon,
              tone === 'danger' ? styles.iconDanger : styles.iconSuccess,
            ]}
          >
            <Typography
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              variant="h2"
              style={[
                styles.iconText,
                tone === 'danger'
                  ? styles.iconTextDanger
                  : styles.iconTextSuccess,
              ]}
            >
              {tone === 'danger' ? '!' : '✓'}
            </Typography>
          </View>
          <Typography variant="h2" style={styles.title}>
            {title}
          </Typography>
          {message ? (
            <Typography variant="body" style={styles.message}>
              {message}
            </Typography>
          ) : null}
          <Button accessibilityLabel="알림 확인" onPress={onConfirm}>
            확인
          </Button>
        </View>
      </View>
    </Modal>
  );
}

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = '확인',
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Modal animationType="fade" transparent visible={visible}>
      <View style={styles.backdrop}>
        <View style={styles.dialog}>
          <View style={[styles.icon, styles.iconDanger]}>
            <Typography variant="h2" style={[styles.iconText, styles.iconTextDanger]}>
              !
            </Typography>
          </View>
          <Typography variant="h2" style={styles.title}>
            {title}
          </Typography>
          {message ? (
            <Typography variant="body" style={styles.message}>
              {message}
            </Typography>
          ) : null}
          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              onPress={onCancel}
              style={styles.cancelButton}
            >
              <Typography variant="body" style={styles.cancelText}>
                취소
              </Typography>
            </Pressable>
            <View style={styles.confirmButton}>
              <Button accessibilityLabel={confirmLabel} onPress={onConfirm}>
                {confirmLabel}
              </Button>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    gap: theme.spacing[2],
    width: '100%',
  },
  backdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    flex: 1,
    justifyContent: 'center',
    padding: theme.spacing[6],
  },
  cancelButton: {
    alignItems: 'center',
    borderColor: lightColors.border.hex,
    borderRadius: theme.borderRadius.md,
    borderWidth: theme.borderWidth.hairline,
    flex: 1,
    justifyContent: 'center',
    minHeight: theme.controlHeights.md,
  },
  cancelText: {
    color: lightColors.foreground.hex,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  confirmButton: {
    flex: 1,
  },
  dialog: {
    alignItems: 'center',
    backgroundColor: lightColors.card.hex,
    borderColor: lightColors.border.hex,
    borderRadius: theme.borderRadius.xl,
    borderWidth: theme.borderWidth.hairline,
    gap: theme.spacing[3],
    maxWidth: 360,
    padding: theme.spacing[5],
    width: '100%',
  },
  icon: {
    alignItems: 'center',
    borderRadius: 999,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  iconDanger: {
    backgroundColor: lightColors.destructive.hex + '1A',
  },
  iconSuccess: {
    backgroundColor: lightColors.chart3.hex + '1A',
  },
  iconText: {
    fontWeight: theme.typography.fontWeight.bold,
  },
  iconTextDanger: {
    color: lightColors.destructive.hex,
  },
  iconTextSuccess: {
    color: lightColors.chart3.hex,
  },
  message: {
    color: lightColors.mutedForeground.hex,
    textAlign: 'center',
  },
  title: {
    textAlign: 'center',
  },
});
