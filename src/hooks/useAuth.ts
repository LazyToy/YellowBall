import { useSyncExternalStore } from 'react';
import type { Session, User } from '@supabase/supabase-js';

import {
  signIn as serviceSignIn,
  signInWithOAuthProvider as serviceSignInWithOAuthProvider,
  signOut as serviceSignOut,
  type SocialAuthProvider,
  type SignInResult,
} from '../services/authService';
import { getProfile } from '../services/profileService';
import { resetAllZustandStores } from '../stores/resetStores';
import type { Profile } from '../types/database';

export type AuthSnapshot = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  errorMessage: string | null;
};

export type AuthState = AuthSnapshot & {
  isAdmin: boolean;
  isSuperAdmin: boolean;
  signIn: (email: string, password: string) => Promise<SignInResult>;
  signInWithOAuthProvider: (
    provider: SocialAuthProvider,
  ) => Promise<SignInResult>;
  signOut: () => Promise<void>;
};

type AuthListener = () => void;

const listeners = new Set<AuthListener>();

let snapshot: AuthSnapshot = {
  session: null,
  user: null,
  profile: null,
  isLoading: true,
  errorMessage: null,
};

const notify = () => {
  listeners.forEach((listener) => listener());
};

const setSnapshot = (nextSnapshot: AuthSnapshot) => {
  snapshot = nextSnapshot;
  notify();
};

const toKoreanAuthError = (error: unknown) => {
  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return `인증 상태를 불러오지 못했습니다. ${error.message}`;
  }

  return '인증 상태를 불러오지 못했습니다.';
};

const getBlockedAccountMessage = (profile: Profile) => {
  if (profile.status === 'suspended') {
    return '계정이 제재되었습니다.';
  }

  if (profile.status === 'deleted_pending') {
    return '탈퇴 처리 중인 계정입니다.';
  }

  if (profile.status === 'deleted') {
    return '탈퇴가 완료된 계정입니다.';
  }

  return null;
};

const clearAuthenticatedSnapshot = (errorMessage: string | null = null) => {
  setSnapshot({
    session: null,
    user: null,
    profile: null,
    isLoading: false,
    errorMessage,
  });
};

export const syncAuthSession = async (session: Session | null) => {
  if (!session) {
    clearAuthenticatedSnapshot();
    return;
  }

  setSnapshot({
    session,
    user: session.user,
    profile: null,
    isLoading: true,
    errorMessage: null,
  });

  try {
    const profile = await getProfile(session.user.id);
    const blockedMessage = getBlockedAccountMessage(profile);

    if (blockedMessage) {
      try {
        await serviceSignOut();
      } catch {
        // 차단된 세션은 원격 로그아웃 실패와 무관하게 로컬에서 제거합니다.
      }

      resetAllZustandStores();
      clearAuthenticatedSnapshot(blockedMessage);
      return;
    }

    setSnapshot({
      session,
      user: session.user,
      profile,
      isLoading: false,
      errorMessage: null,
    });
  } catch (error) {
    setSnapshot({
      session,
      user: session.user,
      profile: null,
      isLoading: false,
      errorMessage: toKoreanAuthError(error),
    });
  }
};

const subscribeToAuthStore = (listener: AuthListener) => {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
};

const getAuthSnapshot = () => snapshot;

export const resetAuthStateForTest = () => {
  listeners.clear();
  snapshot = {
    session: null,
    user: null,
    profile: null,
    isLoading: true,
    errorMessage: null,
  };
};

const signIn = async (email: string, password: string) => {
  setSnapshot({
    ...snapshot,
    isLoading: true,
    errorMessage: null,
  });

  const result = await serviceSignIn(email, password);

  if (result.error || !result.session) {
    setSnapshot({
      session: null,
      user: null,
      profile: null,
      isLoading: false,
      errorMessage: result.error?.message ?? '로그인에 실패했습니다.',
    });
    return result;
  }

  await syncAuthSession(result.session);
  return result;
};

const signInWithOAuthProvider = async (provider: SocialAuthProvider) => {
  setSnapshot({
    ...snapshot,
    isLoading: true,
    errorMessage: null,
  });

  const result = await serviceSignInWithOAuthProvider(provider);

  if (result.error || !result.session) {
    setSnapshot({
      session: null,
      user: null,
      profile: null,
      isLoading: false,
      errorMessage: result.error?.message ?? '로그인에 실패했습니다.',
    });
    return result;
  }

  await syncAuthSession(result.session);
  return result;
};

const signOut = async () => {
  setSnapshot({
    ...snapshot,
    isLoading: true,
    errorMessage: null,
  });

  try {
    await serviceSignOut();
    resetAllZustandStores();
    await syncAuthSession(null);
  } catch (error) {
    setSnapshot({
      ...snapshot,
      isLoading: false,
      errorMessage:
        error instanceof Error ? error.message : '로그아웃에 실패했습니다.',
    });
    throw error;
  }
};

export function useAuth(): AuthState {
  const currentSnapshot = useSyncExternalStore(
    subscribeToAuthStore,
    getAuthSnapshot,
    getAuthSnapshot,
  );

  const isSuperAdmin = currentSnapshot.profile?.role === 'super_admin';
  const isAdmin = currentSnapshot.profile?.role === 'admin' || isSuperAdmin;

  return {
    ...currentSnapshot,
    isAdmin,
    isSuperAdmin,
    signIn,
    signInWithOAuthProvider,
    signOut,
  };
}
