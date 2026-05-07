import { AdminOAuthCallback } from '@/components/admin/admin-oauth-callback';
import { sanitizeAdminNextPath } from '@/lib/admin-auth-core';

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

export default async function AdminOAuthCallbackPage({ searchParams }: PageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const nextPath = sanitizeAdminNextPath(getSearchValue(resolvedSearchParams, 'next'));
  const error =
    getSearchValue(resolvedSearchParams, 'error_description') ??
    getSearchValue(resolvedSearchParams, 'error') ??
    null;

  return <AdminOAuthCallback error={error} nextPath={nextPath} />;
}
