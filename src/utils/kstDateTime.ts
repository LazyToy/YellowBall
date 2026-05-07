export const BOOKING_TIME_ZONE = 'Asia/Seoul';

const kstOffsetMinutes = 9 * 60;

const pad = (value: number) => String(value).padStart(2, '0');

const dateParts = new Intl.DateTimeFormat('en-CA', {
  day: '2-digit',
  month: '2-digit',
  timeZone: BOOKING_TIME_ZONE,
  year: 'numeric',
});

const dateTimeParts = new Intl.DateTimeFormat('en-CA', {
  day: '2-digit',
  hour: '2-digit',
  hour12: false,
  minute: '2-digit',
  month: '2-digit',
  timeZone: BOOKING_TIME_ZONE,
  year: 'numeric',
});

const timeParts = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  hour12: false,
  minute: '2-digit',
  timeZone: BOOKING_TIME_ZONE,
});

const partsToRecord = (parts: Intl.DateTimeFormatPart[]) =>
  Object.fromEntries(parts.map((part) => [part.type, part.value]));

export const formatKstDateKey = (date = new Date()) => {
  const parts = partsToRecord(dateParts.formatToParts(date));

  return `${parts.year}-${parts.month}-${parts.day}`;
};

export const formatKstDateTime = (value?: string | null) => {
  if (!value) {
    return '-';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  const parts = partsToRecord(dateTimeParts.formatToParts(date));

  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}`;
};

export const formatKstTime = (value?: string | null) => {
  if (!value) {
    return '--:--';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '--:--';
  }

  return timeParts.format(date);
};

export const kstDateTimeToIso = (dateKey: string, totalMinutes: number) => {
  const [year, month, day] = dateKey.split('-').map(Number);

  return new Date(
    Date.UTC(year, month - 1, day, 0, totalMinutes - kstOffsetMinutes, 0, 0),
  ).toISOString();
};

export const kstDateAndTimeToIso = (dateKey: string, time: string) => {
  const [hour, minute] = time.split(':').map(Number);

  return kstDateTimeToIso(dateKey, hour * 60 + minute);
};

export const nextKstDateKey = (dateKey: string) => {
  const [year, month, day] = dateKey.split('-').map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + 1));

  return `${next.getUTCFullYear()}-${pad(next.getUTCMonth() + 1)}-${pad(
    next.getUTCDate(),
  )}`;
};

export const kstDateRangeToIso = (dateKey: string) => ({
  end: kstDateTimeToIso(nextKstDateKey(dateKey), 0),
  start: kstDateTimeToIso(dateKey, 0),
});

export const isPastKstDateKey = (dateKey: string, now = new Date()) =>
  dateKey < formatKstDateKey(now);

export const isPastIsoDateTime = (value?: string | null, now = new Date()) => {
  if (!value) {
    return true;
  }

  const time = new Date(value).getTime();

  return !Number.isFinite(time) || time <= now.getTime();
};

export const timeToMinutes = (value: string) => {
  const [hour, minute] = value.split(':').map(Number);

  return hour * 60 + minute;
};

export const formatMinutesAsTime = (minutes: number) =>
  `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;

export const getMinimumTimeForKstDate = (dateKey: string, now = new Date()) => {
  if (dateKey !== formatKstDateKey(now)) {
    return null;
  }

  const parts = partsToRecord(timeParts.formatToParts(now));

  return `${parts.hour}:${parts.minute}`;
};
