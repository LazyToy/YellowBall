import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Tabs } from '@/components/Tabs';
import { Typography } from '@/components/Typography';
import { lightColors, theme } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { getMyBookings } from '@/services/bookingService';
import { getMyDemoBookings } from '@/services/demoBookingService';
import type { DemoBooking, ServiceBooking } from '@/types/database';
import {
  getBookingRacketLabel,
  getBookingSlotLabel,
  getBookingStringLabel,
} from '@/utils/bookingDisplay';
import {
  demoBookingStatusLabels,
  demoBookingStatusVariant,
  serviceBookingStatusGroup,
  serviceBookingStatusLabels,
  serviceBookingStatusVariant,
  serviceBookingTimeline,
  type BookingStatusGroup,
} from '@/utils/bookingStatus';

const formatDateTime = (value: string) =>
  new Date(value).toISOString().slice(0, 16).replace('T', ' ');

export default function BookingScreen() {
  const { profile } = useAuth();
  const profileId = profile?.id;
  const [serviceBookings, setServiceBookings] = useState<ServiceBooking[]>([]);
  const [demoBookings, setDemoBookings] = useState<DemoBooking[]>([]);
  const [message, setMessage] = useState<string>();

  const loadBookings = useCallback(async () => {
    if (!profileId) {
      return;
    }

    const [serviceRows, demoRows] = await Promise.all([
      getMyBookings(profileId),
      getMyDemoBookings(profileId),
    ]);

    setServiceBookings(serviceRows);
    setDemoBookings(demoRows);
  }, [profileId]);

  useEffect(() => {
    loadBookings().catch(() => setMessage('예약 목록을 불러오지 못했습니다.'));
  }, [loadBookings]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Typography variant="h1">예약</Typography>

      <Tabs
        tabs={[
          {
            key: 'active',
            label: '진행중',
            content: (
              <ServiceBookingList bookings={serviceBookings} group="active" />
            ),
          },
          {
            key: 'completed',
            label: '완료',
            content: (
              <ServiceBookingList bookings={serviceBookings} group="completed" />
            ),
          },
          {
            key: 'cancelled',
            label: '취소',
            content: (
              <ServiceBookingList bookings={serviceBookings} group="cancelled" />
            ),
          },
        ]}
      />

      <View style={styles.section}>
        <Typography variant="h2">시타</Typography>
        {demoBookings.length === 0 ? (
          <Typography variant="caption" style={styles.muted}>
            시타 예약이 없습니다.
          </Typography>
        ) : null}
        {demoBookings.map((booking) => (
          <View key={booking.id} style={styles.card}>
            <View style={styles.rowBetween}>
              <Typography variant="body">시타 예약</Typography>
              <Badge variant={demoBookingStatusVariant(booking.status)}>
                {demoBookingStatusLabels[booking.status]}
              </Badge>
            </View>
            <Typography variant="caption" style={styles.muted}>
              {formatDateTime(booking.start_time)} -{' '}
              {formatDateTime(booking.expected_return_time)}
            </Typography>
          </View>
        ))}
      </View>

      {message ? (
        <Typography accessibilityRole="alert" variant="caption" style={styles.muted}>
          {message}
        </Typography>
      ) : null}
    </ScrollView>
  );
}

function ServiceBookingList({
  bookings,
  group,
}: {
  bookings: ServiceBooking[];
  group: BookingStatusGroup;
}) {
  const router = useRouter();
  const filteredBookings = bookings.filter(
    (booking) => serviceBookingStatusGroup(booking.status) === group,
  );

  if (filteredBookings.length === 0) {
    return (
      <Typography variant="caption" style={styles.muted}>
        해당 예약이 없습니다.
      </Typography>
    );
  }

  return (
    <View style={styles.section}>
      {filteredBookings.map((booking) => (
        <View key={booking.id} style={styles.card}>
          <View style={styles.rowBetween}>
            <Typography variant="body">스트링 예약</Typography>
            <Badge variant={serviceBookingStatusVariant(booking.status)}>
              {serviceBookingStatusLabels[booking.status]}
            </Badge>
          </View>
          <Typography variant="caption" style={styles.muted}>
            라켓 {getBookingRacketLabel(booking)}
          </Typography>
          <Typography variant="caption" style={styles.muted}>
            스트링 {getBookingStringLabel(booking)}
          </Typography>
          <Typography variant="caption" style={styles.muted}>
            예약 시간 {getBookingSlotLabel(booking)}
          </Typography>
          <Typography variant="caption" style={styles.muted}>
            텐션 {booking.tension_main}/{booking.tension_cross} lbs
          </Typography>
          <Typography variant="caption" style={styles.muted}>
            생성 {formatDateTime(booking.created_at)}
          </Typography>
          {booking.admin_notes ? (
            <Typography variant="caption" style={styles.muted}>
              관리자 메모: {booking.admin_notes}
            </Typography>
          ) : null}
          <View style={styles.timeline}>
            {serviceBookingTimeline.map((status) => {
              const active =
                serviceBookingTimeline.indexOf(status) <=
                serviceBookingTimeline.indexOf(booking.status);

              return (
                <Badge
                  key={status}
                  variant={active ? 'secondary' : 'outline'}
                >
                  {serviceBookingStatusLabels[status]}
                </Badge>
              );
            })}
          </View>
          <Button
            onPress={() =>
              router.push({
                pathname: '/booking-detail',
                params: { id: booking.id },
              })
            }
            size="sm"
            variant="outline"
          >
            상세
          </Button>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: lightColors.background.hex,
    gap: theme.spacing[5],
    padding: theme.spacing[6],
    paddingTop: theme.spacing[12],
  },
  section: {
    gap: theme.spacing[3],
  },
  card: {
    backgroundColor: lightColors.card.hex,
    borderColor: lightColors.border.hex,
    borderRadius: theme.borderRadius.lg,
    borderWidth: theme.borderWidth.hairline,
    gap: theme.spacing[2],
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
  timeline: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing[1],
  },
});
