import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { TextInput } from '@/components/AppText';
import { Button } from '@/components/Button';
import { CalendarPicker } from '@/components/CalendarPicker';
import { FeedbackDialog } from '@/components/FeedbackDialog';
import { Input } from '@/components/Input';
import { BackButton } from '@/components/MobileUI';
import { RefreshableScrollView } from '@/components/PageRefresh';
import { Typography } from '@/components/Typography';
import { lightColors, theme } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { useAppMenuSettings } from '@/hooks/useAppMenuSettings';
import { useOperationPolicySettings } from '@/hooks/useOperationPolicySettings';
import { useResetOnBlur } from '@/hooks/useResetOnBlur';
import { hasAnyBookingMenu } from '@/services/appMenuSettingsService';
import {
  buildRebookPrefill,
  createBooking,
  getMyBookings,
} from '@/services/bookingService';
import { createDemoBooking } from '@/services/demoBookingService';
import { getDemoRackets } from '@/services/demoRacketService';
import { getRackets } from '@/services/racketService';
import {
  defaultShopSchedule,
  getClosedDates,
  getSchedule,
  type ClosedDate,
  type ShopSchedule,
} from '@/services/scheduleService';
import { getBookingSlotsForDate } from '@/services/slotService';
import { getActiveStrings } from '@/services/stringCatalogService';
import { getAddresses } from '@/services/addressService';
import type {
  Address,
  BookingSlot,
  DemoRacket,
  ServiceBooking,
  ServiceDeliveryMethod,
  StringCatalogItem,
  UserRacket,
} from '@/types/database';
import {
  formatMinutesAsTime,
  formatKstDateKey,
  formatKstDateTime,
  formatKstTime,
  getMinimumTimeForKstDate,
  isPastIsoDateTime,
  kstDateAndTimeToIso,
  timeToMinutes,
} from '@/utils/kstDateTime';
import {
  getBusinessHoursLabel,
  getCalendarDateStatus,
} from '@/utils/bookingCalendarStatus';

type BookingMode = 'stringing' | 'demo';
type DemoTimeStep = 'rental' | 'return' | 'summary';
type BookingStringRelation = {
  brand?: string | null;
  name?: string | null;
};
type RebookCandidate = ServiceBooking & {
  main_string?: BookingStringRelation | null;
  cross_string?: BookingStringRelation | null;
};

const today = () => formatKstDateKey();
const MIN_TENSION = 35;
const MAX_TENSION = 70;
const DEMO_RETURN_MINUTE_STEP = 30;
const DEMO_RETURN_LIMIT_DAYS = 7;
const DEMO_RETURN_LIMIT_MS = DEMO_RETURN_LIMIT_DAYS * 24 * 60 * 60 * 1000;

const formatSlot = (slot: BookingSlot) => {
  return formatKstTime(slot.start_time);
};

const formatSlotDateTime = (slot: BookingSlot) =>
  formatKstDateTime(slot.start_time);

const formatWon = (value?: number | null) =>
  value === null || value === undefined ? '가격 문의' : `${value.toLocaleString('ko-KR')}원`;

const clampTension = (value: number) => {
  if (!Number.isFinite(value)) {
    return MIN_TENSION;
  }

  return Math.min(MAX_TENSION, Math.max(MIN_TENSION, Math.round(value)));
};

const getDefaultBookingMode = (
  preferredMode: BookingMode | undefined,
  canBookString: boolean,
  canBookDemo: boolean,
): BookingMode => {
  if (preferredMode === 'demo' && canBookDemo) {
    return 'demo';
  }

  if (preferredMode === 'stringing' && canBookString) {
    return 'stringing';
  }

  return canBookString ? 'stringing' : 'demo';
};

const isSlotSelectable = (slot: BookingSlot) =>
  !slot.is_blocked &&
  slot.reserved_count < slot.capacity &&
  !isPastIsoDateTime(slot.start_time);

const isSlotSelectableWithPolicy = (
  slot: BookingSlot,
  minimumStartIso: string,
) => isSlotSelectable(slot) && slot.start_time >= minimumStartIso;

const getFirstSelectableSlotId = (
  slotRows: BookingSlot[],
  minimumStartIso: string,
) =>
  slotRows.find((slot) =>
    isSlotSelectableWithPolicy(slot, minimumStartIso),
  )?.id || '';

const addDaysToDateKey = (dateKey: string, days: number) => {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + Math.max(0, days));

  return formatKstDateKey(date);
};

const getMinimumBookingStartIso = (hoursBefore: number) =>
  new Date(Date.now() + Math.max(0, hoursBefore) * 60 * 60 * 1000).toISOString();

const getSixMonthsAgo = () => {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - 6);
  return cutoff;
};

const getStringLabel = (string?: BookingStringRelation | null) =>
  [string?.brand, string?.name].filter(Boolean).join(' ') || '스트링 정보 없음';

const getRebookStringSummary = (booking: RebookCandidate) => {
  const main = getStringLabel(booking.main_string);
  const cross = getStringLabel(booking.cross_string);

  return main === cross ? main : `${main} / ${cross}`;
};

const getRebookTensionSummary = (booking: ServiceBooking) =>
  booking.tension_main === booking.tension_cross
    ? `균일 ${booking.tension_main} lbs`
    : `메인 ${booking.tension_main} / 크로스 ${booking.tension_cross} lbs`;

const getRecentRebookCandidates = (bookings: ServiceBooking[]) => {
  const cutoff = getSixMonthsAgo();

  return (bookings as RebookCandidate[]).filter((booking) => {
    const createdAt = new Date(booking.created_at);

    return Number.isFinite(createdAt.getTime()) && createdAt >= cutoff;
  });
};

type BusinessHours = {
  startHour: number;
  endHour: number;
  minSelectableTime: string;
  maxTime: string;
};

const normalizeScheduleTime = (value: string) => value.slice(0, 5);

const getLaterTime = (...values: (string | null | undefined)[]) =>
  values.filter(Boolean).reduce<string | null>(
    (latest, value) => (!latest || value! > latest ? value! : latest),
    null,
  );

const getDemoReturnLimitTime = (slot: BookingSlot) =>
  new Date(slot.start_time).getTime() + DEMO_RETURN_LIMIT_MS;

const isDemoReturnWithinLimit = (
  slot: BookingSlot,
  expectedReturnTime: string,
) => {
  const returnTime = new Date(expectedReturnTime).getTime();
  const limitTime = getDemoReturnLimitTime(slot);

  return Number.isFinite(returnTime) && returnTime <= limitTime;
};

const buildTimeOptions = (
  startHour: number,
  endHour: number,
  minuteStep = DEMO_RETURN_MINUTE_STEP,
) => {
  const startMinutes = startHour * 60;
  const endMinutes = endHour * 60;
  const options: string[] = [];

  for (let minutes = startMinutes; minutes <= endMinutes; minutes += minuteStep) {
    options.push(formatMinutesAsTime(minutes));
  }

  return options;
};

const getDayOfWeekForDateKey = (dateKey: string) => {
  const [year, month, day] = dateKey.split('-').map(Number);

  if (!year || !month || !day) {
    return null;
  }

  const parsed = new Date(Date.UTC(year, month - 1, day));

  return Number.isNaN(parsed.getTime()) ? null : parsed.getUTCDay();
};

const getBusinessHoursForDate = (
  dateKey: string,
  schedule: ShopSchedule[],
  closedDateRows: ClosedDate[],
): BusinessHours | null => {
  if (closedDateRows.some((entry) => entry.closed_date === dateKey)) {
    return null;
  }

  const dayOfWeek = getDayOfWeekForDateKey(dateKey);
  const daySchedule = schedule.find((entry) => entry.day_of_week === dayOfWeek);

  if (!daySchedule || daySchedule.is_closed) {
    return null;
  }

  const minSelectableTime = normalizeScheduleTime(daySchedule.open_time);
  const maxTime = normalizeScheduleTime(daySchedule.close_time);
  const startHour = Number(minSelectableTime.split(':')[0]);
  const endHour = Number(maxTime.split(':')[0]);

  if (!Number.isInteger(startHour) || !Number.isInteger(endHour)) {
    return null;
  }

  return {
    endHour,
    maxTime,
    minSelectableTime,
    startHour,
  };
};

export default function NewBookingScreen() {
  const router = useRouter();
  const searchParams = useLocalSearchParams<{ mode?: string | string[] }>();
  const { profile } = useAuth();
  const menuSettings = useAppMenuSettings();
  const operationPolicy = useOperationPolicySettings();
  const canBookString = menuSettings['string-booking'];
  const canBookDemo = menuSettings['demo-booking'];
  const bookingMenusVisible = hasAnyBookingMenu(menuSettings);
  const deliveryEnabled = menuSettings.delivery;
  const availableDeliveryMethods: ServiceDeliveryMethod[] = deliveryEnabled
    ? ['store_pickup', 'local_quick', 'parcel']
    : ['store_pickup'];
  const profileId = profile?.id;
  const requestedMode = Array.isArray(searchParams.mode)
    ? searchParams.mode[0]
    : searchParams.mode;
  const preferredMode: BookingMode | undefined =
    requestedMode === 'demo' || requestedMode === 'stringing'
      ? requestedMode
      : undefined;
  const defaultMode = getDefaultBookingMode(
    preferredMode,
    canBookString,
    canBookDemo,
  );
  const [mode, setMode] = useState<BookingMode>(defaultMode);
  const [date, setDate] = useState(today());
  const [rackets, setRackets] = useState<UserRacket[]>([]);
  const [demoRackets, setDemoRackets] = useState<DemoRacket[]>([]);
  const [strings, setStrings] = useState<StringCatalogItem[]>([]);
  const [slots, setSlots] = useState<BookingSlot[]>([]);
  const [shopSchedule, setShopSchedule] =
    useState<ShopSchedule[]>(defaultShopSchedule);
  const [closedDates, setClosedDates] = useState<ClosedDate[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [previousBookings, setPreviousBookings] = useState<ServiceBooking[]>([]);
  const [selectedRacketId, setSelectedRacketId] = useState('');
  const [selectedDemoRacketId, setSelectedDemoRacketId] = useState('');
  const [mainStringId, setMainStringId] = useState('');
  const [crossStringId, setCrossStringId] = useState('');
  const [useSameTension, setUseSameTension] = useState(true);
  const [tensionMain, setTensionMain] = useState('48');
  const [tensionCross, setTensionCross] = useState('48');
  const [slotId, setSlotId] = useState('');
  const [deliveryMethod, setDeliveryMethod] =
    useState<ServiceDeliveryMethod>('store_pickup');
  const [addressId, setAddressId] = useState('');
  const [demoReturnDate, setDemoReturnDate] = useState(today());
  const [expectedReturnTime, setExpectedReturnTime] = useState('');
  const [demoTimeStep, setDemoTimeStep] = useState<DemoTimeStep>('rental');
  const [userNotes, setUserNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string>();
  const [successDialog, setSuccessDialog] = useState<{
    title: string;
    message?: string;
  } | null>(null);
  const maxBookingDate = useMemo(
    () => addDaysToDateKey(today(), operationPolicy.bookingMaxDaysAhead),
    [operationPolicy.bookingMaxDaysAhead],
  );
  const minimumBookingStartIso = useMemo(
    () => getMinimumBookingStartIso(operationPolicy.bookingOpenHoursBefore),
    [operationPolicy.bookingOpenHoursBefore],
  );

  const resetForm = useCallback(() => {
    setMode(defaultMode);
    setDate(today());
    setSelectedRacketId(rackets[0]?.id || '');
    setSelectedDemoRacketId(demoRackets[0]?.id || '');
    setMainStringId(strings[0]?.id || '');
    setCrossStringId(strings[0]?.id || '');
    setUseSameTension(true);
    setTensionMain('48');
    setTensionCross('48');
    setSlotId(
      getFirstSelectableSlotId(slots, minimumBookingStartIso),
    );
    setDeliveryMethod('store_pickup');
    setAddressId(addresses.find((item) => item.is_default)?.id || '');
    setDemoReturnDate(today());
    setExpectedReturnTime('');
    setDemoTimeStep('rental');
    setUserNotes('');
    setMessage(undefined);
    setSuccessDialog(null);
    setIsLoading(false);
  }, [
    addresses,
    defaultMode,
    demoRackets,
    minimumBookingStartIso,
    rackets,
    slots,
    strings,
  ]);

  useResetOnBlur(resetForm);

  const loadBaseData = useCallback(async () => {
    if (!profileId) {
      return;
    }

    const [
      racketRows,
      stringRows,
      addressRows,
      previousRows,
      demoRows,
      scheduleRows,
      closedDateRows,
    ] =
      await Promise.all([
        getRackets(profileId),
        getActiveStrings(),
        getAddresses(profileId),
        getMyBookings(profileId),
        getDemoRackets(),
        getSchedule(),
        getClosedDates(),
      ]);

    setRackets(racketRows);
    setStrings(stringRows);
    setAddresses(addressRows);
    setPreviousBookings(previousRows);
    setDemoRackets(demoRows);
    setShopSchedule(scheduleRows);
    setClosedDates(closedDateRows);
    setSelectedRacketId((current) => current || racketRows[0]?.id || '');
    setSelectedDemoRacketId((current) => current || demoRows[0]?.id || '');
    setMainStringId((current) => current || stringRows[0]?.id || '');
    setCrossStringId((current) => current || stringRows[0]?.id || '');
    setAddressId((current) => current || addressRows.find((item) => item.is_default)?.id || '');
  }, [profileId]);

  const loadSlots = useCallback(async () => {
    const slotRows = await getBookingSlotsForDate(date, mode);
    setSlots(slotRows);
    setSlotId((current) =>
      current &&
      slotRows.some(
        (slot) =>
          slot.id === current &&
          isSlotSelectableWithPolicy(slot, minimumBookingStartIso),
      )
        ? current
        : getFirstSelectableSlotId(slotRows, minimumBookingStartIso),
    );
  }, [date, minimumBookingStartIso, mode]);

  useEffect(() => {
    loadBaseData().catch(() => setMessage('예약 데이터를 불러오지 못했습니다.'));
  }, [loadBaseData]);

  useEffect(() => {
    loadSlots().catch(() => setMessage('예약 가능한 시간을 불러오지 못했습니다.'));
  }, [loadSlots]);

  useEffect(() => {
    if (preferredMode) {
      setMode(defaultMode);
      if (defaultMode === 'demo') {
        setDemoTimeStep('rental');
      }
    }
  }, [defaultMode, preferredMode]);

  useEffect(() => {
    if (mode === 'stringing' && !canBookString && canBookDemo) {
      setMode('demo');
      setDemoTimeStep('rental');
    }

    if (mode === 'demo' && !canBookDemo && canBookString) {
      setMode('stringing');
    }
  }, [canBookDemo, canBookString, mode]);

  useEffect(() => {
    if (!deliveryEnabled && deliveryMethod !== 'store_pickup') {
      setDeliveryMethod('store_pickup');
      setAddressId('');
    }
  }, [deliveryEnabled, deliveryMethod]);

  useEffect(() => {
    if (!useSameTension) {
      return;
    }

    setTensionCross(tensionMain);
    setCrossStringId(mainStringId);
  }, [mainStringId, tensionMain, useSameTension]);

  useEffect(() => {
    if (!useSameTension || !mainStringId) {
      return;
    }

    setCrossStringId(mainStringId);
  }, [mainStringId, useSameTension]);

  const selectedSlot = useMemo(
    () => slots.find((slot) => slot.id === slotId),
    [slotId, slots],
  );
  const selectedSlotDateKey = useMemo(() => {
    if (!selectedSlot?.start_time) {
      return date;
    }

    return formatKstDateKey(new Date(selectedSlot.start_time));
  }, [date, selectedSlot?.start_time]);
  const availableSlotCount = useMemo(
    () =>
      slots.filter((slot) =>
        isSlotSelectableWithPolicy(slot, minimumBookingStartIso),
      ).length,
    [minimumBookingStartIso, slots],
  );
  const isDemoReturnDateStep = mode === 'demo' && demoTimeStep !== 'rental';
  const calendarDate = isDemoReturnDateStep ? demoReturnDate : date;
  const calendarLabel =
    mode === 'demo'
      ? isDemoReturnDateStep
        ? '반납 날짜'
        : '대여 날짜'
      : '날짜';
  const demoReturnMaxDate = addDaysToDateKey(
    selectedSlotDateKey,
    DEMO_RETURN_LIMIT_DAYS,
  );
  const calendarMinDate = isDemoReturnDateStep ? selectedSlotDateKey : today();
  const calendarMaxDate = isDemoReturnDateStep ? demoReturnMaxDate : maxBookingDate;
  const businessHoursLabel = useMemo(
    () => getBusinessHoursLabel(calendarDate, shopSchedule, closedDates),
    [calendarDate, closedDates, shopSchedule],
  );
  const demoReturnBusinessHours = useMemo(
    () => getBusinessHoursForDate(demoReturnDate, shopSchedule, closedDates),
    [closedDates, demoReturnDate, shopSchedule],
  );
  const demoReturnTimeOptions = useMemo(() => {
    if (!demoReturnBusinessHours || !selectedSlot) {
      return [];
    }

    const slotStartTime = formatKstTime(selectedSlot.start_time);
    const currentTime =
      demoReturnDate === today()
        ? getMinimumTimeForKstDate(demoReturnDate)
        : null;
    const lowerBound = getLaterTime(
      demoReturnBusinessHours.minSelectableTime,
      currentTime,
      demoReturnDate === selectedSlotDateKey ? slotStartTime : null,
    );

    return buildTimeOptions(
      demoReturnBusinessHours.startHour,
      demoReturnBusinessHours.endHour,
    ).filter(
      (time) =>
        (!lowerBound || timeToMinutes(time) > timeToMinutes(lowerBound)) &&
        (!demoReturnBusinessHours.maxTime ||
          time <= demoReturnBusinessHours.maxTime),
    );
  }, [demoReturnBusinessHours, demoReturnDate, selectedSlot, selectedSlotDateKey]);
  const recentPreviousBookings = useMemo(
    () => getRecentRebookCandidates(previousBookings),
    [previousBookings],
  );
  const getBookingDateStatus = useCallback(
    (value: string) => getCalendarDateStatus(value, shopSchedule, closedDates),
    [closedDates, shopSchedule],
  );

  useEffect(() => {
    if (
      mode !== 'demo' ||
      !selectedSlot ||
      selectedSlot.service_type !== 'demo'
    ) {
      return;
    }

    if (demoReturnDate < selectedSlotDateKey) {
      setDemoReturnDate(selectedSlotDateKey);
      setExpectedReturnTime('');
      return;
    }

    const expectedDateKey = expectedReturnTime
      ? formatKstDateKey(new Date(expectedReturnTime))
      : '';
    const selectedReturnTime = new Date(expectedReturnTime).getTime();
    const slotStartTime = new Date(selectedSlot.start_time).getTime();
    const returnLimitTime = getDemoReturnLimitTime(selectedSlot);
    const selectedReturnTimeInvalid =
      !Number.isFinite(selectedReturnTime) ||
      (demoReturnDate === selectedSlotDateKey &&
        selectedReturnTime <= slotStartTime) ||
      selectedReturnTime > returnLimitTime;

    if (
      !expectedReturnTime ||
      expectedDateKey !== demoReturnDate ||
      selectedReturnTimeInvalid
    ) {
      const fallbackTime = formatKstTime(selectedSlot.end_time);
      const nextTime = [fallbackTime, ...demoReturnTimeOptions].find(
        (time, index, options) =>
          options.indexOf(time) === index &&
          demoReturnTimeOptions.includes(time) &&
          isDemoReturnWithinLimit(
            selectedSlot,
            kstDateAndTimeToIso(demoReturnDate, time),
          ),
      );

      if (nextTime) {
        setExpectedReturnTime(kstDateAndTimeToIso(demoReturnDate, nextTime));
      } else if (expectedReturnTime) {
        setExpectedReturnTime('');
      }
    }
  }, [
    demoReturnDate,
    demoReturnTimeOptions,
    expectedReturnTime,
    mode,
    selectedSlot,
    selectedSlotDateKey,
  ]);

  const applyRebook = (booking: ServiceBooking) => {
    const prefill = buildRebookPrefill(booking);

    setMode('stringing');
    setSelectedRacketId(prefill.racket_id);
    setMainStringId(prefill.main_string_id);
    setCrossStringId(prefill.cross_string_id);
    setTensionMain(String(prefill.tension_main));
    setTensionCross(String(prefill.tension_cross));
    setUseSameTension(
      prefill.main_string_id === prefill.cross_string_id &&
        prefill.tension_main === prefill.tension_cross,
    );
    setDeliveryMethod(deliveryEnabled ? prefill.delivery_method : 'store_pickup');
    setAddressId(deliveryEnabled ? prefill.address_id ?? '' : '');
    setMessage('이전 예약 설정을 불러왔습니다. 날짜와 시간만 새로 선택하세요.');
  };

  const handleSelectString = (id: string) => {
    setMainStringId(id);
    if (useSameTension) {
      setCrossStringId(id);
    }
  };

  const showDemoReturnLimitAlert = () => {
    const limitMessage =
      '반납 예정 시간은 대여 예정 시간 기준 일주일을 넘길 수 없습니다.';

    Alert.alert('선택 불가', limitMessage);
    setMessage(limitMessage);
  };

  const handleSelectDate = (value: string) => {
    if (mode === 'demo' && demoTimeStep !== 'rental') {
      if (value < selectedSlotDateKey) {
        setMessage('반납 날짜는 대여 날짜보다 빠를 수 없습니다.');
        return;
      }

      if (value > demoReturnMaxDate) {
        showDemoReturnLimitAlert();
        return;
      }

      setDemoReturnDate(value);
      setExpectedReturnTime('');
      if (demoTimeStep === 'summary') {
        setDemoTimeStep('return');
      }
      return;
    }

    setDate(value);
    if (mode === 'demo') {
      setDemoReturnDate(value);
      setExpectedReturnTime('');
      setDemoTimeStep('rental');
    }
  };

  const handleSelectDemoSlot = (id: string) => {
    const nextSlot = slots.find((slot) => slot.id === id);

    setSlotId(id);
    setDemoReturnDate(
      nextSlot?.start_time
        ? formatKstDateKey(new Date(nextSlot.start_time))
        : date,
    );
    setExpectedReturnTime('');
    setDemoTimeStep('rental');
  };

  const handleCompleteDemoRentalTime = () => {
    setDemoReturnDate((current) =>
      current && current >= selectedSlotDateKey ? current : selectedSlotDateKey,
    );
    setDemoTimeStep('return');
  };

  const handleEditDemoRentalTime = () => {
    setExpectedReturnTime('');
    setDemoReturnDate(selectedSlotDateKey);
    setDemoTimeStep('rental');
  };

  const handleEditDemoReturnTime = () => {
    setDemoReturnDate((current) =>
      current && current >= selectedSlotDateKey ? current : selectedSlotDateKey,
    );
    setDemoTimeStep('return');
  };

  const handleSelectDemoReturnTime = (time: string) => {
    if (!selectedSlot) {
      return;
    }

    const nextReturnTime = kstDateAndTimeToIso(demoReturnDate, time);

    if (!isDemoReturnWithinLimit(selectedSlot, nextReturnTime)) {
      showDemoReturnLimitAlert();
      return;
    }

    setMessage(undefined);
    setExpectedReturnTime(nextReturnTime);
  };

  const handleSubmit = async () => {
    if (!profileId) {
      setMessage('로그인이 필요합니다.');
      return;
    }

    if (mode === 'stringing' && !canBookString) {
      setMessage('현재 스트링 작업 예약 메뉴가 비활성화되어 있습니다.');
      return;
    }

    if (mode === 'demo' && !canBookDemo) {
      setMessage('현재 시타 예약 메뉴가 비활성화되어 있습니다.');
      return;
    }

    if (mode === 'stringing' && !selectedRacketId) {
      setMessage('예약할 라켓을 선택하세요.');
      return;
    }

    const effectiveCrossStringId = useSameTension ? mainStringId : crossStringId;
    const effectiveTensionCross = useSameTension ? tensionMain : tensionCross;
    const effectiveDeliveryMethod = deliveryEnabled ? deliveryMethod : 'store_pickup';
    const effectiveAddressId = deliveryEnabled ? addressId || null : null;

    if (mode === 'stringing' && (!mainStringId || !effectiveCrossStringId)) {
      setMessage('예약할 스트링을 선택하세요.');
      return;
    }

    if (mode === 'demo' && !selectedDemoRacketId) {
      setMessage('시타할 라켓을 선택하세요.');
      return;
    }

    if (!slotId) {
      setMessage('예약 시간을 선택하세요.');
      return;
    }

    if (
      !selectedSlot ||
      !isSlotSelectableWithPolicy(selectedSlot, minimumBookingStartIso)
    ) {
      setMessage('현재 시간 이후의 예약 시간을 선택해 주세요.');
      await loadSlots();
      return;
    }

    if (mode === 'demo' && isPastIsoDateTime(expectedReturnTime)) {
      setMessage('현재 시간 이후의 반납 예정 시간을 선택해 주세요.');
      return;
    }

    if (
      mode === 'demo' &&
      new Date(expectedReturnTime).getTime() <=
        new Date(selectedSlot.start_time).getTime()
    ) {
      setMessage('반납 예정 시간은 대여 예정 시간보다 늦어야 합니다.');
      return;
    }

    if (
      mode === 'demo' &&
      !isDemoReturnWithinLimit(selectedSlot, expectedReturnTime)
    ) {
      setMessage('반납 예정 시간은 대여 예정 시간 기준 일주일을 넘길 수 없습니다.');
      return;
    }

    setIsLoading(true);
    setMessage(undefined);

    try {
      if (mode === 'stringing') {
        const booking = await createBooking({
          userId: profileId,
          racketId: selectedRacketId,
          mainStringId,
          crossStringId: effectiveCrossStringId,
          tensionMain: Number(tensionMain),
          tensionCross: Number(effectiveTensionCross),
          slotId,
          deliveryMethod: effectiveDeliveryMethod,
          addressId: effectiveAddressId,
          userNotes,
        });
        setSuccessDialog({
          title: '스트링 예약이 접수되었습니다',
          message: `예약 번호: ${booking.id}`,
        });
      } else {
        await createDemoBooking({
          userId: profileId,
          demoRacketId: selectedDemoRacketId,
          slotId,
          expectedReturnTime,
          userNotes,
        });
        setSuccessDialog({
          title: '시타 예약이 접수되었습니다',
          message: '확인을 누르면 예약 목록으로 이동합니다.',
        });
      }

      await loadSlots();
      await loadBaseData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '예약 생성 실패');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <RefreshableScrollView contentContainerStyle={styles.container}>
      <FeedbackDialog
        visible={successDialog !== null}
        title={successDialog?.title ?? ''}
        message={successDialog?.message}
        onConfirm={() => {
          setSuccessDialog(null);
          router.replace('/booking');
        }}
      />
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <BackButton onPress={() => router.back()} />
          <Typography variant="h1">새 예약</Typography>
        </View>
        {bookingMenusVisible ? (
        <View style={styles.segment}>
          {canBookString ? (
          <ModeButton active={mode === 'stringing'} onPress={() => setMode('stringing')}>
            스트링
          </ModeButton>
          ) : null}
          {canBookDemo ? (
          <ModeButton
            active={mode === 'demo'}
            onPress={() => {
              setMode('demo');
              setDemoTimeStep('rental');
            }}
          >
            시타
          </ModeButton>
          ) : null}
        </View>
        ) : null}
      </View>

      {!bookingMenusVisible ? (
        <View style={styles.section}>
          <Typography variant="caption" style={styles.muted}>
            현재 예약 메뉴가 비활성화되어 있습니다.
          </Typography>
        </View>
      ) : null}

      {bookingMenusVisible && mode === 'stringing' ? (
        <>
          <View style={styles.section}>
            <Typography variant="h2">1. 라켓 선택</Typography>
            <RacketSelectPanel
              items={rackets}
              selectedId={selectedRacketId}
              onSelect={setSelectedRacketId}
            />
          </View>

          <View style={styles.section}>
            <Typography variant="h2">2. 스트링 선택</Typography>
            <StringSelectPanel
              items={strings}
              isHybrid={!useSameTension}
              mainStringId={mainStringId}
              crossStringId={crossStringId}
              onSelectMain={handleSelectString}
              onSelectCross={setCrossStringId}
            />
          </View>

          <View style={styles.section} testID="stringing-tension-section">
            <Typography variant="h2">3. 텐션</Typography>
            <TensionSelectPanel
              isUniform={useSameTension}
              tensionMain={Number(tensionMain)}
              tensionCross={Number(tensionCross)}
              onModeChange={(isUniform) => {
                setUseSameTension(isUniform);
                if (isUniform) {
                  setTensionCross(tensionMain);
                  setCrossStringId(mainStringId);
                } else if (!crossStringId) {
                  setCrossStringId(mainStringId);
                }
              }}
              onTensionMainChange={(value) => {
                const next = String(clampTension(value));
                setTensionMain(next);
                if (useSameTension) {
                  setTensionCross(next);
                }
              }}
              onTensionCrossChange={(value) => setTensionCross(String(clampTension(value)))}
            />
            <View style={styles.sectionSubgroup}>
              <Typography variant="h2">다시 예약</Typography>
              <RebookHistoryPanel
                items={recentPreviousBookings}
                onSelect={applyRebook}
              />
            </View>
          </View>
        </>
      ) : bookingMenusVisible ? (
        <View style={styles.section}>
          <Typography variant="h2">1. 시타 라켓 선택</Typography>
          <DemoRacketSelectPanel
            items={demoRackets}
            selectedId={selectedDemoRacketId}
            onSelect={setSelectedDemoRacketId}
          />
        </View>
      ) : null}

      {bookingMenusVisible ? (
      <View style={styles.section}>
        <Typography variant="h2">{mode === 'stringing' ? '4' : '2'}. 날짜/시간</Typography>
        <CalendarPicker
          key={`booking-calendar-${mode}-${demoTimeStep}-${calendarDate}`}
          getDateStatus={getBookingDateStatus}
          maxDate={calendarMaxDate}
          label={calendarLabel}
          minDate={calendarMinDate}
          selectedDate={calendarDate}
          onSelectDate={handleSelectDate}
          showStatusLegend
        />
        <View style={styles.slotSummary}>
          <Typography variant="caption" style={styles.muted}>
            {businessHoursLabel}
          </Typography>
          <Typography variant="caption" style={styles.muted}>
            예약 가능 {availableSlotCount}개
          </Typography>
        </View>
        {mode === 'demo' && demoTimeStep === 'rental' ? (
          <View style={styles.slotPickerGroup} testID="demo-rental-time-picker">
            <SlotPickerRow
              items={slots}
              minimumStartIso={minimumBookingStartIso}
              label="대여 예정 시간"
              selectedId={slotId}
              onSelect={handleSelectDemoSlot}
            />
            <Button
              disabled={!selectedSlot}
              onPress={handleCompleteDemoRentalTime}
              size="sm"
              testID="demo-rental-time-complete-button"
              variant="outline"
            >
              대여 시간 완료
            </Button>
          </View>
        ) : null}
        {mode === 'stringing' ? (
          <SlotPickerRow
            items={slots}
            minimumStartIso={minimumBookingStartIso}
            selectedId={slotId}
            onSelect={setSlotId}
          />
        ) : null}
        {mode === 'demo' && demoTimeStep === 'return' ? (
          <>
            <DemoTimeSummary
              label="대여 예정 시간"
              testID="demo-selected-rental-time"
              value={selectedSlot ? formatSlotDateTime(selectedSlot) : '-'}
            />
            <DemoReturnTimePicker
              options={demoReturnTimeOptions}
              selectedTime={formatKstTime(expectedReturnTime)}
              onComplete={() => setDemoTimeStep('summary')}
              onSelect={handleSelectDemoReturnTime}
            />
          </>
        ) : null}
        {mode === 'demo' && demoTimeStep === 'summary' ? (
          <DemoTimeReview
            rentalTime={selectedSlot ? formatSlotDateTime(selectedSlot) : '-'}
            returnTime={formatKstDateTime(expectedReturnTime)}
            onEditRental={handleEditDemoRentalTime}
            onEditReturn={handleEditDemoReturnTime}
          />
        ) : null}
      </View>
      ) : null}

      {bookingMenusVisible && mode === 'stringing' ? (
        <View style={styles.section}>
          <Typography variant="h2">5. 수령 방식</Typography>
          <View style={styles.chipRow}>
            {availableDeliveryMethods.map(
              (method) => (
                <Chip
                  active={deliveryMethod === method}
                  key={method}
                  onPress={() => setDeliveryMethod(method)}
                >
                  {method === 'store_pickup'
                    ? '매장 픽업'
                    : method === 'local_quick'
                      ? '퀵'
                      : '택배'}
                </Chip>
              ),
            )}
          </View>
          {deliveryMethod !== 'store_pickup' ? (
            <PickerRow
              items={addresses}
              labelOf={(item) => `${item.recipient_name} ${item.address_line1}`}
              selectedId={addressId}
              onSelect={setAddressId}
            />
          ) : null}
        </View>
      ) : null}

      {bookingMenusVisible ? (
      <View style={styles.section}>
        <Typography variant="h2">{mode === 'stringing' ? '6' : '3'}. 메모</Typography>
        <Input
          label="요청사항"
          multiline
          onChangeText={setUserNotes}
          value={userNotes}
        />
        <Button
          disabled={mode === 'demo' && demoTimeStep !== 'summary'}
          loading={isLoading}
          onPress={handleSubmit}
          testID="new-booking-submit-button"
        >
          예약 접수
        </Button>
        {message ? (
          <Typography accessibilityRole="alert" variant="caption" style={styles.message}>
            {message}
          </Typography>
        ) : null}
      </View>
      ) : null}
    </RefreshableScrollView>
  );
}

function ModeButton({
  active,
  children,
  onPress,
}: {
  active: boolean;
  children: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[styles.segmentButton, active && styles.segmentButtonActive]}
    >
      <Typography
        variant="caption"
        style={[styles.segmentText, active && styles.segmentTextActive]}
      >
        {children}
      </Typography>
    </Pressable>
  );
}

function Chip({
  active,
  children,
  onPress,
}: {
  active: boolean;
  children: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
    >
      <Typography variant="caption" style={active && styles.chipTextActive}>
        {children}
      </Typography>
    </Pressable>
  );
}

function RadioMark({ active }: { active: boolean }) {
  return (
    <View style={[styles.radioOuter, active && styles.radioOuterActive]}>
      {active ? <View style={styles.radioInner} /> : null}
    </View>
  );
}

function RacketSelectPanel({
  items,
  selectedId,
  onSelect,
}: {
  items: UserRacket[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  if (items.length === 0) {
    return (
      <View style={styles.previewPanel}>
        <Typography variant="body" style={styles.previewTitle}>
          라켓 선택
        </Typography>
        <Typography variant="caption" style={styles.muted}>
          선택 가능한 항목이 없습니다.
        </Typography>
      </View>
    );
  }

  return (
    <View style={styles.previewPanel}>
      <View>
        <Typography variant="body" style={styles.previewTitle}>
          라켓 선택
        </Typography>
        <Typography variant="caption" style={styles.muted}>
          내 라켓 라이브러리에서 선택
        </Typography>
      </View>
      <View style={styles.previewList}>
        {items.map((item) => {
          const active = selectedId === item.id;

          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              key={item.id}
              onPress={() => onSelect(item.id)}
              style={[styles.previewRow, active && styles.previewRowActive]}
            >
              <RadioMark active={active} />
              <View style={styles.previewRowText}>
                <View style={styles.previewTitleRow}>
                  <Typography variant="body" style={styles.previewRowTitle}>
                    {item.brand} {item.model}
                  </Typography>
                  {item.is_primary ? (
                    <View style={styles.miniBadge}>
                      <Typography variant="caption" style={styles.miniBadgeText}>
                        MAIN
                      </Typography>
                    </View>
                  ) : null}
                </View>
                <Typography variant="caption" style={styles.muted}>
                  {[item.weight ? `${item.weight}g` : null, item.grip_size ? `그립 ${item.grip_size}` : null]
                    .filter(Boolean)
                    .join(' · ') || '스펙 미등록'}
                </Typography>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const getDemoRacketSpecs = (item: DemoRacket) =>
  [
    item.weight ? `${item.weight}g` : null,
    item.grip_size ? `그립 ${item.grip_size}` : null,
    item.head_size ? `헤드 ${item.head_size}` : null,
  ]
    .filter(Boolean)
    .join(' · ') || '스펙 미등록';

function DemoRacketSelectPanel({
  items,
  selectedId,
  onSelect,
}: {
  items: DemoRacket[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  if (items.length === 0) {
    return (
      <View style={styles.previewPanel}>
        <Typography variant="body" style={styles.previewTitle}>
          시타 라켓 선택
        </Typography>
        <Typography variant="caption" style={styles.muted}>
          선택 가능한 항목이 없습니다.
        </Typography>
      </View>
    );
  }

  return (
    <View style={styles.previewPanel}>
      <View>
        <Typography variant="body" style={styles.previewTitle}>
          시타 라켓 선택
        </Typography>
        <Typography variant="caption" style={styles.muted}>
          시타 라켓 DB에서 선택
        </Typography>
      </View>
      <View style={styles.previewList}>
        {items.map((item) => {
          const active = selectedId === item.id;
          const itemLabel = `${item.brand} ${item.model}`;

          return (
            <Pressable
              accessibilityLabel={`시타 라켓 ${itemLabel}`}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              key={item.id}
              onPress={() => onSelect(item.id)}
              style={[styles.previewRow, active && styles.previewRowActive]}
            >
              <RadioMark active={active} />
              <View style={styles.previewRowText}>
                <Typography variant="body" style={styles.previewRowTitle}>
                  {itemLabel}
                </Typography>
                <Typography variant="caption" style={styles.muted}>
                  {getDemoRacketSpecs(item)}
                </Typography>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function StringSelectPanel({
  items,
  isHybrid,
  mainStringId,
  crossStringId,
  onSelectMain,
  onSelectCross,
}: {
  items: StringCatalogItem[];
  isHybrid: boolean;
  mainStringId: string;
  crossStringId: string;
  onSelectMain: (id: string) => void;
  onSelectCross: (id: string) => void;
}) {
  if (items.length === 0) {
    return (
      <View style={styles.previewPanel}>
        <Typography variant="body" style={styles.previewTitle}>
          스트링 선택
        </Typography>
        <Typography variant="caption" style={styles.muted}>
          선택 가능한 항목이 없습니다.
        </Typography>
      </View>
    );
  }

  return (
    <View style={styles.previewPanel}>
      <View>
        <Typography variant="body" style={styles.previewTitle}>
          스트링 선택
        </Typography>
        <Typography variant="caption" style={styles.muted}>
          {isHybrid
            ? '메인과 크로스 스트링을 각각 선택합니다.'
            : '단일 스트링을 메인/크로스에 동일 적용합니다.'}
        </Typography>
      </View>
      {isHybrid ? (
        <View style={styles.previewList}>
          <StringChoiceList
            items={items}
            label="메인 스트링"
            selectedId={mainStringId}
            onSelect={onSelectMain}
          />
          <StringChoiceList
            items={items}
            label="크로스 스트링"
            selectedId={crossStringId}
            onSelect={onSelectCross}
          />
        </View>
      ) : (
        <StringChoiceList
          items={items}
          label="단일 스트링"
          selectedId={mainStringId}
          onSelect={onSelectMain}
        />
      )}
    </View>
  );
}

function StringChoiceList({
  items,
  label,
  selectedId,
  onSelect,
}: {
  items: StringCatalogItem[];
  label: string;
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <View style={styles.stringChoiceGroup}>
      <Typography variant="caption" style={styles.choiceGroupTitle}>
        {label}
      </Typography>
      <View style={styles.previewList}>
        {items.map((item, index) => {
          const active = selectedId === item.id;
          const itemLabel = `${item.brand} ${item.name}`;

          return (
            <Pressable
              accessibilityLabel={`${label} ${itemLabel}`}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              key={`${label}-${item.id}`}
              onPress={() => onSelect(item.id)}
              style={[styles.previewRow, active && styles.previewRowActive]}
            >
              <RadioMark active={active} />
              <View style={styles.previewRowText}>
                <View style={styles.previewTitleRow}>
                  <Typography variant="body" style={styles.previewRowTitle}>
                    {itemLabel}
                  </Typography>
                  {item.recommended_style ? (
                    <View style={styles.secondaryMiniBadge}>
                      <Typography variant="caption" style={styles.secondaryMiniBadgeText}>
                        {item.recommended_style}
                      </Typography>
                    </View>
                  ) : null}
                  {index === 0 ? (
                    <View style={styles.miniBadge}>
                      <Typography variant="caption" style={styles.miniBadgeText}>
                        인기
                      </Typography>
                    </View>
                  ) : null}
                </View>
                <Typography variant="caption" style={styles.muted}>
                  {[item.gauge ? `${item.gauge}mm` : null, item.color].filter(Boolean).join(' · ') || '상세 정보 없음'}
                </Typography>
              </View>
              <Typography variant="body" style={styles.priceText}>
                {formatWon(item.price)}
              </Typography>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function TensionButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={styles.tensionRoundButton}
    >
      <Typography variant="body" style={styles.tensionRoundButtonText}>
        {label.includes('감소') ? '-' : '+'}
      </Typography>
    </Pressable>
  );
}

function TensionField({
  hint,
  label,
  value,
  onChange,
}: {
  hint: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <View style={styles.tensionField}>
      <View style={styles.tensionFieldHeader}>
        <Typography variant="caption" style={styles.tensionLabel}>
          {label}
        </Typography>
        <Typography variant="caption" style={styles.muted}>
          {hint}
        </Typography>
      </View>
      <View style={styles.tensionControlRow}>
        <TensionButton label={`${label} 텐션 감소`} onPress={() => onChange(value - 1)} />
        <View style={styles.tensionValueBox}>
          <TextInput
            accessibilityLabel={`${label} 텐션 직접 입력`}
            keyboardType="numeric"
            onChangeText={(text) => onChange(Number(text))}
            value={String(value)}
            style={styles.tensionInput}
          />
          <Typography variant="caption" style={styles.tensionUnit}>
            LB
          </Typography>
        </View>
        <TensionButton label={`${label} 텐션 증가`} onPress={() => onChange(value + 1)} />
      </View>
    </View>
  );
}

function TensionSelectPanel({
  isUniform,
  tensionMain,
  tensionCross,
  onModeChange,
  onTensionMainChange,
  onTensionCrossChange,
}: {
  isUniform: boolean;
  tensionMain: number;
  tensionCross: number;
  onModeChange: (isUniform: boolean) => void;
  onTensionMainChange: (value: number) => void;
  onTensionCrossChange: (value: number) => void;
}) {
  return (
    <View style={styles.previewPanel}>
      <View>
        <Typography variant="body" style={styles.previewTitle}>
          텐션
        </Typography>
        <Typography variant="caption" style={styles.muted}>
          {MIN_TENSION}~{MAX_TENSION} LB · 직접 입력 또는 +/- 버튼으로 조정
        </Typography>
      </View>
      <View style={styles.tensionModeTabs}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: isUniform }}
          onPress={() => onModeChange(true)}
          style={[styles.tensionModeTab, isUniform && styles.tensionModeTabActive]}
        >
          <Typography
            variant="caption"
            style={[styles.tensionModeText, isUniform && styles.tensionModeTextActive]}
          >
            균일 텐션
          </Typography>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: !isUniform }}
          onPress={() => onModeChange(false)}
          style={[styles.tensionModeTab, !isUniform && styles.tensionModeTabActive]}
        >
          <Typography
            variant="caption"
            style={[styles.tensionModeText, !isUniform && styles.tensionModeTextActive]}
          >
            하이브리드 (메인/크로스)
          </Typography>
        </Pressable>
      </View>
      {isUniform ? (
        <TensionField
          hint="메인 · 크로스 동일"
          label="텐션"
          onChange={onTensionMainChange}
          value={tensionMain}
        />
      ) : (
        <View style={styles.previewList}>
          <TensionField
            hint="세로 스트링"
            label="Main"
            onChange={onTensionMainChange}
            value={tensionMain}
          />
          <TensionField
            hint="가로 스트링"
            label="Cross"
            onChange={onTensionCrossChange}
            value={tensionCross}
          />
        </View>
      )}
      <View style={styles.tensionSummary}>
        <Typography variant="caption" style={styles.muted}>
          {isUniform
            ? `균일 · ${tensionMain} LB`
            : `하이브리드 · 메인 ${tensionMain} / 크로스 ${tensionCross} LB`}
        </Typography>
      </View>
    </View>
  );
}

function SlotPickerRow({
  items,
  label,
  minimumStartIso,
  selectedId,
  onSelect,
}: {
  items: BookingSlot[];
  label?: string;
  minimumStartIso: string;
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  if (items.length === 0) {
    return (
      <Typography variant="caption" style={styles.muted}>
        선택 가능한 항목이 없습니다.
      </Typography>
    );
  }

  return (
    <View style={styles.slotPickerGroup}>
      {label ? <Typography variant="caption">{label}</Typography> : null}
      <View style={styles.chipRow}>
        {items.map((item) => {
          const active = selectedId === item.id;
          const selectable = isSlotSelectableWithPolicy(item, minimumStartIso);

          return (
            <Pressable
              accessibilityLabel={`예약 시간 ${formatSlot(item)}`}
              accessibilityRole="button"
              accessibilityState={{ disabled: !selectable, selected: active }}
              disabled={!selectable}
              key={item.id}
              onPress={() => onSelect(item.id)}
              style={[
                styles.chip,
                active && styles.chipActive,
                !selectable && styles.disabledSlotChip,
              ]}
            >
              <Typography
                variant="caption"
                style={[
                  active && styles.chipTextActive,
                  !selectable && styles.disabledSlotText,
                ]}
              >
                {formatSlot(item)}
              </Typography>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function DemoReturnTimePicker({
  onComplete,
  options,
  selectedTime,
  onSelect,
}: {
  onComplete: () => void;
  options: string[];
  selectedTime: string;
  onSelect: (time: string) => void;
}) {
  if (options.length === 0) {
    return (
      <Typography variant="caption" style={styles.muted}>
        선택 가능한 반납 시간이 없습니다.
      </Typography>
    );
  }

  return (
    <View style={styles.slotPickerGroup} testID="demo-return-time-picker">
      <Typography variant="caption">반납 예정 시간</Typography>
      <View style={styles.chipRow}>
        {options.map((time) => {
          const active = selectedTime === time;

          return (
            <Pressable
              accessibilityLabel={`반납 예정 시간 ${time}`}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              key={time}
              onPress={() => onSelect(time)}
              style={[styles.chip, active && styles.chipActive]}
              testID={`demo-return-time-option-${time}`}
            >
              <Typography
                variant="caption"
                style={active && styles.chipTextActive}
              >
                {time}
              </Typography>
            </Pressable>
          );
        })}
      </View>
      <Button
        disabled={!selectedTime || selectedTime === '--:--'}
        onPress={onComplete}
        size="sm"
        testID="demo-return-time-complete-button"
        variant="outline"
      >
        반납 시간 완료
      </Button>
    </View>
  );
}

function DemoTimeSummary({
  label,
  testID,
  value,
}: {
  label: string;
  testID: string;
  value: string;
}) {
  return (
    <View style={styles.timeSummaryPanel} testID={testID}>
      <Typography variant="caption" style={styles.muted}>
        {label}
      </Typography>
      <Typography
        variant="h2"
        style={styles.timeSummaryValue}
        testID={`${testID}-value`}
      >
        {value}
      </Typography>
    </View>
  );
}

function DemoTimeReview({
  rentalTime,
  returnTime,
  onEditRental,
  onEditReturn,
}: {
  rentalTime: string;
  returnTime: string;
  onEditRental: () => void;
  onEditReturn: () => void;
}) {
  return (
    <View style={styles.slotPickerGroup} testID="demo-time-review">
      <DemoTimeSummary
        label="대여 예정 시간"
        testID="demo-selected-rental-time"
        value={rentalTime}
      />
      <DemoTimeSummary
        label="반납 예정 시간"
        testID="demo-selected-return-time"
        value={returnTime}
      />
      <View style={styles.twoColumn}>
        <Button
          onPress={onEditRental}
          size="sm"
          testID="demo-rental-time-back-button"
          variant="outline"
        >
          대여 시간 다시 선택
        </Button>
        <Button
          onPress={onEditReturn}
          size="sm"
          testID="demo-return-time-back-button"
          variant="outline"
        >
          반납 시간 다시 선택
        </Button>
      </View>
    </View>
  );
}

function RebookHistoryPanel({
  items,
  onSelect,
}: {
  items: RebookCandidate[];
  onSelect: (booking: ServiceBooking) => void;
}) {
  if (items.length === 0) {
    return (
      <Typography variant="caption" style={styles.muted}>
        최근 6개월 이내 다시 불러올 예약 기록이 없습니다.
      </Typography>
    );
  }

  return (
    <View style={styles.rebookList}>
      {items.map((item) => (
        <Pressable
          accessibilityLabel={`다시 예약 ${item.id} 불러오기`}
          accessibilityRole="button"
          key={item.id}
          onPress={() => onSelect(item)}
          style={styles.rebookCard}
        >
          <View style={styles.previewRowText}>
            <Typography variant="body" style={styles.previewRowTitle}>
              {getRebookStringSummary(item)}
            </Typography>
            <Typography variant="caption" style={styles.muted}>
              {getRebookTensionSummary(item)}
            </Typography>
          </View>
          <Typography variant="caption" style={styles.rebookActionText}>
            불러오기
          </Typography>
        </Pressable>
      ))}
    </View>
  );
}

function PickerRow<T extends { id: string }>({
  items,
  labelOf,
  selectedId,
  onSelect,
}: {
  items: T[];
  labelOf: (item: T) => string;
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  if (items.length === 0) {
    return (
      <Typography variant="caption" style={styles.muted}>
        선택 가능한 항목이 없습니다.
      </Typography>
    );
  }

  return (
    <View style={styles.chipRow}>
      {items.map((item) => (
        <Chip
          active={selectedId === item.id}
          key={item.id}
          onPress={() => onSelect(item.id)}
        >
          {labelOf(item)}
        </Chip>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: lightColors.background.hex,
    gap: theme.spacing[5],
    padding: theme.spacing[6],
    paddingTop: theme.spacing[12],
  },
  header: {
    gap: theme.spacing[4],
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing[2],
  },
  section: {
    backgroundColor: lightColors.card.hex,
    borderColor: lightColors.border.hex,
    borderRadius: theme.borderRadius.lg,
    borderWidth: theme.borderWidth.hairline,
    gap: theme.spacing[3],
    padding: theme.spacing[4],
  },
  sectionSubgroup: {
    gap: theme.spacing[3],
  },
  sectionTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing[3],
    justifyContent: 'space-between',
  },
  segment: {
    backgroundColor: lightColors.muted.hex,
    borderRadius: theme.borderRadius.md,
    flexDirection: 'row',
    padding: theme.spacing[1],
  },
  segmentButton: {
    alignItems: 'center',
    borderRadius: theme.borderRadius.md,
    flex: 1,
    minHeight: theme.controlHeights.sm,
    justifyContent: 'center',
  },
  segmentButtonActive: {
    backgroundColor: lightColors.primary.hex,
  },
  segmentText: {
    color: lightColors.foreground.hex,
  },
  segmentTextActive: {
    color: lightColors.primaryForeground.hex,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing[2],
  },
  slotPickerGroup: {
    gap: theme.spacing[2],
  },
  timeSummaryPanel: {
    backgroundColor: lightColors.secondary.hex,
    borderColor: lightColors.border.hex,
    borderRadius: theme.borderRadius.md,
    borderWidth: theme.borderWidth.hairline,
    gap: theme.spacing[1],
    padding: theme.spacing[3],
  },
  timeSummaryValue: {
    color: lightColors.foreground.hex,
    fontVariant: ['tabular-nums'],
  },
  previewPanel: {
    backgroundColor: lightColors.card.hex,
    borderColor: lightColors.border.hex,
    borderRadius: theme.borderRadius.lg,
    borderWidth: theme.borderWidth.hairline,
    gap: theme.spacing[3],
    padding: theme.spacing[4],
  },
  previewTitle: {
    color: lightColors.foreground.hex,
    fontFamily: theme.typography.fontFamily.display,
    fontWeight: theme.typography.fontWeight.bold,
  },
  previewList: {
    gap: theme.spacing[2],
  },
  stringChoiceGroup: {
    gap: theme.spacing[2],
  },
  choiceGroupTitle: {
    color: lightColors.foreground.hex,
    fontWeight: theme.typography.fontWeight.bold,
  },
  previewRow: {
    alignItems: 'center',
    backgroundColor: lightColors.background.hex,
    borderColor: lightColors.border.hex,
    borderRadius: theme.borderRadius.md,
    borderWidth: theme.borderWidth.hairline,
    flexDirection: 'row',
    gap: theme.spacing[3],
    padding: theme.spacing[3],
  },
  previewRowActive: {
    backgroundColor: 'rgba(16,60,40,0.05)',
    borderColor: lightColors.primary.hex,
  },
  previewRowText: {
    flex: 1,
    gap: theme.spacing[1],
    minWidth: 0,
  },
  previewTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing[1],
  },
  previewRowTitle: {
    color: lightColors.foreground.hex,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  radioOuter: {
    alignItems: 'center',
    borderColor: lightColors.mutedForeground.hex,
    borderRadius: 999,
    borderWidth: 2,
    height: 20,
    justifyContent: 'center',
    width: 20,
  },
  radioOuterActive: {
    borderColor: lightColors.primary.hex,
  },
  radioInner: {
    backgroundColor: lightColors.primary.hex,
    borderRadius: 999,
    height: 10,
    width: 10,
  },
  miniBadge: {
    backgroundColor: lightColors.accent.hex,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: theme.spacing[1],
    paddingVertical: 2,
  },
  miniBadgeText: {
    color: lightColors.accentForeground.hex,
    fontWeight: theme.typography.fontWeight.bold,
  },
  secondaryMiniBadge: {
    backgroundColor: lightColors.secondary.hex,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: theme.spacing[1],
    paddingVertical: 2,
  },
  secondaryMiniBadgeText: {
    color: lightColors.secondaryForeground.hex,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  priceText: {
    color: lightColors.foreground.hex,
    fontWeight: theme.typography.fontWeight.bold,
  },
  slotSummary: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing[2],
    justifyContent: 'space-between',
  },
  chip: {
    backgroundColor: lightColors.background.hex,
    borderColor: lightColors.border.hex,
    borderRadius: theme.borderRadius.md,
    borderWidth: theme.borderWidth.hairline,
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[2],
  },
  chipActive: {
    backgroundColor: lightColors.primary.hex,
    borderColor: lightColors.primary.hex,
  },
  chipTextActive: {
    color: lightColors.primaryForeground.hex,
  },
  disabledSlotChip: {
    backgroundColor: lightColors.secondary.hex,
    borderColor: lightColors.border.hex,
    opacity: theme.opacity.disabled,
  },
  disabledSlotText: {
    color: lightColors.mutedForeground.hex,
    textDecorationLine: 'line-through',
  },
  tensionModeTabs: {
    backgroundColor: lightColors.secondary.hex,
    borderRadius: theme.borderRadius.md,
    flexDirection: 'row',
    gap: theme.spacing[1],
    padding: theme.spacing[1],
  },
  tensionModeTab: {
    alignItems: 'center',
    borderRadius: theme.borderRadius.sm,
    flex: 1,
    minHeight: theme.controlHeights.sm,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing[2],
  },
  tensionModeTabActive: {
    backgroundColor: lightColors.card.hex,
  },
  tensionModeText: {
    color: lightColors.mutedForeground.hex,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  tensionModeTextActive: {
    color: lightColors.foreground.hex,
  },
  tensionField: {
    backgroundColor: lightColors.secondary.hex,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing[2],
    padding: theme.spacing[3],
  },
  tensionFieldHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tensionLabel: {
    color: lightColors.foreground.hex,
    fontWeight: theme.typography.fontWeight.bold,
  },
  tensionControlRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing[2],
  },
  tensionRoundButton: {
    alignItems: 'center',
    backgroundColor: lightColors.card.hex,
    borderColor: lightColors.border.hex,
    borderRadius: 999,
    borderWidth: theme.borderWidth.hairline,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  tensionRoundButtonText: {
    color: lightColors.foreground.hex,
    fontSize: 20,
    fontWeight: theme.typography.fontWeight.bold,
  },
  tensionInput: {
    color: lightColors.foreground.hex,
    flex: 1,
    fontFamily: theme.typography.fontFamily.display,
    fontSize: 22,
    fontWeight: theme.typography.fontWeight.bold,
    minWidth: 0,
    padding: 0,
    textAlign: 'center',
  },
  tensionValueBox: {
    alignItems: 'center',
    backgroundColor: lightColors.card.hex,
    borderColor: lightColors.border.hex,
    borderRadius: theme.borderRadius.md,
    borderWidth: theme.borderWidth.hairline,
    flex: 1,
    flexDirection: 'row',
    height: 40,
    minWidth: 0,
    paddingHorizontal: theme.spacing[2],
  },
  tensionUnit: {
    color: lightColors.mutedForeground.hex,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  tensionSummary: {
    backgroundColor: lightColors.secondary.hex,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing[2],
  },
  twoColumn: {
    gap: theme.spacing[3],
  },
  rebookList: {
    gap: theme.spacing[2],
  },
  rebookCard: {
    alignItems: 'center',
    backgroundColor: lightColors.background.hex,
    borderColor: lightColors.border.hex,
    borderRadius: theme.borderRadius.md,
    borderWidth: theme.borderWidth.hairline,
    flexDirection: 'row',
    gap: theme.spacing[3],
    padding: theme.spacing[3],
  },
  rebookActionText: {
    color: lightColors.primary.hex,
    fontWeight: theme.typography.fontWeight.bold,
  },
  muted: {
    color: lightColors.mutedForeground.hex,
  },
  message: {
    color: lightColors.mutedForeground.hex,
  },
});
