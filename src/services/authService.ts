import type {
  AuthChangeEvent,
  Session,
  SupabaseClient,
  User,
} from '@supabase/supabase-js';

import { AUTH_SESSION_STORAGE_KEY } from '@/constants/auth';
import type { Database, Profile } from '@/types/database';

type AuthClient = Pick<SupabaseClient<Database>, 'auth' | 'functions' | 'from'>;
type RpcAuthClient = AuthClient & Pick<SupabaseClient<Database>, 'rpc'>;
type SessionStorage = {
  removeItem: (key: string) => Promise<void>;
  storageKey?: string;
};

export type SignInResult = {
  session: Session | null;
  user: User | null;
  error: Error | null;
};

export interface AuthService {
  signUp: (
    phone: string,
    password: string,
    username: string,
    nickname: string,
  ) => Promise<unknown>;
  checkUsernameAvailable: (username: string) => Promise<boolean>;
  signIn: (phone: string, password: string) => Promise<SignInResult>;
  signOut: () => Promise<void>;
  getSession: () => Promise<Session | null>;
  requestAccountDeletion: (
    userId: string,
    password: string,
    profile: Profile,
  ) => Promise<void>;
  onAuthStateChange: (
    callback: (event: AuthChangeEvent, session: Session | null) => void,
  ) => { unsubscribe: () => void };
}

const toErrorMessage = (fallback: string, error: unknown) => {
  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return `${fallback} ${error.message}`;
  }

  if (error instanceof Error) {
    return `${fallback} ${error.message}`;
  }

  return fallback;
};

const toSignInError = (error: unknown) => {
  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string' &&
    /invalid login credentials/i.test(error.message)
  ) {
    return new Error('전화번호 또는 비밀번호가 올바르지 않습니다.');
  }

  return new Error(toErrorMessage('로그인에 실패했습니다.', error));
};

const getBlockedAccountError = (profile: Profile) => {
  if (profile.status === 'suspended') {
    return new Error('계정이 제재되었습니다.');
  }

  if (profile.status === 'deleted_pending') {
    return new Error('탈퇴 처리 중인 계정입니다.');
  }

  return null;
};

const fetchProfile = async (client: AuthClient, userId: string) => {
  const { data, error } = await client
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !data) {
    throw new Error(toErrorMessage('프로필을 불러오지 못했습니다.', error));
  }

  return data;
};

export const createAuthService = (
  client: RpcAuthClient,
  storage: SessionStorage = {
    removeItem: async () => undefined,
    storageKey: AUTH_SESSION_STORAGE_KEY,
  },
): AuthService => ({
  async signUp(phone, password, username, nickname) {
    try {
      const { data, error } = await client.auth.signUp({
        phone,
        password,
        options: {
          data: {
            username,
            nickname,
          },
        },
      });

      if (error) {
        throw new Error(toErrorMessage('회원가입에 실패했습니다.', error));
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }

      throw new Error(toErrorMessage('회원가입에 실패했습니다.', error));
    }
  },

  async checkUsernameAvailable(username) {
    try {
      const { data, error } = await client.functions.invoke('check-username', {
        body: { username },
      });

      if (error) {
        throw new Error(
          toErrorMessage('아이디 중복 확인에 실패했습니다.', error),
        );
      }

      return Boolean((data as { available?: boolean } | null)?.available);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }

      throw new Error(
        toErrorMessage('아이디 중복 확인에 실패했습니다.', error),
      );
    }
  },

  async signIn(phone, password) {
    try {
      const { data, error } = await client.auth.signInWithPassword({
        phone,
        password,
      });

      if (error) {
        return {
          session: null,
          user: null,
          error: toSignInError(error),
        };
      }

      if (!data.session || !data.user) {
        return {
          session: null,
          user: null,
          error: new Error('로그인 세션을 만들지 못했습니다.'),
        };
      }

      const profile = await fetchProfile(client, data.user.id);
      const blockedError = getBlockedAccountError(profile);

      if (blockedError) {
        await client.auth.signOut();
        await storage.removeItem(storage.storageKey ?? AUTH_SESSION_STORAGE_KEY);

        return {
          session: null,
          user: null,
          error: blockedError,
        };
      }

      return {
        session: data.session,
        user: data.user,
        error: null,
      };
    } catch (error) {
      return {
        session: null,
        user: null,
        error: toSignInError(error),
      };
    }
  },

  async signOut() {
    const { error } = await client.auth.signOut();

    if (error) {
      throw new Error(toErrorMessage('로그아웃에 실패했습니다.', error));
    }

    await storage.removeItem(storage.storageKey ?? AUTH_SESSION_STORAGE_KEY);
  },

  async getSession() {
    const { data, error } = await client.auth.getSession();

    if (error) {
      throw new Error(toErrorMessage('세션을 불러오지 못했습니다.', error));
    }

    return data.session;
  },

  async requestAccountDeletion(userId, password, profile) {
    if (profile.id !== userId) {
      throw new Error('본인 계정만 탈퇴할 수 있습니다.');
    }

    if (profile.role === 'super_admin') {
      throw new Error('최고 관리자는 탈퇴할 수 없습니다.');
    }

    const verification = await client.auth.signInWithPassword({
      phone: profile.phone,
      password,
    });

    if (verification.error || verification.data.user?.id !== userId) {
      throw new Error('비밀번호를 다시 확인해 주세요.');
    }

    const { error } = await client.rpc('request_profile_account_deletion', {
      p_user_id: userId,
    });

    if (error) {
      throw new Error(toErrorMessage('탈퇴 요청을 처리하지 못했습니다.', error));
    }

    await client.auth.signOut();
    await storage.removeItem(storage.storageKey ?? AUTH_SESSION_STORAGE_KEY);
  },

  onAuthStateChange(callback) {
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange(callback);

    return subscription;
  },
});

const getDefaultAuthService = async (): Promise<AuthService> => {
  const { secureStoreAdapter, supabase } = await import('./supabase');

  return createAuthService(supabase, secureStoreAdapter);
};

export const signUp = (
  phone: string,
  password: string,
  username: string,
  nickname: string,
) =>
  getDefaultAuthService().then((service) =>
    service.signUp(phone, password, username, nickname),
  );

export const checkUsernameAvailable = (username: string) =>
  getDefaultAuthService().then((service) =>
    service.checkUsernameAvailable(username),
  );

export const signIn = (phone: string, password: string) =>
  getDefaultAuthService().then((service) => service.signIn(phone, password));

export const signOut = () =>
  getDefaultAuthService().then((service) => service.signOut());

export const getSession = () =>
  getDefaultAuthService().then((service) => service.getSession());

export const requestAccountDeletion = (
  userId: string,
  password: string,
  profile: Profile,
) =>
  getDefaultAuthService().then((service) =>
    service.requestAccountDeletion(userId, password, profile),
  );

export const onAuthStateChange = (
  callback: (event: AuthChangeEvent, session: Session | null) => void,
) =>
  getDefaultAuthService().then((service) => service.onAuthStateChange(callback));
