import {
  MENU_SETTINGS_KEY,
  createAppMenuSettingsService,
  createDefaultMenuSettings,
  mergeMenuSettings,
} from '../src/services/appMenuSettingsService';

describe('appMenuSettingsService', () => {
  test('DB 메뉴 설정은 알려진 boolean 메뉴만 반영한다', () => {
    const settings = mergeMenuSettings({
      menus: {
        shop: false,
        community: true,
        unknown: true,
      },
    });

    expect(settings.shop).toBe(false);
    expect(settings.community).toBe(true);
    expect(settings).not.toHaveProperty('unknown');
    expect(settings['audit-log']).toBe(true);
  });

  test('앱 메뉴 설정을 app_settings에서 조회한다', async () => {
    const maybeSingle = jest.fn().mockResolvedValue({
      data: {
        value: {
          menus: {
            'string-booking': false,
            shop: false,
          },
        },
      },
      error: null,
    });
    const eq = jest.fn(() => ({ maybeSingle }));
    const select = jest.fn(() => ({ eq }));
    const from = jest.fn(() => ({ select }));
    const service = createAppMenuSettingsService({ from } as never);

    await expect(service.getSettings()).resolves.toMatchObject({
      'string-booking': false,
      shop: false,
      'audit-log': true,
    });

    expect(from).toHaveBeenCalledWith('app_settings');
    expect(select).toHaveBeenCalledWith('value');
    expect(eq).toHaveBeenCalledWith('key', MENU_SETTINGS_KEY);
  });

  test('조회 실패 시 기본 메뉴 설정을 반환한다', async () => {
    const maybeSingle = jest.fn().mockResolvedValue({
      data: null,
      error: { message: 'permission denied' },
    });
    const eq = jest.fn(() => ({ maybeSingle }));
    const select = jest.fn(() => ({ eq }));
    const from = jest.fn(() => ({ select }));
    const service = createAppMenuSettingsService({ from } as never);

    await expect(service.getSettings()).resolves.toEqual(createDefaultMenuSettings());
  });
});
