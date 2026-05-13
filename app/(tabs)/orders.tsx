import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/AppText';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { BackButton, Pill } from '@/components/MobileUI';
import { RefreshableScrollView } from '@/components/PageRefresh';
import { Typography } from '@/components/Typography';
import { lightColors, theme } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import {
  getMyBookings,
  type ServiceBookingWithMeta,
} from '@/services/bookingService';
import { getMyShopOrders, type ShopOrder } from '@/services/shopOrderService';
import {
  getBookingRacketLabel,
  getBookingSlotLabel,
  getBookingStringLabel,
} from '@/utils/bookingDisplay';
import { serviceBookingStatusLabels } from '@/utils/bookingStatus';

type HistoryItem = {
  id: string;
  type: 'shop' | 'stringing';
  title: string;
  subtitle: string;
  detail: string;
  status: string;
  createdAt: string;
  amount?: number;
  schedule?: string;
};

const shopOrderStatusLabels: Record<string, string> = {
  cancelled: '취소',
  delivered: '배송 완료',
  paid: '결제 완료',
  pending: '결제 대기',
  preparing: '상품 준비',
  refunded: '환불 완료',
  shipping: '배송 중',
};

const formatPrice = (value: number) => `${value.toLocaleString('ko-KR')}원`;

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('ko-KR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const getOrderItemName = (item: unknown) => {
  if (typeof item === 'string') {
    return item;
  }

  if (!isRecord(item)) {
    return null;
  }

  const name = item.name ?? item.title ?? item.product_name;

  return typeof name === 'string' && name.trim() ? name.trim() : null;
};

const getOrderItemsLabel = (items: unknown[]) => {
  const names = items.map(getOrderItemName).filter(Boolean);

  if (names.length > 0) {
    return names.join(', ');
  }

  return items.length > 0 ? `상품 ${items.length}개` : '상품 내역 없음';
};

const toShopHistoryItem = (order: ShopOrder): HistoryItem => ({
  amount: order.total_amount,
  createdAt: order.created_at,
  detail: '상품 주문',
  id: `shop-${order.id}`,
  status: shopOrderStatusLabels[order.status] ?? order.status,
  subtitle: getOrderItemsLabel(order.items),
  title: order.order_number,
  type: 'shop',
});

const toStringingHistoryItem = (
  booking: ServiceBookingWithMeta,
): HistoryItem => ({
  createdAt: booking.created_at,
  detail: getBookingStringLabel(booking),
  id: `stringing-${booking.id}`,
  schedule: getBookingSlotLabel(booking),
  status:
    booking.has_cancel_request
      ? '취소 요청'
      : serviceBookingStatusLabels[booking.status],
  subtitle: getBookingRacketLabel(booking),
  title: '스트링 작업',
  type: 'stringing',
});

export default function OrdersScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const profileId = profile?.id;
  const [shopOrders, setShopOrders] = useState<ShopOrder[]>([]);
  const [serviceBookings, setServiceBookings] = useState<ServiceBookingWithMeta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<string>();

  const loadOrders = useCallback(async () => {
    if (!profileId) {
      setMessage('로그인이 필요합니다.');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const [nextShopOrders, nextServiceBookings] = await Promise.all([
        getMyShopOrders(profileId),
        getMyBookings(profileId),
      ]);
      setShopOrders(nextShopOrders);
      setServiceBookings(nextServiceBookings);
      setMessage(undefined);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : '주문내역을 불러오지 못했습니다.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const historyItems = useMemo(
    () =>
      [
        ...shopOrders.map(toShopHistoryItem),
        ...serviceBookings.map(toStringingHistoryItem),
      ].sort(
        (left, right) =>
          new Date(right.createdAt).getTime() -
          new Date(left.createdAt).getTime(),
      ),
    [serviceBookings, shopOrders],
  );

  if (isLoading) {
    return <LoadingSpinner fullScreen label="주문내역 불러오는 중" />;
  }

  return (
    <RefreshableScrollView contentContainerStyle={styles.container}>
      <View style={styles.titleRow}>
        <BackButton onPress={() => router.back()} />
        <Typography variant="h1">주문 내역</Typography>
      </View>

      {message ? (
        <Typography accessibilityRole="alert" variant="body" style={styles.muted}>
          {message}
        </Typography>
      ) : null}

      {!message && historyItems.length === 0 ? (
        <View style={styles.emptyCard}>
          <Typography variant="h2">구매/작업 내역이 없습니다.</Typography>
          <Typography variant="body" style={styles.muted}>
            샵 구매와 스트링 작업 내역이 이곳에 표시됩니다.
          </Typography>
        </View>
      ) : null}

      {historyItems.map((item) => (
        <View key={item.id} style={styles.card}>
          <View style={styles.row}>
            <View style={styles.flex}>
              <View style={styles.titleLine}>
                <Typography variant="h2">{item.title}</Typography>
                <Pill tone={item.type === 'shop' ? 'primary' : 'accent'}>
                  {item.type === 'shop' ? '상품' : '작업'}
                </Pill>
              </View>
              <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
            </View>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>

          <View style={styles.contentBlock}>
            <Text style={styles.itemText}>{item.subtitle}</Text>
            <Text style={styles.mutedText}>{item.detail}</Text>
            {item.type === 'stringing' ? (
              <Text style={styles.mutedText}>{item.schedule}</Text>
            ) : null}
          </View>

          {typeof item.amount === 'number' ? (
            <View style={styles.row}>
              <Text style={styles.mutedText}>결제 금액</Text>
              <Text style={styles.totalText}>{formatPrice(item.amount)}</Text>
            </View>
          ) : null}
        </View>
      ))}
    </RefreshableScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: lightColors.background.hex,
    flexGrow: 1,
    gap: theme.spacing[4],
    padding: theme.spacing[5],
    paddingTop: theme.spacing[12],
  },
  card: {
    backgroundColor: lightColors.card.hex,
    borderColor: lightColors.border.hex,
    borderRadius: theme.borderRadius.lg,
    borderWidth: theme.borderWidth.hairline,
    gap: theme.spacing[3],
    padding: theme.spacing[4],
  },
  emptyCard: {
    backgroundColor: lightColors.card.hex,
    borderColor: lightColors.border.hex,
    borderRadius: theme.borderRadius.lg,
    borderWidth: theme.borderWidth.hairline,
    gap: theme.spacing[2],
    padding: theme.spacing[5],
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing[3],
    justifyContent: 'space-between',
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing[2],
  },
  titleLine: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing[2],
  },
  contentBlock: {
    gap: theme.spacing[1],
  },
  dateText: {
    color: lightColors.mutedForeground.hex,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 11,
    marginTop: 2,
  },
  statusText: {
    color: lightColors.primary.hex,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 12,
    fontWeight: theme.typography.fontWeight.bold,
  },
  itemText: {
    color: lightColors.foreground.hex,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 14,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  mutedText: {
    color: lightColors.mutedForeground.hex,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 12,
    lineHeight: 17,
  },
  totalText: {
    color: lightColors.foreground.hex,
    fontFamily: theme.typography.fontFamily.display,
    fontSize: 16,
    fontWeight: theme.typography.fontWeight.bold,
  },
  flex: {
    flex: 1,
    minWidth: 0,
  },
  muted: {
    color: lightColors.mutedForeground.hex,
  },
});
