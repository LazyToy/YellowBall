import type { StringCatalogItem } from '@/types/database';

export type HomeFeaturedStringItem = {
  id: string;
  brand: string;
  name: string;
  gauge: string | null;
  price: number | null;
  label: string;
  description: string;
  imageUrl: string | null;
  tone: 'accent' | 'secondary';
};

export const buildHomeFeaturedString = (
  item: StringCatalogItem,
  index: number,
): HomeFeaturedStringItem => ({
  brand: item.brand,
  description: item.description ?? item.recommended_style ?? '',
  gauge: item.gauge,
  id: item.id,
  imageUrl: item.image_url,
  label: index === 0 ? 'BEST' : '추천',
  name: item.name,
  price: item.price,
  tone: index === 0 ? 'accent' : 'secondary',
});
