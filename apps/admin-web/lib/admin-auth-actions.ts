'use server';

import { redirect } from 'next/navigation';

import {
  buildAdminLoginPath,
  loadAdminFromAccessToken,
  sanitizeAdminNextPath,
  signInAdminWithPassword,
} from '@/lib/admin-auth-core';
import {
  clearAdminSessionCookies,
  setAdminSessionCookies,
} from '@/lib/admin-auth';

function redirectToLogin(nextPath: string, error: string): never {
  redirect(buildAdminLoginPath(nextPath, error));
}

export async function loginAdminFromWeb(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const nextPath = sanitizeAdminNextPath(formData.get('next'));

  if (!email || !password) {
    redirectToLogin(nextPath, '이메일과 비밀번호를 입력해주세요.');
  }

  let session: Awaited<ReturnType<typeof signInAdminWithPassword>>;
  try {
    session = await signInAdminWithPassword(email, password);
  } catch {
    redirectToLogin(nextPath, '이메일 또는 비밀번호를 확인해주세요.');
  }

  const admin = await loadAdminFromAccessToken(session.access_token);
  if (!admin) {
    await clearAdminSessionCookies();
    redirectToLogin(nextPath, '관리자 또는 슈퍼 관리자 계정만 접근할 수 있습니다.');
  }

  await setAdminSessionCookies(session);
  redirect(nextPath);
}

export async function logoutAdminFromWeb() {
  await clearAdminSessionCookies();
  redirect('/admin-login');
}
