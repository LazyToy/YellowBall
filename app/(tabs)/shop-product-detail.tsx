import React, { useCallback, useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Text } from '@/components/AppText';
import { Badge } from '@/components/Badge';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { BackButton } from '@/components/MobileUI';
import { RefreshableScrollView } from '@/components/PageRefresh';
import { Typography } from '@/components/Typography';
import { lightColors, theme } from '@/constants/theme';
import {
  getActiveShopProductById,
  type ShopProduct,
} from '@/services/shopProductService';
import { getAppAssetUrl } from '@/services/storageService';
import { goBackOrReplace } from '@/utils/navigation';

const formatPrice = (value: number) => `${value.toLocaleString('ko-KR')}원`;

export default function ShopProductDetailScreen() {
  const router = useRouter();
  const { from, id } = useLocalSearchParams<{ from?: string; id?: string }>();
  const [product, setProduct] = useState<ShopProduct | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<string>();

  const loadProduct = useCallback(async () => {
    if (!id) {
      setMessage('상품 ID가 없습니다.');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setProduct(await getActiveShopProductById(id));
      setMessage(undefined);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : '상품 상세를 불러오지 못했습니다.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadProduct();
  }, [loadProduct]);

  if (isLoading) {
    return <LoadingSpinner fullScreen label="상품 상세 불러오는 중" />;
  }

  if (!product) {
    return (
      <View style={styles.container}>
        <View style={styles.titleRow}>
          <BackButton onPress={() => goBackOrReplace(router, '/shop', from)} />
          <Typography variant="h1">상품 상세</Typography>
        </View>
        <Typography accessibilityRole="alert" variant="body" style={styles.muted}>
          {message ?? '상품을 찾지 못했습니다.'}
        </Typography>
      </View>
    );
  }

  const imageUrl = getAppAssetUrl(product.image_path ?? product.image_url);
  const discount =
    product.price > 0 ? Math.round((1 - product.sale / product.price) * 100) : 0;
  const detailTitle = `${product.category} 상세`;

  return (
    <RefreshableScrollView contentContainerStyle={styles.container}>
      <View style={styles.topRow}>
        <BackButton onPress={() => goBackOrReplace(router, '/shop', from)} />
        <Typography variant="caption" style={styles.muted}>
          {detailTitle}
        </Typography>
      </View>

      {imageUrl ? (
        <Image
          accessibilityLabel={product.name}
          resizeMode="cover"
          source={{ uri: imageUrl }}
          style={styles.image}
        />
      ) : null}

      <View style={styles.card}>
        <View style={styles.titleRow}>
          <View style={styles.flex}>
            <Typography variant="h1">{product.name}</Typography>
            <Typography variant="caption" style={styles.muted}>
              {product.category}
            </Typography>
          </View>
          {product.tag ? <Badge variant="secondary">{product.tag}</Badge> : null}
        </View>
        <View style={styles.priceRow}>
          {discount > 0 ? <Text style={styles.discount}>{discount}%</Text> : null}
          <Text style={styles.salePrice}>{formatPrice(product.sale)}</Text>
        </View>
        {product.price !== product.sale ? (
          <Text style={styles.originalPrice}>{formatPrice(product.price)}</Text>
        ) : null}
      </View>

      <View style={styles.card}>
        <Typography variant="h2">상품 정보</Typography>
        <Meta label="평점" value={product.rating.toFixed(1)} />
        <Meta label="리뷰" value={`${product.reviews.toLocaleString('ko-KR')}개`} />
      </View>
    </RefreshableScrollView>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaRow}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: lightColors.background.hex,
    flexGrow: 1,
    gap: theme.spacing[4],
    padding: theme.spacing[5],
  },
  image: {
    backgroundColor: lightColors.muted.hex,
    borderRadius: theme.borderRadius.lg,
    height: 260,
    width: '100%',
  },
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing[2],
  },
  card: {
    backgroundColor: lightColors.card.hex,
    borderColor: lightColors.border.hex,
    borderRadius: theme.borderRadius.lg,
    borderWidth: theme.borderWidth.hairline,
    gap: theme.spacing[3],
    padding: theme.spacing[4],
  },
  titleRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: theme.spacing[3],
  },
  priceRow: {
    alignItems: 'baseline',
    flexDirection: 'row',
    gap: theme.spacing[2],
  },
  discount: {
    color: lightColors.destructive.hex,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 13,
    fontWeight: theme.typography.fontWeight.bold,
  },
  salePrice: {
    color: lightColors.foreground.hex,
    fontFamily: theme.typography.fontFamily.display,
    fontSize: 24,
    fontWeight: theme.typography.fontWeight.bold,
  },
  originalPrice: {
    color: lightColors.mutedForeground.hex,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 12,
    textDecorationLine: 'line-through',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaLabel: {
    color: lightColors.mutedForeground.hex,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 13,
  },
  metaValue: {
    color: lightColors.foreground.hex,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 13,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  flex: {
    flex: 1,
    minWidth: 0,
  },
  muted: {
    color: lightColors.mutedForeground.hex,
  },
});
