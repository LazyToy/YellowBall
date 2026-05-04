import { createRacketService } from '../src/services/racketService';

const racket = {
  id: 'racket-1',
  owner_id: 'user-1',
  brand: 'Wilson',
  model: 'Blade',
  grip_size: 'G2',
  weight: 305,
  balance: '320mm',
  photo_url: 'https://example.com/racket.jpg',
  is_primary: true,
  memo: '메인',
  created_at: '2026-05-03T00:00:00.000Z',
};

describe('racketService', () => {
  test('첫 라켓은 자동으로 메인 라켓이 된다', async () => {
    const getOrder2 = jest
      .fn()
      .mockResolvedValue({ data: [], error: null });
    const getOrder1 = jest.fn(() => ({ order: getOrder2 }));
    const getEq = jest.fn(() => ({ order: getOrder1 }));
    const getSelect = jest.fn(() => ({ eq: getEq }));

    const clearEq = jest.fn().mockResolvedValue({ error: null });
    const clearUpdate = jest.fn(() => ({ eq: clearEq }));
    const insertSingle = jest
      .fn()
      .mockResolvedValue({ data: racket, error: null });
    const insertSelect = jest.fn(() => ({ single: insertSingle }));
    const insert = jest.fn(() => ({ select: insertSelect }));
    const from = jest
      .fn()
      .mockReturnValueOnce({ select: getSelect })
      .mockReturnValueOnce({ update: clearUpdate })
      .mockReturnValueOnce({ insert });
    const service = createRacketService({ from } as never);

    await expect(
      service.addRacket({
        owner_id: 'user-1',
        brand: 'Wilson',
        model: 'Blade',
        grip_size: 'G2',
        weight: 305,
        balance: '320mm',
        photo_url: 'https://example.com/racket.jpg',
        memo: '메인',
      }),
    ).resolves.toEqual(racket);

    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ is_primary: true, weight: 305, balance: '320mm' }),
    );
  });

  test('updateRacket에서 메인 라켓 지정 시 기존 메인을 해제한다', async () => {
    const ownerSingle = jest
      .fn()
      .mockResolvedValue({ data: { owner_id: 'user-1' }, error: null });
    const ownerEq = jest.fn(() => ({ single: ownerSingle }));
    const ownerSelect = jest.fn(() => ({ eq: ownerEq }));

    const clearEq = jest.fn().mockResolvedValue({ error: null });
    const clearUpdate = jest.fn(() => ({ eq: clearEq }));

    const saveSingle = jest.fn().mockResolvedValue({ data: racket, error: null });
    const saveSelect = jest.fn(() => ({ single: saveSingle }));
    const saveEq = jest.fn(() => ({ select: saveSelect }));
    const saveUpdate = jest.fn(() => ({ eq: saveEq }));
    const from = jest
      .fn()
      .mockReturnValueOnce({ select: ownerSelect })
      .mockReturnValueOnce({ update: clearUpdate })
      .mockReturnValueOnce({ update: saveUpdate });
    const service = createRacketService({ from } as never);

    await expect(
      service.updateRacket('racket-1', { is_primary: true, balance: '325mm' }),
    ).resolves.toEqual(racket);

    expect(clearUpdate).toHaveBeenCalledWith({ is_primary: false });
    expect(saveUpdate).toHaveBeenCalledWith({
      is_primary: true,
      balance: '325mm',
    });
  });
});
