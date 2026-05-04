import {
  createScheduleService,
  defaultShopSchedule,
  type ShopScheduleUpdate,
} from '../src/services/scheduleService';

const superAdminRoleQuery = () => {
  const single = jest
    .fn()
    .mockResolvedValue({ data: { role: 'super_admin' }, error: null });
  const eq = jest.fn(() => ({ single }));
  const select = jest.fn(() => ({ eq }));

  return { select };
};

const userRoleQuery = () => {
  const single = jest.fn().mockResolvedValue({ data: { role: 'user' }, error: null });
  const eq = jest.fn(() => ({ single }));
  const select = jest.fn(() => ({ eq }));

  return { select };
};

describe('scheduleService', () => {
  test('getSchedule returns seven sorted days and fills missing rows from defaults', async () => {
    const order = jest.fn().mockResolvedValue({
      data: [
        {
          day_of_week: 1,
          open_time: '08:30:00',
          close_time: '17:30:00',
          is_closed: false,
        },
      ],
      error: null,
    });
    const select = jest.fn(() => ({ order }));
    const from = jest.fn(() => ({ select }));
    const service = createScheduleService({ from });

    await expect(service.getSchedule()).resolves.toEqual([
      defaultShopSchedule[0],
      {
        day_of_week: 1,
        open_time: '08:30:00',
        close_time: '17:30:00',
        is_closed: false,
      },
      ...defaultShopSchedule.slice(2),
    ]);
    expect(from).toHaveBeenCalledWith('shop_schedule');
    expect(order).toHaveBeenCalledWith('day_of_week', { ascending: true });
  });

  test('updateSchedule rejects invalid time ranges before writing', async () => {
    const service = createScheduleService({
      from: jest.fn().mockReturnValue(superAdminRoleQuery()),
    });

    await expect(
      service.updateSchedule('super-1', [
        {
          day_of_week: 1,
          open_time: '18:00',
          close_time: '09:00',
          is_closed: false,
        },
      ]),
    ).rejects.toThrow('open_time must be earlier than close_time.');
  });

  test('updateSchedule allows admins and upserts normalized weekly hours', async () => {
    const schedule: ShopScheduleUpdate[] = [
      {
        day_of_week: 1,
        open_time: '09:00',
        close_time: '18:00',
        is_closed: false,
      },
    ];
    const order = jest.fn().mockResolvedValue({ data: schedule, error: null });
    const select = jest.fn(() => ({ order }));
    const upsert = jest.fn(() => ({ select }));
    const from = jest
      .fn()
      .mockReturnValueOnce(superAdminRoleQuery())
      .mockReturnValueOnce({ upsert });
    const service = createScheduleService({ from });

    await service.updateSchedule('super-1', schedule);

    expect(upsert).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          day_of_week: 1,
          open_time: '09:00:00',
          close_time: '18:00:00',
          is_closed: false,
          updated_at: expect.any(String),
        }),
      ],
      { onConflict: 'day_of_week' },
    );
  });

  test('non-admin users cannot update schedule', async () => {
    const service = createScheduleService({
      from: jest.fn().mockReturnValue(userRoleQuery()),
    });

    await expect(
      service.updateSchedule('user-1', [
        {
          day_of_week: 1,
          open_time: '09:00',
          close_time: '18:00',
          is_closed: false,
        },
      ]),
    ).rejects.toThrow('Only admins can manage shop schedule settings.');
  });

  test('closed date CRUD uses YYYY-MM-DD dates and admin writes', async () => {
    const closedDate = {
      closed_date: '2026-05-05',
      reason: 'Holiday',
      created_by: 'super-1',
    };
    const insertSingle = jest.fn().mockResolvedValue({ data: closedDate, error: null });
    const insertSelect = jest.fn(() => ({ single: insertSingle }));
    const insert = jest.fn(() => ({ select: insertSelect }));
    const deleteEq = jest.fn().mockResolvedValue({ error: null });
    const deleteQuery = jest.fn(() => ({ eq: deleteEq }));
    const from = jest
      .fn()
      .mockReturnValueOnce(superAdminRoleQuery())
      .mockReturnValueOnce({ insert })
      .mockReturnValueOnce(superAdminRoleQuery())
      .mockReturnValueOnce({ delete: deleteQuery });
    const service = createScheduleService({ from });

    await expect(
      service.addClosedDate('super-1', {
        closed_date: '2026-05-05',
        reason: 'Holiday',
      }),
    ).resolves.toEqual(closedDate);
    await expect(service.removeClosedDate('super-1', '2026-05-05')).resolves.toBe(
      undefined,
    );

    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        closed_date: '2026-05-05',
        reason: 'Holiday',
        created_by: 'super-1',
      }),
    );
    expect(deleteEq).toHaveBeenCalledWith('closed_date', '2026-05-05');
  });

  test('addClosedDate rejects impossible calendar dates', async () => {
    const service = createScheduleService({
      from: jest.fn().mockReturnValue(superAdminRoleQuery()),
    });

    await expect(
      service.addClosedDate('super-1', { closed_date: '2026-02-31' }),
    ).rejects.toThrow('Closed date must be a real calendar date.');
  });
});
