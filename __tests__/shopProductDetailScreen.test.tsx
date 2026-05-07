import React from 'react';
import { render, waitFor } from '@testing-library/react-native';

const mockGetActiveShopProductById = jest.fn();
let mockSearchParams: { id?: string } = {};

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => mockSearchParams,
  useRouter: () => ({
    back: jest.fn(),
  }),
}));

jest.mock('../src/services/shopProductService', () => ({
  getActiveShopProductById: mockGetActiveShopProductById,
}));

jest.mock('../src/services/storageService', () => ({
  getAppAssetUrl: (value?: string | null) => value ?? null,
}));

describe('ShopProductDetailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParams = { id: 'racket-1' };
    mockGetActiveShopProductById.mockResolvedValue({
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
  });

  test('상품 ID로 DB 상품 상세를 불러와 표시한다', async () => {
    const ShopProductDetailScreen =
      require('../app/(tabs)/shop-product-detail').default;
    const screen = render(<ShopProductDetailScreen />);

    await waitFor(() =>
      expect(mockGetActiveShopProductById).toHaveBeenCalledWith('racket-1'),
    );
    expect(screen.getByText('Wilson Pro Staff')).toBeTruthy();
    expect(screen.getByText('329,000원')).toBeTruthy();
    expect(screen.getByLabelText('뒤로 가기')).toBeTruthy();
  });
});
