import { AdminPageHeader } from '@/components/admin/admin-page-header';
import {
  auditCategoryDefinitions,
  loadAuditLogsPageData,
  type AuditCategory,
} from '@/lib/super-admin-data';
import {
  Ban,
  Download,
  RefreshCw,
  ScrollText,
  Search,
  ShieldAlert,
  ShieldCheck,
  ToggleRight,
  UserCog,
} from 'lucide-react';

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const severityStyle: Record<string, string> = {
  high: 'bg-destructive/10 text-destructive',
  medium: 'bg-chart-4/15 text-chart-4',
  low: 'bg-secondary text-muted-foreground',
};

const categoryIcons = {
  all: ScrollText,
  permission: UserCog,
  sanction: Ban,
  policy: ShieldAlert,
  menu: ToggleRight,
  product: RefreshCw,
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function normalizeCategory(value: string | undefined): AuditCategory {
  return auditCategoryDefinitions.some((item) => item.key === value)
    ? (value as AuditCategory)
    : 'all';
}

function buildQuery(params: Record<string, string | number | null | undefined>) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      query.set(key, String(value));
    }
  });

  const serialized = query.toString();
  return serialized ? `?${serialized}` : '?';
}

export default async function SuperAuditPage({ searchParams }: PageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const search = firstParam(resolvedSearchParams.q) ?? '';
  const category = normalizeCategory(firstParam(resolvedSearchParams.category));
  const limit = Math.min(Number(firstParam(resolvedSearchParams.limit) ?? 30) || 30, 200);
  let pageData: Awaited<ReturnType<typeof loadAuditLogsPageData>> | null = null;
  let errorMessage: string | null = null;

  try {
    pageData = await loadAuditLogsPageData({ search, category, limit });
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : String(error);
  }

  return (
    <div>
      <AdminPageHeader
        label="SUPER ADMIN"
        title="감사 로그"
        description="administrator_audit_logs와 profiles의 실제 DB 값을 기준으로 민감 행동을 추적합니다."
        badge={
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-accent text-accent-foreground">
            <ShieldCheck className="size-3" />
            SUPER ADMIN
          </span>
        }
        actions={
          <a
            href={`/admin/super/audit/export${buildQuery({ q: search, category, limit: 200 })}`}
            className="h-9 px-3 rounded-lg border border-border text-xs font-semibold flex items-center gap-1.5 hover:bg-secondary"
          >
            <Download className="size-3.5" />
            CSV 내보내기
          </a>
        }
      />

      <form action="/admin/super/audit" className="flex flex-wrap items-center gap-2 mb-4">
        <input type="hidden" name="category" value={category} />
        <div className="flex-1 min-w-64 h-9 rounded-lg bg-card border border-border px-3 flex items-center gap-2">
          <Search className="size-4 text-muted-foreground" />
          <input
            name="q"
            defaultValue={search}
            placeholder="작업자, 대상, 액션 검색"
            className="flex-1 bg-transparent text-sm focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="h-9 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90"
        >
          검색
        </button>
      </form>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        {auditCategoryDefinitions.map((item) => {
          const active = category === item.key;
          return (
            <a
              key={item.key}
              href={`/admin/super/audit${buildQuery({ q: search, category: item.key, limit: 30 })}`}
              className={`h-9 px-3 rounded-lg text-xs font-semibold inline-flex items-center ${
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card border border-border hover:bg-secondary'
              }`}
            >
              {item.label}
            </a>
          );
        })}
      </div>

      {errorMessage ? (
        <section className="bg-card rounded-xl border border-destructive/30 p-5 text-sm text-destructive">
          {errorMessage}
        </section>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <ul className="divide-y divide-border">
            {pageData?.logs.length === 0 ? (
              <li className="px-5 py-8 text-center text-sm text-muted-foreground">
                조건에 맞는 감사 로그가 없습니다.
              </li>
            ) : (
              pageData?.logs.map((log) => {
                const Icon = categoryIcons[log.category] ?? ScrollText;
                return (
                  <li key={log.id} className="px-5 py-4 flex items-start gap-4 hover:bg-secondary/40">
                    <div className={`size-10 rounded-xl grid place-items-center shrink-0 ${severityStyle[log.severity]}`}>
                      <Icon className="size-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-foreground">{log.actorName}</span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            log.actorRole === '슈퍼 관리자'
                              ? 'bg-accent text-accent-foreground'
                              : 'bg-primary/10 text-primary'
                          }`}
                        >
                          {log.actorRole}
                        </span>
                        <span className="text-sm text-muted-foreground">→</span>
                        <span className="text-sm font-semibold text-foreground">{log.action}</span>
                        <span className="text-sm text-muted-foreground">·</span>
                        <span className="text-sm text-foreground break-all">{log.target}</span>
                        <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full ${severityStyle[log.severity]}`}>
                          {log.severity.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 break-all">{log.detail}</p>
                      <p className="text-[11px] text-muted-foreground mt-1.5 font-mono">
                        {log.time} · IP {log.ip}
                      </p>
                    </div>
                  </li>
                );
              })
            )}
          </ul>
          <div className="px-5 py-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <span>
              표시 {pageData?.logs.length ?? 0}건 · 조건 일치 {pageData?.total ?? 0}건
            </span>
            {pageData?.hasMore ? (
              <a
                href={`/admin/super/audit${buildQuery({ q: search, category, limit: limit + 30 })}`}
                className="font-semibold text-primary hover:underline"
              >
                더 보기
              </a>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
