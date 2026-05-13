import React, { useMemo, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  type StyleProp,
  View,
  type ViewStyle,
} from 'react-native';

import { lightColors, theme } from '@/constants/theme';
import {
  formatKstDateKey,
  formatKstTime,
  getMinimumTimeForKstDate,
  isPastIsoDateTime,
  kstDateAndTimeToIso,
} from '@/utils/kstDateTime';
import type { CalendarDateStatus } from '@/utils/bookingCalendarStatus';
import { Typography } from './Typography';

const weekdayLabels = ['일', '월', '화', '수', '목', '금', '토'];

const pad = (value: number) => String(value).padStart(2, '0');

export const formatDateKey = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const parseDateKey = (value?: string | null) => {
  if (!value) {
    return null;
  }

  const [year, month, day] = value.split('-').map(Number);

  if (!year || !month || !day) {
    return null;
  }

  return new Date(year, month - 1, day);
};

const parseDateTime = (value?: string | null) => {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
};

const formatMonthLabel = (date: Date) =>
  `${date.getFullYear()}.${pad(date.getMonth() + 1)}`;

const monthOptions = Array.from({ length: 12 }, (_, index) => index);

const getYearOptions = (year: number) =>
  Array.from({ length: 7 }, (_, index) => year - 3 + index);

const getMonthCells = (viewDate: Date) => {
  const firstDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const daysInMonth = new Date(
    viewDate.getFullYear(),
    viewDate.getMonth() + 1,
    0,
  ).getDate();
  const leading = firstDate.getDay();

  return Array.from({ length: 42 }, (_, index) => {
    const dayNumber = index - leading + 1;

    if (dayNumber < 1 || dayNumber > daysInMonth) {
      return null;
    }

    const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), dayNumber);

    return {
      date,
      dayNumber,
      key: formatDateKey(date),
    };
  });
};

const chunkWeekRows = <T,>(items: T[]) =>
  Array.from({ length: Math.ceil(items.length / 7) }, (_, rowIndex) =>
    items.slice(rowIndex * 7, rowIndex * 7 + 7),
  );

const buildTimeOptions = (startHour: number, endHour: number, minuteStep: number) => {
  const options: string[] = [];

  for (let hour = startHour; hour <= endHour; hour += 1) {
    for (let minute = 0; minute < 60; minute += minuteStep) {
      options.push(`${pad(hour)}:${pad(minute)}`);
    }
  }

  return options;
};

const combineDateTime = (dateKey: string, time: string) => {
  return kstDateAndTimeToIso(dateKey, time);
};

export type CalendarPickerProps = {
  label?: string;
  selectedDate: string;
  onSelectDate: (date: string) => void;
  markedDates?: ReadonlySet<string>;
  minDate?: string;
  maxDate?: string;
  getDateStatus?: (date: string) => CalendarDateStatus | null;
  showStatusLegend?: boolean;
};

export function CalendarPicker({
  label,
  getDateStatus,
  markedDates,
  maxDate,
  minDate,
  onSelectDate,
  selectedDate,
  showStatusLegend = false,
}: CalendarPickerProps) {
  const initialDate = parseDateKey(selectedDate) ?? new Date();
  const [viewDate, setViewDate] = useState(
    new Date(initialDate.getFullYear(), initialDate.getMonth(), 1),
  );
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const monthCells = useMemo(() => getMonthCells(viewDate), [viewDate]);
  const monthRows = useMemo(() => chunkWeekRows(monthCells), [monthCells]);
  const yearOptions = useMemo(
    () => getYearOptions(viewDate.getFullYear()),
    [viewDate],
  );
  const minDateKey = minDate ?? null;
  const maxDateKey = maxDate ?? null;
  const todayKey = formatDateKey(new Date());

  const moveMonth = (delta: number) => {
    setViewDate((current) => {
      const next = new Date(current);
      next.setMonth(current.getMonth() + delta);
      return next;
    });
  };

  return (
    <View style={styles.container}>
      {label ? <Typography variant="caption">{label}</Typography> : null}
      <View style={styles.calendarCard}>
        <View style={styles.header}>
        <Pressable
          accessibilityLabel="이전 달"
          accessibilityRole="button"
          onPress={() => moveMonth(-1)}
          style={styles.navButton}
        >
          <Typography variant="body" style={styles.navButtonText}>
            {'<'}
          </Typography>
        </Pressable>
        <Pressable
          accessibilityLabel="년월 선택"
          accessibilityRole="button"
          accessibilityState={{ expanded: isMonthPickerOpen }}
          onPress={() => setIsMonthPickerOpen((current) => !current)}
          style={styles.monthTrigger}
        >
          <Typography variant="body" style={styles.monthLabel}>
            {formatMonthLabel(viewDate)}
          </Typography>
        </Pressable>
        <Pressable
          accessibilityLabel="다음 달"
          accessibilityRole="button"
          onPress={() => moveMonth(1)}
          style={styles.navButton}
        >
          <Typography variant="body" style={styles.navButtonText}>
            {'>'}
          </Typography>
        </Pressable>
        </View>
        {isMonthPickerOpen ? (
          <View style={styles.monthPicker}>
            <Typography variant="caption" style={styles.pickerSubheading}>
              년도
            </Typography>
            <View style={styles.yearGrid}>
              {yearOptions.map((year) => {
                const active = year === viewDate.getFullYear();

                return (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    key={year}
                    onPress={() =>
                      setViewDate(
                        new Date(year, viewDate.getMonth(), 1),
                      )
                    }
                    style={[
                      styles.yearOption,
                      active && styles.dateOptionActive,
                    ]}
                  >
                    <Typography
                      variant="caption"
                      style={[
                        styles.dateOptionText,
                        active && styles.dateOptionTextActive,
                      ]}
                    >
                      {year}년
                    </Typography>
                  </Pressable>
                );
              })}
            </View>
            <Typography variant="caption" style={styles.pickerSubheading}>
              월 선택
            </Typography>
            <View style={styles.monthGrid}>
              {monthOptions.map((month) => {
                const active = month === viewDate.getMonth();

                return (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    key={month}
                    onPress={() => {
                      setViewDate(new Date(viewDate.getFullYear(), month, 1));
                      setIsMonthPickerOpen(false);
                    }}
                    style={[
                      styles.monthOption,
                      active && styles.dateOptionActive,
                    ]}
                  >
                    <Typography
                      variant="caption"
                      style={[
                        styles.dateOptionText,
                        active && styles.dateOptionTextActive,
                      ]}
                    >
                      {month + 1}월
                    </Typography>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}
        <View style={styles.weekRow}>
        {weekdayLabels.map((weekday, index) => (
          <Typography
            key={weekday}
            variant="caption"
            style={[
              styles.weekday,
              index === 0 && styles.sundayText,
              index === 6 && styles.saturdayText,
            ]}
          >
            {weekday}
          </Typography>
        ))}
        </View>
        <View style={styles.grid}>
        {monthRows.map((week, weekIndex) => (
          <View key={`week-${weekIndex}`} style={styles.calendarRow}>
            {week.map((cell, dayIndex) => {
              const isDisabled =
                !cell ||
                Boolean(minDateKey && cell.key < minDateKey) ||
                Boolean(maxDateKey && cell.key > maxDateKey);
              const isSelected = cell?.key === selectedDate;
              const isMarked = Boolean(cell && markedDates?.has(cell.key));
              const isToday = cell?.key === todayKey;
              const dateStatus = cell ? getDateStatus?.(cell.key) ?? null : null;

              return (
                <Pressable
                  accessibilityLabel={cell ? `Select ${cell.key}` : undefined}
                  accessibilityRole={cell ? 'button' : undefined}
                  accessibilityState={{ disabled: isDisabled, selected: isSelected }}
                  disabled={isDisabled}
                  key={cell?.key ?? `empty-${weekIndex}-${dayIndex}`}
                  onPress={() => {
                    if (cell) {
                      onSelectDate(cell.key);
                    }
                  }}
                  style={[
                    styles.day,
                    !cell && styles.emptyDay,
                    isMarked && styles.markedDay,
                    isToday && !isSelected && styles.todayDay,
                    isSelected && styles.selectedDay,
                    isDisabled && cell && styles.disabledDay,
                  ]}
                >
                  {cell ? (
                    <>
                      <Typography
                        variant="caption"
                        style={[
                          styles.dayText,
                          isSelected && styles.selectedDayText,
                          isDisabled && styles.disabledDayText,
                        ]}
                      >
                        {cell.dayNumber}
                      </Typography>
                      <View
                        style={[
                          styles.dayDot,
                          !isDisabled && !dateStatus && styles.openDayDot,
                          dateStatus === 'normal' && styles.normalDayDot,
                          dateStatus === 'closed' && styles.closedDayDot,
                          dateStatus === 'ended' && styles.endedDayDot,
                          isMarked && styles.markedDayDot,
                          isSelected && styles.selectedDayDot,
                        ]}
                      />
                    </>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        ))}
        </View>
        {showStatusLegend ? (
          <View style={styles.legendRow}>
            <LegendItem colorStyle={styles.normalDayDot} label="정상영업" />
            <LegendItem colorStyle={styles.closedDayDot} label="휴무" />
            <LegendItem colorStyle={styles.endedDayDot} label="영업종료" />
          </View>
        ) : null}
      </View>
    </View>
  );
}

function LegendItem({
  colorStyle,
  label,
}: {
  colorStyle: StyleProp<ViewStyle>;
  label: string;
}) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, colorStyle]} />
      <Typography variant="caption" style={styles.legendText}>
        {label}
      </Typography>
    </View>
  );
}

export type TimePickerProps = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  startHour?: number;
  endHour?: number;
  minuteStep?: number;
  minTime?: string | null;
  maxTime?: string | null;
  minSelectableTime?: string | null;
};

export function TimePicker({
  disabled = false,
  endHour = 23,
  label,
  maxTime,
  minuteStep = 30,
  minSelectableTime,
  minTime,
  onChange,
  startHour = 0,
  value,
}: TimePickerProps) {
  const [expanded, setExpanded] = useState(false);
  const options = useMemo(
    () =>
      buildTimeOptions(startHour, endHour, minuteStep).filter(
        (option) =>
          (!minSelectableTime || option >= minSelectableTime) &&
          (!minTime || option > minTime) &&
          (!maxTime || option <= maxTime),
      ),
    [endHour, maxTime, minSelectableTime, minTime, minuteStep, startHour],
  );

  return (
    <View style={[styles.container, disabled && styles.disabledPicker]}>
      {label ? <Typography variant="caption">{label}</Typography> : null}
      <Pressable
        accessibilityLabel={label ?? 'Time'}
        accessibilityRole="button"
        accessibilityState={{ disabled, expanded }}
        disabled={disabled}
        onPress={() => setExpanded((current) => !current)}
        style={[styles.timeTrigger, disabled && styles.disabledDay]}
      >
        <Typography variant="body" style={styles.timeTriggerText}>
          {value.slice(0, 5) || '--:--'}
        </Typography>
      </Pressable>
      {expanded ? (
        <View style={styles.timeGrid}>
          {options.map((option) => {
            const isSelected = value.slice(0, 5) === option;

            return (
              <Pressable
                accessibilityLabel={`${label ?? 'Time'} ${option}`}
                accessibilityRole="button"
                accessibilityState={{ disabled, selected: isSelected }}
                disabled={disabled}
                key={option}
                onPress={() => {
                  onChange(option);
                  setExpanded(false);
                }}
                style={[
                  styles.timeOption,
                  isSelected && styles.selectedTimeOption,
                  disabled && styles.disabledDay,
                ]}
              >
                <Typography
                  variant="caption"
                  style={[
                    styles.timeOptionText,
                    isSelected && styles.selectedDayText,
                    disabled && styles.disabledDayText,
                  ]}
                >
                  {option}
                </Typography>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

export type DateTimeCalendarPickerProps = {
  label?: string;
  timeLabel?: string;
  value: string;
  onChange: (value: string) => void;
  minDate?: string;
  maxDate?: string;
  startHour?: number;
  endHour?: number;
  minuteStep?: number;
  minDateTime?: string;
  maxTime?: string | null;
  minSelectableTime?: string | null;
};

export function DateTimeCalendarPicker({
  endHour = 23,
  label,
  maxTime,
  maxDate,
  minDate,
  minDateTime,
  minSelectableTime,
  minuteStep = 30,
  onChange,
  startHour = 0,
  timeLabel,
  value,
}: DateTimeCalendarPickerProps) {
  const parsed = parseDateTime(value) ?? new Date();
  const selectedDate = formatKstDateKey(parsed);
  const selectedTime = formatKstTime(parsed.toISOString());
  const minDateKey = minDateTime
    ? formatKstDateKey(parseDateTime(minDateTime) ?? new Date())
    : minDate;
  const minTime = minDateTime
    ? getMinimumTimeForKstDate(selectedDate, parseDateTime(minDateTime) ?? new Date())
    : null;

  const handleChange = (nextValue: string) => {
    if (minDateTime && isPastIsoDateTime(nextValue, new Date(minDateTime))) {
      return;
    }

    onChange(nextValue);
  };

  return (
    <View style={styles.dateTimeContainer}>
      {label ? <Typography variant="caption">{label}</Typography> : null}
      <CalendarPicker
        maxDate={maxDate}
        minDate={minDateKey}
        onSelectDate={(date) => handleChange(combineDateTime(date, selectedTime))}
        selectedDate={selectedDate}
      />
      <TimePicker
        endHour={endHour}
        label={timeLabel}
        maxTime={maxTime}
        minSelectableTime={minSelectableTime}
        minTime={minTime}
        minuteStep={minuteStep}
        onChange={(time) => handleChange(combineDateTime(selectedDate, time))}
        startHour={startHour}
        value={selectedTime}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing[2],
  },
  calendarCard: {
    backgroundColor: lightColors.card.hex,
    borderColor: lightColors.border.hex,
    borderRadius: theme.borderRadius.lg,
    borderWidth: theme.borderWidth.hairline,
    gap: theme.spacing[3],
    padding: theme.spacing[4],
  },
  dateTimeContainer: {
    gap: theme.spacing[3],
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  navButton: {
    alignItems: 'center',
    backgroundColor: lightColors.background.hex,
    borderColor: lightColors.border.hex,
    borderRadius: theme.borderRadius.md,
    borderWidth: theme.borderWidth.hairline,
    height: theme.controlHeights.md,
    justifyContent: 'center',
    width: theme.controlHeights.md,
  },
  navButtonText: {
    color: lightColors.foreground.hex,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  monthLabel: {
    fontFamily: theme.typography.fontFamily.display,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  monthTrigger: {
    alignItems: 'center',
    borderRadius: theme.borderRadius.md,
    minHeight: theme.controlHeights.md,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing[3],
  },
  monthPicker: {
    backgroundColor: lightColors.background.hex,
    borderColor: lightColors.border.hex,
    borderRadius: theme.borderRadius.md,
    borderWidth: theme.borderWidth.hairline,
    gap: theme.spacing[2],
    padding: theme.spacing[3],
  },
  pickerSubheading: {
    color: lightColors.mutedForeground.hex,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  yearGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing[2],
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing[2],
  },
  yearOption: {
    alignItems: 'center',
    backgroundColor: lightColors.card.hex,
    borderColor: lightColors.border.hex,
    borderRadius: theme.borderRadius.sm,
    borderWidth: theme.borderWidth.hairline,
    minHeight: theme.controlHeights.sm,
    minWidth: 70,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing[2],
  },
  monthOption: {
    alignItems: 'center',
    backgroundColor: lightColors.card.hex,
    borderColor: lightColors.border.hex,
    borderRadius: theme.borderRadius.sm,
    borderWidth: theme.borderWidth.hairline,
    minHeight: theme.controlHeights.sm,
    width: 58,
    justifyContent: 'center',
  },
  dateOptionActive: {
    backgroundColor: lightColors.primary.hex,
    borderColor: lightColors.primary.hex,
  },
  dateOptionText: {
    color: lightColors.foreground.hex,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  dateOptionTextActive: {
    color: lightColors.primaryForeground.hex,
  },
  weekRow: {
    flexDirection: 'row',
  },
  weekday: {
    flex: 1,
    fontWeight: theme.typography.fontWeight.semibold,
    textAlign: 'center',
  },
  sundayText: {
    color: lightColors.destructive.hex,
  },
  saturdayText: {
    color: lightColors.primary.hex,
  },
  grid: {
    gap: theme.spacing[1],
  },
  calendarRow: {
    flexDirection: 'row',
    gap: theme.spacing[1],
  },
  day: {
    alignItems: 'center',
    aspectRatio: 1,
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    borderRadius: theme.borderRadius.md,
    borderWidth: theme.borderWidth.hairline,
    flex: 1,
    gap: 2,
    justifyContent: 'center',
  },
  emptyDay: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  markedDay: {
    backgroundColor: lightColors.accent.hex,
    borderColor: lightColors.accent.hex,
  },
  todayDay: {
    borderColor: lightColors.primary.hex,
  },
  selectedDay: {
    backgroundColor: lightColors.primary.hex,
    borderColor: lightColors.primary.hex,
  },
  disabledDay: {
    opacity: theme.opacity.disabled,
  },
  dayText: {
    color: lightColors.foreground.hex,
  },
  selectedDayText: {
    color: lightColors.primaryForeground.hex,
  },
  disabledDayText: {
    color: lightColors.mutedForeground.hex,
  },
  dayDot: {
    backgroundColor: 'transparent',
    borderRadius: 2,
    height: 4,
    width: 4,
  },
  openDayDot: {
    backgroundColor: lightColors.primary.hex,
  },
  normalDayDot: {
    backgroundColor: '#16A34A',
  },
  closedDayDot: {
    backgroundColor: lightColors.mutedForeground.hex,
  },
  endedDayDot: {
    backgroundColor: lightColors.destructive.hex,
  },
  markedDayDot: {
    backgroundColor: lightColors.accentForeground.hex,
  },
  selectedDayDot: {
    backgroundColor: lightColors.primaryForeground.hex,
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing[3],
  },
  legendItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing[1],
  },
  legendDot: {
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  legendText: {
    color: lightColors.mutedForeground.hex,
  },
  disabledPicker: {
    opacity: theme.opacity.disabled,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing[2],
  },
  timeTrigger: {
    alignItems: 'center',
    backgroundColor: lightColors.background.hex,
    borderColor: lightColors.border.hex,
    borderRadius: theme.borderRadius.sm,
    borderWidth: theme.borderWidth.hairline,
    minHeight: theme.controlHeights.lg,
    paddingHorizontal: theme.spacing[3],
    justifyContent: 'center',
  },
  timeTriggerText: {
    fontWeight: theme.typography.fontWeight.semibold,
  },
  timeOption: {
    alignItems: 'center',
    backgroundColor: lightColors.background.hex,
    borderColor: lightColors.border.hex,
    borderRadius: theme.borderRadius.sm,
    borderWidth: theme.borderWidth.hairline,
    minHeight: theme.controlHeights.sm,
    minWidth: 68,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing[2],
  },
  selectedTimeOption: {
    backgroundColor: lightColors.primary.hex,
    borderColor: lightColors.primary.hex,
  },
  timeOptionText: {
    color: lightColors.foreground.hex,
  },
});
