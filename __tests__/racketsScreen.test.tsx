import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

const mockGetRackets = jest.fn();
const mockAddRacket = jest.fn();
const mockUpdateRacket = jest.fn();
const mockUploadRacketPhoto = jest.fn();
const mockPush = jest.fn();
let mockSearchParams: { editId?: string } = {};
const mockLaunchImageLibraryAsync = jest.fn();
const mockRequestMediaLibraryPermissionsAsync = jest.fn();

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

jest.mock('../src/hooks/useAuth', () => ({
  useAuth: () => ({
    profile: { id: 'user-1' },
  }),
}));

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => mockSearchParams,
  useRouter: () => ({
    back: jest.fn(),
    push: mockPush,
  }),
}));

jest.mock('expo-image-picker', () => ({
  launchCameraAsync: jest.fn(),
  launchImageLibraryAsync: mockLaunchImageLibraryAsync,
  requestCameraPermissionsAsync: jest.fn(),
  requestMediaLibraryPermissionsAsync: mockRequestMediaLibraryPermissionsAsync,
}));

jest.mock('../src/services/racketService', () => ({
  addRacket: mockAddRacket,
  getRackets: mockGetRackets,
  updateRacket: mockUpdateRacket,
}));

jest.mock('../src/services/storageService', () => ({
  uploadRacketPhoto: mockUploadRacketPhoto,
}));

describe('RacketsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParams = {};
    mockGetRackets.mockResolvedValue([racket]);
    mockAddRacket.mockResolvedValue(racket);
    mockUpdateRacket.mockResolvedValue({ ...racket, balance: '325mm' });
    mockUploadRacketPhoto.mockResolvedValue('https://storage.example.com/racket.jpg');
    mockRequestMediaLibraryPermissionsAsync.mockResolvedValue({ granted: true });
    mockLaunchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///tmp/racket.jpg' }],
    });
    global.fetch = jest.fn().mockResolvedValue({
      blob: jest.fn().mockResolvedValue(new Blob(['photo'], { type: 'image/jpeg' })),
    }) as never;
  });

  test('editId로 진입하면 기존 라켓 값을 불러와 수정만 수행한다', async () => {
    mockSearchParams = { editId: 'racket-1' };
    const RacketsScreen = require('../app/(tabs)/rackets').default;
    const screen = render(<RacketsScreen />);

    await waitFor(() => expect(screen.getByDisplayValue('Wilson')).toBeTruthy());
    expect(screen.getByDisplayValue('Blade')).toBeTruthy();

    fireEvent.changeText(screen.getByLabelText('모델'), 'Blade 98');
    await act(async () => {
      fireEvent.press(screen.getByLabelText('라켓 수정 저장'));
    });

    await waitFor(() =>
      expect(mockUpdateRacket).toHaveBeenCalledWith(
        'racket-1',
        expect.objectContaining({ model: 'Blade 98' }),
      ),
    );
    expect(mockAddRacket).not.toHaveBeenCalled();
  });

  test('라켓 추가 화면은 저장 폼만 보여주고 기존 목록 관리 버튼을 섞지 않는다', async () => {
    const RacketsScreen = require('../app/(tabs)/rackets').default;
    const screen = render(<RacketsScreen />);

    await waitFor(() => expect(mockGetRackets).toHaveBeenCalledWith('user-1'));
    expect(screen.getByLabelText('라켓 추가')).toBeTruthy();
    expect(screen.queryByText('Wilson Blade')).toBeNull();
    expect(screen.queryByLabelText('Blade 라켓 상세')).toBeNull();
    expect(screen.queryByLabelText('Blade 라켓 수정')).toBeNull();
  });

  test('사진 파일 URI가 있으면 Storage 업로드 후 반환 URL로 라켓을 저장한다', async () => {
    mockGetRackets.mockResolvedValue([]);
    const RacketsScreen = require('../app/(tabs)/rackets').default;
    const screen = render(<RacketsScreen />);

    fireEvent.changeText(screen.getByLabelText('브랜드'), 'Head');
    fireEvent.changeText(screen.getByLabelText('모델'), 'Speed');
    fireEvent.changeText(screen.getByLabelText('무게(g)'), '300');
    await act(async () => {
      fireEvent.press(screen.getByText('사진 첨부'));
    });
    await act(async () => {
      fireEvent.press(screen.getByLabelText('라켓 추가'));
    });

    await waitFor(() =>
      expect(mockUploadRacketPhoto).toHaveBeenCalledWith(
        'user-1',
        'file:///tmp/racket.jpg',
        expect.any(Blob),
      ),
    );
    expect(mockAddRacket).toHaveBeenCalledWith(
      expect.objectContaining({
        photo_url: 'https://storage.example.com/racket.jpg',
      }),
    );
  });
});
