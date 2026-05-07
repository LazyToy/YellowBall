import React from 'react';
import { render, waitFor } from '@testing-library/react-native';

const mockGetMyShopOrders = jest.fn();
const mockGetMyBookings = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: jest.fn(),
  }),
}));

jest.mock('../src/hooks/useAuth', () => ({
  useAuth: () => ({
    profile: { id: 'user-1' },
  }),
}));

jest.mock('../src/services/shopOrderService', () => ({
  getMyShopOrders: mockGetMyShopOrders,
}));

jest.mock('../src/services/bookingService', () => ({
  getMyBookings: mockGetMyBookings,
}));

describe('OrdersScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetMyShopOrders.mockResolvedValue([
      {
        id: 'order-1',
        user_id: 'user-1',
        order_number: 'ORD-1',
        status: 'paid',
        total_amount: 329000,
        items: [{ name: 'Wilson Pro Staff' }],
        created_at: '2026-05-06T00:00:00.000Z',
      },
    ]);
    mockGetMyBookings.mockResolvedValue([
      {
        id: 'booking-1',
        user_id: 'user-1',
        status: 'done',
        tension_main: 48,
        tension_cross: 46,
        created_at: '2026-05-05T00:00:00.000Z',
        racket_id: 'racket-1',
        main_string_id: 'string-1',
        cross_string_id: 'string-2',
        slot_id: 'slot-1',
        user_rackets: {
          brand: 'Wilson',
          model: 'Blade',
        },
        main_string: {
          brand: 'Luxilon',
          name: 'Alu Power',
        },
        cross_string: {
          brand: 'Babolat',
          name: 'RPM Blast',
        },
        booking_slots: {
          start_time: '2026-05-05T09:00:00.000Z',
          end_time: '2026-05-05T10:00:00.000Z',
        },
      },
    ]);
  });

  test('상품 주문과 스트링 작업 내역을 함께 표시한다', async () => {
    const OrdersScreen = require('../app/(tabs)/orders').default;
    const screen = render(<OrdersScreen />);

    await waitFor(() => expect(mockGetMyShopOrders).toHaveBeenCalledWith('user-1'));
    expect(mockGetMyBookings).toHaveBeenCalledWith('user-1');
    expect(screen.getByText('ORD-1')).toBeTruthy();
    expect(screen.getByText('Wilson Pro Staff')).toBeTruthy();
    expect(screen.getByText('329,000원')).toBeTruthy();
    expect(screen.getByText('스트링 작업')).toBeTruthy();
    expect(screen.getByText('Wilson Blade')).toBeTruthy();
    expect(screen.getByText('Luxilon Alu Power / Babolat RPM Blast')).toBeTruthy();
    expect(screen.getByLabelText('뒤로 가기')).toBeTruthy();
  });
});
