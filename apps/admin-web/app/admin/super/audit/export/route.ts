import {
  auditCategoryDefinitions,
  loadAuditLogsPageData,
  type AuditCategory,
} from '@/lib/super-admin-data';
import { requireSuperAdmin } from '@/lib/admin-auth';

function normalizeCategory(value: string | null): AuditCategory {
  return auditCategoryDefinitions.some((item) => item.key === value)
    ? (value as AuditCategory)
    : 'all';
}

function escapeCsv(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

export async function GET(request: Request) {
  await requireSuperAdmin();

  const url = new URL(request.url);
  const search = url.searchParams.get('q') ?? '';
  const category = normalizeCategory(url.searchParams.get('category'));
  const pageData = await loadAuditLogsPageData({ search, category, limit: 200 });
  const header = ['시간', '작업자', '역할', '액션', '대상', '상세', 'IP', '등급'];
  const rows = pageData.logs.map((log) => [
    log.time,
    log.actorName,
    log.actorRole,
    log.action,
    log.target,
    log.detail,
    log.ip,
    log.severity,
  ]);
  const csv = [header, ...rows].map((row) => row.map(escapeCsv).join(',')).join('\n');

  return new Response(`\uFEFF${csv}`, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="audit-logs.csv"',
    },
  });
}
