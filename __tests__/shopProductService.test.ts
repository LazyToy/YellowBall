import { createShopProductService } from '../src/services/shopProductService';

describe('shopProductService', () => {
  test('getActiveProducts loads structured rows from shop_products', async () => {
    const orderCreatedAt = jest.fn().mockResolvedValue({
      data: [
        {
          id: 'prod-1',
          name: 'Wilson Pro Staff',
          category: '라켓',
          image_path: 'seed/wilson-pro-staff.png',
          image_url: null,
          price: 389000,
          sale_price: 329000,
          rating_average: 4.9,
          review_count: 128,
          tag: 'BEST',
          tone: 'primary',
        },
      ],
      error: null,
    });
    const orderSort = jest.fn(() => ({ order: orderCreatedAt }));
    const eq = jest.fn(() => ({ order: orderSort }));
    const select = jest.fn(() => ({ eq }));
    const from = jest.fn(() => ({ select }));
    const service = createShopProductService({ from } as never);

    await expect(service.getActiveProducts()).resolves.toEqual([
      {
        id: 'prod-1',
        name: 'Wilson Pro Staff',
        category: '라켓',
        image_path: 'seed/wilson-pro-staff.png',
        image_url: null,
        price: 389000,
        sale: 329000,
        rating: 4.9,
        reviews: 128,
        tag: 'BEST',
        tone: 'primary',
      },
    ]);

    expect(from).toHaveBeenCalledWith('shop_products');
    expect(select).toHaveBeenCalledWith('*');
    expect(eq).toHaveBeenCalledWith('is_active', true);
  });

  test('getActiveProductById loads one active product by id', async () => {
    const single = jest.fn().mockResolvedValue({
      data: {
        id: 'prod-1',
        name: 'Wilson Pro Staff',
        category: '라켓',
        image_path: null,
        image_url: null,
        price: 389000,
        sale_price: 329000,
        rating_average: 4.9,
        review_count: 128,
        tag: 'BEST',
        tone: 'primary',
      },
      error: null,
    });
    const query = {
      select: jest.fn(() => query),
      eq: jest.fn(() => query),
      single,
    };
    const service = createShopProductService({
      from: jest.fn(() => query),
    } as never);

    await expect(service.getActiveProductById('prod-1')).resolves.toMatchObject({
      id: 'prod-1',
      name: 'Wilson Pro Staff',
      category: '라켓',
    });

    expect(query.eq).toHaveBeenCalledWith('id', 'prod-1');
    expect(query.eq).toHaveBeenCalledWith('is_active', true);
  });
});
