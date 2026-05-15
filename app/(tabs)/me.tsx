import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Button } from '@/components/Button';
import { Text } from '@/components/AppText';
import { AppIcon, type AppIconName } from '@/components/AppIcon';
import { AuthLoadingOverlay } from '@/components/AuthLoadingOverlay';
import { FeedbackDialog } from '@/components/FeedbackDialog';
import {
  AppScrollView,
  Card,
  Chevron,
  GlyphBubble,
  PageHeader,
  Pill,
  ProductThumb,
  RowButton,
  SectionHeader,
} from '@/components/MobileUI';
import { Input } from '@/components/Input';
import { lightColors, theme } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { useAppMenuSettings } from '@/hooks/useAppMenuSettings';
import { useResetOnBlur } from '@/hooks/useResetOnBlur';
import { getRacketPhotoUrl } from '@/services/storageService';
import { getProfile, updateProfile } from '@/services/profileService';
import { getMyBookings } from '@/services/bookingService';
import { getMyDemoBookings } from '@/services/demoBookingService';
import { getRackets } from '@/services/racketService';
import type { MenuId } from '@/services/appMenuSettingsService';
import type { Profile, UserRacket } from '@/types/database';

type ProfileMetricContent = {
  label: string;
  value: string;
};

type MeProfileSummary = {
  membershipLabel: string;
  storeName: string;
  joinedAtLabel: string;
};

type MeStat = {
  label: string;
  value: number;
  icon: AppIconName;
};

type MeRacket = {
  id: string;
  name: string;
  image_path?: string | null;
  image_url?: string | null;
  string: string;
  lastService: string;
  main: boolean;
  tone: 'primary' | 'accent' | 'secondary' | 'card';
};

type MeMenuGroup = {
  title: string;
  items: {
    label: string;
    route?: string;
    unavailableMessage?: string;
    glyph: string;
    badge?: string;
    menuId?: MenuId | null;
  }[];
};

const screenHorizontalPadding = theme.spacing[5];
const statsGridPadding = theme.spacing[3];

const menuGroups: MeMenuGroup[] = [
  {
    title: '쇼핑',
    items: [
      { label: '주문 내역', route: '/orders', glyph: 'O', menuId: 'shop' },
    ],
  },
  {
    title: '계정',
    items: [
      { label: '배송지 관리', route: '/addresses', glyph: 'A', menuId: 'delivery' },
      { label: '알림 설정', route: '/notification-settings', glyph: 'N' },
    ],
  },
  {
    title: '고객지원',
    items: [
      {
        label: '공지사항',
        unavailableMessage: '공지사항 기능은 준비 중입니다.',
        glyph: 'D',
      },
      {
        label: '문의하기',
        unavailableMessage: '문의하기 기능은 준비 중입니다.',
        glyph: 'Q',
      },
    ],
  },
];

const formatJoinedAt = (value?: string | null) =>
  value
    ? new Intl.DateTimeFormat('ko-KR', {
        month: '2-digit',
        year: 'numeric',
      }).format(new Date(value))
    : '-';

const getMembershipLabel = (profile?: Profile | null) =>
  profile?.role === 'super_admin'
    ? 'SUPER'
    : profile?.role === 'admin'
      ? 'ADMIN'
      : 'MEMBER';

const toMeRacket = (racket: UserRacket): MeRacket => ({
  id: racket.id,
  image_url: racket.photo_url,
  lastService: '-',
  main: Boolean(racket.is_primary),
  name: `${racket.brand} ${racket.model}`,
  string: '스트링 미등록',
  tone: racket.is_primary ? 'primary' : 'accent',
});

export default function MeScreen() {
  const router = useRouter();
  const { profile, signOut } = useAuth();
  const menuSettings = useAppMenuSettings();
  const profileId = profile?.id;
  const [profileOverride, setProfileOverride] = useState<typeof profile>(null);
  const currentProfile = profileOverride ?? profile;
  const [isEditing, setIsEditing] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [nickname, setNickname] = useState(currentProfile?.nickname ?? '');
  const [phone, setPhone] = useState(currentProfile?.phone ?? '');
  const [profileSummary, setProfileSummary] = useState<MeProfileSummary | null>(
    null,
  );
  const [profileMetrics, setProfileMetrics] = useState<ProfileMetricContent[]>(
    [],
  );
  const [stats, setStats] = useState<MeStat[]>([]);
  const [rackets, setRackets] = useState<MeRacket[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>();
  const [successMessage, setSuccessMessage] = useState<string>();
  const [successDialog, setSuccessDialog] = useState(false);

  const resetForm = useCallback(() => {
    setIsEditing(false);
    setIsSaving(false);
    setNickname(currentProfile?.nickname ?? '');
    setPhone(currentProfile?.phone ?? '');
    setErrorMessage(undefined);
    setSuccessMessage(undefined);
    setSuccessDialog(false);
  }, [currentProfile?.nickname, currentProfile?.phone]);

  useResetOnBlur(resetForm);

  useEffect(() => {
    setProfileOverride(null);
  }, [profileId]);

  useEffect(() => {
    let mounted = true;

    if (!currentProfile) {
      setProfileSummary(null);
      setProfileMetrics([]);
      setStats([]);
      setRackets([]);
      return () => {
        mounted = false;
      };
    }

    Promise.all([
      getMyBookings(currentProfile.id),
      getMyDemoBookings(currentProfile.id),
      getRackets(currentProfile.id),
    ])
      .then(([serviceBookings, demoBookings, userRackets]) => {
        if (!mounted) {
          return;
        }

        setProfileSummary({
          joinedAtLabel: `가입 ${formatJoinedAt(currentProfile.created_at)}`,
          membershipLabel: getMembershipLabel(currentProfile),
          storeName: 'YellowBall',
        });
        setProfileMetrics([
          { label: '스트링 예약', value: `${serviceBookings.length}` },
          { label: '데모 예약', value: `${demoBookings.length}` },
          { label: '내 라켓', value: `${userRackets.length}` },
        ]);
        setStats([
          { icon: 'wrench', label: '스트링 작업', value: serviceBookings.length },
          { icon: 'sparkles', label: '데모', value: demoBookings.length },
          { icon: 'package', label: '라켓', value: userRackets.length },
          {
            icon: 'calendar-check',
            label: '진행 중',
            value:
              serviceBookings.filter(
                (booking) =>
                  ![
                    'delivered',
                    'done',
                    'cancelled_user',
                    'cancelled_admin',
                    'rejected',
                    'no_show',
                    'refund_done',
                  ].includes(booking.status),
              ).length +
              demoBookings.filter(
                (booking) =>
                  ![
                    'returned',
                    'cancelled_user',
                    'cancelled_admin',
                    'rejected',
                    'no_show',
                  ].includes(booking.status),
              ).length,
          },
        ]);
        setRackets(userRackets.map(toMeRacket));
      })
      .catch(() => undefined);

    return () => {
      mounted = false;
    };
  }, [currentProfile]);

  const handleSaveProfile = async () => {
    if (!currentProfile) {
      setErrorMessage('프로필을 불러온 뒤 다시 시도해주세요.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(undefined);
    setSuccessMessage(undefined);

    try {
      await updateProfile(currentProfile.id, {
        nickname,
        phone: phone.trim() || null,
      });
      const updatedProfile = await getProfile(currentProfile.id);
      setProfileOverride(updatedProfile);
      setNickname(updatedProfile.nickname);
      setPhone(updatedProfile.phone ?? '');
      setIsEditing(false);
      setSuccessMessage('프로필이 저장되었습니다.');
      setSuccessDialog(true);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : '프로필을 저장하지 못했습니다.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    setErrorMessage(undefined);

    try {
      await signOut();
      router.replace('/(auth)/login');
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : '로그아웃에 실패했습니다. 잠시 후 다시 시도해주세요.',
      );
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleMenuPress = (item: MeMenuGroup['items'][number]) => {
    if (item.route) {
      router.push(item.route);
      return;
    }

    setSuccessMessage(undefined);
    setErrorMessage(item.unavailableMessage ?? '아직 준비 중인 기능입니다.');
  };

  const displayName =
    currentProfile?.nickname ?? currentProfile?.username ?? '회원';
  const displayContact =
    currentProfile?.phone ??
    currentProfile?.email ??
    '연락처 정보를 불러오는 중입니다.';
  const initials = displayName.slice(0, 2).toUpperCase();
  const visibleMenuGroups = menuGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.menuId || menuSettings[item.menuId]),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <View style={styles.screen}>
      <AppScrollView>
        <FeedbackDialog
          visible={successDialog}
          title="프로필이 저장되었습니다"
          message="확인을 누르면 내 정보 화면을 확인할 수 있습니다."
          onConfirm={() => setSuccessDialog(false)}
        />
        <PageHeader title="마이" />

      <View style={styles.section}>
        <Card style={styles.profileCard}>
          <View style={styles.profileGlowTop} />
          <View style={styles.profileGlowBottom} />
          <View style={styles.profileRow}>
            <View style={styles.profileAvatar}>
              <Text style={styles.profileAvatarText}>{initials}</Text>
            </View>
            <View style={styles.flex}>
              <View style={styles.nameRow}>
                <Text numberOfLines={1} style={styles.profileName}>
                  {displayName}
                </Text>
                {profileSummary ? (
                  <Pill tone="accent">{profileSummary.membershipLabel}</Pill>
                ) : null}
              </View>
              <Text numberOfLines={1} style={styles.profileContact}>
                {displayContact}
              </Text>
              <Text numberOfLines={1} style={styles.profileMeta}>
                {profileSummary
                  ? `${profileSummary.storeName} · ${profileSummary.joinedAtLabel}`
                  : ''}
              </Text>
            </View>
            <Pressable
              accessibilityLabel={
                isEditing ? '프로필 카드 수정 취소' : '프로필 카드 수정'
              }
              accessibilityRole="button"
              onPress={() => {
                setNickname(currentProfile?.nickname ?? '');
                setPhone(currentProfile?.phone ?? '');
                setIsEditing((editing) => !editing);
              }}
              style={styles.profileEditButton}
            >
              <Chevron />
            </Pressable>
          </View>

          <View style={styles.profileStats}>
            {profileMetrics.map((metric, index) => (
              <React.Fragment key={metric.label}>
                {index > 0 ? <View style={styles.metricDivider} /> : null}
                <ProfileMetric label={metric.label} value={metric.value} />
              </React.Fragment>
            ))}
          </View>
        </Card>
      </View>

      <View style={styles.section}>
        <Card style={styles.statsGrid} testID="me-stats-grid">
          {stats.map((item) => (
            <View
              key={item.label}
              style={styles.statItem}
              testID={`me-stat-${item.icon}-column`}
            >
              <AppIcon
                color={lightColors.primary.hex}
                name={item.icon}
                size={18}
              />
              <Text style={styles.statValue}>{item.value}</Text>
              <Text numberOfLines={1} style={styles.statLabel}>
                {item.label}
              </Text>
              <Pressable
                accessibilityLabel={item.label}
                accessibilityRole="button"
                onPress={() => undefined}
                style={({ pressed }) => [
                  styles.statPressable,
                  pressed && styles.pressed,
                ]}
                testID={`me-stat-${item.icon}`}
              />
            </View>
          ))}
        </Card>
      </View>

      <View style={styles.section}>
        <SectionHeader
          title="프로필 정보"
          action={
            <Button
              accessibilityLabel={
                isEditing ? '프로필 수정 취소' : '프로필 수정'
              }
              onPress={() => {
                setNickname(currentProfile?.nickname ?? '');
                setPhone(currentProfile?.phone ?? '');
                setIsEditing((editing) => !editing);
              }}
              size="sm"
              variant="outline"
            >
              {isEditing ? '취소' : '수정'}
            </Button>
          }
        />
        <Input
          editable={false}
          label="아이디"
          value={currentProfile?.username ?? ''}
        />
        <Input
          editable={isEditing}
          label="닉네임"
          onChangeText={setNickname}
          value={isEditing ? nickname : (currentProfile?.nickname ?? '')}
        />
        <Input
          editable={isEditing}
          keyboardType="phone-pad"
          label="전화번호"
          onChangeText={setPhone}
          value={isEditing ? phone : (currentProfile?.phone ?? '')}
        />
        {isEditing ? (
          <Button
            accessibilityLabel="프로필 저장"
            loading={isSaving}
            onPress={handleSaveProfile}
          >
            저장
          </Button>
        ) : null}
      </View>

      {menuSettings['racket-library'] ? (
      <View style={styles.section}>
        <SectionHeader
          title="내 라켓"
          action={
            <Pressable
              accessibilityLabel="라켓 추가"
              accessibilityRole="button"
              onPress={() => router.push('/rackets')}
            >
              <Text style={styles.linkText}>추가</Text>
            </Pressable>
          }
        />
        <View style={styles.racketList}>
          {rackets.map((racket) => (
            <RowButton
              accessibilityLabel={`${racket.name} 관리`}
              key={racket.name}
              onPress={() =>
                router.push({
                  pathname: '/racket-detail',
                  params: { from: '/me', id: racket.id },
                })
              }
              style={styles.racketCard}
            >
              <ProductThumb
                imageUrl={getRacketPhotoUrl(racket.image_path ?? racket.image_url)}
                label={racket.name.split(' ')[0]}
                tone={racket.tone}
              />
              <View style={styles.flex}>
                <View style={styles.nameRow}>
                  <Text numberOfLines={1} style={styles.racketTitle}>
                    {racket.name}
                  </Text>
                  {racket.main ? <Pill tone="accent">메인</Pill> : null}
                </View>
                <Text numberOfLines={1} style={styles.mutedText}>
                  {racket.string}
                </Text>
                <Text style={styles.metaText}>
                  최근 작업 · {racket.lastService}
                </Text>
              </View>
              <AppIcon
                color={lightColors.mutedForeground.hex}
                name="more-horizontal"
                size={18}
              />
            </RowButton>
          ))}
        </View>
      </View>
      ) : null}

      <View style={styles.menuSection}>
        {visibleMenuGroups.map((group) => (
          <View key={group.title} style={styles.menuGroup}>
            <Text style={styles.menuGroupTitle}>{group.title}</Text>
            <Card style={styles.menuCard}>
              {group.items.map((item, index) => (
                <Pressable
                  accessibilityLabel={item.label}
                  accessibilityRole="button"
                  key={item.label}
                  onPress={() => handleMenuPress(item)}
                  style={[
                    styles.menuItem,
                    index !== group.items.length - 1
                      ? styles.menuItemDivider
                      : null,
                  ]}
                >
                  <View style={styles.menuIconSlot}>
                    <GlyphBubble glyph={item.glyph} tone="secondary" size={32} />
                  </View>
                  <Text numberOfLines={1} style={styles.menuLabel}>
                    {item.label}
                  </Text>
                  {'badge' in item && item.badge ? (
                    <Pill>{item.badge}</Pill>
                  ) : null}
                  <Chevron />
                </Pressable>
              ))}
            </Card>
          </View>
        ))}
      </View>

      {errorMessage ? (
        <Text style={styles.errorText}>{errorMessage}</Text>
      ) : null}
      {successMessage ? (
        <Text style={styles.successText}>{successMessage}</Text>
      ) : null}

      <View style={styles.footer} testID="me-footer">
        <Button
          accessibilityLabel="로그아웃"
          loading={isSigningOut}
          onPress={handleSignOut}
          size="sm"
          testID="me-footer-logout"
          variant="outline"
        >
          로그아웃
        </Button>
        <Text style={styles.footerText} testID="me-footer-version">
          YellowBall v1.0.0 · MVP
        </Text>
      </View>
      </AppScrollView>
      {isSigningOut ? (
        <AuthLoadingOverlay
          caption="안전하게 세션을 정리하고 있습니다."
          label="로그아웃 중"
          panelTestID="me-signout-loading-panel"
          testID="me-signout-loading"
        />
      ) : null}
    </View>
  );
}

function ProfileMetric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricItem}>
      <Text numberOfLines={1} style={styles.metricLabel}>
        {label}
      </Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: lightColors.background.hex,
    flex: 1,
  },
  section: {
    gap: theme.spacing[3],
    paddingHorizontal: screenHorizontalPadding,
  },
  profileCard: {
    backgroundColor: lightColors.primary.hex,
    borderColor: lightColors.primary.hex,
    gap: theme.spacing[5],
    overflow: 'hidden',
    padding: theme.spacing[5],
  },
  profileGlowTop: {
    backgroundColor: lightColors.accent.hex,
    borderRadius: 999,
    height: 160,
    opacity: 0.14,
    position: 'absolute',
    right: -46,
    top: -52,
    width: 160,
  },
  profileGlowBottom: {
    backgroundColor: lightColors.accent.hex,
    borderRadius: 999,
    bottom: 6,
    height: 82,
    opacity: 0.1,
    position: 'absolute',
    right: 38,
    width: 82,
  },
  profileRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing[3],
  },
  profileAvatar: {
    alignItems: 'center',
    backgroundColor: lightColors.accent.hex,
    borderColor: 'rgba(252,250,244,0.22)',
    borderRadius: 999,
    borderWidth: 2,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  profileAvatarText: {
    color: lightColors.accentForeground.hex,
    fontFamily: theme.typography.fontFamily.display,
    fontSize: 18,
    fontWeight: theme.typography.fontWeight.bold,
  },
  nameRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing[2],
  },
  profileName: {
    color: lightColors.primaryForeground.hex,
    fontFamily: theme.typography.fontFamily.display,
    fontSize: 18,
    fontWeight: theme.typography.fontWeight.bold,
    maxWidth: '72%',
  },
  profileContact: {
    color: 'rgba(252,250,244,0.82)',
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 12,
    marginTop: 2,
  },
  profileMeta: {
    color: 'rgba(252,250,244,0.62)',
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 11,
    marginTop: theme.spacing[1],
  },
  profileEditButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(252,250,244,0.1)',
    borderRadius: 999,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  profileStats: {
    backgroundColor: 'rgba(252,250,244,0.1)',
    borderRadius: theme.borderRadius.md,
    flexDirection: 'row',
    padding: theme.spacing[3],
    width: '100%',
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  metricLabel: {
    color: 'rgba(252,250,244,0.72)',
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 10,
  },
  metricValue: {
    color: lightColors.primaryForeground.hex,
    fontFamily: theme.typography.fontFamily.display,
    fontSize: 16,
    fontWeight: theme.typography.fontWeight.bold,
    marginTop: 2,
  },
  metricDivider: {
    backgroundColor: 'rgba(252,250,244,0.16)',
    width: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    overflow: 'hidden',
    padding: statsGridPadding,
    width: '100%',
  },
  statItem: {
    alignItems: 'center',
    borderRadius: theme.borderRadius.md,
    flexBasis: '25%',
    flexGrow: 0,
    flexShrink: 0,
    justifyContent: 'center',
    maxWidth: '25%',
    minHeight: 68,
    minWidth: 0,
    paddingVertical: theme.spacing[2],
    position: 'relative',
    width: '25%',
  },
  statPressable: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: theme.borderRadius.md,
  },
  statValue: {
    color: lightColors.foreground.hex,
    fontFamily: theme.typography.fontFamily.display,
    fontSize: 16,
    fontWeight: theme.typography.fontWeight.bold,
    includeFontPadding: false,
    lineHeight: 20,
    marginTop: theme.spacing[1],
    textAlign: 'center',
    width: '100%',
  },
  statLabel: {
    color: lightColors.mutedForeground.hex,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 10,
    includeFontPadding: false,
    lineHeight: 14,
    maxWidth: '100%',
    textAlign: 'center',
    width: '100%',
  },
  linkText: {
    color: lightColors.primary.hex,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 12,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  racketList: {
    gap: theme.spacing[2],
  },
  racketCard: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing[3],
    padding: theme.spacing[3],
  },
  racketTitle: {
    color: lightColors.foreground.hex,
    flexShrink: 1,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 14,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  mutedText: {
    color: lightColors.mutedForeground.hex,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
  },
  metaText: {
    color: lightColors.mutedForeground.hex,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 10,
    marginTop: 2,
  },
  menuSection: {
    gap: theme.spacing[5],
    paddingHorizontal: screenHorizontalPadding,
  },
  menuGroup: {
    gap: theme.spacing[2],
  },
  menuGroupTitle: {
    color: lightColors.mutedForeground.hex,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 11,
    fontWeight: theme.typography.fontWeight.semibold,
    letterSpacing: 0,
    paddingHorizontal: theme.spacing[1],
  },
  menuCard: {
    overflow: 'hidden',
    padding: 0,
    width: '100%',
  },
  menuItem: {
    alignItems: 'center',
    alignSelf: 'stretch',
    flexDirection: 'row',
    minHeight: 56,
    minWidth: 0,
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
  },
  menuItemDivider: {
    borderBottomColor: lightColors.border.hex,
    borderBottomWidth: theme.borderWidth.hairline,
  },
  menuIconSlot: {
    flexShrink: 0,
    marginRight: theme.spacing[3],
  },
  menuLabel: {
    color: lightColors.foreground.hex,
    flex: 1,
    flexShrink: 1,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 14,
    marginRight: theme.spacing[3],
    minWidth: 0,
  },
  footer: {
    alignItems: 'center',
    gap: theme.spacing[3],
    paddingHorizontal: screenHorizontalPadding,
    paddingTop: theme.spacing[2],
  },
  footerText: {
    color: lightColors.mutedForeground.hex,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 11,
  },
  errorText: {
    color: lightColors.destructive.hex,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 12,
    paddingHorizontal: screenHorizontalPadding,
  },
  successText: {
    color: lightColors.primary.hex,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 12,
    paddingHorizontal: screenHorizontalPadding,
  },
  flex: {
    flex: 1,
    minWidth: 0,
  },
  pressed: {
    opacity: theme.opacity.pressed,
  },
});
