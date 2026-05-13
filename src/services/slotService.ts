import type { SupabaseClient } from '@supabase/supabase-js';

import {
  createDefaultOperationPolicySettings,
  createOperationPolicyService,
  type OperationPolicySettings,
} from './operationPolicyService';
import { defaultShopSchedule, type DayOfWeek } from './scheduleService';
import type {
  BookingServiceType,
  BookingSlot,
  Database,
} from '@/types/database';
import {
  formatKstDateKey,
  formatKstTime,
  isPastKstDateKey,
  isPastIsoDateTime,
  kstDateRangeToIso,
  kstDateTimeToIso,
} from '@/utils/kstDateTime';

type SlotClient = Pick<SupabaseClient<Database>, 'from' | 'rpc'>;
type OperationPolicyService = {
  getSettings: () => Promise<OperationPolicySettings>;
};

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

const toShortTime = (value: string) => normalizeTime(value).slice(0, 5);

const dayOfWeek = (date: string): DayOfWeek =>
  new Date(`${date}T00:00:00.000Z`).getUTCDay() as DayOfWeek;

const isSlotWithinSchedule = (
  date: string,
  slot: BookingSlot,
  schedule: ScheduleRow,
) => {
  if (schedule.is_closed) {
    return false;
  }

  const openTime = toShortTime(schedule.open_time);
  const closeTime = toShortTime(schedule.close_time);
  const startDate = formatKstDateKey(new Date(slot.start_time));
  const endDate = formatKstDateKey(new Date(slot.end_time));
  const startTime = formatKstTime(slot.start_time);
  const endTime = formatKstTime(slot.end_time);

  return (
    startDate === date &&
    endDate === date &&
    startTime >= openTime &&
    endTime <= closeTime
);
};

const getMinimumStartIso = (
  date: string,
  policy: OperationPolicySettings,
  now = new Date(),
) => {
  const range = kstDateRangeToIso(date);
  const policyMinimum = new Date(
    now.getTime() + policy.bookingOpenHoursBefore * 60 * 60 * 1000,
  ).toISOString();

  return policyMinimum > range.start ? policyMinimum : range.start;
};

const createDefaultSlotPolicyService = (
  client: SlotClient,
): OperationPolicyService =>
  process.env.NODE_ENV === 'test'
    ? {
        getSettings: async () => createDefaultOperationPolicySettings(),
      }
    : createOperationPolicyService(client);

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
      start_time: kstDateTimeToIso(date, start),
      end_time: kstDateTimeToIso(date, start + durationMin),
      capacity,
      reserved_count: 0,
      is_blocked: false,
      block_reason: null,
      updated_at: new Date().toISOString(),
    });
  }

  return rows;
};

export const createSlotService = (
  client: SlotClient,
  operationPolicyService: OperationPolicyService =
    createDefaultSlotPolicyService(client),
) => ({
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

    if (isPastKstDateKey(date)) {
      return [];
    }

    const policy = await operationPolicyService.getSettings();
    const { error: ensureError } = await client.rpc('ensure_booking_slots_for_date', {
      p_date: date,
      p_service_type: serviceType,
      p_duration_min: 60,
      p_capacity: policy.maxConcurrentBookings,
    });

    if (ensureError) {
      throw toServiceError('예약 가능한 시간을 준비하지 못했습니다.', ensureError);
    }

    const schedule = await getScheduleForDate(client, date);

    if (schedule.is_closed) {
      return [];
    }

    const range = kstDateRangeToIso(date);
    const lowerBound = getMinimumStartIso(date, policy);

    const { data, error } = await client
      .from('booking_slots')
      .select('*')
      .eq('service_type', serviceType)
      .eq('is_blocked', false)
      .gte('start_time', lowerBound)
      .lt('start_time', range.end)
      .order('start_time', { ascending: true });

    if (error) {
      throw toServiceError('Unable to load available booking slots.', error);
    }

    return (data ?? []).filter(
      (slot) =>
        slot.reserved_count < slot.capacity &&
        !isPastIsoDateTime(slot.start_time) &&
        isSlotWithinSchedule(date, slot, schedule),
    );
  },

  async getBookingSlotsForDate(
    date: string,
    serviceType: BookingServiceType,
  ): Promise<BookingSlot[]> {
    validateDate(date);
    validateServiceType(serviceType);

    const policy = await operationPolicyService.getSettings();
    const { error: ensureError } = await client.rpc('ensure_booking_slots_for_date', {
      p_date: date,
      p_service_type: serviceType,
      p_duration_min: 60,
      p_capacity: policy.maxConcurrentBookings,
    });

    if (ensureError) {
      throw toServiceError('예약 시간을 준비하지 못했습니다.', ensureError);
    }

    if (await isClosedDate(client, date)) {
      return [];
    }

    const schedule = await getScheduleForDate(client, date);

    if (schedule.is_closed) {
      return [];
    }

    const range = kstDateRangeToIso(date);
    const { data, error } = await client
      .from('booking_slots')
      .select('*')
      .eq('service_type', serviceType)
      .gte('start_time', range.start)
      .lt('start_time', range.end)
      .order('start_time', { ascending: true });

    if (error) {
      throw toServiceError('Unable to load booking slots.', error);
    }

    const minimumStart = getMinimumStartIso(date, policy);

    return (data ?? []).filter(
      (slot) =>
        slot.start_time >= minimumStart &&
        isSlotWithinSchedule(date, slot, schedule),
    );
  },

  async getSlots(
    date: string,
    serviceType: BookingServiceType,
  ): Promise<BookingSlot[]> {
    validateDate(date);
    validateServiceType(serviceType);

    const range = kstDateRangeToIso(date);
    const { data, error } = await client
      .from('booking_slots')
      .select('*')
      .eq('service_type', serviceType)
      .gte('start_time', range.start)
      .lt('start_time', range.end)
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

export const getBookingSlotsForDate = (
  date: string,
  serviceType: BookingServiceType,
) =>
  getDefaultSlotService().then((service) =>
    service.getBookingSlotsForDate(date, serviceType),
  );

export const getSlots = (date: string, serviceType: BookingServiceType) =>
  getDefaultSlotService().then((service) => service.getSlots(date, serviceType));

export const blockSlot = (actorId: string, id: string, reason: string) =>
  getDefaultSlotService().then((service) =>
    service.blockSlot(actorId, id, reason),
  );

export const unblockSlot = (actorId: string, id: string) =>
  getDefaultSlotService().then((service) => service.unblockSlot(actorId, id));
