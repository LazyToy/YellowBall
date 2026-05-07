import { NextRequest, NextResponse } from 'next/server';

import {
  buildAdminLoginPath,
  buildAdminOAuthAuthorizeUrl,
  isAdminOAuthProvider,
  sanitizeAdminNextPath,
} from '@/lib/admin-auth-core';

function getRequestOrigin(request: NextRequest) {
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto') ?? 'https';

  return forwardedHost ? `${forwardedProto}://${forwardedHost}` : request.nextUrl.origin;
}

export function GET(request: NextRequest) {
  const provider = request.nextUrl.searchParams.get('provider');
  const nextPath = sanitizeAdminNextPath(request.nextUrl.searchParams.get('next'));

  if (!isAdminOAuthProvider(provider)) {
    return NextResponse.redirect(
      new URL(buildAdminLoginPath(nextPath, '지원하지 않는 소셜 로그인입니다.'), request.url),
    );
  }

  const authorizeUrl = buildAdminOAuthAuthorizeUrl({
    nextPath,
    provider,
    redirectOrigin: getRequestOrigin(request),
  });

  return NextResponse.redirect(authorizeUrl);
}
