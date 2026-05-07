import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Chrome, MessageCircle, ShieldCheck } from 'lucide-react';

import { loginAdminFromWeb } from '@/lib/admin-auth-actions';
import { getCurrentAdmin } from '@/lib/admin-auth';
import { getCurrentAdminDefaultPath, sanitizeAdminNextPath } from '@/lib/admin-auth-core';

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getSearchValue(
  params: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminLoginPage({ searchParams }: PageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const admin = await getCurrentAdmin();

  if (admin) {
    redirect(getCurrentAdminDefaultPath(admin));
  }

  const nextPath = sanitizeAdminNextPath(getSearchValue(resolvedSearchParams, 'next'));
  const error = getSearchValue(resolvedSearchParams, 'error');
  const oauthNextParam = encodeURIComponent(nextPath);

  return (
    <main className="min-h-dvh bg-secondary/40 grid place-items-center px-4">
      <section className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="size-10 rounded-lg bg-primary text-primary-foreground grid place-items-center">
            <ShieldCheck className="size-5" />
          </div>
          <div>
            <h1 className="font-display text-lg font-bold text-foreground">
              관리자 로그인
            </h1>
            <p className="text-xs text-muted-foreground">
              등록된 관리자 계정만 접근할 수 있습니다.
            </p>
          </div>
        </div>

        {error ? (
          <p className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
            {error}
          </p>
        ) : null}

        <form action={loginAdminFromWeb} className="space-y-4">
          <input type="hidden" name="next" value={nextPath} />
          <div>
            <label className="text-xs font-semibold text-muted-foreground" htmlFor="email">
              이메일
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground" htmlFor="password">
              비밀번호
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <button
            type="submit"
            className="h-10 w-full rounded-lg bg-primary text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            로그인
          </button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-[10px] font-semibold text-muted-foreground">또는</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <div className="grid gap-2">
          <Link
            href={`/admin-auth/oauth?provider=google&next=${oauthNextParam}`}
            className="h-10 w-full rounded-lg border border-border bg-background text-sm font-semibold text-foreground hover:bg-secondary inline-flex items-center justify-center gap-2"
          >
            <Chrome className="size-4" />
            Google로 로그인
          </Link>
          <Link
            href={`/admin-auth/oauth?provider=kakao&next=${oauthNextParam}`}
            className="h-10 w-full rounded-lg bg-[#FEE500] text-sm font-semibold text-[#191919] hover:opacity-90 inline-flex items-center justify-center gap-2"
          >
            <MessageCircle className="size-4" />
            Kakao로 로그인
          </Link>
        </div>
      </section>
    </main>
  );
}
