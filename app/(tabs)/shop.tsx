import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  GestureResponderEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';

import { AppIcon } from '@/components/AppIcon';
import {
  AppScrollView,
  Card,
  PageHeader,
  ProductThumb,
  RowButton,
  SectionHeader,
} from '@/components/MobileUI';
import { lightColors, theme } from '@/constants/theme';
import { useResetOnBlur } from '@/hooks/useResetOnBlur';
import {
  getAppContentBlocks,
  type ShopSaleBanner,
} from '@/services/appContentService';
import {
  getActiveShopProducts,
  type ShopProduct,
} from '@/services/shopProductService';
import { getAppAssetUrl } from '@/services/storageService';
import {
  toggleShopWishlistItem,
  useShopWishlist,
} from '@/stores/shopWishlistStore';

const formatPrice = (value: number) => value.toLocaleString('ko-KR');
const removedShopCategories = new Set(['가방', '가발', '의류', '신발']);

const isVisibleShopCategory = (category: string) =>
  !removedShopCategories.has(category);

export default function ShopScreen() {
  const router = useRouter();
  const { width: windowWidth } = useWindowDimensions();
  const [activeFilter, setActiveFilter] = useState('');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<string[]>([]);
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [saleBanner, setSaleBanner] = useState<ShopSaleBanner | null>(null);
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  const [saleOnly, setSaleOnly] = useState(false);
  const [message, setMessage] = useState<string>();
  const wishlistItems = useShopWishlist();

  const resetForm = useCallback(() => {
    setSearch('');
    setActiveFilter(filters[0] || '');
    setShowFilterOptions(false);
    setSaleOnly(false);
    setMessage(undefined);
  }, [filters]);

  useResetOnBlur(resetForm);

  useEffect(() => {
    let mounted = true;

    Promise.all([
      getAppContentBlocks(['shop_filters', 'shop_sale_banner']),
      getActiveShopProducts(),
    ])
      .then(([blocks, nextProducts]) => {
        if (!mounted) {
          return;
        }

        const nextFilters = (blocks.shop_filters ?? []).filter(isVisibleShopCategory);
        setFilters(nextFilters);
        setProducts(nextProducts.filter((product) => isVisibleShopCategory(product.category)));
        setSaleBanner(blocks.shop_sale_banner ?? null);
        setActiveFilter((current) => current || nextFilters[0] || '');
      })
      .catch((error) => {
        if (mounted) {
          setMessage(
            error instanceof Error
              ? error.message
              : '상품 데이터를 불러오지 못했습니다.',
          );
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const filteredProducts = useMemo(() => {
    const firstFilter = filters[0];
    const searchTerm = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesFilter =
        !activeFilter ||
        activeFilter === firstFilter ||
        product.category === activeFilter;
      const matchesSearch =
        !searchTerm ||
        product.name.toLowerCase().includes(searchTerm) ||
        product.category.toLowerCase().includes(searchTerm);
      const matchesSale = !saleOnly || product.sale < product.price;

      return matchesFilter && matchesSearch && matchesSale;
    });
  }, [activeFilter, filters, products, saleOnly, search]);

  const favoriteIds = useMemo(
    () => new Set(wishlistItems.map((item) => item.id)),
    [wishlistItems],
  );

  const productCardWidth = useMemo(() => {
    const sectionHorizontalPadding = theme.spacing[5] * 2;
    const cardGap = theme.spacing[3];
    const gridWidth = Math.max(0, windowWidth - sectionHorizontalPadding);

    return Math.max(0, Math.floor((gridWidth - cardGap) / 2));
  }, [windowWidth]);

  const handleWishlistPress = (
    event: GestureResponderEvent | undefined,
    product: ShopProduct,
  ) => {
    event?.stopPropagation();
    toggleShopWishlistItem(product);
  };

  return (
    <AppScrollView contentContainerStyle={styles.content}>
      <PageHeader
        title="샵"
        right={
          <Pressable
            accessibilityLabel="장바구니"
            accessibilityRole="button"
            onPress={() => router.push('/shop-wishlist')}
            style={({ pressed }) => [
              styles.cartButton,
              pressed && styles.pressed,
            ]}
          >
            <AppIcon name="shopping-cart" size={19} />
            {wishlistItems.length > 0 ? (
              <View style={styles.cartCount}>
                <Text style={styles.cartCountText}>{wishlistItems.length}</Text>
              </View>
            ) : null}
          </Pressable>
        }
      />

      <View style={styles.searchSection}>
        <View style={styles.searchBox}>
          <AppIcon
            color={lightColors.mutedForeground.hex}
            name="search"
            size={18}
          />
          <TextInput
            accessibilityLabel="상품 검색"
            onChangeText={setSearch}
            placeholder="라켓, 스트링 검색"
            placeholderTextColor={lightColors.mutedForeground.hex}
            style={styles.searchInput}
            value={search}
          />
        </View>
        <Pressable
          accessibilityLabel="필터"
          accessibilityRole="button"
          accessibilityState={{ expanded: showFilterOptions }}
          onPress={() => setShowFilterOptions((current) => !current)}
          style={({ pressed }) => [
            styles.filterButton,
            showFilterOptions && styles.filterButtonActive,
            pressed && styles.pressed,
          ]}
        >
          <AppIcon name="sliders-horizontal" size={19} />
        </Pressable>
      </View>

      {showFilterOptions ? (
        <View style={styles.filterOptions}>
          <Pressable
            accessibilityLabel="할인 상품만 보기"
            accessibilityRole="button"
            accessibilityState={{ selected: saleOnly }}
            onPress={() => setSaleOnly((current) => !current)}
            style={({ pressed }) => [
              styles.filterOption,
              saleOnly && styles.filterOptionActive,
              pressed && styles.pressed,
            ]}
          >
            <Text
              style={[
                styles.filterOptionText,
                saleOnly && styles.filterOptionTextActive,
              ]}
            >
              할인 상품
            </Text>
          </Pressable>
        </View>
      ) : null}

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.filterList}>
          {filters.map((filter) => {
            const active = filter === activeFilter;

            return (
              <Pressable
                accessibilityLabel={`${filter} 필터`}
                accessibilityRole="button"
                key={filter}
                onPress={() => setActiveFilter(filter)}
                style={[styles.filterPill, active && styles.filterPillActive]}
              >
                <Text
                  style={[styles.filterText, active && styles.filterTextActive]}
                >
                  {filter}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {saleBanner ? (
        <View style={styles.section}>
          <Card style={styles.featuredCard}>
            <View style={styles.featuredText}>
              <Text style={styles.saleMeta}>{saleBanner.meta}</Text>
              <Text style={styles.saleTitle}>{saleBanner.title}</Text>
              <Text style={styles.saleSub}>{saleBanner.subtitle}</Text>
              <Pressable
                accessibilityLabel={saleBanner.buttonLabel}
                accessibilityRole="button"
                style={styles.saleButton}
              >
                <Text style={styles.saleButtonText}>
                  {saleBanner.buttonLabel}
                </Text>
              </Pressable>
            </View>
            <View style={styles.featuredThumb}>
              <ProductThumb
                imageUrl={getAppAssetUrl(
                  saleBanner.image_path ?? saleBanner.image_url,
                )}
                label={saleBanner.thumbLabel}
                tone="accent"
              />
            </View>
          </Card>
        </View>
      ) : null}

      <View style={styles.section}>
        <SectionHeader
          title="전체 상품"
          caption={`${filteredProducts.length}개`}
        />
        {message ? <Text style={styles.messageText}>{message}</Text> : null}
        <View style={styles.productGrid}>
          {filteredProducts.map((product) => {
            const discount = Math.round(
              (1 - product.sale / product.price) * 100,
            );
            const selected = favoriteIds.has(product.id);

            return (
              <RowButton
                accessibilityLabel={`${product.name} 보기`}
                key={product.id}
                onPress={() => {
                  router.push({
                    pathname: '/shop-product-detail',
                    params: { from: '/shop', id: product.id },
                  });
                }}
                style={[styles.productCard, { width: productCardWidth }]}
              >
                <View style={styles.thumbWrap}>
                  <ProductThumb
                    imageUrl={getAppAssetUrl(
                      product.image_path ?? product.image_url,
                    )}
                    label={product.category}
                    tone={product.tone}
                  />
                  <Pressable
                    accessibilityLabel={`${product.name} 찜`}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={(event) => handleWishlistPress(event, product)}
                    style={[
                      styles.heartButton,
                      selected && styles.heartButtonActive,
                    ]}
                  >
                    <AppIcon
                      color={
                        selected
                          ? lightColors.destructive.hex
                          : lightColors.mutedForeground.hex
                      }
                      name="heart"
                      size={15}
                    />
                  </Pressable>
                  {product.tag ? (
                    <View style={styles.productTag}>
                      <Text style={styles.productTagText}>{product.tag}</Text>
                    </View>
                  ) : null}
                </View>
                <View style={styles.productInfo}>
                  <Text style={styles.productCategory}>{product.category}</Text>
                  <Text numberOfLines={2} style={styles.productName}>
                    {product.name}
                  </Text>
                  <View style={styles.priceRow}>
                    <Text style={styles.discountText}>{discount}%</Text>
                    <Text style={styles.salePrice}>
                      {formatPrice(product.sale)}원
                    </Text>
                  </View>
                  <View style={styles.ratingRow}>
                    <AppIcon
                      color={lightColors.accent.hex}
                      name="star"
                      size={12}
                    />
                    <Text style={styles.ratingValue}>{product.rating}</Text>
                    <Text style={styles.reviewText}>({product.reviews})</Text>
                  </View>
                </View>
              </RowButton>
            );
          })}
        </View>
        {!message && filteredProducts.length === 0 ? (
          <Text style={styles.messageText}>표시할 상품이 없습니다.</Text>
        ) : null}
      </View>
    </AppScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: theme.spacing[4],
  },
  cartButton: {
    alignItems: 'center',
    borderRadius: 999,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  cartCount: {
    alignItems: 'center',
    backgroundColor: lightColors.accent.hex,
    borderRadius: 999,
    minWidth: 16,
    paddingHorizontal: 4,
    position: 'absolute',
    right: 2,
    top: 4,
  },
  cartCountText: {
    color: lightColors.accentForeground.hex,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 10,
    fontWeight: theme.typography.fontWeight.bold,
  },
  searchSection: {
    flexDirection: 'row',
    gap: theme.spacing[2],
    paddingHorizontal: theme.spacing[5],
  },
  searchBox: {
    alignItems: 'center',
    backgroundColor: lightColors.secondary.hex,
    borderRadius: 999,
    flex: 1,
    flexDirection: 'row',
    gap: theme.spacing[2],
    height: 44,
    paddingHorizontal: theme.spacing[4],
  },
  searchInput: {
    color: lightColors.foreground.hex,
    flex: 1,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 14,
  },
  filterButton: {
    alignItems: 'center',
    backgroundColor: lightColors.card.hex,
    borderColor: lightColors.border.hex,
    borderRadius: 999,
    borderWidth: theme.borderWidth.hairline,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  filterButtonActive: {
    backgroundColor: lightColors.primary.hex,
    borderColor: lightColors.primary.hex,
  },
  filterOptions: {
    flexDirection: 'row',
    gap: theme.spacing[2],
    paddingHorizontal: theme.spacing[5],
  },
  filterOption: {
    alignItems: 'center',
    backgroundColor: lightColors.card.hex,
    borderColor: lightColors.border.hex,
    borderRadius: 999,
    borderWidth: theme.borderWidth.hairline,
    height: 34,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing[4],
  },
  filterOptionActive: {
    backgroundColor: lightColors.primary.hex,
    borderColor: lightColors.primary.hex,
  },
  filterOptionText: {
    color: lightColors.foreground.hex,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 12,
    fontWeight: theme.typography.fontWeight.medium,
  },
  filterOptionTextActive: {
    color: lightColors.primaryForeground.hex,
  },
  filterList: {
    flexDirection: 'row',
    gap: theme.spacing[2],
    paddingHorizontal: theme.spacing[5],
  },
  filterPill: {
    backgroundColor: lightColors.card.hex,
    borderColor: lightColors.border.hex,
    borderRadius: 999,
    borderWidth: theme.borderWidth.hairline,
    height: 32,
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  filterPillActive: {
    backgroundColor: lightColors.primary.hex,
    borderColor: lightColors.primary.hex,
  },
  filterText: {
    color: lightColors.foreground.hex,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 12,
    fontWeight: theme.typography.fontWeight.medium,
  },
  filterTextActive: {
    color: lightColors.primaryForeground.hex,
  },
  section: {
    gap: theme.spacing[3],
    paddingHorizontal: theme.spacing[5],
  },
  featuredCard: {
    backgroundColor: lightColors.primary.hex,
    borderColor: lightColors.primary.hex,
    flexDirection: 'row',
    overflow: 'hidden',
    padding: theme.spacing[5],
  },
  featuredText: {
    flex: 1,
    gap: theme.spacing[2],
    minWidth: 0,
    zIndex: 1,
  },
  saleMeta: {
    color: lightColors.accent.hex,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 11,
    fontWeight: theme.typography.fontWeight.bold,
  },
  saleTitle: {
    color: lightColors.primaryForeground.hex,
    fontFamily: theme.typography.fontFamily.display,
    fontSize: 20,
    fontWeight: theme.typography.fontWeight.bold,
    lineHeight: 26,
  },
  saleSub: {
    color: 'rgba(252,250,244,0.82)',
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 12,
    lineHeight: 17,
  },
  saleButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: lightColors.accent.hex,
    borderRadius: 999,
    height: 32,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing[4],
  },
  saleButtonText: {
    color: lightColors.accentForeground.hex,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 12,
    fontWeight: theme.typography.fontWeight.bold,
  },
  featuredThumb: {
    bottom: -30,
    height: 148,
    opacity: 0.94,
    position: 'absolute',
    right: -22,
    width: 148,
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  messageText: {
    color: lightColors.mutedForeground.hex,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 12,
  },
  productCard: {
    alignItems: 'stretch',
    backgroundColor: lightColors.card.hex,
    borderColor: lightColors.border.hex,
    borderRadius: theme.borderRadius.lg,
    borderWidth: theme.borderWidth.hairline,
    flexDirection: 'column',
    marginBottom: theme.spacing[3],
    overflow: 'hidden',
  },
  thumbWrap: {
    position: 'relative',
  },
  heartButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 999,
    height: 28,
    justifyContent: 'center',
    position: 'absolute',
    right: theme.spacing[2],
    top: theme.spacing[2],
    width: 28,
  },
  heartButtonActive: {
    backgroundColor: lightColors.card.hex,
  },
  productTag: {
    backgroundColor: lightColors.primary.hex,
    borderRadius: theme.borderRadius.sm,
    left: theme.spacing[2],
    paddingHorizontal: theme.spacing[2],
    paddingVertical: 3,
    position: 'absolute',
    top: theme.spacing[2],
  },
  productTagText: {
    color: lightColors.primaryForeground.hex,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 10,
    fontWeight: theme.typography.fontWeight.bold,
  },
  productInfo: {
    gap: theme.spacing[1],
    padding: theme.spacing[3],
  },
  productCategory: {
    color: lightColors.mutedForeground.hex,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 10,
  },
  productName: {
    color: lightColors.foreground.hex,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 12,
    fontWeight: theme.typography.fontWeight.semibold,
    lineHeight: 16,
    minHeight: 32,
  },
  priceRow: {
    alignItems: 'baseline',
    flexDirection: 'row',
    gap: theme.spacing[1],
    marginTop: theme.spacing[1],
  },
  discountText: {
    color: lightColors.destructive.hex,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 10,
    fontWeight: theme.typography.fontWeight.bold,
  },
  salePrice: {
    color: lightColors.foreground.hex,
    fontFamily: theme.typography.fontFamily.display,
    fontSize: 14,
    fontWeight: theme.typography.fontWeight.bold,
  },
  ratingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 3,
  },
  ratingValue: {
    color: lightColors.foreground.hex,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 10,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  reviewText: {
    color: lightColors.mutedForeground.hex,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 10,
  },
  pressed: {
    opacity: theme.opacity.pressed,
  },
});
