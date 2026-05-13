import {
  OPERATION_POLICY_KEY,
  createDefaultOperationPolicySettings,
  createOperationPolicyService,
  mergeOperationPolicySettings,
} from '../src/services/operationPolicyService';

describe('operationPolicyService', () => {
  test('DB 운영 정책은 알려진 숫자와 boolean 값만 반영한다', () => {
    const settings = mergeOperationPolicySettings({
      bookingOpenHoursBefore: 4,
      bookingMaxDaysAhead: 30,
      maxConcurrentBookings: '3',
      notifyMarketing: true,
      unknown: true,
    });

    expect(settings.bookingOpenHoursBefore).toBe(4);
    expect(settings.bookingMaxDaysAhead).toBe(30);
    expect(settings.maxConcurrentBookings).toBe(1);
    expect(settings.notifyMarketing).toBe(true);
    expect(settings).not.toHaveProperty('unknown');
  });

  test('운영 정책을 app_settings.operation_policy에서 조회한다', async () => {
    const maybeSingle = jest.fn().mockResolvedValue({
      data: {
        value: {
          bookingOpenHoursBefore: 6,
          stringingRefundHours: 12,
          suspendedLoginBlocked: false,
        },
      },
      error: null,
    });
    const eq = jest.fn(() => ({ maybeSingle }));
    const select = jest.fn(() => ({ eq }));
    const from = jest.fn(() => ({ select }));
    const service = createOperationPolicyService({ from } as never);

    await expect(service.getSettings()).resolves.toMatchObject({
      bookingOpenHoursBefore: 6,
      stringingRefundHours: 12,
      suspendedLoginBlocked: false,
    });

    expect(from).toHaveBeenCalledWith('app_settings');
    expect(select).toHaveBeenCalledWith('value');
    expect(eq).toHaveBeenCalledWith('key', OPERATION_POLICY_KEY);
  });

  test('조회 실패 시 기본 운영 정책을 반환한다', async () => {
    const maybeSingle = jest.fn().mockResolvedValue({
      data: null,
      error: { message: 'permission denied' },
    });
    const eq = jest.fn(() => ({ maybeSingle }));
    const select = jest.fn(() => ({ eq }));
    const from = jest.fn(() => ({ select }));
    const service = createOperationPolicyService({ from } as never);

    await expect(service.getSettings()).resolves.toEqual(
      createDefaultOperationPolicySettings(),
    );
  });
});
