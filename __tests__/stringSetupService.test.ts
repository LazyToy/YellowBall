import { createStringSetupService } from '../src/services/stringSetupService';

const stringSetup = {
  id: 'setup-1',
  user_id: 'user-1',
  racket_id: 'racket-1',
  main_string_id: 'string-main',
  cross_string_id: 'string-main',
  tension_main: 48,
  tension_cross: 48,
  is_hybrid: false,
  memo: null,
  last_strung_at: null,
  created_at: '2026-05-03T00:00:00.000Z',
  updated_at: '2026-05-03T00:00:00.000Z',
};

describe('stringSetupService', () => {
  test('getSetupsByRacket scopes setups to user and racket', async () => {
    const query = {
      select: jest.fn(() => query),
      eq: jest.fn(() => query),
      order: jest.fn().mockResolvedValue({ data: [stringSetup], error: null }),
    };
    const from = jest.fn(() => query);
    const service = createStringSetupService({ from } as never);

    await expect(service.getSetupsByRacket('user-1', 'racket-1')).resolves.toEqual([
      stringSetup,
    ]);

    expect(from).toHaveBeenCalledWith('user_string_setups');
    expect(query.eq).toHaveBeenCalledWith('user_id', 'user-1');
    expect(query.eq).toHaveBeenCalledWith('racket_id', 'racket-1');
  });

  test('addSetup copies main string to cross string when hybrid is off', async () => {
    const insertSingle = jest
      .fn()
      .mockResolvedValue({ data: stringSetup, error: null });
    const insertSelect = jest.fn(() => ({ single: insertSingle }));
    const insert = jest.fn(() => ({ select: insertSelect }));
    const service = createStringSetupService({
      from: jest.fn(() => ({ insert })),
    } as never);

    await expect(
      service.addSetup({
        user_id: 'user-1',
        racket_id: 'racket-1',
        main_string_id: 'string-main',
        cross_string_id: 'string-cross',
        tension_main: 48,
        tension_cross: 48,
        is_hybrid: false,
        memo: '  daily setup  ',
      }),
    ).resolves.toEqual(stringSetup);

    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        cross_string_id: 'string-main',
        is_hybrid: false,
        memo: 'daily setup',
      }),
    );
  });

  test('hybrid setup keeps a distinct cross string', async () => {
    const hybridSetup = {
      ...stringSetup,
      cross_string_id: 'string-cross',
      is_hybrid: true,
    };
    const insertSingle = jest
      .fn()
      .mockResolvedValue({ data: hybridSetup, error: null });
    const insertSelect = jest.fn(() => ({ single: insertSingle }));
    const insert = jest.fn(() => ({ select: insertSelect }));
    const service = createStringSetupService({
      from: jest.fn(() => ({ insert })),
    } as never);

    await service.addSetup({
      user_id: 'user-1',
      racket_id: 'racket-1',
      main_string_id: 'string-main',
      cross_string_id: 'string-cross',
      tension_main: 48,
      tension_cross: 46,
      is_hybrid: true,
    });

    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        cross_string_id: 'string-cross',
        is_hybrid: true,
      }),
    );
  });

  test('tension outside 20 to 70 is rejected before writing', async () => {
    const from = jest.fn();
    const service = createStringSetupService({ from } as never);

    await expect(
      service.addSetup({
        user_id: 'user-1',
        racket_id: 'racket-1',
        main_string_id: 'string-main',
        cross_string_id: 'string-main',
        tension_main: 71,
        tension_cross: 48,
        is_hybrid: false,
      }),
    ).rejects.toThrow('tension_main must be an integer from 20 to 70.');
    expect(from).not.toHaveBeenCalled();
  });

  test('updateSetup with hybrid off only copies the current main string to cross string', async () => {
    const currentSingle = jest.fn().mockResolvedValue({
      data: { main_string_id: 'current-main' },
      error: null,
    });
    const currentEq = jest.fn(() => ({ single: currentSingle }));
    const currentSelect = jest.fn(() => ({ eq: currentEq }));
    const updateSingle = jest
      .fn()
      .mockResolvedValue({ data: stringSetup, error: null });
    const updateSelect = jest.fn(() => ({ single: updateSingle }));
    const updateEq = jest.fn(() => ({ select: updateSelect }));
    const update = jest.fn(() => ({ eq: updateEq }));
    const from = jest
      .fn()
      .mockReturnValueOnce({ select: currentSelect })
      .mockReturnValueOnce({ update });
    const service = createStringSetupService({ from } as never);

    await expect(service.updateSetup('setup-1', { is_hybrid: false })).resolves.toEqual(
      stringSetup,
    );

    expect(currentSelect).toHaveBeenCalledWith('main_string_id');
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        is_hybrid: false,
        cross_string_id: 'current-main',
      }),
    );
  });

  test('deleteSetup deletes by setup id', async () => {
    const eq = jest.fn().mockResolvedValue({ error: null });
    const deleteQuery = jest.fn(() => ({ eq }));
    const service = createStringSetupService({
      from: jest.fn(() => ({ delete: deleteQuery })),
    } as never);

    await expect(service.deleteSetup('setup-1')).resolves.toBeUndefined();
    expect(eq).toHaveBeenCalledWith('id', 'setup-1');
  });
});
