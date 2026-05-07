import { NextRequest, NextResponse } from 'next/server';

import {
  ADMIN_ACCESS_TOKEN_COOKIE,
  ADMIN_REFRESH_TOKEN_COOKIE,
  buildAdminLoginPath,
  canCurrentAdminAccessPath,
  getCurrentAdminDefaultPath,
  loadAdminFromAccessToken,
  refreshAdminSession,
  type AdminPasswordSignInResult,
} from '@/lib/admin-auth-core';

function setAdminSessionCookies(response: NextResponse, session: AdminPasswordSignInResult) {
  const secure = process.env.NODE_ENV === 'production';

  response.cookies.set(ADMIN_ACCESS_TOKEN_COOKIE, session.access_token, {
    httpOnly: true,
    maxAge: Math.max(session.expires_in, 60),
    path: '/',
    sameSite: 'lax',
    secure,
  });
  response.cookies.set(ADMIN_REFRESH_TOKEN_COOKIE, session.refresh_token, {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
    sameSite: 'lax',
    secure,
  });
}

function isPreviewPath(pathname: string) {
  return (
    pathname === '/' ||
    pathname === '/preview' ||
    pathname === '/booking' ||
    pathname.startsWith('/booking/') ||
    pathname === '/shop' ||
    pathname.startsWith('/shop/') ||
    pathname === '/me' ||
    pathname.startsWith('/me/')
  );
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const nextPath = `${pathname}${search}`;
  const accessToken = request.cookies.get(ADMIN_ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = request.cookies.get(ADMIN_REFRESH_TOKEN_COOKIE)?.value;
  let admin = await loadAdminFromAccessToken(accessToken);
  let refreshedSession: AdminPasswordSignInResult | null = null;

  if (!admin && refreshToken) {
    try {
      refreshedSession = await refreshAdminSession(refreshToken);
      admin = await loadAdminFromAccessToken(refreshedSession.access_token);
    } catch {
      admin = null;
    }
  }

  if (!admin) {
    const response = NextResponse.redirect(
      new URL(buildAdminLoginPath(nextPath), request.url),
    );
    response.cookies.delete(ADMIN_ACCESS_TOKEN_COOKIE);
    response.cookies.delete(ADMIN_REFRESH_TOKEN_COOKIE);
    return response;
  }

  const defaultPath = getCurrentAdminDefaultPath(admin);
  const previewPath = isPreviewPath(pathname);

  if (previewPath) {
    const response = NextResponse.next();
    if (refreshedSession) setAdminSessionCookies(response, refreshedSession);
    return response;
  }

  if (pathname === '/admin' && defaultPath !== '/admin') {
    const response = NextResponse.redirect(new URL(defaultPath, request.url));
    if (refreshedSession) setAdminSessionCookies(response, refreshedSession);
    return response;
  }

  if (!canCurrentAdminAccessPath(admin, pathname)) {
    const response = NextResponse.redirect(new URL(defaultPath, request.url));
    if (refreshedSession) setAdminSessionCookies(response, refreshedSession);
    return response;
  }

  const response = NextResponse.next();
  if (refreshedSession) setAdminSessionCookies(response, refreshedSession);
  return response;
}

export const config = {
  matcher: [
    '/',
    '/preview',
    '/booking/:path*',
    '/shop/:path*',
    '/me/:path*',
    '/admin/:path*',
  ],
};
