import type {
  AuthChangeEvent,
  Provider,
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

export type SocialAuthProvider = Extract<Provider, 'google' | 'kakao'>;

type OAuthBrowserResult = {
  type: string;
  url?: string;
};

type OAuthDependencies = {
  getRedirectUrl?: (provider: SocialAuthProvider) => Promise<string> | string;
  openAuthSession?: (
    authUrl: string,
    redirectUrl: string,
  ) => Promise<OAuthBrowserResult | null | undefined>;
};

export interface AuthService {
  signUp: (
    email: string,
    password: string,
    username: string,
    nickname: string,
  ) => Promise<unknown>;
  checkEmailAvailable: (email: string) => Promise<boolean>;
  checkUsernameAvailable: (username: string) => Promise<boolean>;
  signIn: (email: string, password: string) => Promise<SignInResult>;
  signInWithOAuthProvider: (
    provider: SocialAuthProvider,
  ) => Promise<SignInResult>;
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
    return new Error('이메일 또는 비밀번호가 올바르지 않습니다.');
  }

  return new Error(toErrorMessage('로그인에 실패했습니다.', error));
};

const toOAuthError = (provider: SocialAuthProvider, error: unknown) => {
  const providerLabel = provider === 'google' ? 'Google' : '카카오';

  return new Error(toErrorMessage(`${providerLabel} 로그인에 실패했습니다.`, error));
};

const toSignUpError = (error: unknown) => {
  const message =
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string'
      ? error.message
      : error instanceof Error
        ? error.message
        : '';

  if (/already registered|already exists|already been registered|duplicate/i.test(message)) {
    return new Error('이미 가입된 이메일입니다.');
  }

  return new Error(toErrorMessage('회원가입에 실패했습니다.', error));
};

const getBlockedAccountError = (profile: Profile) => {
  if (profile.status === 'suspended') {
    return new Error('계정이 제재되었습니다.');
  }

  if (profile.status === 'deleted_pending') {
    return new Error('탈퇴 처리 중인 계정입니다.');
  }

  if (profile.status === 'deleted') {
    return new Error('탈퇴가 완료된 계정입니다.');
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

const getOAuthRedirectUrl = async (
  provider: SocialAuthProvider,
  oauthDependencies: OAuthDependencies,
) => {
  if (oauthDependencies.getRedirectUrl) {
    return oauthDependencies.getRedirectUrl(provider);
  }

  if (process.env.EXPO_PUBLIC_AUTH_REDIRECT_URL) {
    return process.env.EXPO_PUBLIC_AUTH_REDIRECT_URL;
  }

  const Linking = await import('expo-linking');

  return Linking.createURL('auth/callback');
};

const openOAuthSession = async (
  authUrl: string,
  redirectUrl: string,
  oauthDependencies: OAuthDependencies,
) => {
  if (oauthDependencies.openAuthSession) {
    return oauthDependencies.openAuthSession(authUrl, redirectUrl);
  }

  const WebBrowser = await import('expo-web-browser');

  WebBrowser.maybeCompleteAuthSession();

  return WebBrowser.openAuthSessionAsync(authUrl, redirectUrl, {
    showInRecents: true,
  });
};

const parseOAuthCallbackUrl = (callbackUrl: string) => {
  const parsedUrl = new URL(callbackUrl);
  const params = new URLSearchParams(parsedUrl.search);

  if (parsedUrl.hash) {
    const hashParams = new URLSearchParams(parsedUrl.hash.slice(1));
    hashParams.forEach((value, key) => {
      params.set(key, value);
    });
  }

  return {
    access_token: params.get('access_token'),
    refresh_token: params.get('refresh_token'),
    code: params.get('code'),
    error: params.get('error_description') ?? params.get('error'),
  };
};

export const createAuthService = (
  client: RpcAuthClient,
  storage: SessionStorage = {
    removeItem: async () => undefined,
    storageKey: AUTH_SESSION_STORAGE_KEY,
  },
  oauthDependencies: OAuthDependencies = {},
): AuthService => ({
  async signUp(email, password, username, nickname) {
    try {
      const { data, error } = await client.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            nickname,
          },
        },
      });

      if (error) {
        throw toSignUpError(error);
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }

      throw toSignUpError(error);
    }
  },

  async checkEmailAvailable(email) {
    try {
      const { data, error } = await client.functions.invoke('check-email', {
        body: { email },
      });

      if (error) {
        throw new Error(
          toErrorMessage('이메일 중복 확인에 실패했습니다.', error),
        );
      }

      return Boolean((data as { available?: boolean } | null)?.available);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }

      throw new Error(
        toErrorMessage('이메일 중복 확인에 실패했습니다.', error),
      );
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

  async signIn(email, password) {
    try {
      const { data, error } = await client.auth.signInWithPassword({
        email,
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

  async signInWithOAuthProvider(provider) {
    try {
      const redirectUrl = await getOAuthRedirectUrl(provider, oauthDependencies);
      const { data, error } = await client.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
          queryParams:
            provider === 'google'
              ? {
                  prompt: 'select_account',
                }
              : undefined,
        },
      });

      if (error) {
        return {
          session: null,
          user: null,
          error: toOAuthError(provider, error),
        };
      }

      if (!data.url) {
        return {
          session: null,
          user: null,
          error: new Error('OAuth 인증 주소를 만들지 못했습니다.'),
        };
      }

      const browserResult = await openOAuthSession(
        data.url,
        redirectUrl,
        oauthDependencies,
      );

      if (browserResult?.type !== 'success' || !browserResult.url) {
        return {
          session: null,
          user: null,
          error: new Error('로그인이 취소되었습니다.'),
        };
      }

      const callbackParams = parseOAuthCallbackUrl(browserResult.url);

      if (callbackParams.error) {
        return {
          session: null,
          user: null,
          error: new Error(callbackParams.error),
        };
      }

      const authResult =
        callbackParams.access_token && callbackParams.refresh_token
          ? await client.auth.setSession({
              access_token: callbackParams.access_token,
              refresh_token: callbackParams.refresh_token,
            })
          : callbackParams.code
            ? await client.auth.exchangeCodeForSession(callbackParams.code)
            : {
                data: { session: null, user: null },
                error: new Error('OAuth 콜백에서 세션 정보를 찾지 못했습니다.'),
              };

      if (authResult.error) {
        return {
          session: null,
          user: null,
          error: toOAuthError(provider, authResult.error),
        };
      }

      if (!authResult.data.session || !authResult.data.user) {
        return {
          session: null,
          user: null,
          error: new Error('로그인 세션을 만들지 못했습니다.'),
        };
      }

      const profile = await fetchProfile(client, authResult.data.user.id);
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
        session: authResult.data.session,
        user: authResult.data.user,
        error: null,
      };
    } catch (error) {
      return {
        session: null,
        user: null,
        error: toOAuthError(provider, error),
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

    const credentials = profile.email
      ? { email: profile.email, password }
      : profile.phone
        ? { phone: profile.phone, password }
        : null;

    if (!credentials) {
      throw new Error('비밀번호로 다시 인증할 수 없는 계정입니다.');
    }

    const verification = await client.auth.signInWithPassword(credentials);

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
  email: string,
  password: string,
  username: string,
  nickname: string,
) =>
  getDefaultAuthService().then((service) =>
    service.signUp(email, password, username, nickname),
  );

export const checkEmailAvailable = (email: string) =>
  getDefaultAuthService().then((service) =>
    service.checkEmailAvailable(email),
  );

export const checkUsernameAvailable = (username: string) =>
  getDefaultAuthService().then((service) =>
    service.checkUsernameAvailable(username),
  );

export const signIn = (email: string, password: string) =>
  getDefaultAuthService().then((service) => service.signIn(email, password));

export const signInWithOAuthProvider = (provider: SocialAuthProvider) =>
  getDefaultAuthService().then((service) =>
    service.signInWithOAuthProvider(provider),
  );

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
