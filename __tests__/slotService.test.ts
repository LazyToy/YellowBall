import { createSlotService } from '../src/services/slotService';
import { createDefaultOperationPolicySettings } from '../src/services/operationPolicyService';

const slot = {
  id: 'slot-1',
  service_type: 'stringing',
  start_time: '2026-05-04T09:00:00.000Z',
  end_time: '2026-05-04T10:00:00.000Z',
  capacity: 1,
  reserved_count: 0,
  is_blocked: false,
  block_reason: null,
  created_at: '2026-05-03T00:00:00.000Z',
  updated_at: '2026-05-03T00:00:00.000Z',
};

const operationPolicyService = (overrides = {}) => ({
  getSettings: jest.fn().mockResolvedValue({
    ...createDefaultOperationPolicySettings(),
    bookingOpenHoursBefore: 0,
    ...overrides,
  }),
});

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

const closedDateQuery = (isClosed = false) => {
  const maybeSingle = jest.fn().mockResolvedValue({
    data: isClosed ? { closed_date: '2026-05-04' } : null,
    error: null,
  });
  const eq = jest.fn(() => ({ maybeSingle }));
  const select = jest.fn(() => ({ eq }));

  return { select };
};

const scheduleQuery = ({
  closeTime = '18:00:00',
  isClosed = false,
  openTime = '09:00:00',
} = {}) => {
  const single = jest.fn().mockResolvedValue({
    data: {
      day_of_week: 1,
      open_time: openTime,
      close_time: closeTime,
      is_closed: isClosed,
    },
    error: null,
  });
  const eq = jest.fn(() => ({ single }));
  const select = jest.fn(() => ({ eq }));

  return { select };
};

describe('slotService', () => {
  test('generateSlots creates nine 60-minute slots for 09:00 to 18:00 hours', async () => {
    const generatedSlots = Array.from({ length: 9 }, (_, index) => ({
      ...slot,
      id: `slot-${index + 1}`,
    }));
    const order = jest.fn().mockResolvedValue({ data: generatedSlots, error: null });
    const select = jest.fn(() => ({ order }));
    const upsert = jest.fn(() => ({ select }));
    const from = jest
      .fn()
      .mockReturnValueOnce(superAdminRoleQuery())
      .mockReturnValueOnce(closedDateQuery(false))
      .mockReturnValueOnce(scheduleQuery())
      .mockReturnValueOnce({ upsert });
    const service = createSlotService({ from } as never);

    await expect(
      service.generateSlots('super-1', '2026-05-04', 'stringing', 60, 1),
    ).resolves.toEqual(generatedSlots);

    expect(upsert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          service_type: 'stringing',
          start_time: '2026-05-04T00:00:00.000Z',
          end_time: '2026-05-04T01:00:00.000Z',
        }),
        expect.objectContaining({
          start_time: '2026-05-04T08:00:00.000Z',
          end_time: '2026-05-04T09:00:00.000Z',
        }),
      ]),
      {
        ignoreDuplicates: true,
        onConflict: 'service_type,start_time',
      },
    );
    expect(upsert.mock.calls[0][0]).toHaveLength(9);
  });

  test('generateSlots returns no slots for closed dates', async () => {
    const from = jest
      .fn()
      .mockReturnValueOnce(superAdminRoleQuery())
      .mockReturnValueOnce(closedDateQuery(true));
    const service = createSlotService({ from } as never);

    await expect(
      service.generateSlots('super-1', '2026-05-04', 'stringing', 60, 1),
    ).resolves.toEqual([]);
    expect(from).toHaveBeenCalledTimes(2);
  });

  test('non-admin users cannot generate slots', async () => {
    const service = createSlotService({
      from: jest.fn().mockReturnValue(userRoleQuery()),
    } as never);

    await expect(
      service.generateSlots('user-1', '2026-05-04', 'stringing', 60, 1),
    ).rejects.toThrow('Only admins can manage booking slots.');
  });

  test('getAvailableSlots filters by date, type, block state, schedule hours, and client-side capacity', async () => {
    const futureSlot = {
      ...slot,
      start_time: '2099-05-04T00:00:00.000Z',
      end_time: '2099-05-04T01:00:00.000Z',
    };
    const outsideHoursSlot = { ...futureSlot, id: 'slot-outside-hours' };
    const withinHoursSlot = {
      ...futureSlot,
      id: 'slot-within-hours',
      start_time: '2099-05-04T01:00:00.000Z',
      end_time: '2099-05-04T02:00:00.000Z',
    };
    const fullSlot = { ...withinHoursSlot, id: 'slot-full', reserved_count: 1, capacity: 1 };
    const query = {
      select: jest.fn(() => query),
      eq: jest.fn(() => query),
      gte: jest.fn(() => query),
      lt: jest.fn(() => query),
      order: jest.fn().mockResolvedValue({
        data: [outsideHoursSlot, withinHoursSlot, fullSlot],
        error: null,
      }),
    };
    const rpc = jest.fn().mockResolvedValue({ data: null, error: null });
    const from = jest
      .fn()
      .mockReturnValueOnce(scheduleQuery({ openTime: '10:00:00', closeTime: '12:00:00' }))
      .mockReturnValueOnce(query);
    const service = createSlotService(
      { from, rpc } as never,
      operationPolicyService(),
    );

    await expect(service.getAvailableSlots('2099-05-04', 'stringing')).resolves.toEqual([
      withinHoursSlot,
    ]);

    expect(rpc).toHaveBeenCalledWith('ensure_booking_slots_for_date', {
      p_date: '2099-05-04',
      p_service_type: 'stringing',
      p_duration_min: 60,
      p_capacity: 1,
    });
    expect(query.eq).toHaveBeenCalledWith('service_type', 'stringing');
    expect(query.eq).toHaveBeenCalledWith('is_blocked', false);
    expect(query.gte).toHaveBeenCalledWith('start_time', '2099-05-03T15:00:00.000Z');
    expect(query.lt).toHaveBeenCalledWith('start_time', '2099-05-04T15:00:00.000Z');
  });

  test('getAvailableSlots uses DB policy capacity when preparing slots', async () => {
    const query = {
      select: jest.fn(() => query),
      eq: jest.fn(() => query),
      gte: jest.fn(() => query),
      lt: jest.fn(() => query),
      order: jest.fn().mockResolvedValue({ data: [], error: null }),
    };
    const rpc = jest.fn().mockResolvedValue({ data: null, error: null });
    const from = jest
      .fn()
      .mockReturnValueOnce(scheduleQuery())
      .mockReturnValueOnce(query);
    const service = createSlotService(
      { from, rpc } as never,
      operationPolicyService({ maxConcurrentBookings: 3 }),
    );

    await expect(service.getAvailableSlots('2099-05-04', 'stringing')).resolves.toEqual([]);

    expect(rpc).toHaveBeenCalledWith('ensure_booking_slots_for_date', {
      p_date: '2099-05-04',
      p_service_type: 'stringing',
      p_duration_min: 60,
      p_capacity: 3,
    });
  });

  test('getSlots returns blocked and open slots for admin slot management', async () => {
    const blockedSlot = { ...slot, id: 'slot-2', is_blocked: true };
    const query = {
      select: jest.fn(() => query),
      eq: jest.fn(() => query),
      gte: jest.fn(() => query),
      lt: jest.fn(() => query),
      order: jest
        .fn()
        .mockResolvedValue({ data: [slot, blockedSlot], error: null }),
    };
    const service = createSlotService({ from: jest.fn(() => query) } as never);

    await expect(service.getSlots('2026-05-04', 'stringing')).resolves.toEqual([
      slot,
      blockedSlot,
    ]);

    expect(query.eq).toHaveBeenCalledWith('service_type', 'stringing');
    expect(query.eq).not.toHaveBeenCalledWith('is_blocked', false);
    expect(query).not.toHaveProperty('filter');
  });

  test('getBookingSlotsForDate prepares and returns all visible slots including unavailable ones', async () => {
    const availableSlot = {
      ...slot,
      id: 'slot-open',
      start_time: '2099-05-04T00:00:00.000Z',
      end_time: '2099-05-04T01:00:00.000Z',
    };
    const fullSlot = {
      ...availableSlot,
      id: 'slot-full',
      start_time: '2099-05-04T01:00:00.000Z',
      end_time: '2099-05-04T02:00:00.000Z',
      reserved_count: 1,
      capacity: 1,
    };
    const blockedSlot = {
      ...availableSlot,
      id: 'slot-blocked',
      start_time: '2099-05-04T02:00:00.000Z',
      end_time: '2099-05-04T03:00:00.000Z',
      is_blocked: true,
    };
    const outsideHoursSlot = {
      ...availableSlot,
      id: 'slot-outside-hours',
      start_time: '2099-05-04T08:00:00.000Z',
      end_time: '2099-05-04T09:00:00.000Z',
    };
    const query = {
      select: jest.fn(() => query),
      eq: jest.fn(() => query),
      gte: jest.fn(() => query),
      lt: jest.fn(() => query),
      order: jest.fn().mockResolvedValue({
        data: [availableSlot, fullSlot, blockedSlot, outsideHoursSlot],
        error: null,
      }),
    };
    const rpc = jest.fn().mockResolvedValue({ data: null, error: null });
    const from = jest
      .fn()
      .mockReturnValueOnce(closedDateQuery(false))
      .mockReturnValueOnce(scheduleQuery({ openTime: '09:00:00', closeTime: '12:00:00' }))
      .mockReturnValueOnce(query);
    const service = createSlotService(
      { from, rpc } as never,
      operationPolicyService(),
    );

    await expect(service.getBookingSlotsForDate('2099-05-04', 'stringing')).resolves.toEqual([
      availableSlot,
      fullSlot,
      blockedSlot,
    ]);

    expect(rpc).toHaveBeenCalledWith('ensure_booking_slots_for_date', {
      p_date: '2099-05-04',
      p_service_type: 'stringing',
      p_duration_min: 60,
      p_capacity: 1,
    });
    expect(query.eq).toHaveBeenCalledWith('service_type', 'stringing');
    expect(query.eq).not.toHaveBeenCalledWith('is_blocked', false);
  });

  test('blockSlot and unblockSlot update blocked state with admin checks', async () => {
    const blockedSlot = { ...slot, is_blocked: true, block_reason: 'Lunch' };
    const blockSingle = jest
      .fn()
      .mockResolvedValue({ data: blockedSlot, error: null });
    const blockSelect = jest.fn(() => ({ single: blockSingle }));
    const blockEq = jest.fn(() => ({ select: blockSelect }));
    const blockUpdate = jest.fn(() => ({ eq: blockEq }));
    const unblockSingle = jest
      .fn()
      .mockResolvedValue({ data: slot, error: null });
    const unblockSelect = jest.fn(() => ({ single: unblockSingle }));
    const unblockEq = jest.fn(() => ({ select: unblockSelect }));
    const unblockUpdate = jest.fn(() => ({ eq: unblockEq }));
    const from = jest
      .fn()
      .mockReturnValueOnce(superAdminRoleQuery())
      .mockReturnValueOnce({ update: blockUpdate })
      .mockReturnValueOnce(superAdminRoleQuery())
      .mockReturnValueOnce({ update: unblockUpdate });
    const service = createSlotService({ from } as never);

    await expect(service.blockSlot('super-1', 'slot-1', 'Lunch')).resolves.toEqual(
      blockedSlot,
    );
    await expect(service.unblockSlot('super-1', 'slot-1')).resolves.toEqual(slot);

    expect(blockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ is_blocked: true, block_reason: 'Lunch' }),
    );
    expect(unblockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ is_blocked: false, block_reason: null }),
    );
  });
});
