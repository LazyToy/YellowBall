import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Typography } from '@/components/Typography';
import { lightColors, theme } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import {
  type AdminNotificationType,
  getAdminNotifications,
  markAdminNotificationAsRead,
} from '@/services/adminNotificationService';
import { adminNotificationTypes } from '@/services/bookingNotificationService';
import type { AppNotification } from '@/types/database';

const typeLabels: Record<AdminNotificationType, string> = {
  admin_new_booking: '신규 예약',
  admin_booking_cancelled: '취소',
  admin_booking_cancel_requested: '취소 요청',
  admin_reschedule_requested: '변경 요청',
  admin_demo_overdue: '반납 지연',
  admin_no_show_risk: '노쇼 위험',
};

export default function AdminNotificationsScreen() {
  const { profile } = useAuth();
  const actorId = profile?.id;
  const [type, setType] = useState<'all' | AdminNotificationType>('all');
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [message, setMessage] = useState<string>();
  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications],
  );

  const loadNotifications = useCallback(async () => {
    if (!actorId) {
      return;
    }

    setNotifications(
      await getAdminNotifications(actorId, {
        type,
      }),
    );
  }, [actorId, type]);

  useEffect(() => {
    loadNotifications().catch(() =>
      setMessage('관리자 알림을 불러오지 못했습니다.'),
    );
  }, [loadNotifications]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View>
          <Typography variant="h1">관리자 알림</Typography>
          <Typography variant="caption" style={styles.muted}>
            예약 이벤트와 운영 주의 항목을 확인합니다.
          </Typography>
        </View>
        <Badge variant={unreadCount > 0 ? 'warning' : 'outline'}>
          미읽음 {unreadCount}
        </Badge>
      </View>

      <View style={styles.chipRow}>
        <Button
          onPress={() => setType('all')}
          size="sm"
          variant={type === 'all' ? 'primary' : 'outline'}
        >
          전체
        </Button>
        {adminNotificationTypes.map((option) => (
          <Button
            key={option}
            onPress={() => setType(option)}
            size="sm"
            variant={type === option ? 'primary' : 'outline'}
          >
            {typeLabels[option]}
          </Button>
        ))}
      </View>

      {notifications.length === 0 ? (
        <Typography variant="caption" style={styles.muted}>
          알림이 없습니다.
        </Typography>
      ) : null}

      {notifications.map((notification) => (
        <View key={notification.id} style={styles.card}>
          <View style={styles.rowBetween}>
            <Badge variant={notification.read ? 'outline' : 'secondary'}>
              {typeLabels[notification.notification_type as AdminNotificationType] ??
                notification.notification_type ??
                '일반'}
            </Badge>
            <Typography variant="caption" style={styles.muted}>
              {notification.read ? '읽음' : '미읽음'}
            </Typography>
          </View>
          <Typography variant="h2">{notification.title}</Typography>
          <Typography variant="body">{notification.body}</Typography>
          {!notification.read ? (
            <Button
              onPress={() =>
                actorId
                  ? markAdminNotificationAsRead(actorId, notification.id)
                      .then(loadNotifications)
                      .catch(() => setMessage('읽음 처리에 실패했습니다.'))
                  : undefined
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
        <Typography accessibilityRole="alert" variant="caption" style={styles.message}>
          {message}
        </Typography>
      ) : null}
    </ScrollView>
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
    gap: theme.spacing[3],
    justifyContent: 'space-between',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing[2],
  },
  card: {
    backgroundColor: lightColors.card.hex,
    borderColor: lightColors.border.hex,
    borderRadius: theme.borderRadius.lg,
    borderWidth: theme.borderWidth.hairline,
    gap: theme.spacing[3],
    padding: theme.spacing[4],
  },
  rowBetween: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing[3],
    justifyContent: 'space-between',
  },
  muted: {
    color: lightColors.mutedForeground.hex,
  },
  message: {
    color: lightColors.mutedForeground.hex,
  },
});
