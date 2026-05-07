import { NextRequest, NextResponse } from 'next/server';

import {
  ADMIN_ACCESS_TOKEN_COOKIE,
  ADMIN_REFRESH_TOKEN_COOKIE,
  getCurrentAdminDefaultPath,
  loadAdminFromAccessToken,
  sanitizeAdminNextPath,
} from '@/lib/admin-auth-core';

type OAuthSessionBody = {
  access_token?: unknown;
  expires_in?: unknown;
  next?: unknown;
  refresh_token?: unknown;
};

function setAdminSessionCookies(
  response: NextResponse,
  session: { accessToken: string; expiresIn: number; refreshToken: string },
) {
  const secure = process.env.NODE_ENV === 'production';

  response.cookies.set(ADMIN_ACCESS_TOKEN_COOKIE, session.accessToken, {
    httpOnly: true,
    maxAge: Math.max(session.expiresIn, 60),
    path: '/',
    sameSite: 'lax',
    secure,
  });
  response.cookies.set(ADMIN_REFRESH_TOKEN_COOKIE, session.refreshToken, {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
    sameSite: 'lax',
    secure,
  });
}

function parseSessionBody(body: OAuthSessionBody) {
  const accessToken = typeof body.access_token === 'string' ? body.access_token : '';
  const refreshToken = typeof body.refresh_token === 'string' ? body.refresh_token : '';
  const expiresIn =
    typeof body.expires_in === 'number'
      ? body.expires_in
      : Number.parseInt(String(body.expires_in ?? ''), 10);
  const nextPath = sanitizeAdminNextPath(
    typeof body.next === 'string' ? body.next : undefined,
  );

  return {
    accessToken,
    expiresIn: Number.isFinite(expiresIn) ? expiresIn : 3600,
    nextPath,
    refreshToken,
  };
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as OAuthSessionBody | null;

  if (!body) {
    return NextResponse.json({ error: '소셜 로그인 응답을 읽지 못했습니다.' }, { status: 400 });
  }

  const session = parseSessionBody(body);
  if (!session.accessToken || !session.refreshToken) {
    return NextResponse.json({ error: '소셜 로그인 세션 정보가 없습니다.' }, { status: 400 });
  }

  const admin = await loadAdminFromAccessToken(session.accessToken);
  if (!admin) {
    return NextResponse.json(
      { error: '관리자 또는 슈퍼 관리자 계정만 접근할 수 있습니다.' },
      { status: 403 },
    );
  }

  const redirectTo =
    session.nextPath === '/admin' ? getCurrentAdminDefaultPath(admin) : session.nextPath;
  const response = NextResponse.json({ redirectTo });
  setAdminSessionCookies(response, session);

  return response;
}
