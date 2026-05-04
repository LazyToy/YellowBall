import { createStringCatalogService } from '../src/services/stringCatalogService';

const activeString = {
  id: 'string-1',
  brand: 'Luxilon',
  name: 'Alu Power',
  gauge: '1.25',
  color: 'Silver',
  image_url: null,
  description: 'Crisp control string.',
  price: 28000,
  recommended_style: 'control',
  is_active: true,
  deactivation_reason: null,
  deactivated_at: null,
  created_at: '2026-05-03T00:00:00.000Z',
  updated_at: '2026-05-03T00:00:00.000Z',
};

const createListQuery = (data = [activeString]) => {
  const query = {
    select: jest.fn(() => query),
    eq: jest.fn(() => query),
    or: jest.fn(() => query),
    order: jest.fn(),
  };

  query.order
    .mockReturnValueOnce(query)
    .mockResolvedValueOnce({ data, error: null });

  return query;
};

const createSingleQuery = (data = activeString) => {
  const query = {
    select: jest.fn(() => query),
    eq: jest.fn(() => query),
    single: jest.fn().mockResolvedValue({ data, error: null }),
  };

  return query;
};

describe('stringCatalogService user catalog lookups', () => {
  test('getActiveStrings reads only active strings and applies search and filters', async () => {
    const query = createListQuery();
    const from = jest.fn(() => query);
    const service = createStringCatalogService({ from } as never);

    await expect(
      service.getActiveStrings({
        search: 'Alu',
        brand: 'Luxilon',
        gauge: '1.25',
        recommendedStyle: 'control',
      }),
    ).resolves.toEqual([activeString]);

    expect(from).toHaveBeenCalledWith('string_catalog');
    expect(query.select).toHaveBeenCalledWith('*');
    expect(query.eq).toHaveBeenCalledWith('is_active', true);
    expect(query.or).toHaveBeenCalledWith(
      'brand.ilike.%Alu%,name.ilike.%Alu%',
    );
    expect(query.eq).toHaveBeenCalledWith('brand', 'Luxilon');
    expect(query.eq).toHaveBeenCalledWith('gauge', '1.25');
    expect(query.eq).toHaveBeenCalledWith('recommended_style', 'control');
    expect(query.order).toHaveBeenCalledWith('brand', { ascending: true });
    expect(query.order).toHaveBeenCalledWith('name', { ascending: true });
  });

  test('getActiveStrings accepts recommended_style filter alias', async () => {
    const query = createListQuery();
    const service = createStringCatalogService({ from: jest.fn(() => query) } as never);

    await service.getActiveStrings({ recommended_style: 'spin' });

    expect(query.eq).toHaveBeenCalledWith('recommended_style', 'spin');
  });

  test('getStringById defaults to active-only detail lookup', async () => {
    const query = createSingleQuery();
    const service = createStringCatalogService({ from: jest.fn(() => query) } as never);

    await expect(service.getStringById('string-1')).resolves.toEqual(activeString);

    expect(query.eq).toHaveBeenCalledWith('id', 'string-1');
    expect(query.eq).toHaveBeenCalledWith('is_active', true);
    expect(query.single).toHaveBeenCalledTimes(1);
  });

  test('getStringById can opt out of active filtering for admin update flows', async () => {
    const query = createSingleQuery();
    const service = createStringCatalogService({ from: jest.fn(() => query) } as never);

    await service.getStringById('string-1', { activeOnly: false });

    expect(query.eq).toHaveBeenCalledTimes(1);
    expect(query.eq).toHaveBeenCalledWith('id', 'string-1');
  });
});
