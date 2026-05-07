import { ShieldAlert } from 'lucide-react';

export default function AdminForbiddenPage() {
  return (
    <section className="rounded-xl border border-border bg-card p-8 text-center">
      <div className="mx-auto mb-4 size-12 rounded-full bg-destructive/10 text-destructive grid place-items-center">
        <ShieldAlert className="size-6" />
      </div>
      <h1 className="font-display text-xl font-bold text-foreground">
        접근 가능한 관리자 메뉴가 없습니다
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        슈퍼 관리자에게 필요한 메뉴 권한을 요청해주세요.
      </p>
    </section>
  );
}
