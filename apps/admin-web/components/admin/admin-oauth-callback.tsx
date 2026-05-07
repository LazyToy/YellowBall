'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, ShieldAlert } from 'lucide-react';

type AdminOAuthCallbackProps = {
  error?: string | null;
  nextPath: string;
};

function readCallbackParams() {
  const params = new URLSearchParams(window.location.search);

  if (window.location.hash) {
    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    hashParams.forEach((value, key) => {
      params.set(key, value);
    });
  }

  return params;
}

export function AdminOAuthCallback({ error, nextPath }: AdminOAuthCallbackProps) {
  const [message, setMessage] = useState(error ?? null);

  useEffect(() => {
    if (error) {
      return;
    }

    const completeOAuthLogin = async () => {
      try {
        const params = readCallbackParams();
        const callbackError = params.get('error_description') ?? params.get('error');
        if (callbackError) {
          throw new Error(callbackError);
        }

        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        const expiresIn = Number.parseInt(params.get('expires_in') ?? '3600', 10);

        if (!accessToken || !refreshToken) {
          throw new Error('소셜 로그인 세션 정보가 없습니다.');
        }

        const response = await fetch('/admin-auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            access_token: accessToken,
            expires_in: Number.isFinite(expiresIn) ? expiresIn : 3600,
            next: nextPath,
            refresh_token: refreshToken,
          }),
        });
        const result = (await response.json().catch(() => null)) as {
          error?: string;
          redirectTo?: string;
        } | null;

        if (!response.ok) {
          throw new Error(result?.error ?? '소셜 로그인을 완료하지 못했습니다.');
        }

        window.location.replace(result?.redirectTo ?? '/admin');
      } catch (nextError) {
        setMessage(
          nextError instanceof Error
            ? nextError.message
            : '소셜 로그인을 완료하지 못했습니다.',
        );
      }
    };

    void completeOAuthLogin();
  }, [error, nextPath]);

  if (!message) {
    return (
      <main className="min-h-dvh bg-secondary/40 grid place-items-center px-4">
        <div className="rounded-xl border border-border bg-card p-6 text-center">
          <Loader2 className="mx-auto mb-3 size-6 animate-spin text-primary" />
          <p className="text-sm font-semibold text-foreground">소셜 로그인 처리 중</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-secondary/40 grid place-items-center px-4">
      <section className="w-full max-w-sm rounded-xl border border-border bg-card p-6 text-center">
        <div className="mx-auto mb-4 size-12 rounded-full bg-destructive/10 text-destructive grid place-items-center">
          <ShieldAlert className="size-6" />
        </div>
        <h1 className="font-display text-lg font-bold text-foreground">
          소셜 로그인 실패
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
        <Link
          href={`/admin-login?next=${encodeURIComponent(nextPath)}`}
          className="mt-5 inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          로그인으로 돌아가기
        </Link>
      </section>
    </main>
  );
}
