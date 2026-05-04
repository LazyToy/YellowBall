import type { SupabaseClient } from '@supabase/supabase-js';

import { defaultShopSchedule, type DayOfWeek } from './scheduleService';
import type {
  BookingServiceType,
  BookingSlot,
  Database,
} from '@/types/database';

type SlotClient = Pick<SupabaseClient<Database>, 'from'>;

type ScheduleRow = {
  day_of_week: DayOfWeek;
  open_time: string;
  close_time: string;
  is_closed: boolean;
};

const adminRoles = new Set(['admin', 'super_admin']);
const serviceTypes = new Set<BookingServiceType>(['stringing', 'demo']);
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

const pad = (value: number) => String(value).padStart(2, '0');

const validateDate = (date: string) => {
  if (!datePattern.test(date)) {
    throw new Error('Slot date must use YYYY-MM-DD format.');
  }

  const parsed = new Date(`${date}T00:00:00.000Z`);

  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) {
    throw new Error('Slot date must be a real calendar date.');
  }
};

const validateServiceType = (serviceType: BookingServiceType) => {
  if (!serviceTypes.has(serviceType)) {
    throw new Error('Unsupported booking slot service type.');
  }
};

const normalizeTime = (value: string) => {
  const trimmed = value.trim();

  if (!timePattern.test(trimmed)) {
    throw new Error('Schedule time must use HH:MM or HH:MM:SS format.');
  }

  return trimmed.length === 5 ? `${trimmed}:00` : trimmed;
};

const timeToMinutes = (value: string) => {
  const [hours, minutes] = normalizeTime(value).split(':');

  return Number(hours) * 60 + Number(minutes);
};

const localSlotIso = (date: string, totalMinutes: number) => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${date}T${pad(hours)}:${pad(minutes)}:00.000Z`;
};

const nextDate = (date: string) => {
  const parsed = new Date(`${date}T00:00:00.000Z`);

  parsed.setUTCDate(parsed.getUTCDate() + 1);

  return parsed.toISOString().slice(0, 10);
};

const dayOfWeek = (date: string): DayOfWeek =>
  new Date(`${date}T00:00:00.000Z`).getUTCDay() as DayOfWeek;

const assertAdmin = async (client: SlotClient, actorId: string) => {
  const { data, error } = await client
    .from('profiles')
    .select('role')
    .eq('id', actorId)
    .single();

  if (error || !data || !adminRoles.has(data.role)) {
    throw toServiceError('Only admins can manage booking slots.', error);
  }
};

const isClosedDate = async (client: SlotClient, date: string) => {
  const { data, error } = await client
    .from('closed_dates')
    .select('closed_date')
    .eq('closed_date', date)
    .maybeSingle();

  if (error) {
    throw toServiceError('Unable to check closed dates.', error);
  }

  return Boolean(data);
};

const getScheduleForDate = async (
  client: SlotClient,
  date: string,
): Promise<ScheduleRow> => {
  const weekday = dayOfWeek(date);
  const { data, error } = await client
    .from('shop_schedule')
    .select('*')
    .eq('day_of_week', weekday)
    .single();

  if (error) {
    throw toServiceError('Unable to load shop hours for slot generation.', error);
  }

  return data ?? defaultShopSchedule[weekday];
};

const buildSlotRows = (
  date: string,
  serviceType: BookingServiceType,
  schedule: ScheduleRow,
  durationMin: number,
  capacity: number,
) => {
  if (!Number.isInteger(durationMin) || durationMin <= 0) {
    throw new Error('Slot duration must be a positive integer.');
  }

  if (!Number.isInteger(capacity) || capacity < 1) {
    throw new Error('Slot capacity must be at least 1.');
  }

  if (schedule.is_closed) {
    return [];
  }

  const open = timeToMinutes(schedule.open_time);
  const close = timeToMinutes(schedule.close_time);

  if (open >= close) {
    throw new Error('Shop schedule open_time must be earlier than close_time.');
  }

  const rows = [];

  for (let start = open; start + durationMin <= close; start += durationMin) {
    rows.push({
      service_type: serviceType,
      start_time: localSlotIso(date, start),
      end_time: localSlotIso(date, start + durationMin),
      capacity,
      reserved_count: 0,
      is_blocked: false,
      block_reason: null,
      updated_at: new Date().toISOString(),
    });
  }

  return rows;
};

export const createSlotService = (client: SlotClient) => ({
  async generateSlots(
    actorId: string,
    date: string,
    serviceType: BookingServiceType,
    durationMin: number,
    capacity = 1,
  ): Promise<BookingSlot[]> {
    await assertAdmin(client, actorId);
    validateDate(date);
    validateServiceType(serviceType);

    if (await isClosedDate(client, date)) {
      return [];
    }

    const schedule = await getScheduleForDate(client, date);
    const rows = buildSlotRows(date, serviceType, schedule, durationMin, capacity);

    if (rows.length === 0) {
      return [];
    }

    const { data, error } = await client
      .from('booking_slots')
      .upsert(rows, {
        ignoreDuplicates: true,
        onConflict: 'service_type,start_time',
      })
      .select('*')
      .order('start_time', { ascending: true });

    if (error) {
      throw toServiceError('Unable to generate booking slots.', error);
    }

    return data ?? [];
  },

  async getAvailableSlots(
    date: string,
    serviceType: BookingServiceType,
  ): Promise<BookingSlot[]> {
    validateDate(date);
    validateServiceType(serviceType);

    const { data, error } = await client
      .from('booking_slots')
      .select('*')
      .eq('service_type', serviceType)
      .eq('is_blocked', false)
      .gte('start_time', `${date}T00:00:00.000Z`)
      .lt('start_time', `${nextDate(date)}T00:00:00.000Z`)
      .filter('reserved_count', 'lt', 'capacity')
      .order('start_time', { ascending: true });

    if (error) {
      throw toServiceError('Unable to load available booking slots.', error);
    }

    return data ?? [];
  },

  async getSlots(
    date: string,
    serviceType: BookingServiceType,
  ): Promise<BookingSlot[]> {
    validateDate(date);
    validateServiceType(serviceType);

    const { data, error } = await client
      .from('booking_slots')
      .select('*')
      .eq('service_type', serviceType)
      .gte('start_time', `${date}T00:00:00.000Z`)
      .lt('start_time', `${nextDate(date)}T00:00:00.000Z`)
      .order('start_time', { ascending: true });

    if (error) {
      throw toServiceError('Unable to load booking slots.', error);
    }

    return data ?? [];
  },

  async blockSlot(
    actorId: string,
    id: string,
    reason: string,
  ): Promise<BookingSlot> {
    await assertAdmin(client, actorId);

    const { data, error } = await client
      .from('booking_slots')
      .update({
        is_blocked: true,
        block_reason: reason.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single();

    if (error || !data) {
      throw toServiceError('Unable to block booking slot.', error);
    }

    return data;
  },

  async unblockSlot(actorId: string, id: string): Promise<BookingSlot> {
    await assertAdmin(client, actorId);

    const { data, error } = await client
      .from('booking_slots')
      .update({
        is_blocked: false,
        block_reason: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single();

    if (error || !data) {
      throw toServiceError('Unable to unblock booking slot.', error);
    }

    return data;
  },
});

const getDefaultSlotService = async () => {
  const { supabase } = await import('./supabase');

  return createSlotService(supabase);
};

export const generateSlots = (
  actorId: string,
  date: string,
  serviceType: BookingServiceType,
  durationMin: number,
  capacity?: number,
) =>
  getDefaultSlotService().then((service) =>
    service.generateSlots(actorId, date, serviceType, durationMin, capacity),
  );

export const getAvailableSlots = (
  date: string,
  serviceType: BookingServiceType,
) =>
  getDefaultSlotService().then((service) =>
    service.getAvailableSlots(date, serviceType),
  );

export const getSlots = (date: string, serviceType: BookingServiceType) =>
  getDefaultSlotService().then((service) => service.getSlots(date, serviceType));

export const blockSlot = (actorId: string, id: string, reason: string) =>
  getDefaultSlotService().then((service) =>
    service.blockSlot(actorId, id, reason),
  );

export const unblockSlot = (actorId: string, id: string) =>
  getDefaultSlotService().then((service) => service.unblockSlot(actorId, id));
