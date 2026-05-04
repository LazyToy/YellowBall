import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Typography } from '@/components/Typography';
import { lightColors, theme } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import {
  blockSlot,
  generateSlots,
  getSlots,
  unblockSlot,
} from '@/services/slotService';
import type { BookingServiceType, BookingSlot } from '@/types/database';

const pad = (value: number) => String(value).padStart(2, '0');
const today = () => {
  const date = new Date();

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const serviceTypeOptions: BookingServiceType[] = ['stringing', 'demo'];

const formatSlotTime = (value: string) => value.slice(11, 16);

export default function AdminSlotsScreen() {
  const { profile } = useAuth();
  const actorId = profile?.id;
  const [date, setDate] = useState(today());
  const [serviceType, setServiceType] = useState<BookingServiceType>('stringing');
  const [durationMin, setDurationMin] = useState('60');
  const [capacity, setCapacity] = useState('1');
  const [blockReason, setBlockReason] = useState('');
  const [slots, setSlots] = useState<BookingSlot[]>([]);
  const [message, setMessage] = useState<string>();
  const [isBusy, setIsBusy] = useState(false);

  const loadSlots = useCallback(async () => {
    setSlots(await getSlots(date, serviceType));
  }, [date, serviceType]);

  useEffect(() => {
    loadSlots().catch(() => setMessage('Unable to load booking slots.'));
  }, [loadSlots]);

  const runAdminAction = async (
    task: () => Promise<void>,
    successMessage: string,
  ) => {
    if (!actorId) {
      setMessage('Please sign in before managing booking slots.');
      return;
    }

    try {
      setIsBusy(true);
      await task();
      await loadSlots();
      setMessage(successMessage);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to update slots.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleGenerateSlots = () =>
    runAdminAction(
      () =>
        generateSlots(
          actorId ?? '',
          date,
          serviceType,
          Number(durationMin),
          Number(capacity),
        ).then((created) => {
          setSlots(created);
        }),
      'Slots generated.',
    );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Typography variant="h1">Booking Slots</Typography>
        <Typography variant="body" style={styles.muted}>
          Generate, block, and reopen reservation slots.
        </Typography>
      </View>

      <View style={styles.card}>
        <Input label="Date" onChangeText={setDate} placeholder="YYYY-MM-DD" value={date} />
        <View style={styles.chipRow}>
          {serviceTypeOptions.map((option) => (
            <ServiceChip
              key={option}
              label={option}
              selected={serviceType === option}
              onPress={() => setServiceType(option)}
            />
          ))}
        </View>
        <View style={styles.inputRow}>
          <Input
            containerStyle={styles.shortInput}
            keyboardType="numeric"
            label="Duration"
            onChangeText={setDurationMin}
            value={durationMin}
          />
          <Input
            containerStyle={styles.shortInput}
            keyboardType="numeric"
            label="Capacity"
            onChangeText={setCapacity}
            value={capacity}
          />
        </View>
        <Button disabled={isBusy} onPress={handleGenerateSlots}>
          Generate slots
        </Button>
      </View>

      <View style={styles.section}>
        <View style={styles.rowBetween}>
          <Typography variant="h2">Slots</Typography>
          <Button disabled={isBusy} onPress={loadSlots} size="sm" variant="outline">
            Refresh
          </Button>
        </View>
        <Input
          label="Block reason"
          onChangeText={setBlockReason}
          placeholder="Lunch break, staff training"
          value={blockReason}
        />

        {slots.length === 0 ? (
          <View style={styles.emptyState}>
            <Typography variant="body">No slots.</Typography>
          </View>
        ) : null}

        {slots.map((slot) => (
          <View key={slot.id} style={styles.card}>
            <View style={styles.rowBetween}>
              <View style={styles.flex}>
                <Typography variant="body">
                  {formatSlotTime(slot.start_time)} to {formatSlotTime(slot.end_time)}
                </Typography>
                <Typography variant="caption" style={styles.muted}>
                  {slot.reserved_count}/{slot.capacity} reserved
                </Typography>
              </View>
              <Badge variant={slot.is_blocked ? 'warning' : 'success'}>
                {slot.is_blocked ? 'Blocked' : 'Open'}
              </Badge>
            </View>
            {slot.block_reason ? (
              <Typography variant="caption" style={styles.muted}>
                {slot.block_reason}
              </Typography>
            ) : null}
            <View style={styles.actions}>
              <Button
                disabled={isBusy || slot.is_blocked}
                onPress={() =>
                  runAdminAction(
                    () => blockSlot(actorId ?? '', slot.id, blockReason).then(() => undefined),
                    'Slot blocked.',
                  )
                }
                size="sm"
                variant="outline"
              >
                Block
              </Button>
              <Button
                disabled={isBusy || !slot.is_blocked}
                onPress={() =>
                  runAdminAction(
                    () => unblockSlot(actorId ?? '', slot.id).then(() => undefined),
                    'Slot reopened.',
                  )
                }
                size="sm"
                variant="outline"
              >
                Reopen
              </Button>
            </View>
          </View>
        ))}
      </View>

      {message ? (
        <Typography accessibilityRole="alert" variant="caption" style={styles.message}>
          {message}
        </Typography>
      ) : null}
    </ScrollView>
  );
}

function ServiceChip({
  label,
  onPress,
  selected,
}: {
  label: string;
  onPress: () => void;
  selected: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.chipSelected,
        pressed && styles.pressed,
      ]}
    >
      <Typography
        variant="caption"
        style={[styles.chipText, selected && styles.chipTextSelected]}
      >
        {label}
      </Typography>
    </Pressable>
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
  inputRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing[3],
  },
  shortInput: {
    minWidth: 120,
    width: 140,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing[2],
  },
  chip: {
    backgroundColor: lightColors.card.hex,
    borderColor: lightColors.border.hex,
    borderRadius: theme.borderRadius.md,
    borderWidth: theme.borderWidth.hairline,
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[2],
  },
  chipSelected: {
    backgroundColor: lightColors.primary.hex,
    borderColor: lightColors.primary.hex,
  },
  chipText: {
    color: lightColors.foreground.hex,
  },
  chipTextSelected: {
    color: lightColors.primaryForeground.hex,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing[2],
  },
  emptyState: {
    backgroundColor: lightColors.card.hex,
    borderColor: lightColors.border.hex,
    borderRadius: theme.borderRadius.lg,
    borderWidth: theme.borderWidth.hairline,
    padding: theme.spacing[4],
  },
  flex: {
    flex: 1,
  },
  muted: {
    color: lightColors.mutedForeground.hex,
  },
  message: {
    color: lightColors.destructive.hex,
  },
  pressed: {
    opacity: theme.opacity.pressed,
  },
});
