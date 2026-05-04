import React from 'react';
import { render, waitFor } from '@testing-library/react-native';

const mockGetBookingDetail = jest.fn();

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: 'booking-1' }),
}));

jest.mock('../src/services/bookingService', () => ({
  getBookingDetail: mockGetBookingDetail,
  cancelBooking: jest.fn(),
}));

const booking = {
  id: 'booking-1',
  user_id: 'user-1',
  racket_id: 'racket-1',
  main_string_id: 'string-1',
  cross_string_id: 'string-2',
  tension_main: 48,
  tension_cross: 46,
  slot_id: 'slot-1',
  delivery_method: 'store_pickup',
  address_id: null,
  status: 'approved',
  user_notes: '오전 방문',
  admin_notes: '라켓 확인 완료',
  no_show_counted: false,
  created_at: '2026-05-04T00:00:00.000Z',
  updated_at: '2026-05-04T00:00:00.000Z',
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
    start_time: '2026-05-04T09:00:00.000Z',
    end_time: '2026-05-04T10:00:00.000Z',
  },
};

describe('BookingDetailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetBookingDetail.mockResolvedValue(booking);
  });

  test('사용자 예약 상세 정보와 상태 타임라인을 표시한다', async () => {
    const BookingDetailScreen = require('../app/(tabs)/booking-detail').default;
    const screen = render(<BookingDetailScreen />);

    await waitFor(() => expect(screen.getByText('예약 상세')).toBeTruthy());

    expect(mockGetBookingDetail).toHaveBeenCalledWith('booking-1');
    expect(screen.getAllByText('승인').length).toBeGreaterThan(0);
    expect(screen.getByText('라켓 Wilson Blade')).toBeTruthy();
    expect(screen.getByText('스트링 Luxilon Alu Power / Babolat RPM Blast')).toBeTruthy();
    expect(
      screen.getByText('예약 시간 2026-05-04 09:00 - 2026-05-04 10:00'),
    ).toBeTruthy();
    expect(screen.getByText('텐션 48/46 lbs')).toBeTruthy();
    expect(screen.getByText('사용자 메모: 오전 방문')).toBeTruthy();
    expect(screen.getByText('관리자 메모: 라켓 확인 완료')).toBeTruthy();
    expect(screen.getByText('작업중')).toBeTruthy();
  });
});
