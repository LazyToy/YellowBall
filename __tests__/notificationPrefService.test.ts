import { createNotificationPrefService } from '../src/services/notificationPrefService';

const preferences = {
  user_id: 'user-1',
  booking_notifications: true,
  delivery_notifications: true,
  string_life_notifications: true,
  marketing_notifications: false,
  quiet_hours_enabled: false,
  quiet_hours_start: null,
  quiet_hours_end: null,
};

describe('notificationPrefService', () => {
  test('getPreferences는 본인 알림 설정을 조회한다', async () => {
    const single = jest
      .fn()
      .mockResolvedValue({ data: preferences, error: null });
    const eq = jest.fn(() => ({ single }));
    const select = jest.fn(() => ({ eq }));
    const from = jest.fn(() => ({ select }));
    const service = createNotificationPrefService({ from } as never);

    await expect(service.getPreferences('user-1')).resolves.toEqual(preferences);

    expect(from).toHaveBeenCalledWith('notification_preferences');
    expect(eq).toHaveBeenCalledWith('user_id', 'user-1');
  });

  test('updatePreferences는 quiet_hours와 토글 값을 저장한다', async () => {
    const updated = {
      ...preferences,
      quiet_hours_enabled: true,
      quiet_hours_start: '22:00',
    };
    const single = jest.fn().mockResolvedValue({ data: updated, error: null });
    const select = jest.fn(() => ({ single }));
    const eq = jest.fn(() => ({ select }));
    const update = jest.fn(() => ({ eq }));
    const from = jest.fn(() => ({ update }));
    const service = createNotificationPrefService({ from } as never);

    await expect(
      service.updatePreferences('user-1', {
        quiet_hours_enabled: true,
        quiet_hours_start: '22:00',
      }),
    ).resolves.toEqual(updated);

    expect(update).toHaveBeenCalledWith({
      quiet_hours_enabled: true,
      quiet_hours_start: '22:00',
    });
    expect(eq).toHaveBeenCalledWith('user_id', 'user-1');
  });
});
