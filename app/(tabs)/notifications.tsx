import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { BackButton } from '@/components/MobileUI';
import { RefreshableScrollView } from '@/components/PageRefresh';
import { Typography } from '@/components/Typography';
import { lightColors, theme } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import {
  getNotifications,
  markAllAsRead,
  markAsRead,
  registerPushToken,
} from '@/services/notificationService';
import type { AppNotification } from '@/types/database';

export default function NotificationsScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const profileId = profile?.id;
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [message, setMessage] = useState<string>();

  const loadNotifications = useCallback(async () => {
    if (!profileId) {
      return;
    }

    setNotifications(await getNotifications(profileId));
  }, [profileId]);

  useEffect(() => {
    loadNotifications().catch(() => setMessage('알림을 불러오지 못했습니다.'));
  }, [loadNotifications]);

  return (
    <RefreshableScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <BackButton onPress={() => router.back()} />
          <Typography variant="h1">알림함</Typography>
        </View>
        <Button
          accessibilityLabel="모두 읽음"
        onPress={() =>
            profileId
              ? markAllAsRead(profileId).then(loadNotifications)
              : undefined
          }
          size="sm"
          variant="outline"
        >
          모두 읽음
        </Button>
      </View>
      <Button
        accessibilityLabel="푸시 토큰 등록"
        onPress={() =>
          profileId
            ? registerPushToken(profileId)
                .then((token) =>
                  setMessage(token ? '푸시 토큰이 등록되었습니다.' : '웹에서는 푸시 토큰을 건너뜁니다.'),
                )
                .catch((error) =>
                  setMessage(error instanceof Error ? error.message : '토큰 등록 실패'),
                )
            : undefined
        }
        variant="outline"
      >
        푸시 토큰 등록
      </Button>
      {notifications.map((notification) => (
        <View key={notification.id} style={styles.card}>
          <Typography variant="caption" style={styles.muted}>
            {notification.notification_type ?? 'general'}
            {notification.read ? ' · 읽음' : ' · 미읽음'}
          </Typography>
          <Typography variant="h2">{notification.title}</Typography>
          <Typography variant="body">{notification.body}</Typography>
          {!notification.read ? (
            <Button
              accessibilityLabel={`${notification.title} 읽음 처리`}
              onPress={() =>
                markAsRead(notification.id)
                  .then(loadNotifications)
                  .catch(() => setMessage('읽음 처리 실패'))
              }
              size="sm"
              variant="outline"
            >
              읽음
            </Button>
          ) : null}
        </View>
      ))}
      {message ? (
        <Typography accessibilityRole="alert" variant="caption" style={styles.muted}>
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
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing[2],
  },
  card: {
    backgroundColor: lightColors.card.hex,
    borderColor: lightColors.border.hex,
    borderRadius: theme.borderRadius.lg,
    borderWidth: theme.borderWidth.hairline,
    gap: theme.spacing[2],
    padding: theme.spacing[4],
  },
  muted: {
    color: lightColors.mutedForeground.hex,
  },
});
