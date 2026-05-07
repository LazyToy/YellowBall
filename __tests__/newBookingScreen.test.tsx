import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

const mockCreateBooking = jest.fn();
const mockGetMyBookings = jest.fn();
const mockCreateDemoBooking = jest.fn();
const mockGetDemoRackets = jest.fn();
const mockGetRackets = jest.fn();
const mockGetSchedule = jest.fn();
const mockGetClosedDates = jest.fn();
const mockGetBookingSlotsForDate = jest.fn();
const mockGetActiveStrings = jest.fn();
const mockGetAddresses = jest.fn();
const mockRouterBack = jest.fn();
let mockMenuSettings: Record<string, boolean>;

jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: mockRouterBack,
  }),
}));

jest.mock('../src/hooks/useAuth', () => ({
  useAuth: () => ({
    profile: { id: 'user-1', role: 'user', status: 'active' },
  }),
}));

jest.mock('@/hooks/useAppMenuSettings', () => ({
  useAppMenuSettings: () => mockMenuSettings,
}));

jest.mock('../src/services/bookingService', () => ({
  buildRebookPrefill: jest.requireActual('../src/services/bookingService')
    .buildRebookPrefill,
  createBooking: mockCreateBooking,
  getMyBookings: mockGetMyBookings,
}));

jest.mock('../src/services/demoBookingService', () => ({
  createDemoBooking: mockCreateDemoBooking,
}));

jest.mock('../src/services/demoRacketService', () => ({
  getDemoRackets: mockGetDemoRackets,
}));

jest.mock('../src/services/racketService', () => ({
  getRackets: mockGetRackets,
}));

jest.mock('../src/services/scheduleService', () => ({
  defaultShopSchedule: [
    { day_of_week: 0, open_time: '10:00:00', close_time: '17:00:00', is_closed: true },
    { day_of_week: 1, open_time: '09:00:00', close_time: '18:00:00', is_closed: false },
    { day_of_week: 2, open_time: '09:00:00', close_time: '18:00:00', is_closed: false },
    { day_of_week: 3, open_time: '09:00:00', close_time: '18:00:00', is_closed: false },
    { day_of_week: 4, open_time: '09:00:00', close_time: '18:00:00', is_closed: false },
    { day_of_week: 5, open_time: '09:00:00', close_time: '18:00:00', is_closed: false },
    { day_of_week: 6, open_time: '10:00:00', close_time: '17:00:00', is_closed: false },
  ],
  getClosedDates: mockGetClosedDates,
  getSchedule: mockGetSchedule,
}));

jest.mock('../src/services/slotService', () => ({
  getBookingSlotsForDate: mockGetBookingSlotsForDate,
}));

jest.mock('../src/services/stringCatalogService', () => ({
  getActiveStrings: mockGetActiveStrings,
}));

jest.mock('../src/services/addressService', () => ({
  getAddresses: mockGetAddresses,
}));

const racket = {
  id: 'racket-1',
  brand: 'Wilson',
  model: 'Blade',
  is_primary: true,
};

const string = {
  id: 'string-1',
  brand: 'Luxilon',
  name: 'Alu Power',
};

const crossString = {
  id: 'string-2',
  brand: 'Solinco',
  name: 'Hyper-G',
};

const previousBooking = {
  id: 'booking-recent',
  created_at: '2026-04-10T00:00:00.000Z',
  racket_id: 'racket-1',
  main_string_id: 'string-1',
  cross_string_id: 'string-2',
  tension_main: 50,
  tension_cross: 47,
  delivery_method: 'store_pickup',
  address_id: null,
  main_string: string,
  cross_string: crossString,
};

const oldPreviousBooking = {
  ...previousBooking,
  id: 'booking-old',
  created_at: '2025-01-10T00:00:00.000Z',
  tension_main: 44,
  tension_cross: 44,
};

const demoRacket = {
  id: 'demo-1',
  brand: 'Head',
  model: 'Speed Demo',
};

const stringSlot = {
  id: 'slot-string',
  service_type: 'stringing',
  start_time: '2099-05-04T00:00:00.000Z',
  end_time: '2099-05-04T01:00:00.000Z',
  capacity: 1,
  reserved_count: 0,
  is_blocked: false,
};

const fullStringSlot = {
  ...stringSlot,
  id: 'slot-full',
  start_time: '2099-05-04T01:00:00.000Z',
  end_time: '2099-05-04T02:00:00.000Z',
  reserved_count: 1,
};

const demoSlot = {
  id: 'slot-demo',
  service_type: 'demo',
  start_time: '2099-05-04T01:00:00.000Z',
  end_time: '2099-05-04T03:00:00.000Z',
  capacity: 1,
  reserved_count: 0,
  is_blocked: false,
};

describe('NewBookingScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetRackets.mockResolvedValue([racket]);
    mockGetActiveStrings.mockResolvedValue([string, crossString]);
    mockGetAddresses.mockResolvedValue([]);
    mockGetMyBookings.mockResolvedValue([]);
    mockGetDemoRackets.mockResolvedValue([demoRacket]);
    mockGetSchedule.mockResolvedValue([
      { day_of_week: 0, open_time: '10:00:00', close_time: '17:00:00', is_closed: true },
      { day_of_week: 1, open_time: '09:00:00', close_time: '18:00:00', is_closed: false },
      { day_of_week: 2, open_time: '09:00:00', close_time: '18:00:00', is_closed: false },
      { day_of_week: 3, open_time: '09:00:00', close_time: '18:00:00', is_closed: false },
      { day_of_week: 4, open_time: '09:00:00', close_time: '18:00:00', is_closed: false },
      { day_of_week: 5, open_time: '09:00:00', close_time: '18:00:00', is_closed: false },
      { day_of_week: 6, open_time: '10:00:00', close_time: '17:00:00', is_closed: false },
    ]);
    mockGetClosedDates.mockResolvedValue([]);
    mockGetBookingSlotsForDate.mockImplementation((_date, mode) =>
      Promise.resolve(mode === 'demo' ? [demoSlot] : [fullStringSlot, stringSlot]),
    );
    mockCreateBooking.mockResolvedValue({});
    mockCreateDemoBooking.mockResolvedValue({});
    mockMenuSettings = {
      'string-booking': true,
      'demo-booking': true,
      shop: true,
      'racket-library': true,
      delivery: true,
      community: false,
      subscription: false,
      'queue-board': true,
      'auto-reorder': true,
      analytics: false,
      'audit-log': true,
    };
  });

  test('스트링 예약은 라켓/스트링/텐션/슬롯으로 createBooking을 호출한다', async () => {
    const NewBookingScreen = require('../app/(tabs)/new-booking').default;
    const screen = render(<NewBookingScreen />);

    await waitFor(() => expect(screen.getByText('Wilson Blade')).toBeTruthy());
    expect(screen.getByText('라켓 선택')).toBeTruthy();
    expect(screen.getByText('내 라켓 라이브러리에서 선택')).toBeTruthy();
    expect(screen.getByText('스트링 선택')).toBeTruthy();
    expect(screen.getByText('단일 스트링')).toBeTruthy();
    expect(screen.getByText('균일 텐션')).toBeTruthy();
    expect(screen.getByText('하이브리드 (메인/크로스)')).toBeTruthy();
    expect(screen.getByText('09:00')).toBeTruthy();
    expect(screen.getByText('10:00')).toBeTruthy();
    expect(screen.getByText('정상영업')).toBeTruthy();
    expect(screen.getByText('휴무')).toBeTruthy();
    expect(screen.getByText('영업종료')).toBeTruthy();
    expect(screen.getByText(/^영업시간 /)).toBeTruthy();
    expect(screen.getByText('예약 가능 1개')).toBeTruthy();

    fireEvent.press(screen.getByText('예약 접수'));

    await waitFor(() =>
      expect(mockCreateBooking).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          racketId: 'racket-1',
          mainStringId: 'string-1',
          crossStringId: 'string-1',
          tensionMain: 48,
          tensionCross: 48,
          slotId: 'slot-string',
        }),
      ),
    );
  });

  test('텐션 선택은 균일과 하이브리드 모드를 전환한다', async () => {
    const NewBookingScreen = require('../app/(tabs)/new-booking').default;
    const screen = render(<NewBookingScreen />);

    await waitFor(() => expect(screen.getByText('Wilson Blade')).toBeTruthy());

    expect(screen.getByText('균일 텐션')).toBeTruthy();
    expect(screen.getByLabelText('텐션 텐션 직접 입력')).toBeTruthy();
    expect(screen.queryByLabelText('Main 텐션 직접 입력')).toBeNull();

    fireEvent.press(screen.getByText('하이브리드 (메인/크로스)'));

    expect(screen.getByText('메인 스트링')).toBeTruthy();
    expect(screen.getByText('크로스 스트링')).toBeTruthy();
    expect(screen.getByLabelText('Main 텐션 직접 입력')).toBeTruthy();
    expect(screen.getByLabelText('Cross 텐션 직접 입력')).toBeTruthy();
  });

  test('하이브리드 예약은 메인과 크로스 스트링을 따로 저장한다', async () => {
    const NewBookingScreen = require('../app/(tabs)/new-booking').default;
    const screen = render(<NewBookingScreen />);

    await waitFor(() => expect(screen.getByText('Wilson Blade')).toBeTruthy());

    fireEvent.press(screen.getByText('하이브리드 (메인/크로스)'));
    fireEvent.press(screen.getByLabelText('크로스 스트링 Solinco Hyper-G'));
    fireEvent.press(screen.getByText('예약 접수'));

    await waitFor(() =>
      expect(mockCreateBooking).toHaveBeenCalledWith(
        expect.objectContaining({
          mainStringId: 'string-1',
          crossStringId: 'string-2',
        }),
      ),
    );
  });

  test('다시 예약은 최근 6개월 기록의 스트링명과 텐션을 보여주고 선택 값을 불러온다', async () => {
    mockGetMyBookings.mockResolvedValueOnce([previousBooking, oldPreviousBooking]);
    const NewBookingScreen = require('../app/(tabs)/new-booking').default;
    const screen = render(<NewBookingScreen />);

    await waitFor(() => expect(screen.getByText('Wilson Blade')).toBeTruthy());

    expect(screen.getByText('Luxilon Alu Power / Solinco Hyper-G')).toBeTruthy();
    expect(screen.getByText('메인 50 / 크로스 47 lbs')).toBeTruthy();
    expect(screen.queryByText('메인 44 / 크로스 44 lbs')).toBeNull();

    fireEvent.press(screen.getByLabelText('다시 예약 booking-recent 불러오기'));
    fireEvent.press(screen.getByText('예약 접수'));

    await waitFor(() =>
      expect(mockCreateBooking).toHaveBeenCalledWith(
        expect.objectContaining({
          mainStringId: 'string-1',
          crossStringId: 'string-2',
          tensionMain: 50,
          tensionCross: 47,
        }),
      ),
    );
  });

  test('스트링 예약 필수 선택값이 없으면 DB 생성 호출 전에 안내한다', async () => {
    mockGetRackets.mockResolvedValueOnce([]);
    const NewBookingScreen = require('../app/(tabs)/new-booking').default;
    const screen = render(<NewBookingScreen />);

    await waitFor(() =>
      expect(screen.getAllByText('Luxilon Alu Power').length).toBeGreaterThan(0),
    );

    await act(async () => {
      fireEvent.press(screen.getByText('예약 접수'));
    });

    expect(mockCreateBooking).not.toHaveBeenCalled();
    expect(screen.getByText('예약할 라켓을 선택하세요.')).toBeTruthy();
  });

  test('시타 예약 모드에는 스트링/텐션 입력이 없고 createDemoBooking을 호출한다', async () => {
    const NewBookingScreen = require('../app/(tabs)/new-booking').default;
    const screen = render(<NewBookingScreen />);

    await waitFor(() => expect(screen.getByText('Wilson Blade')).toBeTruthy());

    await act(async () => {
      fireEvent.press(screen.getByText('시타'));
    });

    await waitFor(() => expect(screen.getByText('Head Speed Demo')).toBeTruthy());
    expect(screen.queryByLabelText('메인 텐션')).toBeNull();
    expect(screen.queryByLabelText('크로스 텐션')).toBeNull();

    await act(async () => {
      fireEvent.press(screen.getByText('예약 접수'));
    });

    await waitFor(() =>
      expect(mockCreateDemoBooking).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          demoRacketId: 'demo-1',
          slotId: 'slot-demo',
          expectedReturnTime: '2099-05-04T03:00:00.000Z',
        }),
      ),
    );
  });

  test('배송 메뉴가 꺼져 있으면 퀵/택배 수령 옵션을 숨긴다', async () => {
    mockMenuSettings = {
      ...mockMenuSettings,
      delivery: false,
    };
    const NewBookingScreen = require('../app/(tabs)/new-booking').default;
    const screen = render(<NewBookingScreen />);

    await waitFor(() => expect(screen.getByText('Wilson Blade')).toBeTruthy());

    expect(screen.getByText('매장 픽업')).toBeTruthy();
    expect(screen.queryByText('퀵')).toBeNull();
    expect(screen.queryByText('택배')).toBeNull();
  });
});
