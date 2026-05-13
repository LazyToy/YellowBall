import React, { useCallback, useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { ConfirmDialog, FeedbackDialog } from '@/components/FeedbackDialog';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { BackButton } from '@/components/MobileUI';
import { RefreshableScrollView } from '@/components/PageRefresh';
import { Typography } from '@/components/Typography';
import { lightColors, theme } from '@/constants/theme';
import { useOperationPolicySettings } from '@/hooks/useOperationPolicySettings';
import { cancelBooking, getBookingDetail } from '@/services/bookingService';
import type { ServiceBooking } from '@/types/database';
import {
  getBookingAddressLabel,
  getBookingDeliveryMethodLabel,
  getBookingRacketLabel,
  getBookingSlotLabel,
  getBookingStringLabel,
} from '@/utils/bookingDisplay';
import {
  getServiceBookingWorkStatus,
  serviceBookingStatusLabels,
  serviceBookingStatusVariant,
  serviceBookingTimeline,
} from '@/utils/bookingStatus';
import {
  canCancelFreely,
  canRequestCancellation,
  getRemainingTime,
} from '@/utils/cancellationPolicy';
import { formatKstDateTime } from '@/utils/kstDateTime';

const formatDateTime = (value: string) => formatKstDateTime(value);

export default function BookingDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [booking, setBooking] = useState<ServiceBooking | null>(null);
  const [message, setMessage] = useState<string>();
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelDialogVisible, setCancelDialogVisible] = useState(false);
  const [successDialog, setSuccessDialog] = useState<{
    title: string;
    message?: string;
  } | null>(null);
  const operationPolicy = useOperationPolicySettings();

  const loadBooking = useCallback(async () => {
    if (!id) {
      setMessage('예약 ID가 없습니다.');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setBooking(await getBookingDetail(id));
    } catch {
      setMessage('예약 상세를 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadBooking();
  }, [loadBooking]);

  const handleCancel = async () => {
    if (!booking) {
      return;
    }

    try {
      setCancelDialogVisible(false);
      setIsCancelling(true);
      const result = await cancelBooking(booking.id, booking.user_id);
      await loadBooking();
      setSuccessDialog({
        title: result.requiresAdminApproval
          ? '취소 요청이 등록되었습니다'
          : '예약을 취소했습니다',
        message: result.requiresAdminApproval
          ? '관리자가 확인한 뒤 처리됩니다.'
          : '확인을 누르면 예약 상세를 확인할 수 있습니다.',
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '예약 취소에 실패했습니다.');
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen label="예약 상세 불러오는 중" />;
  }

  if (!booking) {
    return (
      <View style={styles.container}>
        <View style={styles.titleRow}>
          <BackButton onPress={() => router.back()} />
          <Typography variant="h1">예약 상세</Typography>
        </View>
        <Typography accessibilityRole="alert" variant="body" style={styles.muted}>
          {message ?? '예약을 찾지 못했습니다.'}
        </Typography>
      </View>
    );
  }

  const freeCancellationHours = operationPolicy.stringingRefundHours;
  const cancellationRemaining = getRemainingTime(
    booking,
    new Date(),
    freeCancellationHours,
  );
  const canRequestCancel = canRequestCancellation(booking);
  const freeCancellation = canCancelFreely(
    booking,
    new Date(),
    freeCancellationHours,
  );
  const addressLabel = getBookingAddressLabel(booking);

  return (
    <RefreshableScrollView contentContainerStyle={styles.container}>
      <FeedbackDialog
        visible={successDialog !== null}
        title={successDialog?.title ?? ''}
        message={successDialog?.message}
        onConfirm={() => setSuccessDialog(null)}
      />
      <ConfirmDialog
        visible={cancelDialogVisible}
        title={freeCancellation ? '예약을 취소할까요?' : '취소 요청을 등록할까요?'}
        message={
          freeCancellation
            ? '취소 후에는 되돌릴 수 없습니다.'
            : '관리자 확인 후 취소 처리됩니다.'
        }
        confirmLabel={freeCancellation ? '예약 취소' : '취소 요청'}
        onCancel={() => setCancelDialogVisible(false)}
        onConfirm={handleCancel}
      />
      <View style={styles.header}>
        <View style={styles.flex}>
          <View style={styles.titleRow}>
            <BackButton onPress={() => router.back()} />
            <Typography variant="h1">예약 상세</Typography>
          </View>
          <Typography variant="caption" style={styles.muted}>
            #{booking.id.slice(0, 8)}
          </Typography>
        </View>
        <Badge variant={serviceBookingStatusVariant(booking.status)}>
          {serviceBookingStatusLabels[booking.status]}
        </Badge>
      </View>

      <View style={styles.card}>
        <Typography variant="h2">작업 정보</Typography>
        <Typography variant="body">
          라켓 {getBookingRacketLabel(booking)}
        </Typography>
        <Typography variant="body">
          스트링 {getBookingStringLabel(booking)}
        </Typography>
        <Typography variant="body">
          예약 시간 {getBookingSlotLabel(booking)}
        </Typography>
        <Typography variant="body">
          텐션 {booking.tension_main}/{booking.tension_cross} lbs
        </Typography>
        <Typography variant="caption" style={styles.muted}>
          접수 {formatDateTime(booking.created_at)}
        </Typography>
        <Typography variant="caption" style={styles.muted}>
          수령 방식 {getBookingDeliveryMethodLabel(booking)}
        </Typography>
        {addressLabel !== '-' ? (
          <Typography variant="caption" style={styles.muted}>
            배송지 {addressLabel}
          </Typography>
        ) : null}
        <Typography variant="caption" style={styles.muted}>
          최종 수정 {formatDateTime(booking.updated_at)}
        </Typography>
      </View>

      <View style={styles.card}>
        <Typography variant="h2">취소 정책</Typography>
        <Typography variant="body">
          {canRequestCancel
            ? freeCancellation
              ? `무료 취소 가능: ${cancellationRemaining.hours}시간 ${cancellationRemaining.minutes}분 남음`
              : `${freeCancellationHours}시간 이내 예약은 관리자 확인 후 취소됩니다.`
            : '현재 상태에서는 취소할 수 없습니다.'}
        </Typography>
        <Button
          disabled={!canRequestCancel || isCancelling}
          onPress={() => setCancelDialogVisible(true)}
          size="sm"
          variant={freeCancellation ? 'outline' : 'secondary'}
        >
          {freeCancellation ? '예약 취소' : '취소 요청'}
        </Button>
      </View>

      <View style={styles.card}>
        <Typography variant="h2">상태 타임라인</Typography>
        <View style={styles.timeline}>
          {serviceBookingTimeline.map((status) => {
            const currentStatus = getServiceBookingWorkStatus(booking.status);
            const active =
              serviceBookingTimeline.indexOf(status) <=
              serviceBookingTimeline.indexOf(currentStatus);

            return (
              <Badge key={status} variant={active ? 'secondary' : 'outline'}>
                {serviceBookingStatusLabels[status]}
              </Badge>
            );
          })}
        </View>
      </View>

      <View style={styles.card}>
        <Typography variant="h2">메모</Typography>
        <Typography variant="caption" style={styles.muted}>
          사용자 메모: {booking.user_notes || '-'}
        </Typography>
        <Typography variant="caption" style={styles.muted}>
          관리자 메모: {booking.admin_notes || '-'}
        </Typography>
      </View>

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
    flexGrow: 1,
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
  timeline: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing[1],
  },
  flex: {
    flex: 1,
  },
  muted: {
    color: lightColors.mutedForeground.hex,
  },
});
