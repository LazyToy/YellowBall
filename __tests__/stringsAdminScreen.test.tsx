import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

const mockGetAllStrings = jest.fn();
const mockAddString = jest.fn();
const mockUpdateString = jest.fn();
const mockDeactivateString = jest.fn();
const mockActivateString = jest.fn();
const mockUploadStringPhoto = jest.fn();

jest.mock('../src/hooks/useAuth', () => ({
  useAuth: () => ({
    profile: { id: 'super-1', role: 'super_admin' },
  }),
}));

jest.mock('../src/services/stringCatalogService', () => ({
  activateString: mockActivateString,
  addString: mockAddString,
  deactivateString: mockDeactivateString,
  getAllStrings: mockGetAllStrings,
  updateString: mockUpdateString,
}));

jest.mock('../src/services/storageService', () => ({
  uploadStringPhoto: mockUploadStringPhoto,
}));

describe('AdminStringsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAllStrings.mockResolvedValue([]);
    mockAddString.mockResolvedValue({});
    mockUploadStringPhoto.mockResolvedValue('https://storage.example.com/string.jpg');
    global.fetch = jest.fn().mockResolvedValue({
      blob: jest.fn().mockResolvedValue(new Blob(['photo'], { type: 'image/jpeg' })),
    }) as never;
  });

  test('이미지 파일 URI가 있으면 uploadStringPhoto 결과로 스트링을 등록한다', async () => {
    const AdminStringsScreen = require('../app/(admin)/strings').default;
    const screen = render(<AdminStringsScreen />);

    fireEvent.changeText(screen.getByLabelText('브랜드'), 'Luxilon');
    fireEvent.changeText(screen.getByLabelText('이름'), 'Alu Power');
    fireEvent.changeText(screen.getByLabelText('가격'), '28000');
    fireEvent.changeText(
      screen.getByLabelText('이미지 파일 URI'),
      'file:///tmp/string.jpg',
    );
    await act(async () => {
      fireEvent.press(screen.getByText('스트링 등록'));
    });

    await waitFor(() =>
      expect(mockUploadStringPhoto).toHaveBeenCalledWith(
        'super-1',
        'file:///tmp/string.jpg',
        expect.any(Blob),
      ),
    );
    expect(mockAddString).toHaveBeenCalledWith(
      'super-1',
      expect.objectContaining({
        brand: 'Luxilon',
        name: 'Alu Power',
        price: 28000,
        image_url: 'https://storage.example.com/string.jpg',
      }),
    );
  });
});
