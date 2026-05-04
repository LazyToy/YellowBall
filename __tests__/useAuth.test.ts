import { act, renderHook, waitFor } from '@testing-library/react-native';

import type { Profile } from '../src/types/database';

const mockGetProfile = jest.fn();
const mockServiceSignIn = jest.fn();
const mockServiceSignOut = jest.fn();
const mockResetAllZustandStores = jest.fn();

jest.mock('../src/services/profileService', () => ({
  getProfile: mockGetProfile,
}));

jest.mock('../src/services/authService', () => ({
  signIn: mockServiceSignIn,
  signOut: mockServiceSignOut,
}));

jest.mock('../src/stores/resetStores', () => ({
  resetAllZustandStores: mockResetAllZustandStores,
}));

const profile: Profile = {
  id: 'user-1',
  username: 'yellow01',
  nickname: '옐로볼',
  phone: '010-0000-0000',
  role: 'admin',
  status: 'active',
  created_at: '2026-04-30T00:00:00.000Z',
  updated_at: '2026-04-30T00:00:00.000Z',
};

const session = {
  access_token: 'access-token',
  refresh_token: 'refresh-token',
  expires_in: 3600,
  token_type: 'bearer',
  user: {
    id: 'user-1',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: '2026-04-30T00:00:00.000Z',
  },
};

describe('useAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetProfile.mockResolvedValue(profile);
    mockServiceSignIn.mockResolvedValue({
      session,
      user: session.user,
      error: null,
    });
    mockServiceSignOut.mockResolvedValue(undefined);
  });

  test('초기 세션 없음에서 로그인/로그아웃 상태 전환을 반영한다', async () => {
    const {
      resetAuthStateForTest,
      syncAuthSession,
      useAuth,
    } = require('../src/hooks/useAuth');
    resetAuthStateForTest();

    const { result, unmount } = renderHook(() => useAuth());

    await act(async () => {
      await syncAuthSession(null);
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.session).toBeNull();
    expect(result.current.user).toBeNull();
    expect(result.current.profile).toBeNull();
    expect(result.current.isAdmin).toBe(false);

    await act(async () => {
      await syncAuthSession(session);
    });

    await waitFor(() => expect(result.current.session).toEqual(session));
    expect(result.current.user?.id).toBe('user-1');
    expect(result.current.profile).toEqual(profile);
    expect(result.current.isAdmin).toBe(true);
    expect(result.current.isSuperAdmin).toBe(false);
    expect(mockGetProfile).toHaveBeenCalledWith('user-1');

    await act(async () => {
      await syncAuthSession(null);
    });

    await waitFor(() => expect(result.current.session).toBeNull());
    expect(result.current.user).toBeNull();
    expect(result.current.profile).toBeNull();
    expect(result.current.isAdmin).toBe(false);

    unmount();
  });

  test('signIn과 signOut 메서드는 서비스 호출 후 인증 스냅샷을 갱신한다', async () => {
    const { resetAuthStateForTest, useAuth } = require('../src/hooks/useAuth');
    resetAuthStateForTest();

    const { result, unmount } = renderHook(() => useAuth());

    let signInResult: unknown;
    await act(async () => {
      signInResult = await result.current.signIn('010-1234-5678', 'Yellow1!');
    });

    expect(mockServiceSignIn).toHaveBeenCalledWith(
      '010-1234-5678',
      'Yellow1!',
    );
    expect(signInResult).toEqual({
      session,
      user: session.user,
      error: null,
    });
    await waitFor(() => expect(result.current.profile).toEqual(profile));

    await act(async () => {
      await result.current.signOut();
    });

    expect(mockServiceSignOut).toHaveBeenCalledTimes(1);
    expect(mockResetAllZustandStores).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(result.current.session).toBeNull());
    expect(result.current.profile).toBeNull();

    unmount();
  });

  test('저장된 세션의 프로필이 suspended이면 자동 로그인하지 않고 세션을 삭제한다', async () => {
    const {
      resetAuthStateForTest,
      syncAuthSession,
      useAuth,
    } = require('../src/hooks/useAuth');
    resetAuthStateForTest();
    mockGetProfile.mockResolvedValue({
      ...profile,
      status: 'suspended',
    });

    const { result, unmount } = renderHook(() => useAuth());

    await act(async () => {
      await syncAuthSession(session);
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(mockServiceSignOut).toHaveBeenCalledTimes(1);
    expect(mockResetAllZustandStores).toHaveBeenCalledTimes(1);
    expect(result.current.session).toBeNull();
    expect(result.current.user).toBeNull();
    expect(result.current.profile).toBeNull();
    expect(result.current.errorMessage).toBe('계정이 제재되었습니다.');

    unmount();
  });

  test('저장된 세션의 프로필이 deleted_pending이면 자동 로그인하지 않고 세션을 삭제한다', async () => {
    const {
      resetAuthStateForTest,
      syncAuthSession,
      useAuth,
    } = require('../src/hooks/useAuth');
    resetAuthStateForTest();
    mockGetProfile.mockResolvedValue({
      ...profile,
      status: 'deleted_pending',
    });

    const { result, unmount } = renderHook(() => useAuth());

    await act(async () => {
      await syncAuthSession(session);
    });

    await waitFor(() => expect(result.current.session).toBeNull());
    expect(mockServiceSignOut).toHaveBeenCalledTimes(1);
    expect(mockResetAllZustandStores).toHaveBeenCalledTimes(1);
    expect(result.current.profile).toBeNull();
    expect(result.current.errorMessage).toBe('탈퇴 처리 중인 계정입니다.');

    unmount();
  });
});
