import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

const mockGetAddresses = jest.fn();
const mockAddAddress = jest.fn();
const mockUpdateAddress = jest.fn();
const mockDeleteAddress = jest.fn();
const mockSetDefaultAddress = jest.fn();
const mockRouterBack = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: mockRouterBack,
  }),
}));

const address = {
  id: 'address-1',
  user_id: 'user-1',
  recipient_name: '홍길동',
  phone: '010-1111-2222',
  postal_code: '12345',
  address_line1: '서울시 강남구',
  address_line2: '101호',
  is_default: true,
  created_at: '2026-05-03T00:00:00.000Z',
};

jest.mock('../src/hooks/useAuth', () => ({
  useAuth: () => ({
    profile: { id: 'user-1' },
  }),
}));

jest.mock('../src/services/addressService', () => ({
  addAddress: mockAddAddress,
  deleteAddress: mockDeleteAddress,
  getAddresses: mockGetAddresses,
  setDefaultAddress: mockSetDefaultAddress,
  updateAddress: mockUpdateAddress,
}));

describe('AddressesScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAddresses.mockResolvedValue([address]);
    mockAddAddress.mockResolvedValue(address);
    mockUpdateAddress.mockResolvedValue({ ...address, recipient_name: '김길동' });
  });

  test('주소 수정 플로우가 updateAddress를 호출한다', async () => {
    const AddressesScreen = require('../app/(tabs)/addresses').default;
    const screen = render(<AddressesScreen />);

    await waitFor(() => expect(screen.getByText('홍길동 · 기본')).toBeTruthy());

    fireEvent.press(screen.getByLabelText('홍길동 주소 수정'));
    fireEvent.changeText(screen.getByLabelText('받는 분'), '김길동');
    await act(async () => {
      fireEvent.press(screen.getByLabelText('주소 수정 저장'));
    });

    await waitFor(() =>
      expect(mockUpdateAddress).toHaveBeenCalledWith(
        'address-1',
        expect.objectContaining({ recipient_name: '김길동' }),
      ),
    );
  });
});
