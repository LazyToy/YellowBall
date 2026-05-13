import React, { useState } from 'react';
import {
  GestureResponderEvent,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import { Text } from '@/components/AppText';
import { AppIcon } from '@/components/AppIcon';
import { FeedbackDialog } from '@/components/FeedbackDialog';
import {
  AppScrollView,
  PageHeader,
  ProductThumb,
  RowButton,
  SectionHeader,
} from '@/components/MobileUI';
import { lightColors, theme } from '@/constants/theme';
import { getAppAssetUrl } from '@/services/storageService';
import {
  removeShopWishlistItem,
  useShopWishlist,
} from '@/stores/shopWishlistStore';
import { goBackOrReplace } from '@/utils/navigation';

const formatPrice = (value: number) => value.toLocaleString('ko-KR');

export default function ShopWishlistScreen() {
  const router = useRouter();
  const wishlistItems = useShopWishlist();
  const [successDialog, setSuccessDialog] = useState<{
    title: string;
    message?: string;
  } | null>(null);

  const handleRemove = (event: GestureResponderEvent | undefined, id: string) => {
    event?.stopPropagation();
    removeShopWishlistItem(id);
    setSuccessDialog({
      title: '찜 목록에서 해제되었습니다',
      message: '확인을 누르면 찜 목록을 확인할 수 있습니다.',
    });
  };

  return (
    <AppScrollView contentContainerStyle={styles.content}>
      <FeedbackDialog
        visible={successDialog !== null}
        title={successDialog?.title ?? ''}
        message={successDialog?.message}
        onConfirm={() => setSuccessDialog(null)}
      />
      <PageHeader
        back
        onBack={() => goBackOrReplace(router, '/shop')}
        title="찜한 상품"
        right={
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{wishlistItems.length}개</Text>
          </View>
        }
      />

      <View style={styles.section}>
        <SectionHeader
          title="찜 목록"
          caption="장바구니 버튼에서 모아 보는 상품입니다"
        />

        {wishlistItems.length === 0 ? (
          <Text accessibilityRole="alert" style={styles.messageText}>
            아직 찜한 상품이 없습니다.
          </Text>
        ) : (
          <View style={styles.list}>
            {wishlistItems.map((item) => {
              const discount =
                item.price > 0
                  ? Math.round((1 - item.sale / item.price) * 100)
                  : 0;

              return (
                <RowButton
                  accessibilityLabel={`${item.name} 보기`}
                  key={item.id}
                  onPress={() => {
                    router.push({
                      pathname: '/shop-product-detail',
                      params: { from: '/shop-wishlist', id: item.id },
                    });
                  }}
                  style={styles.productRow}
                >
                  <View style={styles.thumb}>
                    <ProductThumb
                      imageUrl={getAppAssetUrl(
                        item.image_path ?? item.image_url,
                      )}
                      label={item.category}
                      tone={item.tone}
                    />
                  </View>
                  <View style={styles.productInfo}>
                    <Text style={styles.productCategory}>{item.category}</Text>
                    <Text numberOfLines={2} style={styles.productName}>
                      {item.name}
                    </Text>
                    <View style={styles.priceRow}>
                      {discount > 0 ? (
                        <Text style={styles.discountText}>{discount}%</Text>
                      ) : null}
                      <Text style={styles.salePrice}>
                        {formatPrice(item.sale)}원
                      </Text>
                    </View>
                  </View>
                  <Pressable
                    accessibilityLabel={`${item.name} 찜 해제`}
                    accessibilityRole="button"
                    onPress={(event) => handleRemove(event, item.id)}
                    style={({ pressed }) => [
                      styles.removeButton,
                      pressed && styles.pressed,
                    ]}
                  >
                    <AppIcon
                      color={lightColors.destructive.hex}
                      name="heart"
                      size={18}
                    />
                  </Pressable>
                </RowButton>
              );
            })}
          </View>
        )}
      </View>
    </AppScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: theme.spacing[4],
  },
  countBadge: {
    alignItems: 'center',
    backgroundColor: lightColors.secondary.hex,
    borderRadius: 999,
    height: 30,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing[3],
  },
  countBadgeText: {
    color: lightColors.secondaryForeground.hex,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 12,
    fontWeight: theme.typography.fontWeight.bold,
  },
  section: {
    gap: theme.spacing[3],
    paddingHorizontal: theme.spacing[5],
  },
  list: {
    gap: theme.spacing[3],
  },
  productRow: {
    alignItems: 'center',
    backgroundColor: lightColors.card.hex,
    borderColor: lightColors.border.hex,
    borderRadius: theme.borderRadius.lg,
    borderWidth: theme.borderWidth.hairline,
    gap: theme.spacing[3],
    padding: theme.spacing[3],
  },
  thumb: {
    width: 72,
  },
  productInfo: {
    flex: 1,
    gap: theme.spacing[1],
    minWidth: 0,
  },
  productCategory: {
    color: lightColors.mutedForeground.hex,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 11,
  },
  productName: {
    color: lightColors.foreground.hex,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 14,
    fontWeight: theme.typography.fontWeight.semibold,
    lineHeight: 18,
  },
  priceRow: {
    alignItems: 'baseline',
    flexDirection: 'row',
    gap: theme.spacing[1],
  },
  discountText: {
    color: lightColors.destructive.hex,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 11,
    fontWeight: theme.typography.fontWeight.bold,
  },
  salePrice: {
    color: lightColors.foreground.hex,
    fontFamily: theme.typography.fontFamily.display,
    fontSize: 15,
    fontWeight: theme.typography.fontWeight.bold,
  },
  removeButton: {
    alignItems: 'center',
    backgroundColor: lightColors.secondary.hex,
    borderRadius: 999,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  messageText: {
    color: lightColors.mutedForeground.hex,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 13,
    lineHeight: 18,
  },
  pressed: {
    opacity: theme.opacity.pressed,
  },
});
