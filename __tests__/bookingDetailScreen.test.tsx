import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

const mockGetBookingDetail = jest.fn();
const mockGetDemoBookingDetail = jest.fn();
const mockCancelBooking = jest.fn();
let mockSearchParams: Record<string, string | undefined>;

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => mockSearchParams,
  useRouter: () => ({
    back: jest.fn(),
  }),
}));

jest.mock('../src/services/bookingService', () => ({
  getBookingDetail: mockGetBookingDetail,
  cancelBooking: mockCancelBooking,
}));

jest.mock('../src/services/demoBookingService', () => ({
  getDemoBookingDetail: mockGetDemoBookingDetail,
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
  delivery_method: 'parcel',
  address_id: 'address-1',
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
    start_time: '2026-05-04T00:00:00.000Z',
    end_time: '2026-05-04T01:00:00.000Z',
  },
  addresses: {
    recipient_name: '홍길동',
    phone: '010-0000-0000',
    postal_code: '06000',
    address_line1: '서울시 강남구',
    address_line2: '101호',
  },
};

const demoBooking = {
  id: 'demo-booking-1',
  user_id: 'user-1',
  demo_racket_id: 'demo-racket-1',
  slot_id: 'demo-slot-1',
  start_time: '2026-05-04T01:00:00.000Z',
  expected_return_time: '2026-05-05T01:00:00.000Z',
  actual_return_time: null,
  status: 'approved',
  user_notes: '오전 방문',
  admin_notes: '라켓 준비 완료',
  created_at: '2026-05-04T00:00:00.000Z',
  updated_at: '2026-05-04T00:00:00.000Z',
  demo_rackets: {
    brand: 'Head',
    model: 'Speed Demo',
    grip_size: 'G2',
    weight: 300,
    head_size: '100',
  },
  booking_slots: {
    start_time: '2026-05-04T01:00:00.000Z',
    end_time: '2026-05-04T02:00:00.000Z',
  },
};

describe('BookingDetailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParams = { id: 'booking-1' };
    mockGetBookingDetail.mockResolvedValue(booking);
    mockGetDemoBookingDetail.mockResolvedValue(demoBooking);
    mockCancelBooking.mockResolvedValue({
      booking: { ...booking, status: 'cancelled_user' },
      cancelled: true,
      requiresAdminApproval: false,
      cancellationDeadline: '2099-05-04T09:00:00.000Z',
    });
  });

  test('사용자 예약 상세 정보와 상태 타임라인을 표시한다', async () => {
    const BookingDetailScreen = require('../app/(tabs)/booking-detail').default;
    const screen = render(<BookingDetailScreen />);

    await waitFor(() => expect(screen.getByText('예약 상세')).toBeTruthy());

    expect(mockGetBookingDetail).toHaveBeenCalledWith('booking-1');
    expect(screen.getAllByText('승인').length).toBeGreaterThan(0);
    expect(screen.getByText('라켓 Wilson Blade')).toBeTruthy();
    expect(screen.getByText('스트링 Luxilon Alu Power / Babolat RPM Blast')).toBeTruthy();
    expect(screen.getByText('예약 시간 2026-05-04 09:00')).toBeTruthy();
    expect(
      screen.queryByText('예약 시간 2026-05-04 09:00 - 2026-05-04 10:00'),
    ).toBeNull();
    expect(screen.getByText('텐션 48/46 lbs')).toBeTruthy();
    expect(screen.getByText('수령 방식 택배')).toBeTruthy();
    expect(
      screen.getByText('배송지 홍길동 010-0000-0000 (06000) 서울시 강남구 101호'),
    ).toBeTruthy();
    expect(screen.getByText('사용자 메모: 오전 방문')).toBeTruthy();
    expect(screen.getByText('관리자 메모: 라켓 확인 완료')).toBeTruthy();
    expect(screen.getByText('작업중')).toBeTruthy();
  });

  test('예약 취소 후 상세 데이터를 다시 조회한다', async () => {
    const futureBooking = {
      ...booking,
      booking_slots: {
        ...booking.booking_slots,
        start_time: '2099-05-04T09:00:00.000Z',
      },
    };
    mockGetBookingDetail.mockResolvedValue(futureBooking);
    const BookingDetailScreen = require('../app/(tabs)/booking-detail').default;
    const screen = render(<BookingDetailScreen />);

    await waitFor(() => expect(screen.getByText('예약 취소')).toBeTruthy());
    fireEvent.press(screen.getByText('예약 취소'));
    fireEvent.press(screen.getAllByLabelText('예약 취소')[0]);

    await waitFor(() => expect(mockCancelBooking).toHaveBeenCalledWith('booking-1', 'user-1'));
    await waitFor(() =>
      expect(mockGetBookingDetail.mock.calls.length).toBeGreaterThanOrEqual(2),
    );
  });

  test('예약 취소는 확인창을 거쳐 성공 알림창을 표시한다', async () => {
    const futureBooking = {
      ...booking,
      booking_slots: {
        ...booking.booking_slots,
        start_time: '2099-05-04T09:00:00.000Z',
      },
    };
    mockGetBookingDetail.mockResolvedValue(futureBooking);
    const BookingDetailScreen = require('../app/(tabs)/booking-detail').default;
    const screen = render(<BookingDetailScreen />);

    await waitFor(() => expect(screen.getByText('예약 취소')).toBeTruthy());
    fireEvent.press(screen.getByText('예약 취소'));

    expect(screen.getByText('예약을 취소할까요?')).toBeTruthy();
    fireEvent.press(screen.getAllByLabelText('예약 취소')[0]);

    await waitFor(() => expect(screen.getByText('예약을 취소했습니다')).toBeTruthy());
  });

  test('시타 예약 상세 정보를 표시한다', async () => {
    mockSearchParams = { id: 'demo-booking-1', type: 'demo' };
    const BookingDetailScreen = require('../app/(tabs)/booking-detail').default;
    const screen = render(<BookingDetailScreen />);

    await waitFor(() => expect(screen.getByText('시타 예약 상세')).toBeTruthy());

    expect(mockGetDemoBookingDetail).toHaveBeenCalledWith('demo-booking-1');
    expect(screen.getByText('라켓 Head Speed Demo')).toBeTruthy();
    expect(screen.getByText('스펙 300g · G2 · 헤드 100')).toBeTruthy();
    expect(screen.getByText('대여 예정 시간 2026-05-04 10:00')).toBeTruthy();
    expect(screen.getByText('반납 예정 시간 2026-05-05 10:00')).toBeTruthy();
    expect(screen.getByText('사용자 메모: 오전 방문')).toBeTruthy();
    expect(screen.getByText('관리자 메모: 라켓 준비 완료')).toBeTruthy();
  });
});
