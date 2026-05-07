import {
  canAccessAdminPath,
  canUseAdminPermission,
  getDefaultAdminPath,
  normalizeAdminPermissions,
  type AdminPermissionKey,
  type AdminPermissionRow,
  type ProfileRow,
} from './super-admin-data';

export const ADMIN_ACCESS_TOKEN_COOKIE = 'yellowball-admin-access-token';
export const ADMIN_REFRESH_TOKEN_COOKIE = 'yellowball-admin-refresh-token';

type SupabaseAuthUser = {
  id: string;
  email?: string | null;
};

export type AdminPasswordSignInResult = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: SupabaseAuthUser;
};

export type CurrentAdmin = {
  profile: ProfileRow;
  permissions: AdminPermissionRow | null;
};

export type AdminOAuthProvider = 'google' | 'kakao';

const adminOAuthProviders = new Set(['google', 'kakao']);

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey =
  process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

function assertAdminAuthConfig() {
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    throw new Error(
      '관리자 로그인을 사용하려면 Supabase URL, anon key, service role key가 필요합니다.',
    );
  }
}

async function readResponseJson<T>(response: Response, fallbackMessage: string) {
  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      body && typeof body === 'object' && 'msg' in body && typeof body.msg === 'string'
        ? body.msg
        : fallbackMessage;
    throw new Error(message);
  }

  return body as T;
}

async function fetchAuthUser(accessToken: string) {
  assertAdminAuthConfig();

  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    cache: 'no-store',
    headers: {
      apikey: anonKey!,
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as SupabaseAuthUser;
}

async function fetchProfile(userId: string) {
  assertAdminAuthConfig();

  const url = new URL('/rest/v1/profiles', supabaseUrl);
  url.searchParams.set('select', 'id,username,nickname,email,phone,role,status,created_at,updated_at');
  url.searchParams.set('id', `eq.${userId}`);
  url.searchParams.set('limit', '1');

  const response = await fetch(url, {
    cache: 'no-store',
    headers: {
      apikey: serviceRoleKey!,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
  });
  const rows = await readResponseJson<ProfileRow[]>(response, '관리자 프로필을 확인하지 못했습니다.');

  return rows[0] ?? null;
}

async function fetchPermissions(adminId: string) {
  assertAdminAuthConfig();

  const url = new URL('/rest/v1/admin_permissions', supabaseUrl);
  url.searchParams.set('select', '*');
  url.searchParams.set('admin_id', `eq.${adminId}`);
  url.searchParams.set('limit', '1');

  const response = await fetch(url, {
    cache: 'no-store',
    headers: {
      apikey: serviceRoleKey!,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
  });
  const rows = await readResponseJson<AdminPermissionRow[]>(
    response,
    '관리자 권한을 확인하지 못했습니다.',
  );

  return normalizeAdminPermissions(adminId, rows[0] ?? null);
}

export function isAdminOAuthProvider(value: string | null | undefined): value is AdminOAuthProvider {
  return Boolean(value && adminOAuthProviders.has(value));
}

export function buildSupabaseOAuthAuthorizeUrl({
  nextPath,
  provider,
  redirectOrigin,
  supabaseUrl: targetSupabaseUrl,
}: {
  nextPath: string;
  provider: AdminOAuthProvider;
  redirectOrigin: string;
  supabaseUrl: string;
}) {
  const callbackUrl = new URL('/admin-auth/callback', redirectOrigin);
  callbackUrl.searchParams.set('next', sanitizeAdminNextPath(nextPath));

  const authorizeUrl = new URL('/auth/v1/authorize', targetSupabaseUrl);
  authorizeUrl.searchParams.set('provider', provider);
  authorizeUrl.searchParams.set('redirect_to', callbackUrl.toString());

  return authorizeUrl.toString();
}

export function buildAdminOAuthAuthorizeUrl({
  nextPath,
  provider,
  redirectOrigin,
}: {
  nextPath: string;
  provider: AdminOAuthProvider;
  redirectOrigin: string;
}) {
  assertAdminAuthConfig();

  return buildSupabaseOAuthAuthorizeUrl({
    nextPath,
    provider,
    redirectOrigin,
    supabaseUrl: supabaseUrl!,
  });
}

export async function signInAdminWithPassword(email: string, password: string) {
  assertAdminAuthConfig();

  const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    cache: 'no-store',
    headers: {
      apikey: anonKey!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  return readResponseJson<AdminPasswordSignInResult>(
    response,
    '이메일 또는 비밀번호를 확인해주세요.',
  );
}

export async function refreshAdminSession(refreshToken: string) {
  assertAdminAuthConfig();

  const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
    method: 'POST',
    cache: 'no-store',
    headers: {
      apikey: anonKey!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  return readResponseJson<AdminPasswordSignInResult>(
    response,
    '관리자 로그인 세션을 갱신하지 못했습니다.',
  );
}

export async function loadAdminFromAccessToken(accessToken: string | undefined | null) {
  if (!accessToken) {
    return null;
  }

  const user = await fetchAuthUser(accessToken);
  if (!user?.id) {
    return null;
  }

  const profile = await fetchProfile(user.id);
  if (!profile || profile.status !== 'active') {
    return null;
  }

  if (profile.role === 'super_admin') {
    return { profile, permissions: null } satisfies CurrentAdmin;
  }

  if (profile.role !== 'admin') {
    return null;
  }

  return {
    profile,
    permissions: await fetchPermissions(profile.id),
  } satisfies CurrentAdmin;
}

export function canCurrentAdminAccessPath(admin: CurrentAdmin | null, pathname: string) {
  return canAccessAdminPath(pathname, admin?.profile ?? null, admin?.permissions ?? null);
}

export function getCurrentAdminDefaultPath(admin: CurrentAdmin | null) {
  return getDefaultAdminPath(admin?.profile ?? null, admin?.permissions ?? null);
}

export function currentAdminCanUsePermission(
  admin: CurrentAdmin | null,
  permission: AdminPermissionKey,
) {
  return canUseAdminPermission(admin?.profile ?? null, admin?.permissions ?? null, permission);
}

export function sanitizeAdminNextPath(value: FormDataEntryValue | string | null | undefined) {
  const next = typeof value === 'string' ? value : '';
  const pathname = next.split('?')[0] ?? '';
  const isPreviewPath =
    pathname === '/' ||
    pathname === '/preview' ||
    pathname === '/booking' ||
    pathname.startsWith('/booking/') ||
    pathname === '/shop' ||
    pathname.startsWith('/shop/') ||
    pathname === '/me' ||
    pathname.startsWith('/me/');

  if (
    next.startsWith('/admin-login') ||
    next.startsWith('/admin-auth') ||
    (!next.startsWith('/admin') && !isPreviewPath)
  ) {
    return '/admin';
  }

  return next;
}

export function buildAdminLoginPath(nextPath: string, error?: string) {
  const params = new URLSearchParams({ next: sanitizeAdminNextPath(nextPath) });

  if (error) {
    params.set('error', error);
  }

  return `/admin-login?${params.toString()}`;
}
