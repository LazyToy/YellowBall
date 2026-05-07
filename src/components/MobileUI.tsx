import React from 'react';
import {
  Image,
  Pressable,
  PressableProps,
  ScrollView,
  ScrollViewProps,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { AppIcon, type AppIconName } from '@/components/AppIcon';
import { usePageRefreshControl } from '@/components/PageRefresh';
import { lightColors, theme } from '@/constants/theme';

type Tone = 'primary' | 'accent' | 'secondary' | 'card';

const iconByGlyph: Record<string, AppIconName> = {
  A: 'map-pin',
  B: 'shopping-bag',
  D: 'package',
  H: 'home',
  N: 'bell',
  O: 'package',
  Q: 'search',
  R: 'calendar-check',
  S: 'sparkles',
  W: 'wrench',
};

const getGlyphIconName = (glyph: string): AppIconName =>
  iconByGlyph[glyph] ?? 'package';

export function AppScrollView({
  alwaysBounceVertical = true,
  children,
  contentContainerStyle,
  refreshControl,
  ...scrollViewProps
}: ScrollViewProps) {
  const pageRefreshControl = usePageRefreshControl();

  return (
    <ScrollView
      alwaysBounceVertical={alwaysBounceVertical}
      showsVerticalScrollIndicator={false}
      style={styles.screen}
      contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
      refreshControl={refreshControl ?? pageRefreshControl}
      {...scrollViewProps}
    >
      {children}
    </ScrollView>
  );
}

export function TopBar({
  nickname,
  storeName,
  onNotificationsPress,
}: {
  nickname?: string | null;
  storeName?: string | null;
  onNotificationsPress?: () => void;
}) {
  const initial = (nickname ?? 'Y').slice(0, 1).toUpperCase();
  /** 표시할 매장명 — prop이 없으면 'YellowBall' 기본값 */
  const displayStore = storeName || 'YellowBall';

  return (
    <View style={styles.topBar}>
      <View style={styles.brandRow}>
        <View style={styles.brandMark}>
          <Text style={styles.brandMarkText}>Y</Text>
        </View>
        <View style={styles.flex}>
          {/* DB에서 로드한 매장명 표시 */}
          <Text style={styles.locationText}>{displayStore}</Text>
          <Text style={styles.brandText}>YellowBall</Text>
        </View>
      </View>
      <View style={styles.topActions}>
        <Pressable
          accessibilityLabel="알림"
          accessibilityRole="button"
          onPress={onNotificationsPress}
          style={({ pressed }) => [styles.roundButton, pressed && styles.pressed]}
        >
          <AppIcon
            color={lightColors.secondaryForeground.hex}
            name="bell"
            size={18}
          />
          <View style={styles.notificationDot} />
        </Pressable>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
      </View>
    </View>
  );
}


export function PageHeader({
  title,
  back = false,
  onBack,
  right,
}: {
  title: string;
  back?: boolean;
  onBack?: () => void;
  right?: React.ReactNode;
}) {
  return (
    <View style={styles.pageHeader}>
      {back ? (
        <Pressable
          accessibilityLabel="뒤로 가기"
          accessibilityRole="button"
          onPress={onBack}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <AppIcon name="chevron-left" size={22} />
        </Pressable>
      ) : null}
      <Text style={styles.pageTitle}>{title}</Text>
      {right}
    </View>
  );
}

export function BackButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityLabel="뒤로 가기"
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
    >
      <AppIcon name="chevron-left" size={22} />
    </Pressable>
  );
}

export function SectionHeader({
  title,
  caption,
  action,
}: {
  title: string;
  caption?: string;
  action?: React.ReactNode;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.flex}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {caption ? <Text style={styles.captionText}>{caption}</Text> : null}
      </View>
      {action}
    </View>
  );
}

export function GlyphBubble({
  glyph,
  tone = 'secondary',
  size = 44,
}: {
  glyph: string;
  tone?: Tone;
  size?: number;
}) {
  return (
    <View
      style={[
        styles.glyphBubble,
        toneStyles[tone],
        {
          borderRadius: size >= 50 ? theme.borderRadius.lg : theme.borderRadius.md,
          height: size,
          width: size,
        },
      ]}
    >
      <AppIcon
        color={
          tone === 'card'
            ? lightColors.foreground.hex
            : lightColors.primaryForeground.hex
        }
        name={getGlyphIconName(glyph)}
        size={Math.max(18, Math.floor(size * 0.46))}
      />
    </View>
  );
}

export function IconAction({
  glyph,
  label,
  sub,
  tone,
  onPress,
}: {
  glyph: string;
  label: string;
  sub: string;
  tone: Tone;
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.iconAction, pressed && styles.pressed]}
    >
      <GlyphBubble glyph={glyph} tone={tone} size={52} />
      <Text numberOfLines={1} style={styles.iconActionLabel}>
        {label}
      </Text>
      <Text numberOfLines={1} style={styles.iconActionSub}>
        {sub}
      </Text>
    </Pressable>
  );
}

export function Card({
  children,
  style,
  elevated = false,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  elevated?: boolean;
}) {
  return <View style={[styles.card, elevated && theme.shadow.card, style]}>{children}</View>;
}

export function RowButton({
  children,
  onPress,
  style,
  accessibilityLabel,
}: PressableProps & {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.rowButton, pressed && styles.pressed, style]}
    >
      {children}
    </Pressable>
  );
}

export function Pill({
  children,
  tone = 'secondary',
  style,
  textStyle,
}: {
  children: React.ReactNode;
  tone?: Tone | 'danger';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}) {
  return (
    <View style={[styles.pill, pillToneStyles[tone], style]}>
      <Text style={[styles.pillText, pillTextToneStyles[tone], textStyle]}>{children}</Text>
    </View>
  );
}

export function ProductThumb({
  tone = 'primary',
  label,
  wide = false,
  imageUrl,
}: {
  tone?: Tone;
  label: string;
  wide?: boolean;
  imageUrl?: string | null;
}) {
  return (
    <View style={[styles.productThumb, wide && styles.productThumbWide, thumbToneStyles[tone]]}>
      {imageUrl ? (
        <>
          <Image
            accessibilityIgnoresInvertColors
            resizeMode="cover"
            source={{ uri: imageUrl }}
            style={styles.productThumbImage}
          />
          <View style={styles.productThumbOverlay} />
        </>
      ) : (
        <>
          <View style={styles.racketHandle} />
          <View style={styles.racketHead} />
        </>
      )}
      <Text numberOfLines={1} style={styles.productThumbText}>
        {label}
      </Text>
    </View>
  );
}

export function Chevron() {
  return (
    <AppIcon
      color={lightColors.mutedForeground.hex}
      name="chevron-right"
      size={18}
    />
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: lightColors.background.hex,
    flex: 1,
  },
  scrollContent: {
    gap: theme.spacing[4],
    paddingBottom: theme.spacing[8],
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing[3],
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing[5],
    paddingTop: theme.spacing[5],
  },
  brandRow: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: theme.spacing[2],
  },
  brandMark: {
    alignItems: 'center',
    backgroundColor: lightColors.primary.hex,
    borderRadius: 999,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  brandMarkText: {
    color: lightColors.primaryForeground.hex,
    fontFamily: theme.typography.fontFamily.display,
    fontSize: 16,
    fontWeight: theme.typography.fontWeight.bold,
  },
  locationText: {
    color: lightColors.mutedForeground.hex,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 11,
    lineHeight: 15,
  },
  brandText: {
    color: lightColors.foreground.hex,
    fontFamily: theme.typography.fontFamily.display,
    fontSize: 14,
    fontWeight: theme.typography.fontWeight.semibold,
    lineHeight: 18,
  },
  topActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing[2],
  },
  roundButton: {
    alignItems: 'center',
    backgroundColor: lightColors.secondary.hex,
    borderRadius: 999,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  actionGlyph: {
    color: lightColors.secondaryForeground.hex,
    fontFamily: theme.typography.fontFamily.display,
    fontSize: 16,
    fontWeight: theme.typography.fontWeight.bold,
  },
  notificationDot: {
    backgroundColor: lightColors.destructive.hex,
    borderColor: lightColors.background.hex,
    borderRadius: 999,
    borderWidth: 2,
    height: 10,
    position: 'absolute',
    right: 9,
    top: 9,
    width: 10,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: lightColors.accent.hex,
    borderColor: lightColors.border.hex,
    borderRadius: 999,
    borderWidth: theme.borderWidth.hairline,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  avatarText: {
    color: lightColors.accentForeground.hex,
    fontFamily: theme.typography.fontFamily.display,
    fontSize: 14,
    fontWeight: theme.typography.fontWeight.bold,
  },
  pageHeader: {
    alignItems: 'center',
    borderBottomColor: lightColors.border.hex,
    borderBottomWidth: theme.borderWidth.hairline,
    flexDirection: 'row',
    gap: theme.spacing[3],
    minHeight: 56,
    paddingHorizontal: theme.spacing[5],
    paddingTop: theme.spacing[2],
  },
  pageTitle: {
    color: lightColors.foreground.hex,
    flex: 1,
    fontFamily: theme.typography.fontFamily.display,
    fontSize: 18,
    fontWeight: theme.typography.fontWeight.bold,
  },
  backButton: {
    alignItems: 'center',
    borderRadius: 999,
    height: 36,
    justifyContent: 'center',
    marginLeft: -theme.spacing[2],
    width: 36,
  },
  backGlyph: {
    color: lightColors.foreground.hex,
    fontFamily: theme.typography.fontFamily.display,
    fontSize: 20,
    fontWeight: theme.typography.fontWeight.bold,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing[3],
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: lightColors.foreground.hex,
    fontFamily: theme.typography.fontFamily.display,
    fontSize: 16,
    fontWeight: theme.typography.fontWeight.bold,
    lineHeight: 22,
  },
  captionText: {
    color: lightColors.mutedForeground.hex,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
  },
  flex: {
    flex: 1,
    minWidth: 0,
  },
  glyphBubble: {
    alignItems: 'center',
    borderWidth: theme.borderWidth.hairline,
    justifyContent: 'center',
  },
  glyph: {
    color: lightColors.primaryForeground.hex,
    fontFamily: theme.typography.fontFamily.display,
    fontSize: 19,
    fontWeight: theme.typography.fontWeight.bold,
  },
  cardGlyph: {
    color: lightColors.foreground.hex,
  },
  iconAction: {
    alignItems: 'center',
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  iconActionLabel: {
    color: lightColors.foreground.hex,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 11,
    fontWeight: theme.typography.fontWeight.semibold,
    marginTop: theme.spacing[1],
    maxWidth: '100%',
  },
  iconActionSub: {
    color: lightColors.mutedForeground.hex,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 10,
    maxWidth: '100%',
  },
  card: {
    backgroundColor: lightColors.card.hex,
    borderColor: lightColors.border.hex,
    borderRadius: theme.borderRadius.lg,
    borderWidth: theme.borderWidth.hairline,
    padding: theme.spacing[4],
  },
  rowButton: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  pill: {
    alignSelf: 'flex-start',
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: theme.spacing[2],
    paddingVertical: 3,
  },
  pillText: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 10,
    fontWeight: theme.typography.fontWeight.bold,
    lineHeight: 13,
  },
  productThumb: {
    aspectRatio: 1,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    padding: theme.spacing[2],
  },
  productThumbWide: {
    aspectRatio: 4 / 3,
  },
  productThumbImage: {
    height: '100%',
    left: 0,
    position: 'absolute',
    top: 0,
    width: '100%',
  },
  productThumbOverlay: {
    backgroundColor: 'rgba(16,60,40,0.26)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  racketHandle: {
    backgroundColor: 'rgba(255,255,255,0.65)',
    borderRadius: 999,
    height: '48%',
    position: 'absolute',
    right: '24%',
    top: '46%',
    transform: [{ rotate: '32deg' }],
    width: 7,
  },
  racketHead: {
    borderColor: 'rgba(255,255,255,0.78)',
    borderRadius: 999,
    borderWidth: 5,
    height: '58%',
    position: 'absolute',
    right: '18%',
    top: '12%',
    transform: [{ rotate: '-18deg' }],
    width: '48%',
  },
  productThumbText: {
    bottom: theme.spacing[2],
    color: lightColors.primaryForeground.hex,
    fontFamily: theme.typography.fontFamily.display,
    fontSize: 11,
    fontWeight: theme.typography.fontWeight.bold,
    left: theme.spacing[2],
    position: 'absolute',
    right: theme.spacing[2],
  },
  chevron: {
    color: lightColors.mutedForeground.hex,
    fontFamily: theme.typography.fontFamily.display,
    fontSize: 18,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  pressed: {
    opacity: theme.opacity.pressed,
  },
});

const toneStyles = StyleSheet.create({
  primary: {
    backgroundColor: lightColors.primary.hex,
    borderColor: lightColors.primary.hex,
  },
  accent: {
    backgroundColor: lightColors.accent.hex,
    borderColor: lightColors.accent.hex,
  },
  secondary: {
    backgroundColor: lightColors.secondary.hex,
    borderColor: lightColors.secondary.hex,
  },
  card: {
    backgroundColor: lightColors.card.hex,
    borderColor: lightColors.border.hex,
  },
});

const pillToneStyles = StyleSheet.create({
  primary: {
    backgroundColor: lightColors.primary.hex,
  },
  accent: {
    backgroundColor: lightColors.accent.hex,
  },
  secondary: {
    backgroundColor: lightColors.secondary.hex,
  },
  card: {
    backgroundColor: lightColors.card.hex,
  },
  danger: {
    backgroundColor: lightColors.destructive.hex,
  },
});

const pillTextToneStyles = StyleSheet.create({
  primary: {
    color: lightColors.primaryForeground.hex,
  },
  accent: {
    color: lightColors.accentForeground.hex,
  },
  secondary: {
    color: lightColors.secondaryForeground.hex,
  },
  card: {
    color: lightColors.foreground.hex,
  },
  danger: {
    color: lightColors.destructiveForeground.hex,
  },
});

const thumbToneStyles = StyleSheet.create({
  primary: {
    backgroundColor: lightColors.primary.hex,
  },
  accent: {
    backgroundColor: lightColors.chart4.hex,
  },
  secondary: {
    backgroundColor: lightColors.chart5.hex,
  },
  card: {
    backgroundColor: lightColors.chart3.hex,
  },
});
