import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

const mockPush = jest.fn();
const mockGetMyBookings = jest.fn();
const mockGetMyDemoBookings = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock('../src/hooks/useAuth', () => ({
  useAuth: () => ({
    profile: { id: 'user-1' },
  }),
}));

jest.mock('../src/services/bookingService', () => ({
  getMyBookings: mockGetMyBookings,
}));

jest.mock('../src/services/demoBookingService', () => ({
  getMyDemoBookings: mockGetMyDemoBookings,
}));

const bookingBase = {
  user_id: 'user-1',
  racket_id: 'racket-1',
  main_string_id: 'string-1',
  cross_string_id: 'string-2',
  tension_main: 48,
  tension_cross: 46,
  slot_id: 'slot-1',
  delivery_method: 'store_pickup',
  address_id: null,
  user_notes: null,
  admin_notes: null,
  no_show_counted: false,
  created_at: '2026-05-04T00:00:00.000Z',
  updated_at: '2026-05-04T00:00:00.000Z',
  user_rackets: {
    brand: 'Wilson',
    model: 'Clash',
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
    start_time: '2026-05-04T09:00:00.000Z',
    end_time: '2026-05-04T10:00:00.000Z',
  },
};

describe('BookingScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetMyDemoBookings.mockResolvedValue([]);
    mockGetMyBookings.mockResolvedValue([
      {
        ...bookingBase,
        id: 'active-booking',
        status: 'approved',
      },
      {
        ...bookingBase,
        id: 'past-booking',
        status: 'done',
      },
    ]);
  });

  test('진행 중 예약과 지난 예약을 누르면 예약 상세로 이동한다', async () => {
    const BookingScreen = require('../app/(tabs)/booking').default;
    const screen = render(<BookingScreen />);

    await waitFor(() => expect(mockGetMyBookings).toHaveBeenCalledWith('user-1'));

    fireEvent.press(screen.getByLabelText('예약 상세 보기'));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/booking-detail',
      params: { id: 'active-booking' },
    });

    fireEvent.press(screen.getByText('지난 예약'));
    fireEvent.press(screen.getByLabelText('Wilson Clash 예약 상세 보기'));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/booking-detail',
      params: { id: 'past-booking' },
    });
  });
});
