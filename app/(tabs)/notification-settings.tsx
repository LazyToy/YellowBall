import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { StyleSheet, Switch, View } from 'react-native';

import { TimePicker } from '@/components/CalendarPicker';
import { FeedbackDialog } from '@/components/FeedbackDialog';
import { BackButton } from '@/components/MobileUI';
import { RefreshableScrollView } from '@/components/PageRefresh';
import { Typography } from '@/components/Typography';
import { lightColors, theme } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import {
  getPreferences,
  updatePreferences,
} from '@/services/notificationPrefService';
import type { NotificationPreference } from '@/types/database';

type PreferenceKey = keyof Pick<
  NotificationPreference,
  | 'booking_notifications'
  | 'delivery_notifications'
  | 'string_life_notifications'
  | 'marketing_notifications'
  | 'quiet_hours_enabled'
>;

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const profileId = profile?.id;
  const [preferences, setPreferences] = useState<NotificationPreference>();
  const [message, setMessage] = useState<string>();
  const [successDialog, setSuccessDialog] = useState(false);

  const loadPreferences = useCallback(async () => {
    if (!profileId) {
      return;
    }

    setPreferences(await getPreferences(profileId));
  }, [profileId]);

  useEffect(() => {
    loadPreferences().catch(() =>
      setMessage('알림 설정을 불러오지 못했습니다.'),
    );
  }, [loadPreferences]);

  const updateToggle = async (key: PreferenceKey, value: boolean) => {
    if (!profileId || !preferences) {
      return;
    }

    const nextPreferences = { ...preferences, [key]: value };
    setPreferences(nextPreferences);

    try {
      await updatePreferences(profileId, { [key]: value });
      await loadPreferences();
      setSuccessDialog(true);
    } catch {
      setPreferences(preferences);
      setMessage('알림 설정을 저장하지 못했습니다.');
    }
  };

  const updateQuietHour = async (
    key: 'quiet_hours_start' | 'quiet_hours_end',
    value: string,
  ) => {
    if (!profileId || !preferences) {
      return;
    }

    const nextPreferences = { ...preferences, [key]: value };
    setPreferences(nextPreferences);

    try {
      await updatePreferences(profileId, { [key]: value });
      await loadPreferences();
      setSuccessDialog(true);
    } catch {
      setPreferences(preferences);
      setMessage('야간 제한 시간을 저장하지 못했습니다.');
    }
  };

  if (!preferences) {
    return (
      <View style={styles.container}>
        <View style={styles.titleRow}>
          <BackButton onPress={() => router.back()} />
          <Typography variant="h1">알림 설정</Typography>
        </View>
        <Typography variant="body">설정을 불러오는 중입니다.</Typography>
      </View>
    );
  }

  return (
    <RefreshableScrollView contentContainerStyle={styles.container}>
      <FeedbackDialog
        visible={successDialog}
        title="알림 설정이 변경되었습니다"
        message="확인을 누르면 내 정보로 이동합니다."
        onConfirm={() => {
          setSuccessDialog(false);
          router.replace('/me');
        }}
      />
      <View style={styles.titleRow}>
        <BackButton onPress={() => router.back()} />
        <Typography variant="h1">알림 설정</Typography>
      </View>
      <ToggleRow
        description="끄면 예약 승인과 작업 상태 알림을 받을 수 없습니다."
        label="예약/작업 알림"
        onValueChange={(value) => updateToggle('booking_notifications', value)}
        value={preferences.booking_notifications}
      />
      <ToggleRow
        label="배송 알림"
        onValueChange={(value) => updateToggle('delivery_notifications', value)}
        value={preferences.delivery_notifications}
      />
      <ToggleRow
        label="스트링 교체 알림"
        onValueChange={(value) =>
          updateToggle('string_life_notifications', value)
        }
        value={preferences.string_life_notifications}
      />
      <ToggleRow
        description="이벤트와 혜택 정보 수신에 동의합니다."
        label="마케팅 알림"
        onValueChange={(value) => updateToggle('marketing_notifications', value)}
        value={preferences.marketing_notifications}
      />
      <ToggleRow
        label="야간 제한"
        onValueChange={(value) => updateToggle('quiet_hours_enabled', value)}
        value={preferences.quiet_hours_enabled}
      />
      <View style={styles.timeRow}>
        <TimePicker
          disabled={!preferences.quiet_hours_enabled}
          label="시작"
          onChange={(value) => updateQuietHour('quiet_hours_start', value)}
          value={preferences.quiet_hours_start ?? ''}
        />
        <TimePicker
          disabled={!preferences.quiet_hours_enabled}
          label="종료"
          onChange={(value) => updateQuietHour('quiet_hours_end', value)}
          value={preferences.quiet_hours_end ?? ''}
        />
      </View>
      {message ? (
        <Typography accessibilityRole="alert" variant="caption" style={styles.muted}>
          {message}
        </Typography>
      ) : null}
    </RefreshableScrollView>
  );
}

function ToggleRow({
  description,
  label,
  onValueChange,
  value,
}: {
  description?: string;
  label: string;
  onValueChange: (value: boolean) => void;
  value: boolean;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowText}>
        <Typography variant="body">{label}</Typography>
        {description ? (
          <Typography variant="caption" style={styles.muted}>
            {description}
          </Typography>
        ) : null}
      </View>
      <Switch
        accessibilityLabel={label}
        onValueChange={onValueChange}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: lightColors.background.hex,
    gap: theme.spacing[4],
    padding: theme.spacing[6],
    paddingTop: theme.spacing[12],
  },
  row: {
    alignItems: 'center',
    backgroundColor: lightColors.card.hex,
    borderColor: lightColors.border.hex,
    borderRadius: theme.borderRadius.lg,
    borderWidth: theme.borderWidth.hairline,
    flexDirection: 'row',
    gap: theme.spacing[3],
    justifyContent: 'space-between',
    padding: theme.spacing[4],
  },
  rowText: {
    flex: 1,
    gap: theme.spacing[1],
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing[2],
  },
  muted: {
    color: lightColors.mutedForeground.hex,
  },
  timeRow: {
    flexDirection: 'row',
    gap: theme.spacing[3],
  },
});
