import type { ReactNode } from "react"

export function AdminPageHeader({
  title,
  description,
  actions,
  badge,
  label,
}: {
  title: string
  description?: string
  actions?: ReactNode
  badge?: ReactNode
  label?: string
}) {
  return (
    <div className="mb-8">
      {/* 섹션 레이블 (선택적) */}
      {label && (
        <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-1">
          {label}
        </p>
      )}

      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-display text-2xl font-bold text-foreground tracking-tight">
              {title}
            </h1>
            {badge}
          </div>
          {description && (
            <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {actions}
          </div>
        )}
      </div>

      {/* 구분선 */}
      <div className="mt-6 border-b border-border" />
    </div>
  )
}
