import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Typography } from '@/components/Typography';
import { lightColors, theme } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import {
  approveDemo,
  getAllDemoBookings,
  markInUse,
  markOverdue,
  markReturned,
  rejectDemo,
} from '@/services/adminDemoBookingService';
import { addConditionCheck } from '@/services/conditionCheckService';
import type { DemoBooking } from '@/types/database';
import {
  demoBookingStatusLabels,
  demoBookingStatusVariant,
} from '@/utils/bookingStatus';

export default function AdminDemoBookingsScreen() {
  const { profile } = useAuth();
  const actorId = profile?.id;
  const [bookings, setBookings] = useState<DemoBooking[]>([]);
  const [reason, setReason] = useState('');
  const [actualReturnTime, setActualReturnTime] = useState(
    new Date().toISOString(),
  );
  const [conditionPhotoUrl, setConditionPhotoUrl] = useState('');
  const [scratchNotes, setScratchNotes] = useState('');
  const [stringCondition, setStringCondition] = useState('');
  const [gripCondition, setGripCondition] = useState('');
  const [depositDeduction, setDepositDeduction] = useState('0');
  const [damageDetected, setDamageDetected] = useState(false);
  const [message, setMessage] = useState<string>();
  const [isBusy, setIsBusy] = useState(false);

  const loadBookings = useCallback(async () => {
    setBookings(await getAllDemoBookings());
  }, []);

  useEffect(() => {
    loadBookings().catch(() => setMessage('시타 예약 목록을 불러오지 못했습니다.'));
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

  const saveConditionCheck = (
    booking: DemoBooking,
    checkType: 'before_rental' | 'after_return',
  ) =>
    runAction(
      async () => {
        await addConditionCheck({
          demo_booking_id: booking.id,
          check_type: checkType,
          photoUrls: conditionPhotoUrl.trim() ? [conditionPhotoUrl.trim()] : [],
          scratch_notes: scratchNotes.trim() || null,
          string_condition: stringCondition.trim() || null,
          grip_condition: gripCondition.trim() || null,
          damage_detected: damageDetected,
          deposit_deduction: Number(depositDeduction || 0),
          checked_by: actorId ?? '',
        });
      },
      checkType === 'before_rental'
        ? '대여 전 상태 체크를 저장했습니다.'
        : '반납 후 상태 체크를 저장했습니다.',
    );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Typography variant="h1">시타 예약 관리</Typography>
        <Typography variant="caption" style={styles.muted}>
          시타 승인, 거절, 사용중, 반납, 지연 상태를 관리합니다.
        </Typography>
      </View>

      <Input label="거절 사유" onChangeText={setReason} value={reason} />
      <Input
        label="실제 반납 시간"
        onChangeText={setActualReturnTime}
        value={actualReturnTime}
      />
      <Input
        label="상태 사진 URL"
        onChangeText={setConditionPhotoUrl}
        value={conditionPhotoUrl}
      />
      <Input
        label="스크래치 메모"
        onChangeText={setScratchNotes}
        value={scratchNotes}
      />
      <Input
        label="스트링 상태"
        onChangeText={setStringCondition}
        value={stringCondition}
      />
      <Input
        label="그립 상태"
        onChangeText={setGripCondition}
        value={gripCondition}
      />
      <Input
        label="보증금 차감액"
        keyboardType="numeric"
        onChangeText={setDepositDeduction}
        value={depositDeduction}
      />
      <Button
        onPress={() => setDamageDetected((value) => !value)}
        size="sm"
        variant={damageDetected ? 'secondary' : 'outline'}
      >
        {damageDetected ? '파손 있음' : '파손 없음'}
      </Button>

      {bookings.length === 0 ? (
        <Typography variant="caption" style={styles.muted}>
          시타 예약이 없습니다.
        </Typography>
      ) : null}

      {bookings.map((booking) => (
        <View key={booking.id} style={styles.card}>
          <View style={styles.rowBetween}>
            <View style={styles.flex}>
              <Typography variant="h2">시타 #{booking.id.slice(0, 8)}</Typography>
              <Typography variant="caption" style={styles.muted}>
                {booking.start_time.slice(0, 16)} -{' '}
                {booking.expected_return_time.slice(0, 16)}
              </Typography>
            </View>
            <Badge variant={demoBookingStatusVariant(booking.status)}>
              {demoBookingStatusLabels[booking.status]}
            </Badge>
          </View>
          <View style={styles.actions}>
            <Button
              disabled={isBusy || booking.status !== 'requested'}
              onPress={() =>
                runAction(
                  () => approveDemo(booking.id, actorId ?? '').then(() => undefined),
                  '시타 예약을 승인했습니다.',
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
                    rejectDemo(
                      booking.id,
                      actorId ?? '',
                      reason || '관리자 거절',
                    ).then(() => undefined),
                  '시타 예약을 거절했습니다.',
                )
              }
              size="sm"
              variant="outline"
            >
              거절
            </Button>
            <Button
              disabled={isBusy || booking.status !== 'approved'}
              onPress={() =>
                runAction(
                  () => markInUse(booking.id, actorId ?? '').then(() => undefined),
                  '시타 사용중으로 변경했습니다.',
                )
              }
              size="sm"
              variant="outline"
            >
              사용중
            </Button>
            <Button
              disabled={isBusy || booking.status !== 'approved'}
              onPress={() => saveConditionCheck(booking, 'before_rental')}
              size="sm"
              variant="outline"
            >
              대여 전 체크
            </Button>
            <Button
              disabled={isBusy || !['in_use', 'overdue'].includes(booking.status)}
              onPress={() =>
                runAction(
                  () =>
                    markReturned(
                      booking.id,
                      actorId ?? '',
                      actualReturnTime,
                    ).then(() => undefined),
                  '시타 반납을 처리했습니다.',
                )
              }
              size="sm"
              variant="outline"
            >
              반납
            </Button>
            <Button
              disabled={isBusy || !['in_use', 'overdue', 'returned'].includes(booking.status)}
              onPress={() => saveConditionCheck(booking, 'after_return')}
              size="sm"
              variant="outline"
            >
              반납 후 체크
            </Button>
            <Button
              disabled={isBusy || booking.status !== 'in_use'}
              onPress={() =>
                runAction(
                  () => markOverdue(booking.id, actorId ?? '').then(() => undefined),
                  '반납 지연으로 변경했습니다.',
                )
              }
              size="sm"
              variant="outline"
            >
              지연
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
