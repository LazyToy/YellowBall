import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';

import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Typography } from '@/components/Typography';
import { lightColors, theme } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import {
  addClosedDate,
  defaultShopSchedule,
  getClosedDates,
  getSchedule,
  removeClosedDate,
  updateSchedule,
  type ClosedDate,
  type ShopSchedule,
} from '@/services/scheduleService';

const dayLabels = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const calendarDays = 35;

const pad = (value: number) => String(value).padStart(2, '0');

const formatLocalDate = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const shortTime = (value: string) => value.slice(0, 5);

const buildUpcomingDates = () => {
  const today = new Date();

  return Array.from({ length: calendarDays }, (_, index) => {
    const nextDate = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() + index,
    );

    return {
      date: formatLocalDate(nextDate),
      dayName: dayLabels[nextDate.getDay()].slice(0, 3),
      dayNumber: String(nextDate.getDate()),
    };
  });
};

export default function AdminScheduleScreen() {
  const { profile } = useAuth();
  const actorId = profile?.id;
  const [schedule, setSchedule] = useState<ShopSchedule[]>(defaultShopSchedule);
  const [closedDates, setClosedDates] = useState<ClosedDate[]>([]);
  const [selectedDate, setSelectedDate] = useState(formatLocalDate(new Date()));
  const [closedReason, setClosedReason] = useState('');
  const [message, setMessage] = useState<string>();
  const [isBusy, setIsBusy] = useState(false);
  const upcomingDates = useMemo(buildUpcomingDates, []);

  const loadScheduleSettings = useCallback(async () => {
    const [nextSchedule, nextClosedDates] = await Promise.all([
      getSchedule(),
      getClosedDates(),
    ]);

    setSchedule(nextSchedule);
    setClosedDates(nextClosedDates);
  }, []);

  useEffect(() => {
    loadScheduleSettings().catch(() =>
      setMessage('Unable to load schedule settings.'),
    );
  }, [loadScheduleSettings]);

  const closedDateSet = useMemo(
    () => new Set(closedDates.map((entry) => entry.closed_date)),
    [closedDates],
  );

  const updateDay = (
    index: number,
    field: 'open_time' | 'close_time' | 'is_closed',
    value: string | boolean,
  ) => {
    setSchedule((current) =>
      current.map((entry, entryIndex) =>
        entryIndex === index ? { ...entry, [field]: value } : entry,
      ),
    );
  };

  const runAction = async (task: () => Promise<void>, successMessage: string) => {
    if (!actorId) {
      setMessage('Please sign in before changing schedule settings.');
      return;
    }

    try {
      setIsBusy(true);
      await task();
      await loadScheduleSettings();
      setMessage(successMessage);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to save changes.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleSaveSchedule = () =>
    runAction(
      () =>
        updateSchedule(
          actorId ?? '',
          schedule.map((entry) => ({
            day_of_week: entry.day_of_week,
            open_time: shortTime(entry.open_time),
            close_time: shortTime(entry.close_time),
            is_closed: entry.is_closed,
          })),
        ).then(() => undefined),
      'Weekly hours saved.',
    );

  const handleAddClosedDate = () =>
    runAction(
      () =>
        addClosedDate(actorId ?? '', {
          closed_date: selectedDate,
          reason: closedReason,
        }).then(() => {
          setClosedReason('');
        }),
      'Closed date added.',
    );

  const handleRemoveClosedDate = (date: string) =>
    runAction(
      () => removeClosedDate(actorId ?? '', date),
      'Closed date removed.',
    );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Typography variant="h1">Shop Schedule</Typography>
        <Typography variant="caption" style={styles.mutedText}>
          Manage weekly hours and one-off closed dates.
        </Typography>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Typography variant="h2">Weekly Hours</Typography>
          <Button disabled={isBusy} onPress={handleSaveSchedule}>
            Save hours
          </Button>
        </View>

        {schedule.map((entry, index) => (
          <View key={entry.day_of_week} style={styles.card}>
            <View style={styles.rowBetween}>
              <View style={styles.flex}>
                <Typography variant="body">{dayLabels[entry.day_of_week]}</Typography>
                <Typography variant="caption" style={styles.mutedText}>
                  {entry.is_closed
                    ? 'Closed'
                    : `${shortTime(entry.open_time)} to ${shortTime(entry.close_time)}`}
                </Typography>
              </View>
              <Badge variant={entry.is_closed ? 'outline' : 'success'}>
                {entry.is_closed ? 'Closed' : 'Open'}
              </Badge>
            </View>

            <View style={styles.timeRow}>
              <Input
                containerStyle={styles.timeInput}
                label="Open"
                onChangeText={(value) => updateDay(index, 'open_time', value)}
                placeholder="09:00"
                value={shortTime(entry.open_time)}
              />
              <Input
                containerStyle={styles.timeInput}
                label="Close"
                onChangeText={(value) => updateDay(index, 'close_time', value)}
                placeholder="18:00"
                value={shortTime(entry.close_time)}
              />
              <View style={styles.switchColumn}>
                <Typography variant="caption">Closed</Typography>
                <Switch
                  onValueChange={(value) => updateDay(index, 'is_closed', value)}
                  value={entry.is_closed}
                />
              </View>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Typography variant="h2">Closed Dates</Typography>

        <View style={styles.calendarGrid}>
          {upcomingDates.map((day) => {
            const isClosed = closedDateSet.has(day.date);
            const isSelected = selectedDate === day.date;

            return (
              <Pressable
                accessibilityLabel={`Select ${day.date}`}
                accessibilityRole="button"
                key={day.date}
                onPress={() => setSelectedDate(day.date)}
                style={[
                  styles.calendarDay,
                  isClosed && styles.calendarDayClosed,
                  isSelected && styles.calendarDaySelected,
                ]}
              >
                <Typography variant="caption" style={styles.calendarDayName}>
                  {day.dayName}
                </Typography>
                <Typography variant="body">{day.dayNumber}</Typography>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.card}>
          <Input
            label="Date"
            onChangeText={setSelectedDate}
            placeholder="YYYY-MM-DD"
            value={selectedDate}
          />
          <Input
            label="Reason"
            onChangeText={setClosedReason}
            placeholder="Holiday, maintenance, private event"
            value={closedReason}
          />
          <Button disabled={isBusy} onPress={handleAddClosedDate}>
            Add closed date
          </Button>
        </View>

        <View style={styles.section}>
          {closedDates.length === 0 ? (
            <Typography variant="caption" style={styles.mutedText}>
              No closed dates set.
            </Typography>
          ) : (
            closedDates.map((entry) => (
              <View key={entry.closed_date} style={styles.closedDateRow}>
                <View style={styles.flex}>
                  <Typography variant="body">{entry.closed_date}</Typography>
                  <Typography variant="caption" style={styles.mutedText}>
                    {entry.reason ?? 'No reason provided'}
                  </Typography>
                </View>
                <Button
                  disabled={isBusy}
                  onPress={() => handleRemoveClosedDate(entry.closed_date)}
                  size="sm"
                  variant="outline"
                >
                  Remove
                </Button>
              </View>
            ))
          )}
        </View>
      </View>

      {message ? (
        <Typography accessibilityRole="alert" variant="caption" style={styles.message}>
          {message}
        </Typography>
      ) : null}
    </ScrollView>
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
    gap: theme.spacing[2],
  },
  section: {
    gap: theme.spacing[3],
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing[3],
    justifyContent: 'space-between',
  },
  card: {
    backgroundColor: lightColors.card.hex,
    borderColor: lightColors.border.hex,
    borderRadius: theme.borderRadius.lg,
    borderWidth: theme.borderWidth.hairline,
    gap: theme.spacing[3],
    padding: theme.spacing[4],
  },
  rowBetween: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing[3],
    justifyContent: 'space-between',
  },
  flex: {
    flex: 1,
  },
  timeRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing[3],
  },
  timeInput: {
    minWidth: 120,
    width: 140,
  },
  switchColumn: {
    alignItems: 'center',
    gap: theme.spacing[2],
    minHeight: theme.controlHeights.lg,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing[2],
  },
  calendarDay: {
    alignItems: 'center',
    backgroundColor: lightColors.card.hex,
    borderColor: lightColors.border.hex,
    borderRadius: theme.borderRadius.sm,
    borderWidth: theme.borderWidth.hairline,
    gap: theme.spacing[1],
    minHeight: 58,
    paddingHorizontal: theme.spacing[2],
    paddingVertical: theme.spacing[2],
    width: 58,
  },
  calendarDayClosed: {
    backgroundColor: lightColors.warning.hex,
    borderColor: lightColors.warningBorder.hex,
  },
  calendarDaySelected: {
    borderColor: lightColors.primary.hex,
    borderWidth: 2,
  },
  calendarDayName: {
    color: lightColors.mutedForeground.hex,
  },
  closedDateRow: {
    alignItems: 'center',
    backgroundColor: lightColors.card.hex,
    borderColor: lightColors.border.hex,
    borderRadius: theme.borderRadius.lg,
    borderWidth: theme.borderWidth.hairline,
    flexDirection: 'row',
    gap: theme.spacing[3],
    justifyContent: 'space-between',
    padding: theme.spacing[4],
  },
  mutedText: {
    color: lightColors.mutedForeground.hex,
  },
  message: {
    color: lightColors.mutedForeground.hex,
  },
});
