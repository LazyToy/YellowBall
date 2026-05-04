import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

const mockCreateBooking = jest.fn();
const mockGetMyBookings = jest.fn();
const mockCreateDemoBooking = jest.fn();
const mockGetDemoRackets = jest.fn();
const mockGetRackets = jest.fn();
const mockGetAvailableSlots = jest.fn();
const mockGetActiveStrings = jest.fn();
const mockGetAddresses = jest.fn();

jest.mock('../src/hooks/useAuth', () => ({
  useAuth: () => ({
    profile: { id: 'user-1', role: 'user', status: 'active' },
  }),
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

jest.mock('../src/services/slotService', () => ({
  getAvailableSlots: mockGetAvailableSlots,
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

const demoRacket = {
  id: 'demo-1',
  brand: 'Head',
  model: 'Speed Demo',
};

const stringSlot = {
  id: 'slot-string',
  service_type: 'stringing',
  start_time: '2026-05-04T09:00:00.000Z',
  end_time: '2026-05-04T10:00:00.000Z',
  capacity: 1,
  reserved_count: 0,
  is_blocked: false,
};

const demoSlot = {
  id: 'slot-demo',
  service_type: 'demo',
  start_time: '2026-05-04T10:00:00.000Z',
  end_time: '2026-05-04T12:00:00.000Z',
  capacity: 1,
  reserved_count: 0,
  is_blocked: false,
};

describe('NewBookingScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetRackets.mockResolvedValue([racket]);
    mockGetActiveStrings.mockResolvedValue([string]);
    mockGetAddresses.mockResolvedValue([]);
    mockGetMyBookings.mockResolvedValue([]);
    mockGetDemoRackets.mockResolvedValue([demoRacket]);
    mockGetAvailableSlots.mockImplementation((_date, mode) =>
      Promise.resolve(mode === 'demo' ? [demoSlot] : [stringSlot]),
    );
    mockCreateBooking.mockResolvedValue({});
    mockCreateDemoBooking.mockResolvedValue({});
  });

  test('스트링 예약은 라켓/스트링/텐션/슬롯으로 createBooking을 호출한다', async () => {
    const NewBookingScreen = require('../app/(tabs)/new-booking').default;
    const screen = render(<NewBookingScreen />);

    await waitFor(() => expect(screen.getByText('Wilson Blade')).toBeTruthy());

    await act(async () => {
      fireEvent.press(screen.getByText('예약 접수'));
    });

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
          expectedReturnTime: '2026-05-04T12:00:00.000Z',
        }),
      ),
    );
  });
});
