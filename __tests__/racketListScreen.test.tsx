import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

const mockGetRackets = jest.fn();
const mockPush = jest.fn();
const mockBack = jest.fn();

const racket = {
  id: 'racket-1',
  owner_id: 'user-1',
  brand: 'Wilson',
  model: 'Blade',
  grip_size: 'G2',
  weight: 305,
  balance: '320mm',
  photo_url: 'https://example.com/racket.jpg',
  is_primary: true,
  memo: '메인',
  created_at: '2026-05-03T00:00:00.000Z',
};

const flattenStyle = (style: unknown) =>
  StyleSheet.flatten(
    typeof style === 'function'
      ? style({ pressed: false, hovered: false, focused: false })
      : style,
  );

jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: mockBack,
    push: mockPush,
  }),
}));

jest.mock('../src/hooks/useAuth', () => ({
  useAuth: () => ({
    profile: { id: 'user-1' },
  }),
}));

jest.mock('../src/services/racketService', () => ({
  getRackets: mockGetRackets,
}));

describe('RacketListScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetRackets.mockResolvedValue([racket]);
  });

  test('라켓 목록에서 상세와 추가 화면으로 분리 이동한다', async () => {
    const RacketListScreen = require('../app/(tabs)/racket-list').default;
    render(<RacketListScreen />);

    await waitFor(() => expect(screen.getByText('Wilson Blade')).toBeTruthy());

    expect(
      flattenStyle(screen.getByTestId('racket-list-card-surface-racket-1').props.style),
    ).toEqual(
      expect.objectContaining({
        flexDirection: 'row',
        minHeight: 96,
        overflow: 'hidden',
        width: '100%',
      }),
    );
    expect(
      flattenStyle(screen.getByTestId('racket-list-card-hit-target-racket-1').props.style),
    ).toEqual(
      expect.objectContaining({
        borderRadius: expect.any(Number),
        width: '100%',
      }),
    );

    fireEvent.press(screen.getByTestId('racket-list-card-hit-target-racket-1'));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/racket-detail',
      params: { from: '/racket-list', id: 'racket-1' },
    });

    fireEvent.press(screen.getByLabelText('라켓 추가'));
    expect(mockPush).toHaveBeenCalledWith('/rackets');
  });
});
