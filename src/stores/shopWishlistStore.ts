import { useSyncExternalStore } from 'react';

import type { ShopProduct } from '@/services/shopProductService';

export type ShopWishlistItem = Pick<
  ShopProduct,
  | 'category'
  | 'id'
  | 'image_path'
  | 'image_url'
  | 'name'
  | 'price'
  | 'rating'
  | 'reviews'
  | 'sale'
  | 'tag'
  | 'tone'
>;

type ShopWishlistListener = () => void;

let wishlistItems: ShopWishlistItem[] = [];
const listeners = new Set<ShopWishlistListener>();

const emitChange = () => {
  listeners.forEach((listener) => listener());
};

const toWishlistItem = (product: ShopProduct): ShopWishlistItem => {
  const id = product.id.trim();

  if (!id) {
    throw new Error('상품 ID가 없습니다.');
  }

  return {
    category: product.category,
    id,
    image_path: product.image_path,
    image_url: product.image_url,
    name: product.name,
    price: product.price,
    rating: product.rating,
    reviews: product.reviews,
    sale: product.sale,
    tag: product.tag,
    tone: product.tone,
  };
};

export const getShopWishlistItems = () => wishlistItems;

export const isShopWishlistItemSelected = (id: string) =>
  wishlistItems.some((item) => item.id === id);

export const toggleShopWishlistItem = (product: ShopProduct) => {
  const item = toWishlistItem(product);

  if (isShopWishlistItemSelected(item.id)) {
    wishlistItems = wishlistItems.filter((current) => current.id !== item.id);
  } else {
    wishlistItems = [item, ...wishlistItems];
  }

  emitChange();
  return wishlistItems;
};

export const removeShopWishlistItem = (id: string) => {
  const nextId = id.trim();

  if (!nextId) {
    throw new Error('상품 ID가 없습니다.');
  }

  wishlistItems = wishlistItems.filter((item) => item.id !== nextId);
  emitChange();
  return wishlistItems;
};

export const clearShopWishlistForTests = () => {
  wishlistItems = [];
  emitChange();
};

const subscribeShopWishlist = (listener: ShopWishlistListener) => {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
};

export const useShopWishlist = () =>
  useSyncExternalStore(
    subscribeShopWishlist,
    getShopWishlistItems,
    getShopWishlistItems,
  );
