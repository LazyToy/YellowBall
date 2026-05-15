import React, { useCallback, useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image, StyleSheet, View } from 'react-native';

import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { ConfirmDialog } from '@/components/FeedbackDialog';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { BackButton } from '@/components/MobileUI';
import { RefreshableScrollView } from '@/components/PageRefresh';
import { Typography } from '@/components/Typography';
import { lightColors, theme } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import {
  deleteRacket,
  getRacket,
  setPrimaryRacket,
} from '@/services/racketService';
import { getStringById } from '@/services/stringCatalogService';
import { getSetupsByRacket } from '@/services/stringSetupService';
import { getRacketPhotoUrl } from '@/services/storageService';
import type {
  StringCatalogItem,
  UserRacket,
  UserStringSetup,
} from '@/types/database';
import { goBackOrReplace } from '@/utils/navigation';

export default function RacketDetailScreen() {
  const router = useRouter();
  const { from, id } = useLocalSearchParams<{ from?: string; id?: string }>();
  const { profile } = useAuth();
  const [racket, setRacket] = useState<UserRacket | null>(null);
  const [setup, setSetup] = useState<UserStringSetup | null>(null);
  const [mainString, setMainString] = useState<StringCatalogItem | null>(null);
  const [crossString, setCrossString] = useState<StringCatalogItem | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<string>();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const loadRacket = useCallback(async () => {
    if (!id) {
      setMessage('라켓 ID가 없습니다.');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const racketData = await getRacket(id);
      setRacket(racketData);

      // 스트링 셋업 조회 (로그인 사용자의 셋업만 로드)
      if (profile?.id) {
        const setups = await getSetupsByRacket(profile.id, id);
        const latestSetup = setups[0] ?? null;
        setSetup(latestSetup);

        if (latestSetup) {
          // 메인/크로스 스트링 상세 정보 조회
          const [main, cross] = await Promise.all([
            getStringById(latestSetup.main_string_id, { activeOnly: false }),
            latestSetup.is_hybrid
              ? getStringById(latestSetup.cross_string_id, {
                  activeOnly: false,
                })
              : Promise.resolve(null),
          ]);
          setMainString(main);
          setCrossString(cross);
        }
      }

      setMessage(undefined);
    } catch {
      setMessage('라켓 상세를 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [id, profile?.id]);

  useEffect(() => {
    loadRacket();
  }, [loadRacket]);

  const handleDeleteRacket = async () => {
    if (!id) {
      return;
    }

    try {
      await deleteRacket(id);
      setShowDeleteConfirm(false);
      router.replace('/racket-list');
    } catch {
      setShowDeleteConfirm(false);
      setMessage('라켓 삭제 실패');
    }
  };

  const handleSetPrimaryRacket = async () => {
    if (!id) {
      return;
    }

    try {
      await setPrimaryRacket(id);
      await loadRacket();
      setMessage('메인 라켓으로 설정되었습니다.');
    } catch {
      setMessage('메인 라켓 설정 실패');
    }
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen label="라켓 상세 불러오는 중" />;
  }

  if (!racket) {
    return (
      <View style={styles.container}>
        <View style={styles.titleRow}>
          <BackButton onPress={() => goBackOrReplace(router, '/racket-list', from)} />
          <Typography variant="h1">라켓 상세</Typography>
        </View>
        <Typography accessibilityRole="alert" variant="body" style={styles.muted}>
          {message ?? '라켓을 찾지 못했습니다.'}
        </Typography>
      </View>
    );
  }

  return (
    <RefreshableScrollView contentContainerStyle={styles.container}>
      <ConfirmDialog
        visible={showDeleteConfirm}
        title="라켓을 삭제할까요?"
        message={`${racket.brand} ${racket.model}`}
        confirmLabel="삭제"
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteRacket}
      />
      <View style={styles.header}>
        <BackButton onPress={() => goBackOrReplace(router, '/racket-list', from)} />
        <View style={styles.flex}>
          <Typography variant="h1">
            {racket.brand} {racket.model}
          </Typography>
          <Typography variant="caption" style={styles.muted}>
            등록일 {new Date(racket.created_at).toISOString().slice(0, 10)}
          </Typography>
        </View>
        <Badge variant={racket.is_primary ? 'success' : 'secondary'}>
          {racket.is_primary ? '메인 라켓' : '보조 라켓'}
        </Badge>
      </View>

      <View style={styles.actions}>
        <Button
          accessibilityLabel="라켓 수정"
          onPress={() =>
            router.push({
              pathname: '/rackets',
              params: { editId: racket.id },
            })
          }
          size="sm"
          variant="outline"
        >
          수정하기
        </Button>
        <Button
          accessibilityLabel="라켓 삭제"
          onPress={() => setShowDeleteConfirm(true)}
          size="sm"
          variant="outline"
        >
          삭제하기
        </Button>
        <Button
          accessibilityLabel="메인 라켓 설정"
          disabled={racket.is_primary}
          onPress={handleSetPrimaryRacket}
          size="sm"
          variant="outline"
        >
          메인 설정
        </Button>
      </View>

      {racket.photo_url ? (
        <Image
          accessibilityLabel={`${racket.brand} ${racket.model}`}
          resizeMode="cover"
          source={{ uri: getRacketPhotoUrl(racket.photo_url) ?? racket.photo_url }}
          style={styles.image}
        />
      ) : null}

      {/* 스펙 카드 */}
      <View style={styles.card}>
        <Typography variant="h2">스펙</Typography>
        <View style={styles.metaGrid}>
          <Meta label="그립" value={racket.grip_size ?? '-'} />
          <Meta label="무게" value={racket.weight === null ? '-' : `${racket.weight}g`} />
          <Meta label="밸런스" value={racket.balance ?? '-'} />
        </View>
      </View>

      {/* 스트링 정보 카드 */}
      <View style={styles.card}>
        <Typography variant="h2">스트링 정보</Typography>
        {setup && mainString ? (
          <View style={styles.metaGrid}>
            <Meta
              label="메인 스트링"
              value={`${mainString.brand} ${mainString.name}`}
            />
            <Meta label="메인 텐션" value={`${setup.tension_main} lb`} />
            {setup.is_hybrid && crossString ? (
              <>
                <Meta
                  label="크로스 스트링"
                  value={`${crossString.brand} ${crossString.name}`}
                />
                <Meta label="크로스 텐션" value={`${setup.tension_cross} lb`} />
              </>
            ) : null}
            {mainString.gauge ? (
              <Meta label="게이지" value={mainString.gauge} />
            ) : null}
            {setup.last_strung_at ? (
              <Meta
                label="마지막 스트링 날짜"
                value={new Date(setup.last_strung_at).toLocaleDateString('ko-KR')}
              />
            ) : null}
          </View>
        ) : (
          <Typography variant="body" style={styles.muted}>
            등록된 스트링 정보가 없습니다.{'\n'}
            <Typography variant="caption" style={styles.muted}>
              라켓 수정 화면에서 스트링을 선택해보세요.
            </Typography>
          </Typography>
        )}
      </View>

      {/* 메모 카드 */}
      {racket.memo ? (
        <View style={styles.card}>
          <Typography variant="h2">메모</Typography>
          <Typography variant="body">{racket.memo}</Typography>
        </View>
      ) : null}

      {message ? (
        <Typography accessibilityRole="alert" variant="caption" style={styles.muted}>
          {message}
        </Typography>
      ) : null}
    </RefreshableScrollView>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaItem}>
      <Typography variant="caption" style={styles.muted}>
        {label}
      </Typography>
      <Typography variant="body">{value}</Typography>
    </View>
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
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: theme.spacing[3],
    justifyContent: 'space-between',
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing[2],
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing[2],
  },
  image: {
    backgroundColor: lightColors.muted.hex,
    borderRadius: theme.borderRadius.lg,
    height: 220,
    width: '100%',
  },
  card: {
    backgroundColor: lightColors.card.hex,
    borderColor: lightColors.border.hex,
    borderRadius: theme.borderRadius.lg,
    borderWidth: theme.borderWidth.hairline,
    gap: theme.spacing[3],
    padding: theme.spacing[4],
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing[3],
  },
  metaItem: {
    backgroundColor: lightColors.background.hex,
    borderColor: lightColors.border.hex,
    borderRadius: theme.borderRadius.md,
    borderWidth: theme.borderWidth.hairline,
    gap: theme.spacing[1],
    minWidth: 96,
    padding: theme.spacing[3],
  },
  flex: {
    flex: 1,
  },
  muted: {
    color: lightColors.mutedForeground.hex,
  },
});
