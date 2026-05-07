import type { HomeShopCategory } from '@/services/appContentService';

export const normalizeHomeShopCategories = (
  items?: (HomeShopCategory | string)[] | null,
): HomeShopCategory[] =>
  (items ?? [])
    .map((item): HomeShopCategory | null => {
      if (typeof item === 'string') {
        return {
          id: item,
          image_path: null,
          image_url: null,
          label: item,
          route: '/shop',
        };
      }

      const label = item.label?.trim();

      if (!label) {
        return null;
      }

      return {
        id: item.id?.trim() || label,
        image_path: item.image_path ?? null,
        image_url: item.image_url ?? null,
        label,
        route: item.route ?? '/shop',
      };
    })
    .filter((item): item is HomeShopCategory => item !== null);
