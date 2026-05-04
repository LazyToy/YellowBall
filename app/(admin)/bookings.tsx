import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Typography } from '@/components/Typography';
import { lightColors, theme } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import {
  addAdminNote,
  approveBooking,
  getAllBookings,
  rejectBooking,
  updateStatus,
} from '@/services/adminBookingService';
import type { ServiceBooking, ServiceBookingStatus } from '@/types/database';
import {
  serviceBookingStatusLabels,
  serviceBookingStatusVariant,
} from '@/utils/bookingStatus';
import { serviceBookingTransitions } from '@/utils/statusTransition';

const statusOptions: ('all' | ServiceBookingStatus)[] = [
  'all',
  'requested',
  'approved',
  'visit_pending',
  'racket_received',
  'in_progress',
  'completed',
  'pickup_ready',
  'done',
  'cancelled_admin',
  'rejected',
];

export default function AdminBookingsScreen() {
  const { profile } = useAuth();
  const actorId = profile?.id;
  const [status, setStatus] = useState<'all' | ServiceBookingStatus>('all');
  const [bookings, setBookings] = useState<ServiceBooking[]>([]);
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [message, setMessage] = useState<string>();
  const [isBusy, setIsBusy] = useState(false);

  const loadBookings = useCallback(async () => {
    setBookings(
      await getAllBookings(status === 'all' ? undefined : { status }),
    );
  }, [status]);

  useEffect(() => {
    loadBookings().catch(() => setMessage('예약 목록을 불러오지 못했습니다.'));
  }, [loadBookings]);

  const runAction = async (task: () => Promise<void>, successMessage: string) => {
    if (!actorId) {
      setMessage('로그인이 필요합니다.');
      return;
    }

    try {
      setIsBusy(true);
      await task();
      await loadBookings();
      setMessage(successMessage);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '작업에 실패했습니다.');
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Typography variant="h1">예약 관리</Typography>
        <Typography variant="caption" style={styles.muted}>
          스트링 작업 예약 승인, 거절, 상태 변경을 처리합니다.
        </Typography>
      </View>

      <View style={styles.chipRow}>
        {statusOptions.map((option) => (
          <Button
            key={option}
            onPress={() => setStatus(option)}
            size="sm"
            variant={status === option ? 'primary' : 'outline'}
          >
            {option === 'all' ? '전체' : serviceBookingStatusLabels[option]}
          </Button>
        ))}
      </View>

      <Input
        label="거절/변경 사유"
        onChangeText={setReason}
        value={reason}
      />
      <Input label="관리자 메모" onChangeText={setNote} value={note} />

      {bookings.length === 0 ? (
        <Typography variant="caption" style={styles.muted}>
          예약이 없습니다.
        </Typography>
      ) : null}

      {bookings.map((booking) => (
        <View key={booking.id} style={styles.card}>
          <View style={styles.rowBetween}>
            <View style={styles.flex}>
              <Typography variant="h2">예약 #{booking.id.slice(0, 8)}</Typography>
              <Typography variant="caption" style={styles.muted}>
                텐션 {booking.tension_main}/{booking.tension_cross} lbs
              </Typography>
            </View>
            <Badge variant={serviceBookingStatusVariant(booking.status)}>
              {serviceBookingStatusLabels[booking.status]}
            </Badge>
          </View>
          {booking.admin_notes ? (
            <Typography variant="caption" style={styles.muted}>
              메모: {booking.admin_notes}
            </Typography>
          ) : null}
          <View style={styles.actions}>
            <Button
              disabled={isBusy || booking.status !== 'requested'}
              onPress={() =>
                runAction(
                  () => approveBooking(booking.id, actorId ?? '').then(() => undefined),
                  '예약을 승인했습니다.',
                )
              }
              size="sm"
              variant="outline"
            >
              승인
            </Button>
            <Button
              disabled={isBusy || booking.status !== 'requested'}
              onPress={() =>
                runAction(
                  () =>
                    rejectBooking(
                      booking.id,
                      actorId ?? '',
                      reason || '관리자 거절',
                    ).then(() => undefined),
                  '예약을 거절했습니다.',
                )
              }
              size="sm"
              variant="outline"
            >
              거절
            </Button>
            {serviceBookingTransitions[booking.status].map((nextStatus) => (
              <Button
                disabled={isBusy}
                key={nextStatus}
                onPress={() =>
                  runAction(
                    () =>
                      updateStatus(
                        booking.id,
                        actorId ?? '',
                        nextStatus,
                        reason || null,
                      ).then(() => undefined),
                    '예약 상태를 변경했습니다.',
                  )
                }
                size="sm"
                variant="outline"
              >
                {serviceBookingStatusLabels[nextStatus]}
              </Button>
            ))}
            <Button
              disabled={isBusy || !note.trim()}
              onPress={() =>
                runAction(
                  () =>
                    addAdminNote(booking.id, actorId ?? '', note).then(
                      () => undefined,
                    ),
                  '관리자 메모를 저장했습니다.',
                )
              }
              size="sm"
              variant="outline"
            >
              메모 저장
            </Button>
          </View>
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
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing[2],
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing[2],
  },
  flex: {
    flex: 1,
  },
  muted: {
    color: lightColors.mutedForeground.hex,
  },
  message: {
    color: lightColors.mutedForeground.hex,
  },
});
