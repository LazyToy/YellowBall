import React from 'react';
import { render, waitFor } from '@testing-library/react-native';

const mockGetRacket = jest.fn();
const mockGetStringById = jest.fn();
let mockSearchParams: { id?: string } = {};

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => mockSearchParams,
  useRouter: () => ({
    back: jest.fn(),
  }),
}));

jest.mock('../src/services/racketService', () => ({
  getRacket: mockGetRacket,
}));

jest.mock('../src/services/stringCatalogService', () => ({
  getStringById: mockGetStringById,
}));

describe('상세 화면', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParams = { id: 'item-1' };
  });

  test('라켓 상세 화면은 라켓 ID로 상세 데이터를 불러와 표시한다', async () => {
    mockGetRacket.mockResolvedValue({
      id: 'item-1',
      owner_id: 'user-1',
      brand: 'Wilson',
      model: 'Blade',
      grip_size: 'G2',
      weight: 305,
      balance: '320mm',
      photo_url: 'https://example.com/racket.jpg',
      is_primary: true,
      memo: '메인 라켓',
      created_at: '2026-05-03T00:00:00.000Z',
    });

    const RacketDetailScreen = require('../app/(tabs)/racket-detail').default;
    const screen = render(<RacketDetailScreen />);

    await waitFor(() => expect(mockGetRacket).toHaveBeenCalledWith('item-1'));
    expect(screen.getByText('Wilson Blade')).toBeTruthy();
    expect(screen.getAllByText('메인 라켓')).toHaveLength(2);
    expect(screen.getByText('305g')).toBeTruthy();
  });

  test('스트링 상세 화면은 스트링 ID로 상세 데이터를 불러와 표시한다', async () => {
    mockGetStringById.mockResolvedValue({
      id: 'item-1',
      brand: 'Luxilon',
      name: 'Alu Power',
      gauge: '1.25',
      color: 'Silver',
      image_url: null,
      description: '컨트롤 중심 스트링',
      price: 28000,
      recommended_style: 'control',
      is_active: true,
      deactivation_reason: null,
      deactivated_at: null,
      created_at: '2026-05-03T00:00:00.000Z',
      updated_at: '2026-05-03T00:00:00.000Z',
    });

    const StringDetailScreen = require('../app/(tabs)/string-detail').default;
    const screen = render(<StringDetailScreen />);

    await waitFor(() => expect(mockGetStringById).toHaveBeenCalledWith('item-1'));
    expect(screen.getByText('Luxilon Alu Power')).toBeTruthy();
    expect(screen.getByText('KRW 28,000')).toBeTruthy();
    expect(screen.getByText('컨트롤 중심 스트링')).toBeTruthy();
  });
});
