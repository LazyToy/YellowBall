import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import {
  Image,
  type LayoutChangeEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';

import { Text } from '@/components/AppText';
import {
  AppScrollView,
  Card,
  GlyphBubble,
  Pill,
  ProductThumb,
  SectionHeader,
  TopBar,
} from '@/components/MobileUI';
import { AppIcon } from '@/components/AppIcon';
import { lightColors, theme } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { useAppMenuSettings } from '@/hooks/useAppMenuSettings';
import {
  hasAnyBookingMenu,
  type MenuId,
} from '@/services/appMenuSettingsService';
import {
  getAppContentBlocks,
  type ContentTone,
  type StoreHoursContent,
} from '@/services/appContentService';
import { getMyBookings } from '@/services/bookingService';
import { getRackets } from '@/services/racketService';
import {
  getRacketPhotoUrl,
  getStringPhotoUrl,
} from '@/services/storageService';
import { getActiveStrings } from '@/services/stringCatalogService';
import { getSetupsByRacket } from '@/services/stringSetupService';
import type {
  ServiceBooking,
  ServiceBookingStatus,
  UserRacket,
  UserStringSetup,
} from '@/types/database';
import {
  buildHomeFeaturedString,
  type HomeFeaturedStringItem,
} from '@/utils/homeFeaturedStrings';
import {
  getHomeBannerMeasuredContentLayout,
  getHomeQuickActionLayout,
  getSafeHomeContentWidth,
} from '@/utils/homeLayout';

type HomeRebookContent = {
  meta: string;
  title: string;
  subtitle: string;
};

const ADD_RACKET_HORIZONTAL_DASHES = Array.from(
  { length: 7 },
  (_, index) => index,
);
const ADD_RACKET_VERTICAL_DASHES = Array.from(
  { length: 10 },
  (_, index) => index,
);

type HomeActiveBooking = {
  statusLabel: string;
  bookingNumber: string;
  racketName: string;
  stringSummary: string;
  pickupLabel: string;
  pickupTime: string;
  activeStepIndex: number;
};

type HomeRacket = {
  id: string;
  brand: string;
  model: string;
  image_path?: string | null;
  image_url?: string | null;
  string: string;
  tension: string;
  tone: ContentTone;
  main: boolean;
};

type BookingRelation = {
  brand?: string | null;
  model?: string | null;
  name?: string | null;
};

type BookingSlotRelation = {
  start_time?: string | null;
  end_time?: string | null;
};

type ServiceBookingWithDetails = ServiceBooking & {
  user_rackets?: BookingRelation | null;
  main_string?: BookingRelation | null;
  cross_string?: BookingRelation | null;
  booking_slots?: BookingSlotRelation | null;
};

const quickServices = [
  {
    menuId: 'string-booking' as const,
    glyph: 'W',
    label: '스트링 작업',
    sub: '예약 · 결제',
    tone: 'primary' as const,
    route: '/new-booking?mode=stringing',
  },
  {
    menuId: 'demo-booking' as const,
    glyph: 'S',
    label: '라켓 시타',
    sub: '데모 대여',
    tone: 'accent' as const,
    route: '/new-booking?mode=demo',
  },
  {
    menuId: 'shop' as const,
    glyph: 'B',
    label: '용품 쇼핑',
    sub: '테니스 · 피클볼',
    tone: 'card' as const,
    route: '/shop',
  },
  {
    menuId: 'booking-history' as const,
    glyph: 'R',
    label: '내 예약',
    sub: '진행 상태',
    tone: 'card' as const,
    route: '/booking',
  },
];


const progressSteps = ['접수', '승인', '작업중', '완료'];
const screenHorizontalPadding = theme.spacing[5];
const quickActionColumns = 4;
const quickActionGap = theme.spacing[2];
const minQuickActionWidth = 72;
const featuredStringColumns = 2;
const featuredStringGap = theme.spacing[2];
const featuredStringCardHeight = 312;

const activeBookingStatuses: ServiceBookingStatus[] = [
  'requested',
  'approved',
  'visit_pending',
  'racket_received',
  'in_progress',
  'completed',
  'pickup_ready',
];

const terminalBookingStatuses: ServiceBookingStatus[] = ['delivered', 'done'];

const statusLabels: Partial<Record<ServiceBookingStatus, string>> = {
  approved: '승인',
  completed: '완료',
  in_progress: '작업중',
  pickup_ready: '완료',
  racket_received: '작업중',
  requested: '접수',
  visit_pending: '승인',
};

const statusStepIndex: Partial<Record<ServiceBookingStatus, number>> = {
  approved: 1,
  completed: 3,
  in_progress: 2,
  pickup_ready: 3,
  racket_received: 2,
  requested: 0,
  visit_pending: 1,
};

const formatDateTime = (value?: string | null) =>
  value
    ? new Intl.DateTimeFormat('ko-KR', {
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        month: 'short',
      }).format(new Date(value))
    : '-';

const getRacketName = (racket?: BookingRelation | null) =>
  [racket?.brand, racket?.model].filter(Boolean).join(' ') || '라켓 정보 없음';

const getStringName = (item?: BookingRelation | null) =>
  [item?.brand, item?.name].filter(Boolean).join(' ') || '스트링 정보 없음';

const toBookingNumber = (id: string) => `#${id.slice(0, 8).toUpperCase()}`;

const toHomeActiveBooking = (
  booking: ServiceBookingWithDetails,
): HomeActiveBooking => ({
  activeStepIndex: statusStepIndex[booking.status] ?? 0,
  bookingNumber: toBookingNumber(booking.id),
  pickupLabel: '예정 시간',
  pickupTime: formatDateTime(booking.booking_slots?.start_time),
  racketName: getRacketName(booking.user_rackets),
  statusLabel: statusLabels[booking.status] ?? booking.status,
  stringSummary: `${getStringName(booking.main_string)} · 메인 ${
    booking.tension_main
  } / 크로스 ${booking.tension_cross} lbs`,
});

const toHomeRebook = (
  booking: ServiceBookingWithDetails | undefined,
): HomeRebookContent | null =>
  booking
    ? {
        meta: `마지막 작업 · ${formatDateTime(booking.created_at)}`,
        subtitle: `${getStringName(booking.main_string)} · ${
          booking.tension_main
        } / ${booking.tension_cross} lbs`,
        title: '스트링 교체 시기가 되면 이전 조합으로 다시 예약할 수 있어요.',
      }
    : null;

const toHomeRacket = (
  racket: UserRacket,
  setup: UserStringSetup | null,
  stringName: string,
): HomeRacket => ({
  id: racket.id,
  brand: racket.brand,
  image_url: racket.photo_url,
  main: Boolean(racket.is_primary),
  model: racket.model,
  string: stringName,
  tension: setup ? `${setup.tension_main}` : '-',
  tone: racket.is_primary ? 'primary' : 'accent',
});

const chunkItems = <T,>(items: T[], size: number): T[][] => {
  const chunkSize = Math.max(1, Math.floor(size));
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += chunkSize) {
    chunks.push(items.slice(index, index + chunkSize));
  }

  return chunks;
};

export default function HomeScreen() {
  const router = useRouter();
  const menuSettings = useAppMenuSettings();
  const { width: windowWidth } = useWindowDimensions();
  const { profile } = useAuth();
  const profileId = profile?.id;
  const nickname = profile?.nickname ?? profile?.username ?? '회원';
  const [rebook, setRebook] = useState<HomeRebookContent | null>(null);
  const [activeBooking, setActiveBooking] = useState<HomeActiveBooking | null>(
    null,
  );
  const [rackets, setRackets] = useState<HomeRacket[]>([]);
  const [featuredStrings, setFeaturedStrings] = useState<
    HomeFeaturedStringItem[]
  >([]);
  const [storeHours, setStoreHours] = useState<StoreHoursContent | null>(null);
  const [measuredContentWidth, setMeasuredContentWidth] = useState<
    number | null
  >(null);
  const fallbackContentWidth = useMemo(
    () => Math.max(0, Math.floor(windowWidth - screenHorizontalPadding * 2)),
    [windowWidth],
  );
  const visibleContentWidth = useMemo(
    () => getSafeHomeContentWidth(measuredContentWidth, fallbackContentWidth),
    [fallbackContentWidth, measuredContentWidth],
  );
  const bookingMenusVisible = hasAnyBookingMenu(menuSettings);
  const visibleQuickServices = useMemo(
    () =>
      quickServices.filter((service) => {
        if (service.menuId === 'booking-history') {
          return bookingMenusVisible;
        }

        return menuSettings[service.menuId as MenuId];
      }),
    [bookingMenusVisible, menuSettings],
  );
  const quickActionLayout = useMemo(
    () =>
      getHomeQuickActionLayout(
        visibleContentWidth,
        quickActionGap,
        visibleQuickServices.length,
        quickActionColumns,
        minQuickActionWidth,
      ),
    [visibleContentWidth, visibleQuickServices.length],
  );
  const quickActionColumnCount = quickActionLayout.columns;
  const quickActionWidth = quickActionLayout.itemWidth;
  const quickActionIconSize = useMemo(() => {
    if (quickActionWidth <= 0) {
      return 52;
    }

    return Math.max(42, Math.min(52, Math.floor(quickActionWidth * 0.68)));
  }, [quickActionWidth]);
  const quickActionRows = useMemo(
    () => chunkItems(visibleQuickServices, quickActionColumnCount),
    [quickActionColumnCount, visibleQuickServices],
  );
  const featuredStringWidth = getHomeBannerMeasuredContentLayout(
    visibleContentWidth,
    featuredStringGap,
    featuredStringColumns,
  ).itemWidth;
  const featuredStringCardSizing = useMemo(
    () =>
      featuredStringWidth > 0
        ? {
            flexBasis: featuredStringWidth,
            flexShrink: 0,
            maxWidth: featuredStringWidth,
            minWidth: featuredStringWidth,
            width: featuredStringWidth,
          }
        : null,
    [featuredStringWidth],
  );

  const handleHomeLayoutProbe = useCallback((event: LayoutChangeEvent) => {
    const nextWidth = Math.floor(event.nativeEvent.layout.width);

    if (!Number.isFinite(nextWidth) || nextWidth <= 0) {
      return;
    }

    setMeasuredContentWidth((currentWidth) =>
      currentWidth === nextWidth ? currentWidth : nextWidth,
    );
  }, []);

  useEffect(() => {
    let mounted = true;

    Promise.all([
      getAppContentBlocks(['home_store_hours']),
      profileId
        ? getMyBookings(profileId)
        : Promise.resolve([] as ServiceBooking[]),
      profileId ? getRackets(profileId) : Promise.resolve([] as UserRacket[]),
      getActiveStrings(),
    ])
      .then(async ([blocks, bookings, userRackets, strings]) => {
        if (!mounted) {
          return;
        }

        const detailedBookings = bookings as ServiceBookingWithDetails[];
        const active = detailedBookings.find((booking) =>
          activeBookingStatuses.includes(booking.status),
        );
        const lastCompleted = detailedBookings.find((booking) =>
          terminalBookingStatuses.includes(booking.status),
        );

        setRebook(toHomeRebook(lastCompleted));
        setActiveBooking(active ? toHomeActiveBooking(active) : null);
        // 각 라켓의 스트링 셋업 병렬 조회
        const racketSetups = await Promise.all(
          userRackets.map(async (racket) => {
            if (!profileId)
              return { racket, setup: null, stringName: '스트링 미등록' };
            try {
              const setups = await getSetupsByRacket(profileId, racket.id);
              const latest = setups[0] ?? null;
              let stringName = '스트링 미등록';
              if (latest) {
                // string_catalog 정보는 이미 로드된 strings에서 찾기 (API 호출 최소화)
                const found = strings.find(
                  (s) => s.id === latest.main_string_id,
                );
                if (found) {
                  stringName = `${found.brand} ${found.name}`;
                } else {
                  stringName = '스트링 등록됨';
                }
              }
              return { racket, setup: latest, stringName };
            } catch {
              return { racket, setup: null, stringName: '스트링 미등록' };
            }
          }),
        );

        setRackets(
          racketSetups.map(({ racket, setup, stringName }) =>
            toHomeRacket(racket, setup, stringName),
          ),
        );
        setFeaturedStrings(strings.slice(0, 3).map(buildHomeFeaturedString));
        setStoreHours(blocks.home_store_hours ?? null);
      })
      .catch(() => {
        if (!mounted) {
          return;
        }

        setRebook(null);
        setActiveBooking(null);
        setRackets([]);
        setFeaturedStrings([]);
        setStoreHours(null);
      });

    return () => {
      mounted = false;
    };
  }, [profileId]);

  return (
    <AppScrollView>
      <View pointerEvents="none" style={styles.homeLayoutProbeWrap}>
        <View
          onLayout={handleHomeLayoutProbe}
          style={styles.homeLayoutProbe}
          testID="home-layout-probe"
        />
      </View>

      <TopBar onNotificationsPress={() => router.push('/notifications')} />

      <View style={styles.heroSection}>
        <Text style={styles.greeting}>안녕하세요, {nickname}님</Text>
        <Text style={styles.heroTitle}>
          오늘은 어떤 라켓으로{'\n'}
          <Text style={styles.heroAccent}>완벽한 한 게임</Text> 할까요?
        </Text>

        {menuSettings['string-booking'] && rebook ? (
          <Card style={styles.rebookCard}>
            <View style={styles.rebookGlow} />
            <View style={styles.rebookText}>
              <Text style={styles.rebookMeta}>{rebook.meta}</Text>
              <Text style={styles.rebookTitle}>{rebook.title}</Text>
              <Text style={styles.rebookSub}>{rebook.subtitle}</Text>
            </View>
            <Pressable
              accessibilityLabel="다시 예약하기"
              accessibilityRole="button"
              onPress={() => router.push('/new-booking')}
              style={({ pressed }) => [
                styles.rebookButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.rebookButtonText}>{'>'}</Text>
            </Pressable>
          </Card>
        ) : null}
      </View>

      <View style={styles.quickGrid}>
        {quickActionRows.map((row, rowIndex) => {
          return (
            <View
              key={`quick-row-${rowIndex}`}
              style={styles.quickRow}
              testID={`home-quick-row-${rowIndex}`}
            >
              {row.map((service) => (
                <View
                  key={service.label}
                  style={[
                    styles.quickActionCell,
                    quickActionWidth > 0
                      ? {
                          flexBasis: quickActionWidth,
                          maxWidth: quickActionWidth,
                          width: quickActionWidth,
                        }
                      : null,
                  ]}
                  testID={`home-quick-cell-${service.menuId}`}
                >
                  <Pressable
                    accessibilityLabel={service.label}
                    accessibilityRole="button"
                    testID={`home-quick-action-${service.menuId}`}
                    onPress={() => router.push(service.route)}
                    style={({ pressed }) => [
                      styles.quickAction,
                      quickActionWidth > 0
                        ? {
                            width: quickActionWidth,
                          }
                        : styles.quickActionFallback,
                      pressed ? styles.pressed : null,
                    ]}
                  >
                    <View
                      style={styles.quickActionIconSlot}
                      testID={`home-quick-icon-slot-${service.menuId}`}
                    >
                      <GlyphBubble
                        glyph={service.glyph}
                        tone={service.tone}
                        size={quickActionIconSize}
                      />
                    </View>
                    <Text
                      numberOfLines={1}
                      style={styles.quickActionLabel}
                      testID={`home-quick-label-${service.menuId}`}
                    >
                      {service.label}
                    </Text>
                    <Text numberOfLines={1} style={styles.quickActionSub}>
                      {service.sub}
                    </Text>
                  </Pressable>
                </View>
              ))}
            </View>
          );
        })}
      </View>

      {bookingMenusVisible ? (
        <View style={styles.section}>
          <SectionHeader
            title="진행 중인 예약"
            action={
              <Pressable
                accessibilityLabel="예약 전체 보기"
                accessibilityRole="button"
                onPress={() => router.push('/booking')}
              >
                <Text style={styles.linkText}>전체 보기 {'>'}</Text>
              </Pressable>
            }
          />
          {activeBooking ? (
            <Card>
              <View style={styles.bookingTop}>
                <View style={styles.flex}>
                  <View style={styles.badgeRow}>
                    <Pill tone="accent">{activeBooking.statusLabel}</Pill>
                    <Text style={styles.metaText}>
                      예약 {activeBooking.bookingNumber}
                    </Text>
                  </View>
                  <Text style={styles.bookingTitle}>
                    {activeBooking.racketName}
                  </Text>
                  <Text style={styles.mutedText}>
                    {activeBooking.stringSummary}
                  </Text>
                </View>
                <View style={styles.pickupBox}>
                  <Text style={styles.metaText}>
                    {activeBooking.pickupLabel}
                  </Text>
                  <Text style={styles.pickupTime}>
                    {activeBooking.pickupTime}
                  </Text>
                </View>
              </View>
              <View style={styles.progressWrap}>
                {progressSteps.map((step, index) => {
                  const active = index <= activeBooking.activeStepIndex;

                  return (
                    <View key={step} style={styles.progressItem}>
                      <View
                        style={[
                          styles.progressBar,
                          active && styles.progressBarActive,
                        ]}
                      />
                      <Text
                        style={[
                          styles.progressLabel,
                          active && styles.progressLabelActive,
                        ]}
                      >
                        {step}
                      </Text>
                    </View>
                  );
                })}
              </View>
              <View style={styles.bookingActions}>
                <Pressable
                  accessibilityLabel="예약 상세 보기"
                  accessibilityRole="button"
                  onPress={() => router.push('/booking')}
                  style={styles.secondaryButton}
                >
                  <Text style={styles.secondaryButtonText}>상세 보기</Text>
                </Pressable>
                <Pressable
                  accessibilityLabel="매장 위치 안내"
                  accessibilityRole="button"
                  style={styles.primaryButton}
                >
                  <Text style={styles.primaryButtonText}>매장 위치 안내</Text>
                </Pressable>
              </View>
            </Card>
          ) : (
            <Card>
              <Text style={styles.mutedText}>진행 중인 예약이 없습니다.</Text>
            </Card>
          )}
        </View>
      ) : null}

      {menuSettings['racket-library'] ? (
        <View style={styles.racketSection} testID="home-racket-section">
          <SectionHeader
            title="내 라켓"
            caption="저장된 조합으로 빠르게 예약"
            action={
              <Pressable
                accessibilityLabel="라켓 관리"
                accessibilityRole="button"
                onPress={() => router.push('/rackets')}
                testID="home-racket-manage-link"
              >
                <Text style={styles.linkText}>관리 {'>'}</Text>
              </Pressable>
            }
          />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.racketList}
          >
            {rackets.map((racket) => (
              <View
                key={racket.id}
                style={styles.racketCard}
                testID={`home-racket-card-${racket.id}`}
              >
                <Pressable
                  accessibilityLabel={`${racket.brand} ${racket.model} 상세 보기`}
                  accessibilityRole="button"
                  onPress={() =>
                    router.push({
                      pathname: '/racket-detail',
                      params: { from: '/', id: racket.id },
                    })
                  }
                  style={({ pressed }) => [
                    styles.racketCardPressable,
                    pressed && styles.pressed,
                  ]}
                  testID={`home-racket-card-pressable-${racket.id}`}
                >
                  <ProductThumb
                    imageUrl={getRacketPhotoUrl(
                      racket.image_path ?? racket.image_url,
                    )}
                    label={racket.brand}
                    tone={racket.tone}
                    wide
                  />
                  <View
                    style={styles.racketInfo}
                    testID={`home-racket-info-${racket.id}`}
                  >
                    <View style={styles.badgeRow}>
                      <Text style={styles.racketBrand}>{racket.brand}</Text>
                      {racket.main ? <Pill tone="primary">메인</Pill> : null}
                    </View>
                    <Text style={styles.racketModel}>{racket.model}</Text>
                    <View style={styles.stringRow}>
                      <Pill>{racket.string}</Pill>
                      <Text style={styles.metaText}>{racket.tension} lbs</Text>
                    </View>
                  </View>
                </Pressable>
              </View>
            ))}
            <Pressable
              accessibilityLabel="라켓 추가"
              accessibilityRole="button"
              onPress={() => router.push('/rackets')}
              style={({ pressed }) => [
                styles.addRacketCard,
                pressed && styles.pressed,
              ]}
              testID="home-add-racket-card"
            >
              <View
                pointerEvents="none"
                style={styles.addRacketContent}
                testID="home-add-racket-content"
              >
                <AppIcon
                  color={lightColors.mutedForeground.hex}
                  name="plus"
                  size={28}
                />
                <Text style={styles.addText}>라켓 추가</Text>
              </View>
              <View
                pointerEvents="none"
                style={styles.addRacketDashLayer}
                testID="home-add-racket-dash-outline"
              >
                <View
                  style={[
                    styles.addRacketDashRow,
                    styles.addRacketDashTop,
                  ]}
                  testID="home-add-racket-dash-top"
                >
                  {ADD_RACKET_HORIZONTAL_DASHES.map((dash) => (
                    <View
                      key={`top-${dash}`}
                      style={styles.addRacketDashHorizontal}
                    />
                  ))}
                </View>
                <View
                  style={[
                    styles.addRacketDashRow,
                    styles.addRacketDashBottom,
                  ]}
                  testID="home-add-racket-dash-bottom"
                >
                  {ADD_RACKET_HORIZONTAL_DASHES.map((dash) => (
                    <View
                      key={`bottom-${dash}`}
                      style={styles.addRacketDashHorizontal}
                    />
                  ))}
                </View>
                <View
                  style={[
                    styles.addRacketDashColumn,
                    styles.addRacketDashLeft,
                  ]}
                  testID="home-add-racket-dash-left"
                >
                  {ADD_RACKET_VERTICAL_DASHES.map((dash) => (
                    <View
                      key={`left-${dash}`}
                      style={styles.addRacketDashVertical}
                    />
                  ))}
                </View>
                <View
                  style={[
                    styles.addRacketDashColumn,
                    styles.addRacketDashRight,
                  ]}
                  testID="home-add-racket-dash-right"
                >
                  {ADD_RACKET_VERTICAL_DASHES.map((dash) => (
                    <View
                      key={`right-${dash}`}
                      style={styles.addRacketDashVertical}
                    />
                  ))}
                </View>
              </View>
            </Pressable>
          </ScrollView>
        </View>
      ) : null}

      <View style={styles.section}>
        {storeHours ? (
          <Card style={styles.hoursCard}>
            <View style={styles.flex}>
              <Text style={styles.metaText}>영업 정보</Text>
              <Text style={styles.hoursTitle}>
                {storeHours.title}{' '}
                <Text style={styles.hoursAccent}>{storeHours.accent}</Text>
              </Text>
              <Text style={styles.mutedText}>{storeHours.subtitle}</Text>
            </View>
            <Pressable
              accessibilityLabel="매장 전화"
              accessibilityRole="button"
              style={styles.phoneButton}
            >
              <Text style={styles.phoneText}>T</Text>
            </Pressable>
          </Card>
        ) : null}
      </View>

      {menuSettings['string-booking'] ? (
        <View style={styles.section}>
          <SectionHeader title="추천 스트링" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.featuredList}>
              {featuredStrings.map((item) => (
                <Pressable
                  accessibilityLabel={`${item.brand} ${item.name} 상세 보기`}
                  accessibilityRole="button"
                  key={item.id}
                  onPress={() =>
                    router.push({
                      pathname: '/string-detail',
                      params: { from: '/', id: item.id },
                    })
                  }
                  style={({ pressed }) => [
                    featuredStringCardSizing,
                    pressed && styles.pressed,
                  ]}
                  testID={`home-featured-string-${item.id}`}
                >
                  <Card
                    style={[styles.featuredCard, featuredStringCardSizing]}
                    testID={`home-featured-string-card-${item.id}`}
                  >
                    <View style={styles.featuredImageWrap}>
                      {item.imageUrl ? (
                        <Image
                          accessibilityIgnoresInvertColors
                          resizeMode="cover"
                          source={{
                            uri:
                              getStringPhotoUrl(item.imageUrl) ??
                              item.imageUrl,
                          }}
                          style={styles.featuredImage}
                        />
                      ) : null}
                      <View style={styles.featuredBadge}>
                        <Pill tone={item.tone}>{item.label}</Pill>
                      </View>
                    </View>
                    <View style={styles.featuredBody}>
                      <Text numberOfLines={1} style={styles.metaText}>
                        {item.brand}
                      </Text>
                      <Text
                        ellipsizeMode="tail"
                        numberOfLines={2}
                        style={styles.featuredTitle}
                        testID={`home-featured-string-title-${item.id}`}
                      >
                        {item.name}
                      </Text>
                      <View style={styles.featuredMetaRow}>
                        <Text numberOfLines={1} style={styles.featuredPrice}>
                          {item.price !== null
                            ? `${item.price.toLocaleString('ko-KR')}원`
                            : '가격 문의'}
                        </Text>
                        {item.gauge ? (
                          <Text numberOfLines={1} style={styles.metaText}>
                            {item.gauge}mm
                          </Text>
                        ) : null}
                      </View>
                      {item.description ? (
                        <Text
                          ellipsizeMode="tail"
                          numberOfLines={2}
                          style={styles.mutedText}
                          testID={`home-featured-string-description-${item.id}`}
                        >
                          {item.description}
                        </Text>
                      ) : null}
                    </View>
                  </Card>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>
      ) : null}

    </AppScrollView>
  );
}

const styles = StyleSheet.create({
  homeLayoutProbeWrap: {
    height: 0,
    paddingHorizontal: screenHorizontalPadding,
    width: '100%',
  },
  homeLayoutProbe: {
    height: 0,
    width: '100%',
  },
  heroSection: {
    gap: theme.spacing[3],
    paddingHorizontal: screenHorizontalPadding,
  },
  greeting: {
    color: lightColors.mutedForeground.hex,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 13,
  },
  heroTitle: {
    color: lightColors.foreground.hex,
    fontFamily: theme.typography.fontFamily.display,
    fontSize: 25,
    fontWeight: theme.typography.fontWeight.bold,
    lineHeight: 33,
  },
  heroAccent: {
    color: lightColors.primary.hex,
  },
  rebookCard: {
    alignItems: 'center',
    backgroundColor: lightColors.primary.hex,
    borderColor: lightColors.primary.hex,
    flexDirection: 'row',
    gap: theme.spacing[3],
    overflow: 'hidden',
  },
  rebookGlow: {
    backgroundColor: lightColors.accent.hex,
    borderRadius: 999,
    bottom: -42,
    height: 128,
    opacity: 0.2,
    position: 'absolute',
    right: -24,
    width: 128,
  },
  rebookText: {
    flex: 1,
    gap: theme.spacing[1],
    minWidth: 0,
  },
  rebookMeta: {
    color: 'rgba(252,250,244,0.72)',
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 11,
  },
  rebookTitle: {
    color: lightColors.primaryForeground.hex,
    fontFamily: theme.typography.fontFamily.display,
    fontSize: 15,
    fontWeight: theme.typography.fontWeight.semibold,
    lineHeight: 21,
  },
  rebookSub: {
    color: 'rgba(252,250,244,0.62)',
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 12,
  },
  rebookButton: {
    alignItems: 'center',
    backgroundColor: lightColors.accent.hex,
    borderRadius: 999,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  rebookButtonText: {
    color: lightColors.accentForeground.hex,
    fontFamily: theme.typography.fontFamily.display,
    fontSize: 22,
    fontWeight: theme.typography.fontWeight.bold,
  },
  quickGrid: {
    alignContent: 'flex-start',
    alignItems: 'stretch',
    paddingHorizontal: screenHorizontalPadding,
    width: '100%',
  },
  quickRow: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: quickActionGap,
    width: '100%',
  },
  quickActionCell: {
    flexGrow: 0,
    flexShrink: 0,
    minWidth: 0,
  },
  quickAction: {
    alignItems: 'stretch',
    flexGrow: 0,
    flexShrink: 0,
    minWidth: 0,
  },
  quickActionIconSlot: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  quickActionSpacer: {
    flexShrink: 0,
    width: quickActionGap,
  },
  quickActionFallback: {
    width: '100%',
  },
  quickActionLabel: {
    color: lightColors.foreground.hex,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 12,
    lineHeight: 16,
    marginTop: theme.spacing[2],
    maxWidth: '100%',
    minWidth: 0,
    textAlign: 'center',
    width: '100%',
  },
  quickActionSub: {
    color: lightColors.mutedForeground.hex,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
    maxWidth: '100%',
    minWidth: 0,
    textAlign: 'center',
    width: '100%',
  },
  section: {
    gap: theme.spacing[3],
    paddingHorizontal: screenHorizontalPadding,
  },
  racketSection: {
    gap: theme.spacing[3],
    paddingHorizontal: screenHorizontalPadding,
  },
  linkText: {
    color: lightColors.mutedForeground.hex,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 12,
    fontWeight: theme.typography.fontWeight.medium,
  },
  bookingTop: {
    flexDirection: 'row',
    gap: theme.spacing[3],
  },
  badgeRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing[2],
  },
  metaText: {
    color: lightColors.mutedForeground.hex,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 11,
  },
  bookingTitle: {
    color: lightColors.foreground.hex,
    fontFamily: theme.typography.fontFamily.display,
    fontSize: 15,
    fontWeight: theme.typography.fontWeight.semibold,
    marginTop: theme.spacing[1],
  },
  mutedText: {
    color: lightColors.mutedForeground.hex,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  pickupBox: {
    alignItems: 'flex-end',
  },
  pickupTime: {
    color: lightColors.foreground.hex,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 13,
    fontWeight: theme.typography.fontWeight.semibold,
    marginTop: 2,
  },
  progressWrap: {
    flexDirection: 'row',
    gap: theme.spacing[2],
    marginTop: theme.spacing[4],
  },
  progressItem: {
    alignItems: 'center',
    flex: 1,
    gap: theme.spacing[1],
  },
  progressBar: {
    backgroundColor: lightColors.secondary.hex,
    borderRadius: 999,
    height: 6,
    width: '100%',
  },
  progressBarActive: {
    backgroundColor: lightColors.primary.hex,
  },
  progressLabel: {
    color: lightColors.mutedForeground.hex,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 10,
  },
  progressLabelActive: {
    color: lightColors.primary.hex,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  bookingActions: {
    flexDirection: 'row',
    gap: theme.spacing[2],
    marginTop: theme.spacing[4],
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: lightColors.secondary.hex,
    borderRadius: theme.borderRadius.md,
    flex: 1,
    height: 40,
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: lightColors.secondaryForeground.hex,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 13,
    fontWeight: theme.typography.fontWeight.medium,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: lightColors.primary.hex,
    borderRadius: theme.borderRadius.md,
    flex: 1,
    height: 40,
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: lightColors.primaryForeground.hex,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 13,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  flex: {
    flex: 1,
    minWidth: 0,
  },
  racketList: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    paddingBottom: theme.spacing[1],
  },
  racketCard: {
    flexShrink: 0,
    marginRight: theme.spacing[3],
    maxWidth: 210,
    minWidth: 210,
    width: 210,
  },
  racketCardPressable: {
    width: '100%',
  },
  racketInfo: {
    gap: theme.spacing[1],
    marginTop: theme.spacing[4],
  },
  racketBrand: {
    color: lightColors.mutedForeground.hex,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 11,
  },
  racketModel: {
    color: lightColors.foreground.hex,
    fontFamily: theme.typography.fontFamily.display,
    fontSize: 14,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  stringRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing[2],
    marginTop: theme.spacing[1],
  },
  addRacketCard: {
    backgroundColor: 'transparent',
    borderRadius: theme.borderRadius.lg,
    flexShrink: 0,
    height: 198,
    maxWidth: 140,
    minHeight: 198,
    minWidth: 140,
    overflow: 'hidden',
    position: 'relative',
    width: 140,
  },
  addRacketContent: {
    alignItems: 'center',
    flexDirection: 'column',
    gap: theme.spacing[2],
    height: 198,
    justifyContent: 'center',
    width: 140,
  },
  addRacketDashLayer: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  addRacketDashRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    left: theme.spacing[5],
    position: 'absolute',
    right: theme.spacing[5],
  },
  addRacketDashTop: {
    top: 1,
  },
  addRacketDashBottom: {
    bottom: 1,
  },
  addRacketDashColumn: {
    bottom: theme.spacing[6],
    justifyContent: 'space-between',
    position: 'absolute',
    top: theme.spacing[6],
  },
  addRacketDashLeft: {
    left: 1,
  },
  addRacketDashRight: {
    right: 1,
  },
  addRacketDashHorizontal: {
    backgroundColor: lightColors.border.hex,
    borderRadius: 1,
    height: 2,
    width: theme.spacing[2],
  },
  addRacketDashVertical: {
    backgroundColor: lightColors.border.hex,
    borderRadius: 1,
    height: theme.spacing[2],
    width: 2,
  },
  addText: {
    color: lightColors.mutedForeground.hex,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 12,
    fontWeight: theme.typography.fontWeight.medium,
    textAlign: 'center',
  },
  hoursCard: {
    alignItems: 'center',
    backgroundColor: lightColors.secondary.hex,
    borderColor: lightColors.secondary.hex,
    flexDirection: 'row',
    gap: theme.spacing[3],
  },
  hoursTitle: {
    color: lightColors.foreground.hex,
    fontFamily: theme.typography.fontFamily.display,
    fontSize: 14,
    fontWeight: theme.typography.fontWeight.semibold,
    marginTop: theme.spacing[1],
  },
  hoursAccent: {
    color: lightColors.primary.hex,
  },
  phoneButton: {
    alignItems: 'center',
    backgroundColor: lightColors.card.hex,
    borderColor: lightColors.border.hex,
    borderRadius: 999,
    borderWidth: theme.borderWidth.hairline,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  phoneText: {
    color: lightColors.foreground.hex,
    fontFamily: theme.typography.fontFamily.display,
    fontWeight: theme.typography.fontWeight.bold,
  },
  featuredList: {
    flexDirection: 'row',
    gap: featuredStringGap,
    paddingRight: screenHorizontalPadding,
  },
  featuredCard: {
    height: featuredStringCardHeight,
    overflow: 'hidden',
    padding: 0,
    width: '100%',
  },
  featuredImageWrap: {
    backgroundColor: lightColors.secondary.hex,
    height: 148,
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
  },
  featuredImage: {
    height: '100%',
    width: '100%',
  },
  featuredBadge: {
    left: theme.spacing[2],
    position: 'absolute',
    top: theme.spacing[2],
  },
  featuredBody: {
    flex: 1,
    gap: theme.spacing[1],
    padding: theme.spacing[3],
  },
  featuredTitle: {
    color: lightColors.foreground.hex,
    fontFamily: theme.typography.fontFamily.display,
    fontSize: 14,
    fontWeight: theme.typography.fontWeight.semibold,
    lineHeight: 18,
  },
  featuredMetaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing[2],
    justifyContent: 'space-between',
  },
  featuredPrice: {
    color: lightColors.foreground.hex,
    flexShrink: 1,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 13,
    fontWeight: theme.typography.fontWeight.bold,
  },
  pressed: {
    opacity: theme.opacity.pressed,
  },
});
