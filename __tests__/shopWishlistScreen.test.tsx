import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: jest.fn(),
    canGoBack: () => false,
    push: mockPush,
    replace: mockReplace,
  }),
}));

jest.mock('../src/services/storageService', () => ({
  getAppAssetUrl: (value?: string | null) => value ?? null,
}));

describe('ShopWishlistScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    require('../src/stores/shopWishlistStore').clearShopWishlistForTests();
  });

  test('찜한 상품을 목록으로 보여주고 상세 페이지로 이동한다', () => {
    const store = require('../src/stores/shopWishlistStore');
    store.toggleShopWishlistItem({
      id: 'racket-1',
      name: 'Wilson Pro Staff',
      category: '라켓',
      image_path: null,
      image_url: null,
      price: 389000,
      sale: 329000,
      rating: 4.9,
      reviews: 128,
      tag: 'BEST',
      tone: 'primary',
    });

    const ShopWishlistScreen = require('../app/(tabs)/shop-wishlist').default;
    const screen = render(<ShopWishlistScreen />);

    expect(screen.getByText('Wilson Pro Staff')).toBeTruthy();
    expect(screen.getByText('1개')).toBeTruthy();

    fireEvent.press(screen.getByLabelText('Wilson Pro Staff 보기'));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/shop-product-detail',
      params: { from: '/shop-wishlist', id: 'racket-1' },
    });
  });

  test('찜한 상품이 없으면 빈 목록 안내를 보여준다', () => {
    const ShopWishlistScreen = require('../app/(tabs)/shop-wishlist').default;
    const screen = render(<ShopWishlistScreen />);

    expect(screen.getByText('아직 찜한 상품이 없습니다.')).toBeTruthy();
  });
});
