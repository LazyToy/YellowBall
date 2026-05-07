import { cookies } from 'next/headers';

import {
  ADMIN_ACCESS_TOKEN_COOKIE,
  ADMIN_REFRESH_TOKEN_COOKIE,
  currentAdminCanUsePermission,
  loadAdminFromAccessToken,
  type AdminPasswordSignInResult,
} from '@/lib/admin-auth-core';
import type { AdminPermissionKey } from '@/lib/super-admin-data';

const refreshCookieMaxAge = 60 * 60 * 24 * 30;

export async function getCurrentAdmin() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ADMIN_ACCESS_TOKEN_COOKIE)?.value;

  return loadAdminFromAccessToken(accessToken);
}

export async function requireCurrentAdmin() {
  const admin = await getCurrentAdmin();

  if (!admin) {
    throw new Error('관리자 로그인이 필요합니다.');
  }

  return admin;
}

export async function requireAdminPermission(permission: AdminPermissionKey) {
  const admin = await requireCurrentAdmin();

  if (!currentAdminCanUsePermission(admin, permission)) {
    throw new Error('이 작업을 수행할 관리자 권한이 없습니다.');
  }

  return admin;
}

export async function requireSuperAdmin() {
  const admin = await requireCurrentAdmin();

  if (admin.profile.role !== 'super_admin') {
    throw new Error('슈퍼 관리자만 수행할 수 있습니다.');
  }

  return admin;
}

export async function setAdminSessionCookies(session: AdminPasswordSignInResult) {
  const cookieStore = await cookies();
  const secure = process.env.NODE_ENV === 'production';

  cookieStore.set(ADMIN_ACCESS_TOKEN_COOKIE, session.access_token, {
    httpOnly: true,
    maxAge: Math.max(session.expires_in, 60),
    path: '/',
    sameSite: 'lax',
    secure,
  });
  cookieStore.set(ADMIN_REFRESH_TOKEN_COOKIE, session.refresh_token, {
    httpOnly: true,
    maxAge: refreshCookieMaxAge,
    path: '/',
    sameSite: 'lax',
    secure,
  });
}

export async function clearAdminSessionCookies() {
  const cookieStore = await cookies();

  cookieStore.delete(ADMIN_ACCESS_TOKEN_COOKIE);
  cookieStore.delete(ADMIN_REFRESH_TOKEN_COOKIE);
}
