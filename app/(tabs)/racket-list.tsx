import React, { useCallback, useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Button } from '@/components/Button';
import { BackButton } from '@/components/MobileUI';
import { RefreshableScrollView } from '@/components/PageRefresh';
import { Typography } from '@/components/Typography';
import { lightColors, theme } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { getRackets } from '@/services/racketService';
import { getRacketPhotoUrl } from '@/services/storageService';
import type { UserRacket } from '@/types/database';

export default function RacketListScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const profileId = profile?.id;
  const [rackets, setRackets] = useState<UserRacket[]>([]);
  const [message, setMessage] = useState<string>();

  const loadRackets = useCallback(async () => {
    if (!profileId) {
      setRackets([]);
      return;
    }

    setRackets(await getRackets(profileId));
  }, [profileId]);

  useEffect(() => {
    loadRackets().catch(() => setMessage('라켓 목록을 불러오지 못했습니다.'));
  }, [loadRackets]);

  return (
    <RefreshableScrollView
      contentContainerStyle={styles.container}
      style={styles.screen}
    >
      <View style={styles.header}>
        <View style={styles.headerBack}>
          <BackButton onPress={() => router.back()} />
        </View>
        <View style={styles.headerCopy}>
          <Typography variant="h1">라켓 목록</Typography>
          <Typography variant="caption" style={styles.muted}>
            라켓을 누르면 상세, 수정, 삭제를 확인할 수 있습니다.
          </Typography>
        </View>
      </View>

      <Button
        accessibilityLabel="라켓 추가"
        onPress={() => router.push('/rackets')}
      >
        라켓 추가
      </Button>

      <View style={styles.section}>
        {rackets.length === 0 ? (
          <View style={styles.emptyCard}>
            <Typography variant="h2">등록된 라켓이 없습니다</Typography>
            <Typography variant="body" style={styles.muted}>
              먼저 라켓을 추가해 예약에 사용할 장비 정보를 저장하세요.
            </Typography>
          </View>
        ) : null}

        {rackets.map((racket) => {
          const photoUrl = getRacketPhotoUrl(racket.photo_url) ?? racket.photo_url;

          return (
            <Pressable
              key={racket.id}
              accessibilityLabel={`${racket.brand} ${racket.model} 상세 보기`}
              accessibilityRole="button"
              onPress={() =>
                router.push({
                  pathname: '/racket-detail',
                  params: { from: '/racket-list', id: racket.id },
                })
              }
              style={({ pressed }) => [
                styles.cardPressable,
                pressed && styles.pressed,
              ]}
              testID={`racket-list-card-hit-target-${racket.id}`}
            >
              <View
                pointerEvents="none"
                style={styles.cardSurface}
                testID={`racket-list-card-surface-${racket.id}`}
              >
                <View style={styles.cardContent}>
                  <View style={styles.thumb}>
                    {photoUrl ? (
                      <Image
                        accessibilityIgnoresInvertColors
                        resizeMode="cover"
                        source={{ uri: photoUrl }}
                        style={styles.thumbImage}
                      />
                    ) : (
                      <Typography variant="h2" style={styles.thumbText}>
                        {racket.brand.slice(0, 1)}
                      </Typography>
                    )}
                  </View>
                  <View style={styles.cardBody}>
                    <View style={styles.titleRow}>
                      <Typography
                        numberOfLines={1}
                        variant="h2"
                        style={styles.racketTitle}
                      >
                        {racket.brand} {racket.model}
                      </Typography>
                      {racket.is_primary ? (
                        <View style={styles.primaryPill}>
                          <Typography variant="caption" style={styles.primaryText}>
                            메인
                          </Typography>
                        </View>
                      ) : null}
                    </View>
                    <Typography
                      numberOfLines={1}
                      variant="caption"
                      style={styles.muted}
                    >
                      {racket.grip_size ? `${racket.grip_size} · ` : ''}
                      {racket.weight ? `${racket.weight}g · ` : ''}
                      {racket.balance ?? '밸런스 미등록'}
                    </Typography>
                    {racket.memo ? (
                      <Typography numberOfLines={1} variant="body" style={styles.memo}>
                        {racket.memo}
                      </Typography>
                    ) : null}
                  </View>
                </View>
              </View>
            </Pressable>
          );
        })}
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
  screen: {
    backgroundColor: lightColors.background.hex,
    flex: 1,
  },
  container: {
    backgroundColor: lightColors.background.hex,
    flexGrow: 1,
    gap: theme.spacing[4],
    padding: theme.spacing[6],
    paddingTop: theme.spacing[12],
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: theme.spacing[2],
    width: '100%',
  },
  headerBack: {
    height: 42,
    justifyContent: 'center',
    marginTop: 2,
    width: 36,
  },
  headerCopy: {
    flex: 1,
    gap: theme.spacing[1],
    minWidth: 0,
  },
  section: {
    gap: theme.spacing[3],
  },
  cardPressable: {
    borderRadius: theme.borderRadius.lg,
    width: '100%',
  },
  cardSurface: {
    alignItems: 'center',
    backgroundColor: lightColors.card.hex,
    borderColor: lightColors.border.hex,
    borderRadius: theme.borderRadius.lg,
    borderWidth: theme.borderWidth.hairline,
    flexDirection: 'row',
    minHeight: 96,
    minWidth: 0,
    overflow: 'hidden',
    padding: theme.spacing[3],
    width: '100%',
  },
  cardContent: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing[3],
    minHeight: 96,
    minWidth: 0,
    width: '100%',
  },
  emptyCard: {
    backgroundColor: lightColors.card.hex,
    borderColor: lightColors.border.hex,
    borderRadius: theme.borderRadius.lg,
    borderWidth: theme.borderWidth.hairline,
    gap: theme.spacing[2],
    padding: theme.spacing[4],
  },
  thumb: {
    alignItems: 'center',
    backgroundColor: lightColors.secondary.hex,
    borderRadius: theme.borderRadius.md,
    flexShrink: 0,
    height: 72,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 72,
  },
  thumbImage: {
    height: '100%',
    width: '100%',
  },
  thumbText: {
    color: lightColors.mutedForeground.hex,
  },
  cardBody: {
    flex: 1,
    flexShrink: 1,
    gap: theme.spacing[1],
    minWidth: 0,
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing[2],
    minWidth: 0,
  },
  racketTitle: {
    flexShrink: 1,
    minWidth: 0,
  },
  primaryPill: {
    backgroundColor: lightColors.primary.hex,
    borderRadius: 999,
    flexShrink: 0,
    paddingHorizontal: theme.spacing[2],
    paddingVertical: 2,
  },
  primaryText: {
    color: lightColors.primaryForeground.hex,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  memo: {
    color: lightColors.foreground.hex,
  },
  muted: {
    color: lightColors.mutedForeground.hex,
  },
  pressed: {
    opacity: theme.opacity.pressed,
  },
});
