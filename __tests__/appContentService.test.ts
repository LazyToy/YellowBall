import { createAppContentService } from '../src/services/appContentService';

describe('appContentService', () => {
  test('getBlocks loads active content payloads by key', async () => {
    const eq = jest.fn().mockResolvedValue({
      data: [
        { key: 'shop_filters', payload: ['전체', '라켓'] },
        {
          key: 'shop_sale_banner',
          payload: { title: 'Sale' },
        },
      ],
      error: null,
    });
    const inFilter = jest.fn(() => ({ eq }));
    const select = jest.fn(() => ({ in: inFilter }));
    const from = jest.fn(() => ({ select }));
    const service = createAppContentService({ from } as never);

    await expect(
      service.getBlocks(['shop_filters', 'shop_sale_banner']),
    ).resolves.toEqual({
      shop_filters: ['전체', '라켓'],
      shop_sale_banner: { title: 'Sale' },
    });

    expect(from).toHaveBeenCalledWith('app_content_blocks');
    expect(select).toHaveBeenCalledWith('key,payload');
    expect(inFilter).toHaveBeenCalledWith('key', [
      'shop_filters',
      'shop_sale_banner',
    ]);
    expect(eq).toHaveBeenCalledWith('is_active', true);
  });

  test('getBlock returns null when content is missing', async () => {
    const eq = jest.fn().mockResolvedValue({ data: [], error: null });
    const inFilter = jest.fn(() => ({ eq }));
    const select = jest.fn(() => ({ in: inFilter }));
    const from = jest.fn(() => ({ select }));
    const service = createAppContentService({ from } as never);

    await expect(service.getBlock('shop_sale_banner')).resolves.toBeNull();
  });
});
