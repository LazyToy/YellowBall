import { createAddressService } from '../src/services/addressService';

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

describe('addressService', () => {
  test('getAddresses는 user_id로 본인 주소만 조회한다', async () => {
    const order2 = jest
      .fn()
      .mockResolvedValue({ data: [address], error: null });
    const order1 = jest.fn(() => ({ order: order2 }));
    const eq = jest.fn(() => ({ order: order1 }));
    const select = jest.fn(() => ({ eq }));
    const from = jest.fn(() => ({ select }));
    const service = createAddressService({ from } as never);

    await expect(service.getAddresses('user-1')).resolves.toEqual([address]);

    expect(from).toHaveBeenCalledWith('addresses');
    expect(select).toHaveBeenCalledWith('*');
    expect(eq).toHaveBeenCalledWith('user_id', 'user-1');
  });

  test('첫 주소는 자동으로 기본 주소가 된다', async () => {
    const getOrder2 = jest
      .fn()
      .mockResolvedValue({ data: [], error: null });
    const getOrder1 = jest.fn(() => ({ order: getOrder2 }));
    const getEq = jest.fn(() => ({ order: getOrder1 }));
    const getSelect = jest.fn(() => ({ eq: getEq }));

    const clearEq = jest.fn().mockResolvedValue({ error: null });
    const clearUpdate = jest.fn(() => ({ eq: clearEq }));
    const insertSingle = jest
      .fn()
      .mockResolvedValue({ data: address, error: null });
    const insertSelect = jest.fn(() => ({ single: insertSingle }));
    const insert = jest.fn(() => ({ select: insertSelect }));
    const from = jest
      .fn()
      .mockReturnValueOnce({ select: getSelect })
      .mockReturnValueOnce({ update: clearUpdate })
      .mockReturnValueOnce({ insert });
    const service = createAddressService({ from } as never);

    await expect(
      service.addAddress({
        user_id: 'user-1',
        recipient_name: '홍길동',
        phone: '010-1111-2222',
        postal_code: '12345',
        address_line1: '서울시 강남구',
        address_line2: '101호',
      }),
    ).resolves.toEqual(address);

    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ is_default: true }),
    );
  });

  test('setDefaultAddress는 기존 기본 주소를 해제한 뒤 새 기본 주소를 저장한다', async () => {
    const ownerSingle = jest
      .fn()
      .mockResolvedValue({ data: { user_id: 'user-1' }, error: null });
    const ownerEq = jest.fn(() => ({ single: ownerSingle }));
    const ownerSelect = jest.fn(() => ({ eq: ownerEq }));

    const clearEq = jest.fn().mockResolvedValue({ error: null });
    const clearUpdate = jest.fn(() => ({ eq: clearEq }));

    const saveSingle = jest.fn().mockResolvedValue({ data: address, error: null });
    const saveSelect = jest.fn(() => ({ single: saveSingle }));
    const saveEq = jest.fn(() => ({ select: saveSelect }));
    const saveUpdate = jest.fn(() => ({ eq: saveEq }));
    const from = jest
      .fn()
      .mockReturnValueOnce({ select: ownerSelect })
      .mockReturnValueOnce({ update: clearUpdate })
      .mockReturnValueOnce({ update: saveUpdate });
    const service = createAddressService({ from } as never);

    await expect(service.setDefaultAddress('address-1')).resolves.toEqual(address);

    expect(clearUpdate).toHaveBeenCalledWith({ is_default: false });
    expect(saveUpdate).toHaveBeenCalledWith({ is_default: true });
  });

  test('updateAddress는 주소 소유자를 확인하고 수정한다', async () => {
    const ownerSingle = jest
      .fn()
      .mockResolvedValue({ data: { user_id: 'user-1' }, error: null });
    const ownerEq = jest.fn(() => ({ single: ownerSingle }));
    const ownerSelect = jest.fn(() => ({ eq: ownerEq }));

    const updated = { ...address, recipient_name: '김길동' };
    const saveSingle = jest.fn().mockResolvedValue({ data: updated, error: null });
    const saveSelect = jest.fn(() => ({ single: saveSingle }));
    const saveEq = jest.fn(() => ({ select: saveSelect }));
    const saveUpdate = jest.fn(() => ({ eq: saveEq }));
    const from = jest
      .fn()
      .mockReturnValueOnce({ select: ownerSelect })
      .mockReturnValueOnce({ update: saveUpdate });
    const service = createAddressService({ from } as never);

    await expect(
      service.updateAddress('address-1', { recipient_name: '김길동' }),
    ).resolves.toEqual(updated);

    expect(ownerEq).toHaveBeenCalledWith('id', 'address-1');
    expect(saveUpdate).toHaveBeenCalledWith({ recipient_name: '김길동' });
    expect(saveEq).toHaveBeenCalledWith('id', 'address-1');
  });

  test('기본 주소 삭제 시 남은 첫 주소로 기본 주소를 이전한다', async () => {
    const nextAddress = { ...address, id: 'address-2', is_default: false };
    const ownerSingle = jest
      .fn()
      .mockResolvedValue({ data: { user_id: 'user-1' }, error: null });
    const ownerEq = jest.fn(() => ({ single: ownerSingle }));
    const ownerSelect = jest.fn(() => ({ eq: ownerEq }));

    const currentSingle = jest
      .fn()
      .mockResolvedValue({ data: { is_default: true }, error: null });
    const currentEq = jest.fn(() => ({ single: currentSingle }));
    const currentSelect = jest.fn(() => ({ eq: currentEq }));

    const deleteEq = jest.fn().mockResolvedValue({ error: null });
    const remove = jest.fn(() => ({ eq: deleteEq }));

    const nextLimit = jest
      .fn()
      .mockResolvedValue({ data: [nextAddress], error: null });
    const nextOrder = jest.fn(() => ({ limit: nextLimit }));
    const nextEq = jest.fn(() => ({ order: nextOrder }));
    const nextSelect = jest.fn(() => ({ eq: nextEq }));

    const setOwnerSingle = jest
      .fn()
      .mockResolvedValue({ data: { user_id: 'user-1' }, error: null });
    const setOwnerEq = jest.fn(() => ({ single: setOwnerSingle }));
    const setOwnerSelect = jest.fn(() => ({ eq: setOwnerEq }));

    const clearEq = jest.fn().mockResolvedValue({ error: null });
    const clearUpdate = jest.fn(() => ({ eq: clearEq }));

    const saveSingle = jest
      .fn()
      .mockResolvedValue({ data: { ...nextAddress, is_default: true }, error: null });
    const saveSelect = jest.fn(() => ({ single: saveSingle }));
    const saveEq = jest.fn(() => ({ select: saveSelect }));
    const saveUpdate = jest.fn(() => ({ eq: saveEq }));

    const from = jest
      .fn()
      .mockReturnValueOnce({ select: ownerSelect })
      .mockReturnValueOnce({ select: currentSelect })
      .mockReturnValueOnce({ delete: remove })
      .mockReturnValueOnce({ select: nextSelect })
      .mockReturnValueOnce({ select: setOwnerSelect })
      .mockReturnValueOnce({ update: clearUpdate })
      .mockReturnValueOnce({ update: saveUpdate });
    const service = createAddressService({ from } as never);

    await expect(service.deleteAddress('address-1')).resolves.toBeUndefined();

    expect(remove).toHaveBeenCalledTimes(1);
    expect(saveEq).toHaveBeenCalledWith('id', 'address-2');
  });
});
