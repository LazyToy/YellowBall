import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

const mockPush = jest.fn();
const mockGetMyBookings = jest.fn();
const mockGetMyDemoBookings = jest.fn();
let mockFocusCallback: (() => void) | undefined;

jest.mock('expo-router', () => ({
  useFocusEffect: (callback: () => void) => {
    const React = require('react');

    mockFocusCallback = callback;
    React.useEffect(() => {
      callback();
    }, [callback]);
  },
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

const flattenStyle = (style: unknown) =>
  StyleSheet.flatten(
    typeof style === 'function'
      ? style({ pressed: false, hovered: false, focused: false })
      : style,
  );

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

const demoBookingBase = {
  id: 'demo-active',
  user_id: 'user-1',
  demo_racket_id: 'demo-racket-1',
  slot_id: 'demo-slot-1',
  start_time: '2026-05-04T01:00:00.000Z',
  expected_return_time: '2026-05-05T01:00:00.000Z',
  actual_return_time: null,
  status: 'approved',
  user_notes: null,
  admin_notes: null,
  created_at: '2026-05-04T00:00:00.000Z',
  updated_at: '2026-05-04T00:00:00.000Z',
  demo_rackets: {
    brand: 'Head',
    model: 'Speed Demo',
  },
  booking_slots: {
    start_time: '2026-05-04T01:00:00.000Z',
    end_time: '2026-05-04T02:00:00.000Z',
  },
};

describe('BookingScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFocusCallback = undefined;
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

  test('새 예약 만들기 CTA를 누르면 새 예약 화면으로 이동한다', async () => {
    const BookingScreen = require('../app/(tabs)/booking').default;
    const screen = render(<BookingScreen />);

    await waitFor(() => expect(mockGetMyBookings).toHaveBeenCalledWith('user-1'));

    fireEvent.press(screen.getByLabelText('스트링 작업 예약'));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/new-booking',
      params: { mode: 'stringing' },
    });

    fireEvent.press(screen.getByLabelText('라켓 시타 예약'));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/new-booking',
      params: { mode: 'demo' },
    });
  });

  test('새 예약 만들기 항목은 Android에서도 카드형 한 줄 레이아웃을 유지한다', async () => {
    const BookingScreen = require('../app/(tabs)/booking').default;
    const screen = render(<BookingScreen />);

    await waitFor(() => expect(mockGetMyBookings).toHaveBeenCalledWith('user-1'));

    const ctaSurfaceStyle = flattenStyle(
      screen.getByTestId('booking-cta-string-booking-surface').props.style,
    );

    expect(ctaSurfaceStyle).toEqual(
      expect.objectContaining({
        backgroundColor: '#ffffff',
        borderColor: '#dfded7',
        borderWidth: 1,
        minHeight: 104,
        overflow: 'hidden',
        width: '100%',
      }),
    );
    expect(
      flattenStyle(screen.getByTestId('booking-cta-string-booking').props.style),
    ).toEqual(
      expect.objectContaining({
        minHeight: 104,
        width: '100%',
      }),
    );

    expect(
      StyleSheet.flatten(
        screen.getByTestId('booking-cta-string-booking-row').props.style,
      ),
    ).toEqual(
      expect.objectContaining({
        alignItems: 'center',
        flexDirection: 'row',
        flexWrap: 'nowrap',
        minHeight: 104,
        minWidth: 0,
        paddingHorizontal: expect.any(Number),
        paddingVertical: expect.any(Number),
        width: '100%',
      }),
    );
    expect(
      StyleSheet.flatten(
        screen.getByTestId('booking-cta-string-booking-content').props.style,
      ),
    ).toEqual(
      expect.objectContaining({
        flex: 1,
        flexShrink: 1,
        marginRight: expect.any(Number),
        minWidth: 0,
      }),
    );
  });

  test('진행 중 스트링 작업 카드는 Android에서도 흰색 표면과 줄바꿈 가능한 상세 박스를 유지한다', async () => {
    const BookingScreen = require('../app/(tabs)/booking').default;
    const screen = render(<BookingScreen />);

    await waitFor(() => expect(mockGetMyBookings).toHaveBeenCalledWith('user-1'));

    expect(
      flattenStyle(screen.getByTestId('service-booking-card-surface').props.style),
    ).toEqual(
      expect.objectContaining({
        backgroundColor: '#ffffff',
        borderColor: '#dfded7',
        borderWidth: 1,
        overflow: 'hidden',
        width: '100%',
      }),
    );
    expect(
      StyleSheet.flatten(screen.getByTestId('service-booking-card-content').props.style),
    ).toEqual(
      expect.objectContaining({
        flexDirection: 'column',
        paddingHorizontal: expect.any(Number),
        paddingVertical: expect.any(Number),
        width: '100%',
      }),
    );
    expect(
      StyleSheet.flatten(screen.getByTestId('service-booking-detail-box').props.style),
    ).toEqual(
      expect.objectContaining({
        alignSelf: 'stretch',
        backgroundColor: '#f0efe7',
        padding: expect.any(Number),
      }),
    );
    expect(
      StyleSheet.flatten(
        screen.getByTestId('service-booking-detail-value-스트링').props.style,
      ),
    ).toEqual(
      expect.objectContaining({
        flexShrink: 1,
        minWidth: 0,
        textAlign: 'right',
      }),
    );
  });

  test('reloads bookings when the booking tab receives focus again', async () => {
    const BookingScreen = require('../app/(tabs)/booking').default;
    render(<BookingScreen />);

    await waitFor(() => expect(mockGetMyBookings).toHaveBeenCalledTimes(1));

    mockGetMyBookings.mockResolvedValueOnce([
      {
        ...bookingBase,
        id: 'newly-created-booking',
        status: 'approved',
      },
    ]);

    await act(async () => {
      mockFocusCallback?.();
    });

    await waitFor(() => expect(mockGetMyBookings).toHaveBeenCalledTimes(2));
    expect(mockGetMyDemoBookings).toHaveBeenCalledTimes(2);
  });

  test('booking list shows only the reservation start time', async () => {
    const BookingScreen = require('../app/(tabs)/booking').default;
    const screen = render(<BookingScreen />);

    await waitFor(() => expect(mockGetMyBookings).toHaveBeenCalledWith('user-1'));

    expect(screen.getByText('2026-05-04 18:00')).toBeTruthy();
    expect(screen.queryByText('2026-05-04 18:00 - 2026-05-04 19:00')).toBeNull();
  });

  test('opens demo booking detail from the demo booking card', async () => {
    mockGetMyDemoBookings.mockResolvedValueOnce([demoBookingBase]);
    const BookingScreen = require('../app/(tabs)/booking').default;
    const screen = render(<BookingScreen />);

    await waitFor(() => expect(mockGetMyDemoBookings).toHaveBeenCalledWith('user-1'));

    expect(screen.getByTestId('demo-booking-detail-box')).toBeTruthy();
    expect(screen.getByText('Head Speed Demo')).toBeTruthy();
    expect(screen.getAllByText('2026-05-04 10:00').length).toBeGreaterThan(0);
    expect(screen.getByText('2026-05-05 10:00')).toBeTruthy();

    fireEvent.press(screen.getByTestId('demo-booking-card'));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/booking-detail',
      params: { id: 'demo-active', type: 'demo' },
    });
  });
});
