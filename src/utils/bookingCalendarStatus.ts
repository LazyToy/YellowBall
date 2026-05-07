import type { ClosedDate, ShopSchedule } from '@/services/scheduleService';
import { formatKstDateKey, formatKstTime } from '@/utils/kstDateTime';

export type CalendarDateStatus = 'normal' | 'closed' | 'ended';

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

const normalizeTime = (value: string) => value.slice(0, 5);

const getDayOfWeek = (date: string) => {
  if (!datePattern.test(date)) {
    return null;
  }

  const parsed = new Date(`${date}T00:00:00.000Z`);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.getUTCDay();
};

const getScheduleForDate = (date: string, schedule: ShopSchedule[]) => {
  const dayOfWeek = getDayOfWeek(date);

  if (dayOfWeek === null) {
    return null;
  }

  return schedule.find((entry) => entry.day_of_week === dayOfWeek) ?? null;
};

const isClosedDate = (date: string, closedDates: ClosedDate[]) =>
  closedDates.some((entry) => entry.closed_date === date);

export const getCalendarDateStatus = (
  date: string,
  schedule: ShopSchedule[],
  closedDates: ClosedDate[],
  now = new Date(),
): CalendarDateStatus => {
  const daySchedule = getScheduleForDate(date, schedule);

  if (!daySchedule || daySchedule.is_closed || isClosedDate(date, closedDates)) {
    return 'closed';
  }

  const today = formatKstDateKey(now);

  if (date < today) {
    return 'ended';
  }

  if (date === today && formatKstTime(now.toISOString()) >= normalizeTime(daySchedule.close_time)) {
    return 'ended';
  }

  return 'normal';
};

export const getBusinessHoursLabel = (
  date: string,
  schedule: ShopSchedule[],
  closedDates: ClosedDate[],
  now = new Date(),
) => {
  const daySchedule = getScheduleForDate(date, schedule);

  if (!daySchedule || daySchedule.is_closed || isClosedDate(date, closedDates)) {
    return '휴무';
  }

  const prefix =
    getCalendarDateStatus(date, schedule, closedDates, now) === 'ended'
      ? '영업 종료'
      : '영업시간';

  return `${prefix} ${normalizeTime(daySchedule.open_time)} - ${normalizeTime(
    daySchedule.close_time,
  )}`;
};
