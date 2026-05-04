import { createStringCatalogService } from '../src/services/stringCatalogService';

const stringItem = {
  id: 'string-1',
  brand: 'Luxilon',
  name: 'Alu Power',
  gauge: '1.25',
  color: 'Silver',
  image_url: null,
  description: null,
  price: 28000,
  recommended_style: 'control',
  is_active: true,
  deactivation_reason: null,
  deactivated_at: null,
  created_at: '2026-05-03T00:00:00.000Z',
  updated_at: '2026-05-03T00:00:00.000Z',
};

const superAdminRoleQuery = () => {
  const single = jest
    .fn()
    .mockResolvedValue({ data: { role: 'super_admin' }, error: null });
  const eq = jest.fn(() => ({ single }));
  const select = jest.fn(() => ({ eq }));

  return { select };
};

const userRoleQuery = () => {
  const single = jest.fn().mockResolvedValue({ data: { role: 'user' }, error: null });
  const eq = jest.fn(() => ({ single }));
  const select = jest.fn(() => ({ eq }));

  return { select };
};

const readStringQuery = (item = stringItem) => {
  const single = jest.fn().mockResolvedValue({ data: item, error: null });
  const eq = jest.fn(() => ({ single }));
  const select = jest.fn(() => ({ eq }));

  return { select };
};

const updateStringQuery = (item = stringItem) => {
  const single = jest.fn().mockResolvedValue({ data: item, error: null });
  const select = jest.fn(() => ({ single }));
  const eq = jest.fn(() => ({ select }));
  const update = jest.fn(() => ({ eq }));

  return { update };
};

describe('stringCatalogService', () => {
  test('권한 없는 admin의 등록을 차단한다', async () => {
    const roleSingle = jest
      .fn()
      .mockResolvedValue({ data: { role: 'admin' }, error: null });
    const roleEq = jest.fn(() => ({ single: roleSingle }));
    const roleSelect = jest.fn(() => ({ eq: roleEq }));

    const permissionSingle = jest.fn().mockResolvedValue({
      data: { admin_id: 'admin-1', can_manage_strings: false },
      error: null,
    });
    const permissionEq = jest.fn(() => ({ maybeSingle: permissionSingle }));
    const permissionSelect = jest.fn(() => ({ eq: permissionEq }));
    const from = jest
      .fn()
      .mockReturnValueOnce({ select: roleSelect })
      .mockReturnValueOnce({ select: permissionSelect });
    const service = createStringCatalogService({ from } as never);

    await expect(
      service.addString('admin-1', {
        brand: 'Luxilon',
        name: 'Alu Power',
        price: 28000,
      }),
    ).rejects.toThrow('스트링 카탈로그 관리 권한이 없습니다.');
  });

  test('일반 사용자의 스트링 CUD를 차단한다', async () => {
    const service = createStringCatalogService({
      from: jest.fn().mockReturnValue(userRoleQuery()),
    } as never);

    await expect(
      service.updateString('user-1', 'string-1', { price: 25000 }),
    ).rejects.toThrow('스트링 카탈로그 관리 권한이 없습니다.');
  });

  test('super_admin은 스트링을 등록하고 감사 로그를 남긴다', async () => {
    const insertSingle = jest.fn().mockResolvedValue({ data: stringItem, error: null });
    const insertSelect = jest.fn(() => ({ single: insertSingle }));
    const insert = jest.fn(() => ({ select: insertSelect }));
    const auditInsert = jest.fn().mockResolvedValue({ error: null });
    const from = jest
      .fn()
      .mockReturnValueOnce(superAdminRoleQuery())
      .mockReturnValueOnce({ insert })
      .mockReturnValueOnce({ insert: auditInsert });
    const service = createStringCatalogService({ from } as never);

    await expect(
      service.addString('super-1', {
        brand: 'Luxilon',
        name: 'Alu Power',
        price: 28000,
      }),
    ).resolves.toEqual(stringItem);

    expect(auditInsert).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'string.create', target_id: 'string-1' }),
    );
  });

  test('updateString은 변경 전후를 감사 로그에 남긴다', async () => {
    const updated = { ...stringItem, price: 30000 };
    const updateQuery = updateStringQuery(updated);
    const auditInsert = jest.fn().mockResolvedValue({ error: null });
    const from = jest
      .fn()
      .mockReturnValueOnce(superAdminRoleQuery())
      .mockReturnValueOnce(readStringQuery())
      .mockReturnValueOnce(updateQuery)
      .mockReturnValueOnce({ insert: auditInsert });
    const service = createStringCatalogService({ from } as never);

    await expect(
      service.updateString('super-1', 'string-1', { price: 30000 }),
    ).resolves.toEqual(updated);

    expect(updateQuery.update).toHaveBeenCalledWith(
      expect.objectContaining({ price: 30000, updated_at: expect.any(String) }),
    );
    expect(auditInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'string.update',
        before_value: stringItem,
        after_value: updated,
      }),
    );
  });

  test('deactivateString과 activateString은 활성 상태와 비활성 사유를 갱신한다', async () => {
    const inactive = {
      ...stringItem,
      is_active: false,
      deactivation_reason: '단종',
    };
    const deactivateQuery = updateStringQuery(inactive);
    const activateQuery = updateStringQuery(stringItem);
    const auditInsert = jest.fn().mockResolvedValue({ error: null });
    const from = jest
      .fn()
      .mockReturnValueOnce(superAdminRoleQuery())
      .mockReturnValueOnce(readStringQuery())
      .mockReturnValueOnce(deactivateQuery)
      .mockReturnValueOnce({ insert: auditInsert })
      .mockReturnValueOnce(superAdminRoleQuery())
      .mockReturnValueOnce(readStringQuery(inactive))
      .mockReturnValueOnce(activateQuery)
      .mockReturnValueOnce({ insert: auditInsert });
    const service = createStringCatalogService({ from } as never);

    await expect(
      service.deactivateString('super-1', 'string-1', '단종'),
    ).resolves.toEqual(inactive);
    expect(deactivateQuery.update).toHaveBeenCalledWith(
      expect.objectContaining({
        is_active: false,
        deactivation_reason: '단종',
        deactivated_at: expect.any(String),
      }),
    );

    await expect(service.activateString('super-1', 'string-1')).resolves.toEqual(
      stringItem,
    );
    expect(activateQuery.update).toHaveBeenCalledWith(
      expect.objectContaining({
        is_active: true,
        deactivation_reason: null,
        deactivated_at: null,
      }),
    );
  });
});
