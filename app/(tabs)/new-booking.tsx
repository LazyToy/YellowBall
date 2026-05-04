import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Typography } from '@/components/Typography';
import { lightColors, theme } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import {
  buildRebookPrefill,
  createBooking,
  getMyBookings,
} from '@/services/bookingService';
import { createDemoBooking } from '@/services/demoBookingService';
import { getDemoRackets } from '@/services/demoRacketService';
import { getRackets } from '@/services/racketService';
import { getAvailableSlots } from '@/services/slotService';
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

type BookingMode = 'stringing' | 'demo';

const today = () => new Date().toISOString().slice(0, 10);

const formatSlot = (slot: BookingSlot) => {
  const start = new Date(slot.start_time);
  const end = new Date(slot.end_time);

  return `${start.getUTCHours().toString().padStart(2, '0')}:${start
    .getUTCMinutes()
    .toString()
    .padStart(2, '0')} - ${end
    .getUTCHours()
    .toString()
    .padStart(2, '0')}:${end.getUTCMinutes().toString().padStart(2, '0')}`;
};

export default function NewBookingScreen() {
  const { profile } = useAuth();
  const profileId = profile?.id;
  const [mode, setMode] = useState<BookingMode>('stringing');
  const [date, setDate] = useState(today());
  const [rackets, setRackets] = useState<UserRacket[]>([]);
  const [demoRackets, setDemoRackets] = useState<DemoRacket[]>([]);
  const [strings, setStrings] = useState<StringCatalogItem[]>([]);
  const [slots, setSlots] = useState<BookingSlot[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [previousBookings, setPreviousBookings] = useState<ServiceBooking[]>([]);
  const [selectedRacketId, setSelectedRacketId] = useState('');
  const [selectedDemoRacketId, setSelectedDemoRacketId] = useState('');
  const [mainStringId, setMainStringId] = useState('');
  const [crossStringId, setCrossStringId] = useState('');
  const [tensionMain, setTensionMain] = useState('48');
  const [tensionCross, setTensionCross] = useState('48');
  const [slotId, setSlotId] = useState('');
  const [deliveryMethod, setDeliveryMethod] =
    useState<ServiceDeliveryMethod>('store_pickup');
  const [addressId, setAddressId] = useState('');
  const [expectedReturnTime, setExpectedReturnTime] = useState('');
  const [userNotes, setUserNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string>();

  const loadBaseData = useCallback(async () => {
    if (!profileId) {
      return;
    }

    const [racketRows, stringRows, addressRows, previousRows, demoRows] =
      await Promise.all([
        getRackets(profileId),
        getActiveStrings(),
        getAddresses(profileId),
        getMyBookings(profileId),
        getDemoRackets(),
      ]);

    setRackets(racketRows);
    setStrings(stringRows);
    setAddresses(addressRows);
    setPreviousBookings(previousRows);
    setDemoRackets(demoRows);
    setSelectedRacketId((current) => current || racketRows[0]?.id || '');
    setSelectedDemoRacketId((current) => current || demoRows[0]?.id || '');
    setMainStringId((current) => current || stringRows[0]?.id || '');
    setCrossStringId((current) => current || stringRows[0]?.id || '');
    setAddressId((current) => current || addressRows.find((item) => item.is_default)?.id || '');
  }, [profileId]);

  const loadSlots = useCallback(async () => {
    const slotRows = await getAvailableSlots(date, mode);
    setSlots(slotRows);
    setSlotId((current) =>
      current && slotRows.some((slot) => slot.id === current)
        ? current
        : slotRows[0]?.id || '',
    );
  }, [date, mode]);

  useEffect(() => {
    loadBaseData().catch(() => setMessage('예약 데이터를 불러오지 못했습니다.'));
  }, [loadBaseData]);

  useEffect(() => {
    loadSlots().catch(() => setMessage('예약 가능한 시간을 불러오지 못했습니다.'));
  }, [loadSlots]);

  const selectedSlot = useMemo(
    () => slots.find((slot) => slot.id === slotId),
    [slotId, slots],
  );

  useEffect(() => {
    if (
      mode !== 'demo' ||
      !selectedSlot ||
      selectedSlot.service_type !== 'demo' ||
      expectedReturnTime
    ) {
      return;
    }

    setExpectedReturnTime(selectedSlot.end_time);
  }, [expectedReturnTime, mode, selectedSlot]);

  const applyRebook = (booking: ServiceBooking) => {
    const prefill = buildRebookPrefill(booking);

    setMode('stringing');
    setSelectedRacketId(prefill.racket_id);
    setMainStringId(prefill.main_string_id);
    setCrossStringId(prefill.cross_string_id);
    setTensionMain(String(prefill.tension_main));
    setTensionCross(String(prefill.tension_cross));
    setDeliveryMethod(prefill.delivery_method);
    setAddressId(prefill.address_id ?? '');
    setMessage('이전 예약 설정을 불러왔습니다. 날짜와 시간만 새로 선택하세요.');
  };

  const handleSubmit = async () => {
    if (!profileId) {
      setMessage('로그인이 필요합니다.');
      return;
    }

    if (!slotId) {
      setMessage('예약 시간을 선택하세요.');
      return;
    }

    setIsLoading(true);
    setMessage(undefined);

    try {
      if (mode === 'stringing') {
        await createBooking({
          userId: profileId,
          racketId: selectedRacketId,
          mainStringId,
          crossStringId,
          tensionMain: Number(tensionMain),
          tensionCross: Number(tensionCross),
          slotId,
          deliveryMethod,
          addressId: addressId || null,
          userNotes,
        });
        setMessage('스트링 예약이 접수되었습니다.');
      } else {
        await createDemoBooking({
          userId: profileId,
          demoRacketId: selectedDemoRacketId,
          slotId,
          expectedReturnTime,
          userNotes,
        });
        setMessage('시타 예약이 접수되었습니다.');
      }

      await loadSlots();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '예약 생성 실패');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Typography variant="h1">새 예약</Typography>
        <View style={styles.segment}>
          <ModeButton active={mode === 'stringing'} onPress={() => setMode('stringing')}>
            스트링
          </ModeButton>
          <ModeButton active={mode === 'demo'} onPress={() => setMode('demo')}>
            시타
          </ModeButton>
        </View>
      </View>

      {mode === 'stringing' ? (
        <View style={styles.section}>
          <Typography variant="h2">1. 라켓</Typography>
          <PickerRow
            items={rackets}
            labelOf={(item) => `${item.brand} ${item.model}`}
            selectedId={selectedRacketId}
            onSelect={setSelectedRacketId}
          />

          <Typography variant="h2">2. 스트링</Typography>
          <PickerRow
            items={strings}
            labelOf={(item) => `${item.brand} ${item.name}`}
            selectedId={mainStringId}
            onSelect={setMainStringId}
          />
          <PickerRow
            items={strings}
            labelOf={(item) => `크로스 ${item.brand} ${item.name}`}
            selectedId={crossStringId}
            onSelect={setCrossStringId}
          />

          <Typography variant="h2">3. 텐션</Typography>
          <View style={styles.twoColumn}>
            <Input
              keyboardType="numeric"
              label="메인 텐션"
              onChangeText={setTensionMain}
              value={tensionMain}
            />
            <Input
              keyboardType="numeric"
              label="크로스 텐션"
              onChangeText={setTensionCross}
              value={tensionCross}
            />
          </View>

          <Typography variant="h2">다시 예약</Typography>
          <PickerRow
            items={previousBookings.slice(0, 3)}
            labelOf={(item) => `이전 설정 ${item.tension_main}/${item.tension_cross} lbs`}
            selectedId=""
            onSelect={(id) => {
              const booking = previousBookings.find((item) => item.id === id);
              if (booking) {
                applyRebook(booking);
              }
            }}
          />
        </View>
      ) : (
        <View style={styles.section}>
          <Typography variant="h2">1. 시타 라켓</Typography>
          <PickerRow
            items={demoRackets}
            labelOf={(item) => `${item.brand} ${item.model}`}
            selectedId={selectedDemoRacketId}
            onSelect={setSelectedDemoRacketId}
          />
        </View>
      )}

      <View style={styles.section}>
        <Typography variant="h2">{mode === 'stringing' ? '4' : '2'}. 날짜/시간</Typography>
        <Input label="날짜" onChangeText={setDate} placeholder="YYYY-MM-DD" value={date} />
        <PickerRow
          items={slots}
          labelOf={(item) => formatSlot(item)}
          selectedId={slotId}
          onSelect={setSlotId}
        />
        {mode === 'demo' ? (
          <Input
            label="반납 예정 시간"
            onChangeText={setExpectedReturnTime}
            placeholder="2026-05-04T12:00:00.000Z"
            value={expectedReturnTime}
          />
        ) : null}
      </View>

      {mode === 'stringing' ? (
        <View style={styles.section}>
          <Typography variant="h2">5. 수령 방식</Typography>
          <View style={styles.chipRow}>
            {(['store_pickup', 'local_quick', 'parcel'] as ServiceDeliveryMethod[]).map(
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

      <View style={styles.section}>
        <Typography variant="h2">{mode === 'stringing' ? '6' : '3'}. 메모</Typography>
        <Input
          label="요청사항"
          multiline
          onChangeText={setUserNotes}
          value={userNotes}
        />
        <Button loading={isLoading} onPress={handleSubmit}>
          예약 접수
        </Button>
        {message ? (
          <Typography accessibilityRole="alert" variant="caption" style={styles.message}>
            {message}
          </Typography>
        ) : null}
      </View>
    </ScrollView>
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
  section: {
    backgroundColor: lightColors.card.hex,
    borderColor: lightColors.border.hex,
    borderRadius: theme.borderRadius.lg,
    borderWidth: theme.borderWidth.hairline,
    gap: theme.spacing[3],
    padding: theme.spacing[4],
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
  twoColumn: {
    gap: theme.spacing[3],
  },
  muted: {
    color: lightColors.mutedForeground.hex,
  },
  message: {
    color: lightColors.mutedForeground.hex,
  },
});
