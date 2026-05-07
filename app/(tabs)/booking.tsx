import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import {
  AppScrollView,
  Card,
  Chevron,
  GlyphBubble,
  PageHeader,
  Pill,
  RowButton,
  SectionHeader,
} from '@/components/MobileUI';
import { lightColors, theme } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { useAppMenuSettings } from '@/hooks/useAppMenuSettings';
import { hasAnyBookingMenu } from '@/services/appMenuSettingsService';
import {
  getMyBookings,
  type ServiceBookingWithMeta,
} from '@/services/bookingService';
import { getMyDemoBookings } from '@/services/demoBookingService';
import type { DemoBooking } from '@/types/database';
import {
  getBookingRacketLabel,
  getBookingSlotLabel,
  getBookingStringLabel,
} from '@/utils/bookingDisplay';
import { formatKstDateTime } from '@/utils/kstDateTime';
import {
  demoBookingStatusLabels,
  getServiceBookingWorkStatus,
  serviceBookingStatusGroup,
  serviceBookingStatusLabels,
  serviceBookingTimeline,
} from '@/utils/bookingStatus';

type BookingTab = 'upcoming' | 'past';

const formatDateTime = (value: string) => formatKstDateTime(value);

const timelineLabels = ['접수', '승인', '작업중', '완료'];

const getServiceBookingListLabel = (booking: ServiceBookingWithMeta) =>
  booking.has_cancel_request &&
  serviceBookingStatusGroup(booking.status) === 'active'
    ? '취소 요청'
    : serviceBookingStatusLabels[booking.status];

export default function BookingScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const menuSettings = useAppMenuSettings();
  const profileId = profile?.id;
  const [serviceBookings, setServiceBookings] = useState<ServiceBookingWithMeta[]>([]);
  const [demoBookings, setDemoBookings] = useState<DemoBooking[]>([]);
  const [tab, setTab] = useState<BookingTab>('upcoming');
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

  const upcomingCount = useMemo(
    () =>
      serviceBookings.filter(
        (booking) => serviceBookingStatusGroup(booking.status) === 'active',
      ).length + demoBookings.length,
    [demoBookings.length, serviceBookings],
  );
  const pastCount = useMemo(
    () =>
      serviceBookings.filter(
        (booking) => serviceBookingStatusGroup(booking.status) !== 'active',
      ).length,
    [serviceBookings],
  );
  const openBookingDetail = useCallback(
    (id: string) =>
      router.push({
        pathname: '/booking-detail',
        params: { id },
      }),
    [router],
  );

  return (
    <AppScrollView>
      <PageHeader title="내 예약" />

      <View style={styles.section}>
        <SectionHeader title="새 예약 만들기" />
        {hasAnyBookingMenu(menuSettings) ? (
        <View style={styles.ctaList}>
          {menuSettings['string-booking'] ? (
          <BookingCta
            badge="평균 24시간"
            description="내 라켓에 맞는 스트링·텐션 선택"
            glyph="W"
            onPress={() => router.push('/new-booking')}
            title="스트링 작업 예약"
            tone="primary"
          />
          ) : null}
          {menuSettings['demo-booking'] ? (
          <BookingCta
            badge="1회 무료"
            description="샵에서 신상 라켓 직접 사용해보기"
            glyph="S"
            onPress={() => router.push('/new-booking')}
            title="라켓 시타 예약"
            tone="accent"
          />
          ) : null}
        </View>
        ) : (
          <Card>
            <Text style={styles.mutedText}>현재 예약 메뉴가 비활성화되어 있습니다.</Text>
          </Card>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.tabList}>
          <BookingTabButton
            active={tab === 'upcoming'}
            count={upcomingCount}
            label="진행 중"
            onPress={() => setTab('upcoming')}
          />
          <BookingTabButton
            active={tab === 'past'}
            count={pastCount}
            label="지난 예약"
            onPress={() => setTab('past')}
          />
        </View>
      </View>

      {tab === 'upcoming' ? (
        <UpcomingBookings
          demoBookings={demoBookings}
          serviceBookings={serviceBookings}
          onPressDetail={openBookingDetail}
        />
      ) : (
        <PastBookings
          bookings={serviceBookings}
          onPressDetail={openBookingDetail}
        />
      )}

      {message ? <Text style={styles.errorText}>{message}</Text> : null}
    </AppScrollView>
  );
}

function BookingCta({
  badge,
  description,
  glyph,
  onPress,
  title,
  tone,
}: {
  badge: string;
  description: string;
  glyph: string;
  onPress: () => void;
  title: string;
  tone: 'primary' | 'accent';
}) {
  return (
    <RowButton accessibilityLabel={title} onPress={onPress} style={styles.ctaCard}>
      <GlyphBubble glyph={glyph} tone={tone} size={48} />
      <View style={styles.flex}>
        <View style={styles.titleRow}>
          <Text style={styles.ctaTitle}>{title}</Text>
          <Pill>{badge}</Pill>
        </View>
        <Text numberOfLines={1} style={styles.mutedText}>
          {description}
        </Text>
      </View>
      <Chevron />
    </RowButton>
  );
}

function BookingTabButton({
  active,
  count,
  label,
  onPress,
}: {
  active: boolean;
  count: number;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[styles.tabButton, active && styles.tabButtonActive]}
    >
      <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
      <View style={[styles.tabCount, active && styles.tabCountActive]}>
        <Text style={[styles.tabCountText, active && styles.tabCountTextActive]}>
          {count}
        </Text>
      </View>
    </Pressable>
  );
}

function UpcomingBookings({
  demoBookings,
  onPressDetail,
  serviceBookings,
}: {
  demoBookings: DemoBooking[];
  onPressDetail: (id: string) => void;
  serviceBookings: ServiceBookingWithMeta[];
}) {
  const activeBookings = serviceBookings.filter(
    (booking) => serviceBookingStatusGroup(booking.status) === 'active',
  );

  if (activeBookings.length === 0 && demoBookings.length === 0) {
    return (
      <View style={styles.section}>
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>진행 중인 예약이 없어요</Text>
          <Text style={styles.mutedText}>스트링 작업이나 라켓 시타를 새로 예약해보세요.</Text>
        </Card>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      {activeBookings.map((booking) => (
        <ServiceBookingCard
          booking={booking}
          key={booking.id}
          onPress={() => onPressDetail(booking.id)}
        />
      ))}
      {demoBookings.map((booking) => (
        <DemoBookingCard booking={booking} key={booking.id} />
      ))}
    </View>
  );
}

function ServiceBookingCard({
  booking,
  onPress,
}: {
  booking: ServiceBookingWithMeta;
  onPress: () => void;
}) {
  const currentIndex = Math.max(
    0,
    serviceBookingTimeline.indexOf(getServiceBookingWorkStatus(booking.status)),
  );
  const compactProgress = Math.min(3, currentIndex);
  const pending = booking.status === 'requested';

  return (
    <RowButton
      accessibilityLabel="예약 상세 보기"
      onPress={onPress}
      style={[styles.bookingCard, pending && styles.pendingCard]}
    >
      <View style={styles.cardColumn}>
        <View style={styles.bookingCardHeader}>
          <GlyphBubble glyph="W" tone="primary" size={40} />
          <View style={styles.flex}>
            <View style={styles.titleRow}>
              <Text style={styles.bookingType}>스트링 작업</Text>
              <Pill tone={pending ? 'accent' : 'primary'}>
                {getServiceBookingListLabel(booking)}
              </Pill>
            </View>
            <Text style={styles.metaText}>예약 #{booking.id.slice(0, 6)}</Text>
          </View>
          <Chevron />
        </View>

        <View style={styles.detailBox}>
          <DetailRow label="라켓" value={getBookingRacketLabel(booking)} />
          <DetailRow label="스트링" value={getBookingStringLabel(booking)} />
          <DetailRow label="예약 시간" value={getBookingSlotLabel(booking)} />
          <DetailRow
            label="텐션"
            value={`${booking.tension_main}/${booking.tension_cross} lbs`}
          />
        </View>

        {pending ? (
          <View style={styles.pendingNotice}>
            <Text style={styles.pendingNoticeText}>관리자 확인 중 · 통상 30분 이내 응답</Text>
          </View>
        ) : null}

        <View style={styles.timeline}>
          {timelineLabels.map((label, index) => {
            const filled = index <= compactProgress;

            return (
              <View key={label} style={styles.timelineItem}>
                <View style={[styles.timelineBar, filled && styles.timelineBarActive]} />
                <Text style={[styles.timelineLabel, filled && styles.timelineLabelActive]}>
                  {label}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </RowButton>
  );
}

function DemoBookingCard({ booking }: { booking: DemoBooking }) {
  return (
    <Card>
      <View style={styles.bookingCardHeader}>
        <GlyphBubble glyph="S" tone="accent" size={40} />
        <View style={styles.flex}>
          <View style={styles.titleRow}>
            <Text style={styles.bookingType}>라켓 시타</Text>
            <Pill>{demoBookingStatusLabels[booking.status]}</Pill>
          </View>
          <Text style={styles.metaText}>
            {formatDateTime(booking.start_time)} - {formatDateTime(booking.expected_return_time)}
          </Text>
        </View>
      </View>
    </Card>
  );
}

function PastBookings({
  bookings,
  onPressDetail,
}: {
  bookings: ServiceBookingWithMeta[];
  onPressDetail: (id: string) => void;
}) {
  const pastBookings = bookings.filter(
    (booking) => serviceBookingStatusGroup(booking.status) !== 'active',
  );

  if (pastBookings.length === 0) {
    return (
      <View style={styles.section}>
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>지난 예약이 아직 없어요</Text>
          <Text style={styles.mutedText}>완료된 작업은 이곳에서 재예약할 수 있습니다.</Text>
        </Card>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      {pastBookings.map((booking) => (
        <RowButton
          accessibilityLabel={`${getBookingRacketLabel(booking)} 예약 상세 보기`}
          key={booking.id}
          onPress={() => onPressDetail(booking.id)}
          style={styles.pastCard}
        >
          <GlyphBubble glyph="W" tone="secondary" size={36} />
          <View style={styles.flex}>
            <Text numberOfLines={1} style={styles.pastTitle}>
              {getBookingRacketLabel(booking)}
            </Text>
            <Text numberOfLines={1} style={styles.mutedText}>
              {getBookingStringLabel(booking)}
            </Text>
            <Text style={styles.metaText}>
              {formatDateTime(booking.created_at)} · {getServiceBookingListLabel(booking)}
            </Text>
          </View>
          <Pill tone="secondary">재예약</Pill>
          <Chevron />
        </RowButton>
      ))}
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text numberOfLines={2} style={styles.detailValue}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: theme.spacing[3],
    paddingHorizontal: theme.spacing[5],
  },
  ctaList: {
    gap: theme.spacing[3],
  },
  ctaCard: {
    backgroundColor: lightColors.card.hex,
    borderColor: lightColors.border.hex,
    borderRadius: theme.borderRadius.lg,
    borderWidth: theme.borderWidth.hairline,
    gap: theme.spacing[3],
    padding: theme.spacing[4],
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing[2],
  },
  ctaTitle: {
    color: lightColors.foreground.hex,
    fontFamily: theme.typography.fontFamily.display,
    fontSize: 15,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  mutedText: {
    color: lightColors.mutedForeground.hex,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 12,
    lineHeight: 17,
  },
  tabList: {
    alignSelf: 'flex-start',
    backgroundColor: lightColors.secondary.hex,
    borderRadius: 999,
    flexDirection: 'row',
    gap: theme.spacing[1],
    padding: theme.spacing[1],
  },
  tabButton: {
    alignItems: 'center',
    borderRadius: 999,
    flexDirection: 'row',
    gap: theme.spacing[2],
    minHeight: 34,
    paddingHorizontal: theme.spacing[4],
  },
  tabButtonActive: {
    backgroundColor: lightColors.card.hex,
    ...theme.shadow.card,
  },
  tabText: {
    color: lightColors.mutedForeground.hex,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 14,
    fontWeight: theme.typography.fontWeight.medium,
  },
  tabTextActive: {
    color: lightColors.foreground.hex,
  },
  tabCount: {
    backgroundColor: lightColors.card.hex,
    borderRadius: 999,
    minWidth: 20,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tabCountActive: {
    backgroundColor: lightColors.primary.hex,
  },
  tabCountText: {
    color: lightColors.mutedForeground.hex,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 10,
    fontWeight: theme.typography.fontWeight.bold,
    textAlign: 'center',
  },
  tabCountTextActive: {
    color: lightColors.primaryForeground.hex,
  },
  bookingCard: {
    alignItems: 'stretch',
    backgroundColor: lightColors.card.hex,
    borderColor: lightColors.border.hex,
    borderRadius: theme.borderRadius.lg,
    borderWidth: theme.borderWidth.hairline,
    flexDirection: 'column',
    padding: theme.spacing[4],
  },
  pendingCard: {
    borderColor: lightColors.accent.hex,
  },
  cardColumn: {
    gap: theme.spacing[3],
  },
  bookingCardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing[3],
  },
  bookingType: {
    color: lightColors.foreground.hex,
    fontFamily: theme.typography.fontFamily.display,
    fontSize: 15,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  metaText: {
    color: lightColors.mutedForeground.hex,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 11,
    marginTop: 2,
  },
  detailBox: {
    backgroundColor: lightColors.secondary.hex,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing[2],
    padding: theme.spacing[3],
  },
  detailRow: {
    flexDirection: 'row',
    gap: theme.spacing[3],
    justifyContent: 'space-between',
  },
  detailLabel: {
    color: lightColors.mutedForeground.hex,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 12,
  },
  detailValue: {
    color: lightColors.foreground.hex,
    flex: 1,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 12,
    fontWeight: theme.typography.fontWeight.medium,
    textAlign: 'right',
  },
  pendingNotice: {
    backgroundColor: 'rgba(213,228,63,0.16)',
    borderColor: 'rgba(213,228,63,0.42)',
    borderRadius: theme.borderRadius.md,
    borderWidth: theme.borderWidth.hairline,
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[2],
  },
  pendingNoticeText: {
    color: lightColors.foreground.hex,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 11,
  },
  timeline: {
    flexDirection: 'row',
    gap: theme.spacing[2],
  },
  timelineItem: {
    alignItems: 'center',
    flex: 1,
    gap: theme.spacing[1],
  },
  timelineBar: {
    backgroundColor: lightColors.secondary.hex,
    borderRadius: 999,
    height: 6,
    width: '100%',
  },
  timelineBarActive: {
    backgroundColor: lightColors.primary.hex,
  },
  timelineLabel: {
    color: lightColors.mutedForeground.hex,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 10,
  },
  timelineLabelActive: {
    color: lightColors.primary.hex,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  emptyCard: {
    gap: theme.spacing[1],
  },
  emptyTitle: {
    color: lightColors.foreground.hex,
    fontFamily: theme.typography.fontFamily.display,
    fontSize: 15,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  pastCard: {
    alignItems: 'center',
    backgroundColor: lightColors.card.hex,
    borderColor: lightColors.border.hex,
    borderRadius: theme.borderRadius.lg,
    borderWidth: theme.borderWidth.hairline,
    flexDirection: 'row',
    gap: theme.spacing[3],
    padding: theme.spacing[4],
  },
  pastTitle: {
    color: lightColors.foreground.hex,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 14,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  errorText: {
    color: lightColors.destructive.hex,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 12,
    paddingHorizontal: theme.spacing[5],
  },
  flex: {
    flex: 1,
    minWidth: 0,
  },
});
