import React, { useCallback, useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image, StyleSheet, View } from 'react-native';

import { Badge } from '@/components/Badge';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { BackButton } from '@/components/MobileUI';
import { RefreshableScrollView } from '@/components/PageRefresh';
import { Typography } from '@/components/Typography';
import { lightColors, theme } from '@/constants/theme';
import { getStringById } from '@/services/stringCatalogService';
import { getStringPhotoUrl } from '@/services/storageService';
import type { StringCatalogItem } from '@/types/database';
import { goBackOrReplace } from '@/utils/navigation';

const formatPrice = (price: number | null) =>
  price === null ? '가격 미정' : `KRW ${price.toLocaleString()}`;

export default function StringDetailScreen() {
  const router = useRouter();
  const { from, id } = useLocalSearchParams<{ from?: string; id?: string }>();
  const [item, setItem] = useState<StringCatalogItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<string>();

  const loadString = useCallback(async () => {
    if (!id) {
      setMessage('스트링 ID가 없습니다.');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setItem(await getStringById(id));
      setMessage(undefined);
    } catch {
      setMessage('스트링 상세를 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadString();
  }, [loadString]);

  if (isLoading) {
    return <LoadingSpinner fullScreen label="스트링 상세 불러오는 중" />;
  }

  if (!item) {
    return (
      <View style={styles.container}>
        <View style={styles.titleRow}>
          <BackButton
            onPress={() => goBackOrReplace(router, '/string-catalog', from)}
          />
          <Typography variant="h1">스트링 상세</Typography>
        </View>
        <Typography accessibilityRole="alert" variant="body" style={styles.muted}>
          {message ?? '스트링을 찾지 못했습니다.'}
        </Typography>
      </View>
    );
  }

  return (
    <RefreshableScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <BackButton
          onPress={() => goBackOrReplace(router, '/string-catalog', from)}
        />
        <View style={styles.flex}>
          <Typography variant="h1">
            {item.brand} {item.name}
          </Typography>
          <Typography variant="body" style={styles.price}>
            {formatPrice(item.price)}
          </Typography>
        </View>
        <Badge variant={item.is_active ? 'success' : 'outline'}>
          {item.is_active ? '판매 중' : '비활성'}
        </Badge>
      </View>

      {item.image_url ? (
        <Image
          accessibilityLabel={`${item.brand} ${item.name}`}
          resizeMode="cover"
          source={{ uri: getStringPhotoUrl(item.image_url) ?? item.image_url }}
          style={styles.image}
        />
      ) : null}

      <View style={styles.card}>
        <Typography variant="h2">상세 정보</Typography>
        <View style={styles.metaGrid}>
          <Meta label="게이지" value={item.gauge ?? '-'} />
          <Meta label="색상" value={item.color ?? '-'} />
          <Meta label="스타일" value={item.recommended_style ?? '-'} />
        </View>
      </View>

      <View style={styles.card}>
        <Typography variant="h2">설명</Typography>
        <Typography variant="body">{item.description ?? '등록된 설명이 없습니다.'}</Typography>
      </View>
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
  price: {
    color: lightColors.primary.hex,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  muted: {
    color: lightColors.mutedForeground.hex,
  },
});
