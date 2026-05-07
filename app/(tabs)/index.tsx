import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

import {
  AppScrollView,
  Card,
  IconAction,
  Pill,
  ProductThumb,
  RowButton,
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
  type HomeBanner,
  type HomeShopCategory,
  type StoreHoursContent,
} from '@/services/appContentService';
import { getMyBookings } from '@/services/bookingService';
import { getRackets } from '@/services/racketService';
import {
  getAppAssetUrl,
  getRacketPhotoUrl,
  getStringPhotoUrl,
} from '@/services/storageService';
import { getActiveStrings } from '@/services/stringCatalogService';
import { getSetupsByRacket } from '@/services/stringSetupService';
import { getStoreInfo } from '@/services/storeSettingsService';
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
import { normalizeHomeShopCategories } from '@/utils/homeShopCategories';

type HomeRebookContent = {
  meta: string;
  title: string;
  subtitle: string;
};

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
    route: '/new-booking',
  },
  {
    menuId: 'demo-booking' as const,
    glyph: 'S',
    label: '라켓 시타',
    sub: '데모 대여',
    tone: 'accent' as const,
    route: '/new-booking',
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

const defaultHomeBanners: HomeBanner[] = [
  {
    buttonLabel: '예약하기',
    id: 'home-stringing',
    image_path: 'seed/home-banner-stringing.png',
    meta: 'STRINGING',
    route: '/new-booking',
    subtitle: '새 스트링 작업을 빠르게 예약하세요.',
    title: '오늘 컨디션에 맞춘 스트링',
  },
  {
    buttonLabel: '둘러보기',
    id: 'home-demo-rackets',
    image_path: 'seed/home-banner-demo-rackets.png',
    meta: 'DEMO RACKETS',
    route: '/shop',
    subtitle: '인기 라켓을 비교하고 다음 장비를 찾아보세요.',
    title: '새 라켓을 찾는 시간',
  },
  {
    buttonLabel: '쇼핑하기',
    id: 'home-accessories',
    image_path: 'seed/home-banner-accessories.png',
    meta: 'SHOP',
    route: '/shop',
    subtitle: '스트링, 그립, 액세서리를 한 번에 확인하세요.',
    title: '코트 준비를 더 가볍게',
  },
];


const progressSteps = ['접수', '승인', '작업중', '완료'];

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
  const [homeBanners, setHomeBanners] =
    useState<HomeBanner[]>(defaultHomeBanners);
  const [categories, setCategories] = useState<HomeShopCategory[]>([]);
  const [storeHours, setStoreHours] = useState<StoreHoursContent | null>(null);
  // DB에서 로드한 매장명 상태
  const [storeName, setStoreName] = useState<string | null>(null);

  const categoryCardWidth = useMemo(() => {
    const sectionHorizontalPadding = theme.spacing[5] * 2;
    const cardGap = theme.spacing[2];
    const gridWidth = Math.max(0, windowWidth - sectionHorizontalPadding);

    return Math.max(0, Math.floor((gridWidth - cardGap) / 2));
  }, [windowWidth]);
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
  const visibleHomeBanners = useMemo(
    () =>
      homeBanners.filter((banner) => {
        if (banner.route === '/shop') {
          return menuSettings.shop;
        }

        if (banner.route === '/new-booking') {
          return bookingMenusVisible;
        }

        return true;
      }),
    [bookingMenusVisible, homeBanners, menuSettings.shop],
  );

  useEffect(() => {
    let mounted = true;

    Promise.all([
      getAppContentBlocks([
        'home_banners',
        'home_categories',
        'home_store_hours',
      ]),
      profileId
        ? getMyBookings(profileId)
        : Promise.resolve([] as ServiceBooking[]),
      profileId ? getRackets(profileId) : Promise.resolve([] as UserRacket[]),
      getActiveStrings(),
      // 매장 정보 병렬 로드
      getStoreInfo(),
    ])
      .then(async ([blocks, bookings, userRackets, strings, storeInfo]) => {
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
        // 매장명 업데이트
        setStoreName(storeInfo.storeName || null);
        // 각 라켓의 스트링 셋업 병렬 조회
        const racketSetups = await Promise.all(
          userRackets.map(async (racket) => {
            if (!profileId) return { racket, setup: null, stringName: '스트링 미등록' };
            try {
              const setups = await getSetupsByRacket(profileId, racket.id);
              const latest = setups[0] ?? null;
              let stringName = '스트링 미등록';
              if (latest) {
                // string_catalog 정보는 이미 로드된 strings에서 찾기 (API 호출 최소화)
                const found = strings.find((s) => s.id === latest.main_string_id);
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
        setHomeBanners(
          blocks.home_banners?.length ? blocks.home_banners : defaultHomeBanners,
        );
        setCategories(normalizeHomeShopCategories(blocks.home_categories));
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
        setHomeBanners(defaultHomeBanners);
        setCategories([]);
        setStoreHours(null);
      });

    return () => {
      mounted = false;
    };
  }, [profileId]);

  return (
    <AppScrollView>
      <TopBar
        nickname={nickname}
        storeName={storeName}
        onNotificationsPress={() => router.push('/notifications')}
      />

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

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.bannerList}>
          {visibleHomeBanners.map((banner) => {
            const imageUrl = getAppAssetUrl(
              banner.image_path ?? banner.image_url,
            );
            const imageSource = imageUrl ? { uri: imageUrl } : null;

            return (
              <Pressable
                accessibilityLabel={banner.title}
                accessibilityRole="button"
                key={banner.id}
                onPress={() => {
                  if (banner.route) {
                    router.push(banner.route);
                  }
                }}
                style={({ pressed }) => [
                  styles.homeBanner,
                  pressed && styles.pressed,
                ]}
              >
                {imageSource ? (
                  <Image
                    accessibilityIgnoresInvertColors
                    resizeMode="cover"
                    source={imageSource}
                    style={styles.homeBannerImage}
                  />
                ) : null}
                <View style={styles.homeBannerOverlay} />
                <View style={styles.homeBannerText}>
                  <Text style={styles.homeBannerMeta}>{banner.meta}</Text>
                  <Text style={styles.homeBannerTitle}>{banner.title}</Text>
                  <Text style={styles.homeBannerSub}>{banner.subtitle}</Text>
                </View>
                <View style={styles.homeBannerButton}>
                  <Text style={styles.homeBannerButtonText}>
                    {banner.buttonLabel}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.quickGrid}>
        {visibleQuickServices.map((service) => (
          <IconAction
            glyph={service.glyph}
            key={service.label}
            label={service.label}
            onPress={() => router.push(service.route)}
            sub={service.sub}
            tone={service.tone}
          />
        ))}
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
                <Text style={styles.metaText}>{activeBooking.pickupLabel}</Text>
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
      <View style={styles.racketSection}>
        <SectionHeader
          title="내 라켓"
          caption="저장된 조합으로 빠르게 예약"
          action={
            <Pressable
              accessibilityLabel="라켓 관리"
              accessibilityRole="button"
              onPress={() => router.push('/rackets')}
            >
              <Text style={styles.linkText}>관리 {'>'}</Text>
            </Pressable>
          }
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.racketList}>
            {rackets.map((racket) => (
              <Pressable
                accessibilityLabel={`${racket.brand} ${racket.model} 상세 보기`}
                accessibilityRole="button"
                key={racket.id}
                onPress={() =>
                  router.push({
                    pathname: '/racket-detail',
                    params: { from: '/', id: racket.id },
                  })
                }
                style={({ pressed }) => [
                  styles.racketCard,
                  pressed && styles.pressed,
                ]}
              >
                <ProductThumb
                  imageUrl={getRacketPhotoUrl(
                    racket.image_path ?? racket.image_url,
                  )}
                  label={racket.brand}
                  tone={racket.tone}
                  wide
                />
                <View style={styles.racketInfo}>
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
            ))}
            <RowButton
              accessibilityLabel="라켓 추가"
              onPress={() => router.push('/rackets')}
              style={styles.addRacketCard}
            >
              <AppIcon
                color={lightColors.mutedForeground.hex}
                name="plus"
                size={28}
              />
              <Text style={styles.addText}>라켓 추가</Text>
            </RowButton>
          </View>
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
            <Card key={item.id} style={styles.featuredCard}>
              <View style={styles.featuredImageWrap}>
                {item.imageUrl ? (
                  <Image
                    accessibilityIgnoresInvertColors
                    resizeMode="cover"
                    source={{
                      uri: getStringPhotoUrl(item.imageUrl) ?? item.imageUrl,
                    }}
                    style={styles.featuredImage}
                  />
                ) : null}
                <View style={styles.featuredBadge}>
                  <Pill tone={item.tone}>{item.label}</Pill>
                </View>
              </View>
              <View style={styles.featuredBody}>
                <Text style={styles.metaText}>{item.brand}</Text>
                <Text style={styles.featuredTitle}>{item.name}</Text>
                <View style={styles.featuredMetaRow}>
                  <Text style={styles.featuredPrice}>
                    {item.price !== null
                      ? `${item.price.toLocaleString('ko-KR')}원`
                      : '가격 문의'}
                  </Text>
                  {item.gauge ? (
                    <Text style={styles.metaText}>{item.gauge}mm</Text>
                  ) : null}
                </View>
                {item.description ? (
                  <Text style={styles.mutedText} numberOfLines={2}>
                    {item.description}
                  </Text>
                ) : null}
              </View>
            </Card>
          ))}
        </View>
        </ScrollView>
      </View>
      ) : null}

      <View style={[styles.section, !menuSettings.shop && styles.hiddenSection]}>
        <SectionHeader title="샵 카테고리" />
        {menuSettings.shop ? (
        <View style={styles.categoryGrid}>
          {categories.map((category) => {
            const imageUrl = getAppAssetUrl(
              category.image_path ?? category.image_url,
            );
            const imageSource = imageUrl ? { uri: imageUrl } : null;

            return (
              <Pressable
                accessibilityLabel={`${category.label} 보기`}
                accessibilityRole="button"
                key={category.id}
                onPress={() => router.push(category.route ?? '/shop')}
                style={({ pressed }) => [
                  styles.categoryCard,
                  { width: categoryCardWidth },
                  pressed && styles.pressed,
                ]}
              >
                {imageSource ? (
                  <Image
                    accessibilityIgnoresInvertColors
                    resizeMode="cover"
                    source={imageSource}
                    style={styles.categoryImage}
                  />
                ) : null}
                <View style={styles.categoryOverlay} />
                <View style={styles.categoryTextWrap}>
                  <Text style={styles.categoryMeta}>SHOP</Text>
                  <Text style={styles.categoryText}>{category.label}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
        ) : null}
      </View>

      <Text style={styles.footerText}>YellowBall v1.0.0 · MVP</Text>
    </AppScrollView>
  );
}

const styles = StyleSheet.create({
  heroSection: {
    gap: theme.spacing[3],
    paddingHorizontal: theme.spacing[5],
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
    flexDirection: 'row',
    gap: theme.spacing[2],
    paddingHorizontal: theme.spacing[5],
  },
  bannerList: {
    flexDirection: 'row',
    gap: theme.spacing[3],
    paddingHorizontal: theme.spacing[5],
  },
  homeBanner: {
    borderRadius: theme.borderRadius.lg,
    height: 164,
    overflow: 'hidden',
    padding: theme.spacing[4],
    width: 292,
  },
  homeBannerImage: {
    height: '100%',
    left: 0,
    position: 'absolute',
    top: 0,
    width: '100%',
  },
  homeBannerOverlay: {
    backgroundColor: 'rgba(12,34,27,0.46)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  homeBannerText: {
    flex: 1,
    gap: theme.spacing[1],
    justifyContent: 'flex-end',
    maxWidth: 210,
    zIndex: 1,
  },
  homeBannerMeta: {
    color: lightColors.accent.hex,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 11,
    fontWeight: theme.typography.fontWeight.bold,
  },
  homeBannerTitle: {
    color: lightColors.primaryForeground.hex,
    fontFamily: theme.typography.fontFamily.display,
    fontSize: 18,
    fontWeight: theme.typography.fontWeight.bold,
    lineHeight: 24,
  },
  homeBannerSub: {
    color: 'rgba(252,250,244,0.82)',
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 12,
    lineHeight: 17,
  },
  homeBannerButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: lightColors.accent.hex,
    borderRadius: 999,
    height: 30,
    justifyContent: 'center',
    marginTop: theme.spacing[3],
    paddingHorizontal: theme.spacing[3],
    zIndex: 1,
  },
  homeBannerButtonText: {
    color: lightColors.accentForeground.hex,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 11,
    fontWeight: theme.typography.fontWeight.bold,
  },
  section: {
    gap: theme.spacing[3],
    paddingHorizontal: theme.spacing[5],
  },
  hiddenSection: {
    display: 'none',
  },
  racketSection: {
    gap: theme.spacing[3],
    paddingLeft: theme.spacing[5],
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
    flexDirection: 'row',
    gap: theme.spacing[3],
    paddingBottom: theme.spacing[1],
    paddingRight: theme.spacing[5],
  },
  racketCard: {
    gap: theme.spacing[3],
    width: 210,
  },
  racketInfo: {
    gap: theme.spacing[1],
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
    alignItems: 'center',
    borderColor: lightColors.border.hex,
    borderRadius: theme.borderRadius.lg,
    borderStyle: 'dashed',
    borderWidth: 2,
    gap: theme.spacing[2],
    justifyContent: 'center',
    minHeight: 198,
    width: 140,
  },
  addText: {
    color: lightColors.mutedForeground.hex,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 12,
    fontWeight: theme.typography.fontWeight.medium,
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
    gap: theme.spacing[2],
    paddingRight: theme.spacing[5],
  },
  featuredCard: {
    overflow: 'hidden',
    padding: 0,
    width: 160,
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
    gap: theme.spacing[1],
    padding: theme.spacing[3],
  },
  featuredTitle: {
    color: lightColors.foreground.hex,
    fontFamily: theme.typography.fontFamily.display,
    fontSize: 14,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  featuredMetaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  featuredPrice: {
    color: lightColors.foreground.hex,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 13,
    fontWeight: theme.typography.fontWeight.bold,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    aspectRatio: 4 / 3,
    backgroundColor: lightColors.secondary.hex,
    borderRadius: theme.borderRadius.lg,
    justifyContent: 'flex-end',
    marginBottom: theme.spacing[2],
    overflow: 'hidden',
  },
  categoryImage: {
    ...StyleSheet.absoluteFillObject,
    height: '100%',
    width: '100%',
  },
  categoryOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(8,20,14,0.34)',
  },
  categoryTextWrap: {
    gap: 2,
    padding: theme.spacing[3],
  },
  categoryMeta: {
    color: 'rgba(255,255,255,0.78)',
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 10,
    fontWeight: theme.typography.fontWeight.bold,
  },
  categoryText: {
    color: lightColors.primaryForeground.hex,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 15,
    fontWeight: theme.typography.fontWeight.bold,
  },
  footerText: {
    color: lightColors.mutedForeground.hex,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 11,
    paddingBottom: theme.spacing[2],
    textAlign: 'center',
  },
  pressed: {
    opacity: theme.opacity.pressed,
  },
});
