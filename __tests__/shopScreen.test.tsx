import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

const mockPush = jest.fn();
const mockGetAppContentBlocks = jest.fn();
const mockGetActiveShopProducts = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock('../src/services/appContentService', () => ({
  getAppContentBlocks: mockGetAppContentBlocks,
}));

jest.mock('../src/services/shopProductService', () => ({
  getActiveShopProducts: mockGetActiveShopProducts,
}));

jest.mock('../src/services/storageService', () => ({
  getAppAssetUrl: (value?: string | null) => value ?? null,
}));

describe('ShopScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    require('../src/stores/shopWishlistStore').clearShopWishlistForTests();
    mockGetAppContentBlocks.mockResolvedValue({
      shop_filters: ['전체', '라켓', '스트링', '가방', '가발', '의류'],
      shop_sale_banner: null,
    });
    mockGetActiveShopProducts.mockResolvedValue([
      {
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
      },
      {
        id: 'string-1',
        name: 'Luxilon ALU Power',
        category: '스트링',
        image_path: null,
        image_url: null,
        price: 32000,
        sale: 28000,
        rating: 4.9,
        reviews: 412,
        tag: null,
        tone: 'secondary',
      },
      {
        id: 'grip-1',
        name: 'Yonex Overgrip',
        category: '그립',
        image_path: null,
        image_url: null,
        price: 12000,
        sale: 12000,
        rating: 4.4,
        reviews: 20,
        tag: null,
        tone: 'card',
      },
      {
        id: 'bag-1',
        name: 'Wilson Tour Bag',
        category: '가방',
        image_path: null,
        image_url: null,
        price: 159000,
        sale: 139000,
        rating: 4.7,
        reviews: 38,
        tag: null,
        tone: 'primary',
      },
      {
        id: 'apparel-1',
        name: 'Court Jacket',
        category: '의류',
        image_path: null,
        image_url: null,
        price: 99000,
        sale: 89000,
        rating: 4.5,
        reviews: 11,
        tag: null,
        tone: 'card',
      },
      {
        id: 'shoe-1',
        name: 'Asics Court FF',
        category: '신발',
        image_path: null,
        image_url: null,
        price: 219000,
        sale: 189000,
        rating: 4.8,
        reviews: 72,
        tag: null,
        tone: 'accent',
      },
    ]);
  });

  test('샵에서 가방/가발/의류/신발 카테고리와 상품을 표시하지 않는다', async () => {
    const ShopScreen = require('../app/(tabs)/shop').default;
    const screen = render(<ShopScreen />);

    await waitFor(() => expect(screen.getByText('Wilson Pro Staff')).toBeTruthy());

    expect(screen.queryByText('Wilson Tour Bag')).toBeNull();
    expect(screen.queryByText('Court Jacket')).toBeNull();
    expect(screen.queryByText('가방')).toBeNull();
    expect(screen.queryByText('가발')).toBeNull();
    expect(screen.queryByText('의류')).toBeNull();
    expect(screen.queryByText('신발')).toBeNull();
    expect(screen.queryByText('Asics Court FF')).toBeNull();
  });

  test('라켓 상품 클릭은 DB 상품 상세 페이지로 이동한다', async () => {
    const ShopScreen = require('../app/(tabs)/shop').default;
    const screen = render(<ShopScreen />);

    await waitFor(() => expect(screen.getByLabelText('Wilson Pro Staff 보기')).toBeTruthy());

    fireEvent.press(screen.getByLabelText('Wilson Pro Staff 보기'));

    expect(mockPush).not.toHaveBeenCalledWith('/string-catalog');
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/shop-product-detail',
      params: { from: '/shop', id: 'racket-1' },
    });
  });

  test('스트링 상품 클릭도 카테고리 목록이 아니라 DB 상품 상세 페이지로 이동한다', async () => {
    const ShopScreen = require('../app/(tabs)/shop').default;
    const screen = render(<ShopScreen />);

    await waitFor(() => expect(screen.getByLabelText('Luxilon ALU Power 보기')).toBeTruthy());

    fireEvent.press(screen.getByLabelText('Luxilon ALU Power 보기'));

    expect(mockPush).not.toHaveBeenCalledWith('/string-catalog');
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/shop-product-detail',
      params: { from: '/shop', id: 'string-1' },
    });
  });

  test('필터 조건에서 할인 상품만 볼 수 있다', async () => {
    const ShopScreen = require('../app/(tabs)/shop').default;
    const screen = render(<ShopScreen />);

    await waitFor(() => expect(screen.getByText('Yonex Overgrip')).toBeTruthy());

    fireEvent.press(screen.getByLabelText('필터'));
    fireEvent.press(screen.getByLabelText('할인 상품만 보기'));

    expect(screen.queryByText('Yonex Overgrip')).toBeNull();
    expect(screen.getByText('Wilson Pro Staff')).toBeTruthy();
  });

  test('상품을 찜하면 장바구니 버튼으로 찜 목록에 진입할 수 있다', async () => {
    const ShopScreen = require('../app/(tabs)/shop').default;
    const screen = render(<ShopScreen />);

    await waitFor(() => expect(screen.getByLabelText('Wilson Pro Staff 찜')).toBeTruthy());

    fireEvent.press(screen.getByLabelText('Wilson Pro Staff 찜'));
    expect(screen.getByText('1')).toBeTruthy();

    fireEvent.press(screen.getByLabelText('장바구니'));

    expect(mockPush).toHaveBeenCalledWith('/shop-wishlist');
  });

  test('상품 찜 추가와 해제 후 알림창을 표시한다', async () => {
    const ShopScreen = require('../app/(tabs)/shop').default;
    const screen = render(<ShopScreen />);

    await waitFor(() => expect(screen.getByLabelText('Wilson Pro Staff 찜')).toBeTruthy());

    fireEvent.press(screen.getByLabelText('Wilson Pro Staff 찜'));
    expect(screen.getByText('찜 목록에 추가되었습니다')).toBeTruthy();
    fireEvent.press(screen.getByText('확인'));

    fireEvent.press(screen.getByLabelText('Wilson Pro Staff 찜'));
    expect(screen.getByText('찜 목록에서 해제되었습니다')).toBeTruthy();
  });
});
