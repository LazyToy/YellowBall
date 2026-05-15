import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

const mockReplace = jest.fn();
const mockPush = jest.fn();
const mockSignOut = jest.fn();
const mockGetProfile = jest.fn();
const mockUpdateProfile = jest.fn();
const mockGetMyBookings = jest.fn();
const mockGetMyDemoBookings = jest.fn();
const mockGetRackets = jest.fn();
let mockMenuSettings: Record<string, boolean>;

const defaultRackets = [
  {
    id: 'racket-1',
    brand: 'Wilson',
    model: 'Blade',
    is_primary: true,
    photo_url: null,
  },
];

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
}));

jest.mock('../src/services/profileService', () => ({
  getProfile: mockGetProfile,
  updateProfile: mockUpdateProfile,
}));

jest.mock('../src/services/bookingService', () => ({
  getMyBookings: mockGetMyBookings,
}));

jest.mock('../src/services/demoBookingService', () => ({
  getMyDemoBookings: mockGetMyDemoBookings,
}));

jest.mock('../src/services/racketService', () => ({
  getRackets: mockGetRackets,
}));

jest.mock('../src/services/storageService', () => ({
  getRacketPhotoUrl: (value?: string | null) => value ?? null,
}));

jest.mock('../src/hooks/useAuth', () => ({
  useAuth: () => ({
    profile: {
      id: 'user-1',
      username: 'yellow01',
      nickname: '옐로볼',
      phone: '010-1234-5678',
    },
    signOut: mockSignOut,
  }),
}));

const flattenStyle = (style: unknown) =>
  StyleSheet.flatten(
    typeof style === 'function'
      ? style({ pressed: false, hovered: false, focused: false })
      : style,
  );

jest.mock('@/hooks/useAppMenuSettings', () => ({
  useAppMenuSettings: () => mockMenuSettings,
}));

describe('MeScreen', () => {
  const renderReadyMeScreen = async () => {
    const MeScreen = require('../app/(tabs)/me').default;
    const screen = render(<MeScreen />);

    await waitFor(() => expect(screen.getByTestId('me-stat-wrench')).toBeTruthy());

    return screen;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockSignOut.mockResolvedValue(undefined);
    mockUpdateProfile.mockResolvedValue({
      id: 'user-1',
      username: 'yellow01',
      nickname: '새닉네임',
      phone: '010-2222-3333',
    });
    mockGetProfile.mockResolvedValue({
      id: 'user-1',
      username: 'yellow01',
      nickname: '새닉네임',
      phone: '010-2222-3333',
    });
    mockGetMyBookings.mockResolvedValue([]);
    mockGetMyDemoBookings.mockResolvedValue([]);
    mockGetRackets.mockResolvedValue(defaultRackets);
    mockMenuSettings = {
      'string-booking': true,
      'demo-booking': true,
      shop: true,
      'racket-library': true,
      delivery: true,
      community: false,
      subscription: false,
      'queue-board': true,
      'auto-reorder': true,
      analytics: false,
      'audit-log': true,
    };
  });

  test('프로필 정보와 로그아웃 버튼을 렌더링한다', async () => {
    const screen = await renderReadyMeScreen();

    expect(screen.getByText('옐로볼')).toBeTruthy();
    expect(screen.getByText('010-1234-5678')).toBeTruthy();
    expect(screen.getByDisplayValue('yellow01')).toBeTruthy();
    expect(screen.getByLabelText('로그아웃')).toBeTruthy();
  });

  test('마이페이지 헤더에 중복 알림 설정 톱니바퀴를 노출하지 않는다', async () => {
    const screen = await renderReadyMeScreen();

    expect(screen.queryByLabelText('설정')).toBeNull();
    expect(screen.getByLabelText('알림 설정')).toBeTruthy();
  });

  test('프로필 수정 모드에서 닉네임과 전화번호를 저장한다', async () => {
    const screen = await renderReadyMeScreen();

    fireEvent.press(screen.getByLabelText('프로필 수정'));
    fireEvent.changeText(screen.getByLabelText('닉네임'), '새닉네임');
    fireEvent.changeText(screen.getByLabelText('전화번호'), '010-2222-3333');
    fireEvent.press(screen.getByLabelText('프로필 저장'));

    await waitFor(() =>
      expect(mockUpdateProfile).toHaveBeenCalledWith('user-1', {
        nickname: '새닉네임',
        phone: '010-2222-3333',
      }),
    );
    await waitFor(() => expect(mockGetProfile).toHaveBeenCalledWith('user-1'));
  });

  test('로그아웃 후 인증 화면으로 이동한다', async () => {
    const screen = await renderReadyMeScreen();

    fireEvent.press(screen.getByLabelText('로그아웃'));

    await waitFor(() => expect(mockSignOut).toHaveBeenCalledTimes(1));
    expect(mockReplace).toHaveBeenCalledWith('/(auth)/login');
  });

  test('로그아웃 처리 중에는 마이페이지 안에 로딩 화면을 표시한다', async () => {
    mockSignOut.mockImplementation(() => new Promise(() => undefined));
    const screen = await renderReadyMeScreen();

    fireEvent.press(screen.getByLabelText('로그아웃'));

    await waitFor(() =>
      expect(screen.getByTestId('me-signout-loading')).toBeTruthy(),
    );
    expect(screen.getByText('로그아웃 중')).toBeTruthy();
    expect(screen.getByText('안전하게 세션을 정리하고 있습니다.')).toBeTruthy();
    expect(mockReplace).not.toHaveBeenCalledWith('/(auth)/login');
  });

  test('마이페이지 메뉴는 임시 샵/알림함 라우팅 대신 준비 안내를 표시한다', async () => {
    const screen = await renderReadyMeScreen();

    fireEvent.press(screen.getByLabelText('공지사항'));
    expect(mockPush).not.toHaveBeenCalledWith('/notifications');
    expect(screen.getByText('공지사항 기능은 준비 중입니다.')).toBeTruthy();

    fireEvent.press(screen.getByLabelText('문의하기'));
    expect(mockPush).not.toHaveBeenCalledWith('/notifications');
    expect(screen.getByText('문의하기 기능은 준비 중입니다.')).toBeTruthy();
  });

  test('주문 내역 메뉴는 주문내역 페이지로 이동한다', async () => {
    const screen = await renderReadyMeScreen();

    fireEvent.press(screen.getByLabelText('주문 내역'));

    expect(mockPush).toHaveBeenCalledWith('/orders');
  });

  test('배송 메뉴가 꺼져 있으면 배송지 관리 메뉴를 숨긴다', async () => {
    mockMenuSettings = {
      ...mockMenuSettings,
      delivery: false,
    };
    const screen = await renderReadyMeScreen();

    expect(screen.queryByText('배송지 관리')).toBeNull();
  });

  test('내 라켓 카드는 상세 화면으로 이동한다', async () => {
    const screen = await renderReadyMeScreen();

    await waitFor(() => expect(screen.getByLabelText('Wilson Blade 관리')).toBeTruthy());

    fireEvent.press(screen.getByLabelText('Wilson Blade 관리'));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/racket-detail',
      params: { from: '/me', id: 'racket-1' },
    });
  });

  test('요약 통계는 Android에서 카드 안의 네 칸 고정폭 레이아웃을 사용한다', async () => {
    const screen = await renderReadyMeScreen();

    expect(flattenStyle(screen.getByTestId('me-stats-grid').props.style)).toEqual(
      expect.objectContaining({
        flexDirection: 'row',
        justifyContent: 'flex-start',
        overflow: 'hidden',
        width: '100%',
      }),
    );
    expect(flattenStyle(screen.getByTestId('me-stat-wrench-column').props.style)).toEqual(
      expect.objectContaining({
        flexBasis: '25%',
        flexGrow: 0,
        flexShrink: 0,
        justifyContent: 'center',
        maxWidth: '25%',
        minHeight: 68,
        minWidth: 0,
        width: '25%',
      }),
    );
    expect(flattenStyle(screen.getByTestId('me-stat-wrench').props.style)).toEqual(
      expect.objectContaining({
        bottom: 0,
        left: 0,
        position: 'absolute',
        right: 0,
        top: 0,
      }),
    );
  });

  test('푸터는 로그아웃 버튼을 버전 문구 위에 배치한다', async () => {
    const screen = await renderReadyMeScreen();
    const footerChildren = React.Children.toArray(
      screen.getByTestId('me-footer').props.children,
    ) as React.ReactElement[];

    expect(footerChildren[0].props.testID).toBe('me-footer-logout');
    expect(footerChildren[1].props.testID).toBe('me-footer-version');
  });
});
