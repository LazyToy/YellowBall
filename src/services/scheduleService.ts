type ScheduleClient = {
  from: (table: string) => any;
};

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type ShopSchedule = {
  day_of_week: DayOfWeek;
  open_time: string;
  close_time: string;
  is_closed: boolean;
  created_at?: string;
  updated_at?: string;
};

export type ShopScheduleUpdate = {
  day_of_week: DayOfWeek;
  open_time: string;
  close_time: string;
  is_closed: boolean;
};

export type ClosedDate = {
  closed_date: string;
  reason: string | null;
  created_by: string | null;
  created_at?: string;
  updated_at?: string;
};

export type ClosedDateInput = {
  closed_date: string;
  reason?: string | null;
};

export const defaultShopSchedule: ShopSchedule[] = [
  { day_of_week: 0, open_time: '10:00:00', close_time: '17:00:00', is_closed: true },
  { day_of_week: 1, open_time: '09:00:00', close_time: '18:00:00', is_closed: false },
  { day_of_week: 2, open_time: '09:00:00', close_time: '18:00:00', is_closed: false },
  { day_of_week: 3, open_time: '09:00:00', close_time: '18:00:00', is_closed: false },
  { day_of_week: 4, open_time: '09:00:00', close_time: '18:00:00', is_closed: false },
  { day_of_week: 5, open_time: '09:00:00', close_time: '18:00:00', is_closed: false },
  { day_of_week: 6, open_time: '10:00:00', close_time: '17:00:00', is_closed: false },
];

const adminRoles = new Set(['admin', 'super_admin']);
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const timePattern = /^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/;

const toServiceError = (message: string, error: unknown) => {
  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return new Error(`${message} ${error.message}`);
  }

  return new Error(message);
};

const assertDayOfWeek: (day: number) => asserts day is DayOfWeek = (day) => {
  if (!Number.isInteger(day) || day < 0 || day > 6) {
    throw new Error('day_of_week must be an integer from 0 to 6.');
  }
};

const normalizeTime = (value: string) => {
  const trimmed = value.trim();

  if (!timePattern.test(trimmed)) {
    throw new Error('Time must use HH:MM or HH:MM:SS format.');
  }

  return trimmed.length === 5 ? `${trimmed}:00` : trimmed;
};

const timeToSeconds = (value: string) => {
  const [hours, minutes, seconds = '0'] = normalizeTime(value).split(':');

  return Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds);
};

const validateDate = (date: string) => {
  if (!datePattern.test(date)) {
    throw new Error('Closed date must use YYYY-MM-DD format.');
  }

  const parsed = new Date(`${date}T00:00:00.000Z`);

  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) {
    throw new Error('Closed date must be a real calendar date.');
  }
};

const normalizeScheduleUpdate = (
  entry: ShopScheduleUpdate,
): ShopScheduleUpdate => {
  assertDayOfWeek(entry.day_of_week);

  const openTime = normalizeTime(entry.open_time);
  const closeTime = normalizeTime(entry.close_time);

  if (timeToSeconds(openTime) >= timeToSeconds(closeTime)) {
    throw new Error('open_time must be earlier than close_time.');
  }

  return {
    day_of_week: entry.day_of_week,
    open_time: openTime,
    close_time: closeTime,
    is_closed: Boolean(entry.is_closed),
  };
};

const mergeWithDefaultSchedule = (rows: ShopSchedule[] = []) => {
  const byDay = new Map<DayOfWeek, ShopSchedule>();

  defaultShopSchedule.forEach((entry) => byDay.set(entry.day_of_week, entry));
  rows.forEach((entry) => {
    assertDayOfWeek(entry.day_of_week);
    byDay.set(entry.day_of_week, {
      ...entry,
      open_time: normalizeTime(entry.open_time),
      close_time: normalizeTime(entry.close_time),
    });
  });

  return Array.from(byDay.values()).sort((a, b) => a.day_of_week - b.day_of_week);
};

const assertAdmin = async (client: ScheduleClient, actorId: string) => {
  const { data, error } = await client
    .from('profiles')
    .select('role')
    .eq('id', actorId)
    .single();

  if (error || !data || !adminRoles.has(data.role)) {
    throw toServiceError('Only admins can manage shop schedule settings.', error);
  }
};

export const createScheduleService = (client: ScheduleClient) => ({
  async getSchedule(): Promise<ShopSchedule[]> {
    const { data, error } = await client
      .from('shop_schedule')
      .select('*')
      .order('day_of_week', { ascending: true });

    if (error) {
      throw toServiceError('Unable to load shop schedule.', error);
    }

    return mergeWithDefaultSchedule(data ?? []);
  },

  async updateSchedule(
    actorId: string,
    entries: ShopScheduleUpdate[],
  ): Promise<ShopSchedule[]> {
    await assertAdmin(client, actorId);

    const normalizedEntries = entries.map(normalizeScheduleUpdate);
    const { data, error } = await client
      .from('shop_schedule')
      .upsert(
        normalizedEntries.map((entry) => ({
          ...entry,
          updated_at: new Date().toISOString(),
        })),
        { onConflict: 'day_of_week' },
      )
      .select('*')
      .order('day_of_week', { ascending: true });

    if (error) {
      throw toServiceError('Unable to update shop schedule.', error);
    }

    return mergeWithDefaultSchedule(data ?? normalizedEntries);
  },

  async getClosedDates(): Promise<ClosedDate[]> {
    const { data, error } = await client
      .from('closed_dates')
      .select('*')
      .order('closed_date', { ascending: true });

    if (error) {
      throw toServiceError('Unable to load closed dates.', error);
    }

    return data ?? [];
  },

  async addClosedDate(
    actorId: string,
    input: ClosedDateInput,
  ): Promise<ClosedDate> {
    await assertAdmin(client, actorId);
    validateDate(input.closed_date);

    const { data, error } = await client
      .from('closed_dates')
      .insert({
        closed_date: input.closed_date,
        reason: input.reason?.trim() || null,
        created_by: actorId,
        updated_at: new Date().toISOString(),
      })
      .select('*')
      .single();

    if (error || !data) {
      throw toServiceError('Unable to add closed date.', error);
    }

    return data;
  },

  async removeClosedDate(actorId: string, closedDate: string): Promise<void> {
    await assertAdmin(client, actorId);
    validateDate(closedDate);

    const { error } = await client
      .from('closed_dates')
      .delete()
      .eq('closed_date', closedDate);

    if (error) {
      throw toServiceError('Unable to remove closed date.', error);
    }
  },
});

const getDefaultScheduleService = async () => {
  const { supabase } = await import('./supabase');

  return createScheduleService(supabase);
};

export const getSchedule = () =>
  getDefaultScheduleService().then((service) => service.getSchedule());

export const updateSchedule = (actorId: string, entries: ShopScheduleUpdate[]) =>
  getDefaultScheduleService().then((service) =>
    service.updateSchedule(actorId, entries),
  );

export const getClosedDates = () =>
  getDefaultScheduleService().then((service) => service.getClosedDates());

export const addClosedDate = (actorId: string, input: ClosedDateInput) =>
  getDefaultScheduleService().then((service) =>
    service.addClosedDate(actorId, input),
  );

export const removeClosedDate = (actorId: string, closedDate: string) =>
  getDefaultScheduleService().then((service) =>
    service.removeClosedDate(actorId, closedDate),
  );
