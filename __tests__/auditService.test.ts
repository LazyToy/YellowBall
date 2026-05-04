import { createAuditService } from '../src/services/auditService';

describe('auditService', () => {
  test('logAction은 before/after 값을 JSONB 로그로 저장한다', async () => {
    const log = {
      id: 'log-1',
      actor_id: 'admin-1',
      action: 'string.update',
      target_table: 'string_catalog',
      target_id: 'string-1',
      before_value: { is_active: true },
      after_value: { is_active: false },
      ip_address: null,
      user_agent: null,
      created_at: '2026-05-03T00:00:00.000Z',
    };
    const single = jest.fn().mockResolvedValue({ data: log, error: null });
    const select = jest.fn(() => ({ single }));
    const insert = jest.fn(() => ({ select }));
    const from = jest.fn(() => ({ insert }));
    const service = createAuditService({ from } as never);

    await expect(
      service.logAction(
        'admin-1',
        'string.update',
        { table: 'string_catalog', id: 'string-1' },
        { is_active: true },
        { is_active: false },
      ),
    ).resolves.toEqual(log);

    expect(from).toHaveBeenCalledWith('administrator_audit_logs');
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        actor_id: 'admin-1',
        before_value: { is_active: true },
        after_value: { is_active: false },
      }),
    );
  });

  test('getAuditLogs는 필터와 limit을 적용해 최신순으로 조회한다', async () => {
    const logs = [
      {
        id: 'log-1',
        actor_id: 'admin-1',
        action: 'admin.appoint',
        target_table: 'profiles',
        target_id: 'user-1',
        before_value: null,
        after_value: null,
        ip_address: null,
        user_agent: null,
        created_at: '2026-05-03T00:00:00.000Z',
      },
    ];
    const limit = jest.fn().mockResolvedValue({ data: logs, error: null });
    const query = {
      eq: jest.fn(() => query),
      limit,
    };
    const order = jest.fn(() => query);
    const select = jest.fn(() => ({ order }));
    const from = jest.fn(() => ({ select }));
    const service = createAuditService({ from } as never);

    await expect(
      service.getAuditLogs({
        actorId: 'admin-1',
        action: 'admin.appoint',
        targetTable: 'profiles',
        limit: 10,
      }),
    ).resolves.toEqual(logs);

    expect(order).toHaveBeenCalledWith('created_at', { ascending: false });
    expect(query.eq).toHaveBeenCalledWith('actor_id', 'admin-1');
    expect(query.eq).toHaveBeenCalledWith('action', 'admin.appoint');
    expect(query.eq).toHaveBeenCalledWith('target_table', 'profiles');
    expect(limit).toHaveBeenCalledWith(10);
  });

  test('getAuditLogs는 RLS 조회 차단 오류를 사용자에게 전달한다', async () => {
    const limit = jest
      .fn()
      .mockResolvedValue({ data: null, error: { message: 'permission denied' } });
    const query = {
      eq: jest.fn(() => query),
      limit,
    };
    const order = jest.fn(() => query);
    const select = jest.fn(() => ({ order }));
    const from = jest.fn(() => ({ select }));
    const service = createAuditService({ from } as never);

    await expect(service.getAuditLogs()).rejects.toThrow('permission denied');
  });

  test('withAudit은 작업 결과를 반환하고 로그를 남긴다', async () => {
    const single = jest.fn().mockResolvedValue({
      data: { id: 'log-1', action: 'admin.appoint' },
      error: null,
    });
    const select = jest.fn(() => ({ single }));
    const insert = jest.fn(() => ({ select }));
    const from = jest.fn(() => ({ insert }));
    const service = createAuditService({ from } as never);

    await expect(
      service.withAudit(
        'admin-1',
        'admin.appoint',
        { table: 'profiles', id: 'user-1' },
        async () => ({ ok: true }),
      ),
    ).resolves.toEqual({ ok: true });
    expect(insert).toHaveBeenCalled();
  });
});
