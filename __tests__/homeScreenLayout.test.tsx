import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { theme } from '../src/constants/theme';

const mockPush = jest.fn();
const mockGetAppContentBlocks = jest.fn();
const mockGetMyBookings = jest.fn();
const mockGetRackets = jest.fn();
const mockGetActiveStrings = jest.fn();
const mockGetSetupsByRacket = jest.fn();
const mockGetStoreInfo = jest.fn();
const mockDefaultMenuSettings = {
  'booking-history': true,
  'demo-booking': true,
  'racket-library': false,
  shop: true,
  'string-booking': true,
};
let mockMenuSettings = { ...mockDefaultMenuSettings };

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock('../src/hooks/useAuth', () => ({
  useAuth: () => ({
    profile: { id: 'user-1', nickname: 'Tester', username: 'tester' },
  }),
}));

jest.mock('../src/hooks/useAppMenuSettings', () => ({
  useAppMenuSettings: () => mockMenuSettings,
}));

jest.mock('../src/services/appContentService', () => ({
  getAppContentBlocks: mockGetAppContentBlocks,
}));

jest.mock('../src/services/bookingService', () => ({
  getMyBookings: mockGetMyBookings,
}));

jest.mock('../src/services/racketService', () => ({
  getRackets: mockGetRackets,
}));

jest.mock('../src/services/stringCatalogService', () => ({
  getActiveStrings: mockGetActiveStrings,
}));

jest.mock('../src/services/stringSetupService', () => ({
  getSetupsByRacket: mockGetSetupsByRacket,
}));

jest.mock('../src/services/storeSettingsService', () => ({
  getStoreInfo: mockGetStoreInfo,
}));

jest.mock('../src/services/storageService', () => ({
  getAppAssetUrl: (value?: string | null) => value ?? null,
  getRacketPhotoUrl: (value?: string | null) => value ?? null,
  getStringPhotoUrl: (value?: string | null) => value ?? null,
}));

const flattenStyle = (style: unknown) =>
  StyleSheet.flatten(
    typeof style === 'function'
      ? style({ pressed: false, hovered: false, focused: false })
      : style,
  );

describe('HomeScreen native layout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMenuSettings = { ...mockDefaultMenuSettings };
    mockGetAppContentBlocks.mockResolvedValue({
      home_banners: [
        {
          buttonLabel: 'Book',
          id: 'banner-1',
          image_path: null,
          image_url: null,
          meta: 'STRINGING',
          route: '/new-booking',
          subtitle: 'Fast service',
          title: 'Stringing Banner',
        },
      ],
      home_categories: [
        { id: 'rackets', image_path: null, label: 'Rackets', route: '/shop' },
      ],
      home_store_hours: null,
    });
    mockGetMyBookings.mockResolvedValue([]);
    mockGetRackets.mockResolvedValue([]);
    mockGetActiveStrings.mockResolvedValue([]);
    mockGetSetupsByRacket.mockResolvedValue([]);
    mockGetStoreInfo.mockResolvedValue({ storeName: 'YellowBall' });
  });

  test('removes the home promo banners and shop category menu', async () => {
    const HomeScreen = require('../app/(tabs)/index').default;
    const screen = render(<HomeScreen />);

    fireEvent(screen.getByTestId('home-layout-probe'), 'layout', {
      nativeEvent: { layout: { height: 0, width: 320 } },
    });

    await waitFor(() =>
      expect(mockGetAppContentBlocks).toHaveBeenCalledWith([
        'home_store_hours',
      ]),
    );

    expect(screen.queryByTestId('home-banner-list')).toBeNull();
    expect(screen.queryByTestId('home-banner-banner-1')).toBeNull();
    expect(screen.queryByTestId('home-category-rackets')).toBeNull();
    expect(screen.queryByText('Stringing Banner')).toBeNull();
  });

  test('opens stringing and demo quick actions with matching booking modes', async () => {
    const HomeScreen = require('../app/(tabs)/index').default;
    const screen = render(<HomeScreen />);

    fireEvent(screen.getByTestId('home-layout-probe'), 'layout', {
      nativeEvent: { layout: { height: 0, width: 320 } },
    });

    await waitFor(() => expect(mockGetAppContentBlocks).toHaveBeenCalled());

    fireEvent.press(screen.getByTestId('home-quick-action-string-booking'));
    expect(mockPush).toHaveBeenCalledWith('/new-booking?mode=stringing');

    fireEvent.press(screen.getByTestId('home-quick-action-demo-booking'));
    expect(mockPush).toHaveBeenCalledWith('/new-booking?mode=demo');
  });

  test('uses measured Android content width for quick actions', async () => {
    const HomeScreen = require('../app/(tabs)/index').default;
    const screen = render(<HomeScreen />);

    fireEvent(screen.getByTestId('home-layout-probe'), 'layout', {
      nativeEvent: { layout: { height: 0, width: 320 } },
    });

    await waitFor(() => expect(mockGetAppContentBlocks).toHaveBeenCalled());

    expect(
      flattenStyle(
        screen.getByTestId('home-quick-action-string-booking').props.style,
      ).width,
    ).toBe(74);
    expect(flattenStyle(screen.getByTestId('home-quick-row-0').props.style)).toEqual(
      expect.objectContaining({
        justifyContent: 'space-between',
        width: '100%',
      }),
    );
    expect(
      StyleSheet.flatten(
        screen.getByTestId('home-quick-cell-string-booking').props.style,
      ),
    ).toEqual(
      expect.objectContaining({
        flexGrow: 0,
        flexShrink: 0,
        width: 74,
      }),
    );
    expect(
      StyleSheet.flatten(
        screen.getByTestId('home-quick-label-string-booking').props.style,
      ),
    ).toEqual(
      expect.objectContaining({
        lineHeight: expect.any(Number),
        width: '100%',
      }),
    );
  });

  test('centers quick action icons in a full-width Android-safe slot', async () => {
    const HomeScreen = require('../app/(tabs)/index').default;
    const screen = render(<HomeScreen />);

    fireEvent(screen.getByTestId('home-layout-probe'), 'layout', {
      nativeEvent: { layout: { height: 0, width: 320 } },
    });

    await waitFor(() => expect(mockGetAppContentBlocks).toHaveBeenCalled());

    expect(
      StyleSheet.flatten(
        screen.getByTestId('home-quick-icon-slot-string-booking').props.style,
      ),
    ).toEqual(
      expect.objectContaining({
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
      }),
    );
  });

  test('renders the add racket control as a fixed dashed tile on native', async () => {
    mockMenuSettings = {
      ...mockDefaultMenuSettings,
      'racket-library': true,
    };
    mockGetRackets.mockResolvedValue([
      {
        brand: 'Bobolt',
        id: 'racket-1',
        is_primary: true,
        model: '1212',
        photo_url: null,
      },
    ]);

    const HomeScreen = require('../app/(tabs)/index').default;
    const screen = render(<HomeScreen />);

    fireEvent(screen.getByTestId('home-layout-probe'), 'layout', {
      nativeEvent: { layout: { height: 0, width: 320 } },
    });

    const addRacketCard = await screen.findByTestId('home-add-racket-card');
    const addRacketStyle = flattenStyle(addRacketCard.props.style);
    const racketSectionStyle = flattenStyle(
      screen.getByTestId('home-racket-section').props.style,
    );
    const racketCardStyle = flattenStyle(
      screen.getByTestId('home-racket-card-racket-1').props.style,
    );
    const racketPressableStyle = flattenStyle(
      screen.getByTestId('home-racket-card-pressable-racket-1').props.style,
    );
    const racketInfoStyle = flattenStyle(
      screen.getByTestId('home-racket-info-racket-1').props.style,
    );

    expect(racketSectionStyle).toEqual(
      expect.objectContaining({
        paddingHorizontal: theme.spacing[5],
      }),
    );
    expect(racketCardStyle).toEqual(
      expect.objectContaining({
        flexShrink: 0,
        marginRight: theme.spacing[3],
        maxWidth: 210,
        minWidth: 210,
        width: 210,
      }),
    );
    expect(racketPressableStyle).toEqual(
      expect.objectContaining({
        width: '100%',
      }),
    );
    expect(racketInfoStyle).toEqual(
      expect.objectContaining({
        marginTop: theme.spacing[4],
      }),
    );
    expect(addRacketStyle).toEqual(
      expect.objectContaining({
        flexShrink: 0,
        height: 198,
        maxWidth: 140,
        minHeight: 198,
        minWidth: 140,
        overflow: 'hidden',
        position: 'relative',
        width: 140,
      }),
    );
    expect(addRacketStyle.width).not.toBe('100%');

    const addRacketContentStyle = flattenStyle(
      screen.getByTestId('home-add-racket-content').props.style,
    );
    const dashOutlineStyle = flattenStyle(
      screen.getByTestId('home-add-racket-dash-outline').props.style,
    );
    const topDashRow = screen.getByTestId('home-add-racket-dash-top');
    const leftDashColumn = screen.getByTestId('home-add-racket-dash-left');

    expect(addRacketContentStyle).toEqual(
      expect.objectContaining({
        alignItems: 'center',
        flexDirection: 'column',
        height: 198,
        justifyContent: 'center',
        width: 140,
      }),
    );
    expect(dashOutlineStyle).toEqual(
      expect.objectContaining({
        bottom: 0,
        left: 0,
        overflow: 'hidden',
        position: 'absolute',
        right: 0,
        top: 0,
      }),
    );
    expect(topDashRow.props.children).toHaveLength(7);
    expect(leftDashColumn.props.children).toHaveLength(10);

    fireEvent.press(screen.getByTestId('home-add-racket-card'));
    fireEvent.press(screen.getByTestId('home-racket-manage-link'));

    expect(mockPush).toHaveBeenCalledWith('/rackets');
    expect(mockPush).toHaveBeenCalledWith('/racket-list');
    expect(mockPush).toHaveBeenCalledTimes(2);
  });

  test('opens featured string detail from the home carousel', async () => {
    mockGetActiveStrings.mockResolvedValue([
      {
        brand: 'Babolat',
        description: 'Durable shaped polyester string.',
        gauge: '1.25',
        id: 'string-1',
        image_url: null,
        name: 'RPM Blast',
        price: 30000,
        recommended_style: 'spin',
      },
    ]);

    const HomeScreen = require('../app/(tabs)/index').default;
    const screen = render(<HomeScreen />);

    fireEvent(screen.getByTestId('home-layout-probe'), 'layout', {
      nativeEvent: { layout: { height: 0, width: 320 } },
    });

    const featuredString = await screen.findByTestId(
      'home-featured-string-string-1',
    );

    fireEvent.press(featuredString);

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/string-detail',
      params: { from: '/', id: 'string-1' },
    });
  });

  test('keeps featured string cards a consistent size and truncates long copy', async () => {
    mockGetActiveStrings.mockResolvedValue([
      {
        brand: 'Babolat',
        description:
          'A very long description that should be truncated before it changes the card height on Android devices.',
        gauge: '1.25',
        id: 'long-string',
        image_url: null,
        name: 'RPM Blast Team Extra Long Name For Layout Regression',
        price: 25000,
        recommended_style: 'attack',
      },
      {
        brand: 'Luxilon',
        description: 'Short.',
        gauge: '1.25',
        id: 'short-string',
        image_url: null,
        name: 'ALU',
        price: 32000,
        recommended_style: 'control',
      },
    ]);

    const HomeScreen = require('../app/(tabs)/index').default;
    const screen = render(<HomeScreen />);

    fireEvent(screen.getByTestId('home-layout-probe'), 'layout', {
      nativeEvent: { layout: { height: 0, width: 320 } },
    });

    const longCard = await screen.findByTestId(
      'home-featured-string-card-long-string',
    );
    const shortCard = await screen.findByTestId(
      'home-featured-string-card-short-string',
    );
    const longTitle = screen.getByTestId(
      'home-featured-string-title-long-string',
    );
    const longDescription = screen.getByTestId(
      'home-featured-string-description-long-string',
    );
    const longPressableStyle = flattenStyle(
      screen.getByTestId('home-featured-string-long-string').props.style,
    );

    expect(flattenStyle(longCard.props.style)).toEqual(
      expect.objectContaining({ height: 312 }),
    );
    expect(flattenStyle(shortCard.props.style)).toEqual(
      expect.objectContaining({ height: 312 }),
    );
    expect(longPressableStyle).toEqual(
      expect.objectContaining({
        flexBasis: 156,
        flexShrink: 0,
        maxWidth: 156,
        minWidth: 156,
        width: 156,
      }),
    );
    expect(longTitle.props.numberOfLines).toBe(2);
    expect(longDescription.props.numberOfLines).toBe(2);
  });

  test('falls back to two-column quick actions on narrow measured Android content width', async () => {
    const HomeScreen = require('../app/(tabs)/index').default;
    const screen = render(<HomeScreen />);

    fireEvent(screen.getByTestId('home-layout-probe'), 'layout', {
      nativeEvent: { layout: { height: 0, width: 280 } },
    });

    await waitFor(() => expect(mockGetAppContentBlocks).toHaveBeenCalled());

    expect(
      flattenStyle(
        screen.getByTestId('home-quick-action-string-booking').props.style,
      ).width,
    ).toBe(136);
  });

  test('TopBar shows an inline notification icon without brand or extra top spacing', () => {
    const { TopBar } = require('../src/components/MobileUI');

    const screen = render(
      <TopBar nickname="Tester" storeName="YellowBall" />,
    );
    const topBar = screen.getByTestId('topbar-container');
    const notificationButton = screen.getByTestId(
      'topbar-notification-button',
    );
    const topBarStyle = flattenStyle(topBar.props.style);
    const buttonStyle = flattenStyle(notificationButton.props.style);
    const tree = JSON.stringify(screen.toJSON());

    expect(screen.queryByText('YellowBall')).toBeNull();
    expect(screen.queryByText('T')).toBeNull();
    expect(tree).not.toContain('#de3b3d');
    expect(topBarStyle.paddingTop).toBeUndefined();
    expect(topBarStyle.paddingHorizontal).toBeUndefined();
    expect(buttonStyle.backgroundColor).toBe('transparent');
    expect(buttonStyle.marginTop).toBeUndefined();
  });
});
