import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import {
  Image,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { BackButton } from '@/components/MobileUI';
import { RefreshableScrollView } from '@/components/PageRefresh';
import { Typography } from '@/components/Typography';
import { lightColors, theme } from '@/constants/theme';
import { useResetOnBlur } from '@/hooks/useResetOnBlur';
import {
  getActiveStrings,
  getStringById,
  type StringCatalogFilters,
} from '@/services/stringCatalogService';
import { getStringPhotoUrl } from '@/services/storageService';
import type { StringCatalogItem } from '@/types/database';
import { goBackOrReplace } from '@/utils/navigation';

type FilterKey = 'brand' | 'gauge' | 'recommendedStyle';

const uniqueValues = (
  items: StringCatalogItem[],
  field: keyof Pick<StringCatalogItem, 'brand' | 'gauge' | 'recommended_style'>,
) =>
  Array.from(
    new Set(
      items
        .map((item) => item[field])
        .filter((value): value is string => Boolean(value)),
    ),
  ).sort((a, b) => a.localeCompare(b));

const formatPrice = (price: number | null) =>
  price === null ? 'Price not set' : `KRW ${price.toLocaleString()}`;

export default function StringCatalogScreen() {
  const router = useRouter();
  const [allStrings, setAllStrings] = useState<StringCatalogItem[]>([]);
  const [strings, setStrings] = useState<StringCatalogItem[]>([]);
  const [selectedString, setSelectedString] = useState<StringCatalogItem | null>(
    null,
  );
  const [search, setSearch] = useState('');
  const [brand, setBrand] = useState('');
  const [gauge, setGauge] = useState('');
  const [recommendedStyle, setRecommendedStyle] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<string>();

  const loadAllStrings = useCallback(async () => {
    const activeStrings = await getActiveStrings();
    setAllStrings(activeStrings);
    setStrings(activeStrings);
  }, []);

  useEffect(() => {
    loadAllStrings()
      .catch(() => setMessage('Could not load string catalog.'))
      .finally(() => setIsLoading(false));
  }, [loadAllStrings]);

  useEffect(() => {
    let isCurrent = true;

    const filters: StringCatalogFilters = {
      search,
      brand,
      gauge,
      recommendedStyle,
    };

    setIsLoading(true);
    getActiveStrings(filters)
      .then((items) => {
        if (isCurrent) {
          setStrings(items);
          setSelectedString((selected) =>
            selected && items.some((item) => item.id === selected.id)
              ? selected
              : null,
          );
        }
      })
      .catch(() => {
        if (isCurrent) {
          setMessage('Could not search string catalog.');
        }
      })
      .finally(() => {
        if (isCurrent) {
          setIsLoading(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [brand, gauge, recommendedStyle, search]);

  const filterOptions = useMemo(
    () => ({
      brands: uniqueValues(allStrings, 'brand'),
      gauges: uniqueValues(allStrings, 'gauge'),
      styles: uniqueValues(allStrings, 'recommended_style'),
    }),
    [allStrings],
  );

  const hasFilters = Boolean(search.trim() || brand || gauge || recommendedStyle);

  const setFilter = (key: FilterKey, value: string) => {
    const applyValue = (current: string) => (current === value ? '' : value);

    if (key === 'brand') {
      setBrand(applyValue);
    }

    if (key === 'gauge') {
      setGauge(applyValue);
    }

    if (key === 'recommendedStyle') {
      setRecommendedStyle(applyValue);
    }
  };

  const openDetail = async (id: string) => {
    try {
      setMessage(undefined);
      setSelectedString(await getStringById(id));
      router.push({
        pathname: '/string-detail',
        params: { from: '/string-catalog', id },
      });
    } catch {
      setMessage('This string is no longer available.');
    }
  };

  const clearFilters = useCallback(() => {
    setSearch('');
    setBrand('');
    setGauge('');
    setRecommendedStyle('');
    setSelectedString(null);
  }, []);

  const resetForm = useCallback(() => {
    clearFilters();
    setMessage(undefined);
  }, [clearFilters]);

  useResetOnBlur(resetForm);

  return (
    <RefreshableScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <BackButton onPress={() => goBackOrReplace(router, '/shop')} />
          <Typography variant="h1">String Catalog</Typography>
        </View>
        <Typography variant="body" style={styles.description}>
          Browse active strings by brand, gauge, and playing style.
        </Typography>
      </View>

      <View style={styles.toolbar}>
        <Input
          label="Search"
          onChangeText={setSearch}
          placeholder="Brand or string name"
          returnKeyType="search"
          value={search}
        />

        <FilterGroup
          label="Brand"
          options={filterOptions.brands}
          selectedValue={brand}
          onSelect={(value) => setFilter('brand', value)}
        />
        <FilterGroup
          label="Gauge"
          options={filterOptions.gauges}
          selectedValue={gauge}
          onSelect={(value) => setFilter('gauge', value)}
        />
        <FilterGroup
          label="Style"
          options={filterOptions.styles}
          selectedValue={recommendedStyle}
          onSelect={(value) => setFilter('recommendedStyle', value)}
        />

        {hasFilters ? (
          <Button onPress={clearFilters} variant="outline">
            Clear filters
          </Button>
        ) : null}
      </View>

      {message ? (
        <Typography accessibilityRole="alert" variant="caption" style={styles.message}>
          {message}
        </Typography>
      ) : null}

      {selectedString ? <StringDetail item={selectedString} /> : null}

      <View style={styles.list}>
        {strings.length === 0 && !isLoading ? (
          <View style={styles.emptyState}>
            <Typography variant="h2">No strings found</Typography>
            <Typography variant="body" style={styles.description}>
              Try a different brand, gauge, style, or search term.
            </Typography>
          </View>
        ) : null}

        {strings.map((item) => (
          <Pressable
            accessibilityRole="button"
            key={item.id}
            onPress={() => openDetail(item.id)}
            style={({ pressed }) => [
              styles.card,
              selectedString?.id === item.id && styles.selectedCard,
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.rowBetween}>
              <View style={styles.flex}>
                <Typography variant="h2">
                  {item.brand} {item.name}
                </Typography>
                <Typography variant="caption">
                  {item.gauge ?? 'Gauge not set'} / {item.color ?? 'Color not set'}
                </Typography>
              </View>
              {item.recommended_style ? (
                <Badge variant="secondary">{item.recommended_style}</Badge>
              ) : null}
            </View>
            <Typography variant="body" style={styles.price}>
              {formatPrice(item.price)}
            </Typography>
            {item.image_url ? (
              <Image
                accessibilityLabel={`${item.brand} ${item.name}`}
                resizeMode="cover"
                source={{
                  uri: getStringPhotoUrl(item.image_url) ?? item.image_url,
                }}
                style={styles.cardImage}
              />
            ) : null}
            {item.description ? (
              <Typography variant="caption" numberOfLines={2}>
                {item.description}
              </Typography>
            ) : null}
          </Pressable>
        ))}
      </View>
    </RefreshableScrollView>
  );
}

type FilterGroupProps = {
  label: string;
  options: string[];
  selectedValue: string;
  onSelect: (value: string) => void;
};

function FilterGroup({
  label,
  options,
  selectedValue,
  onSelect,
}: FilterGroupProps) {
  if (options.length === 0) {
    return null;
  }

  return (
    <View style={styles.filterGroup}>
      <Typography variant="caption">{label}</Typography>
      <View style={styles.chipRow}>
        {options.map((option) => {
          const selected = selectedValue === option;

          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected }}
              key={option}
              onPress={() => onSelect(option)}
              style={({ pressed }) => [
                styles.chip,
                selected && styles.chipSelected,
                pressed && styles.pressed,
              ]}
            >
              <Typography
                variant="caption"
                style={[styles.chipText, selected && styles.chipTextSelected]}
              >
                {option}
              </Typography>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function StringDetail({ item }: { item: StringCatalogItem }) {
  return (
    <View style={styles.detail}>
      <View style={styles.rowBetween}>
        <View style={styles.flex}>
          <Typography variant="h2">
            {item.brand} {item.name}
          </Typography>
          <Typography variant="caption">{formatPrice(item.price)}</Typography>
        </View>
        <Badge variant="success">Active</Badge>
      </View>

      {item.image_url ? (
        <Image
          accessibilityLabel={`${item.brand} ${item.name}`}
          resizeMode="cover"
          source={{ uri: getStringPhotoUrl(item.image_url) ?? item.image_url }}
          style={styles.image}
        />
      ) : null}

      <View style={styles.metaGrid}>
        <Meta label="Gauge" value={item.gauge} />
        <Meta label="Color" value={item.color} />
        <Meta label="Style" value={item.recommended_style} />
      </View>

      {item.description ? (
        <Typography variant="body">{item.description}</Typography>
      ) : null}
    </View>
  );
}

function Meta({ label, value }: { label: string; value: string | null }) {
  return (
    <View style={styles.metaItem}>
      <Typography variant="caption">{label}</Typography>
      <Typography variant="body">{value ?? '-'}</Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: lightColors.background.hex,
    gap: theme.spacing[5],
    padding: theme.spacing[6],
    paddingTop: theme.spacing[12],
  },
  header: {
    gap: theme.spacing[2],
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing[2],
  },
  description: {
    color: lightColors.mutedForeground.hex,
  },
  toolbar: {
    gap: theme.spacing[4],
  },
  filterGroup: {
    gap: theme.spacing[2],
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing[2],
  },
  chip: {
    backgroundColor: lightColors.card.hex,
    borderColor: lightColors.border.hex,
    borderRadius: theme.borderRadius.md,
    borderWidth: theme.borderWidth.hairline,
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[2],
  },
  chipSelected: {
    backgroundColor: lightColors.primary.hex,
    borderColor: lightColors.primary.hex,
  },
  chipText: {
    color: lightColors.foreground.hex,
  },
  chipTextSelected: {
    color: lightColors.primaryForeground.hex,
  },
  list: {
    gap: theme.spacing[3],
  },
  card: {
    backgroundColor: lightColors.card.hex,
    borderColor: lightColors.border.hex,
    borderRadius: theme.borderRadius.lg,
    borderWidth: theme.borderWidth.hairline,
    gap: theme.spacing[3],
    padding: theme.spacing[4],
    ...theme.shadow.card,
  },
  selectedCard: {
    borderColor: lightColors.primary.hex,
  },
  detail: {
    backgroundColor: lightColors.card.hex,
    borderColor: lightColors.primary.hex,
    borderRadius: theme.borderRadius.lg,
    borderWidth: theme.borderWidth.hairline,
    gap: theme.spacing[4],
    padding: theme.spacing[4],
  },
  emptyState: {
    alignItems: 'center',
    backgroundColor: lightColors.card.hex,
    borderColor: lightColors.border.hex,
    borderRadius: theme.borderRadius.lg,
    borderWidth: theme.borderWidth.hairline,
    gap: theme.spacing[2],
    padding: theme.spacing[6],
  },
  image: {
    backgroundColor: lightColors.muted.hex,
    borderRadius: theme.borderRadius.md,
    height: 180,
    width: '100%',
  },
  cardImage: {
    backgroundColor: lightColors.muted.hex,
    borderRadius: theme.borderRadius.md,
    height: 132,
    width: '100%',
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
    minWidth: 120,
    padding: theme.spacing[3],
  },
  rowBetween: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: theme.spacing[3],
    justifyContent: 'space-between',
  },
  flex: {
    flex: 1,
  },
  price: {
    color: lightColors.primary.hex,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  message: {
    color: lightColors.destructive.hex,
  },
  pressed: {
    opacity: theme.opacity.pressed,
  },
});
