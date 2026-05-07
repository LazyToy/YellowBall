'use client';

import { useMemo, useState, useTransition } from 'react';
import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Archive, Bell, Loader2, Plus, Send, Trash2 } from 'lucide-react';
import {
  createAnnouncement,
  deleteAnnouncement,
  sendAnnouncementNotification,
  updateAnnouncementStatus,
} from '@/lib/admin-actions';
import type { AdminAnnouncementItem } from '@/lib/admin-data';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ActionFeedbackDialog } from './action-dialogs';

const typeStyle: Record<string, string> = {
  event: 'bg-accent text-accent-foreground',
  notice: 'bg-primary/10 text-primary',
};

const statusStyle: Record<string, string> = {
  archived: 'bg-muted text-muted-foreground',
  draft: 'bg-secondary text-muted-foreground',
  published: 'bg-chart-4/15 text-chart-4',
};

type Feedback = {
  title: string;
  description?: string;
  tone?: 'success' | 'danger';
};

export function AnnouncementManager({
  announcements,
}: {
  announcements: AdminAnnouncementItem[];
}) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [pending, startTransition] = useTransition();
  const stats = useMemo(
    () => ({
      active: announcements.filter((item) => item.status === 'published').length,
      draft: announcements.filter((item) => item.status === 'draft').length,
      sentThisMonth: announcements.filter(
        (item) =>
          item.status === 'published' &&
          item.createdAt.slice(0, 7) === new Date().toISOString().slice(0, 7),
      ).length,
    }),
    [announcements],
  );

  const runAction = (
    action: () => Promise<{ success: boolean; error?: string; sentCount?: number }>,
    successTitle: string,
  ) => {
    startTransition(async () => {
      const result = await action();

      if (!result.success) {
        setFeedback({
          title: '처리 실패',
          description: result.error,
          tone: 'danger',
        });
        return;
      }

      setFeedback({
        title: successTitle,
        description:
          typeof result.sentCount === 'number'
            ? `알림 ${result.sentCount.toLocaleString('ko-KR')}건을 생성했습니다.`
            : undefined,
      });
      router.refresh();
    });
  };

  return (
    <>
      <AnnouncementCreateDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onDone={(result) => {
          setFeedback({
            title: '게시물이 저장되었습니다',
            description: `알림 ${result.sentCount.toLocaleString('ko-KR')}건을 생성했습니다.`,
          });
          router.refresh();
        }}
      />
      <ActionFeedbackDialog
        open={feedback !== null}
        title={feedback?.title ?? ''}
        description={feedback?.description}
        tone={feedback?.tone}
        onConfirm={() => setFeedback(null)}
      />

      <div className="mb-4 flex justify-end">
        <Button
          className="h-9 px-3 rounded-lg text-xs font-semibold"
          disabled={pending}
          onClick={() => setDialogOpen(true)}
        >
          <Plus className="size-3.5" />
          새 게시물
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-6">
        {[
          { icon: Bell, label: '활성 공지', value: stats.active },
          { icon: Send, label: '이번 달 발송', value: stats.sentThisMonth },
          { icon: Archive, label: '임시 저장', value: stats.draft },
        ].map((s) => {
          const Icon = s.icon;

          return (
            <div
              key={s.label}
              className="bg-card rounded-2xl border border-border p-4 flex items-center gap-3"
            >
              <div className="size-10 rounded-xl bg-primary/10 text-primary grid place-items-center">
                <Icon className="size-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="font-display text-xl font-bold text-foreground">
                  {s.value.toLocaleString('ko-KR')}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary/60 text-muted-foreground text-xs">
            <tr>
              <th className="text-left font-semibold px-4 py-3">제목</th>
              <th className="text-left font-semibold px-4 py-3">유형</th>
              <th className="text-left font-semibold px-4 py-3">대상</th>
              <th className="text-left font-semibold px-4 py-3">기간/발송</th>
              <th className="text-right font-semibold px-4 py-3">조회</th>
              <th className="text-left font-semibold px-4 py-3">상태</th>
              <th className="text-right font-semibold px-4 py-3">작업</th>
            </tr>
          </thead>
          <tbody>
            {announcements.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-xs text-muted-foreground">
                  공지/이벤트 게시물이 없습니다.
                </td>
              </tr>
            ) : (
              announcements.map((item) => (
                <tr key={item.key} className="border-t border-border hover:bg-secondary/40">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-foreground">{item.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">{item.body}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-[10px] font-bold px-2 py-1 rounded-full ${typeStyle[item.type]}`}
                    >
                      {item.typeLabel}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-foreground">{item.audience}</td>
                  <td className="px-4 py-3 text-muted-foreground">{item.period}</td>
                  <td className="px-4 py-3 text-right text-foreground">
                    {item.views.toLocaleString('ko-KR')}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-[10px] font-bold px-2 py-1 rounded-full ${statusStyle[item.status]}`}
                    >
                      {item.statusLabel}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1.5">
                      <IconButton
                        disabled={pending || item.status === 'published'}
                        label="게시"
                        onClick={() =>
                          runAction(
                            () => updateAnnouncementStatus(item.key, 'published'),
                            '게시 상태로 변경했습니다',
                          )
                        }
                      >
                        <Send className="size-3.5" />
                      </IconButton>
                      <IconButton
                        disabled={pending}
                        label="알림 재발송"
                        onClick={() =>
                          runAction(
                            () =>
                              sendAnnouncementNotification(item.key, {
                                body: item.body,
                                title: item.title,
                                type: item.type,
                              }),
                            '알림을 재발송했습니다',
                          )
                        }
                      >
                        <Bell className="size-3.5" />
                      </IconButton>
                      <IconButton
                        disabled={pending || item.status === 'archived'}
                        label="보관"
                        onClick={() =>
                          runAction(
                            () => updateAnnouncementStatus(item.key, 'archived'),
                            '게시물을 보관했습니다',
                          )
                        }
                      >
                        <Archive className="size-3.5" />
                      </IconButton>
                      <IconButton
                        disabled={pending}
                        label="삭제"
                        onClick={() =>
                          runAction(
                            () => deleteAnnouncement(item.key),
                            '게시물을 삭제했습니다',
                          )
                        }
                        tone="danger"
                      >
                        <Trash2 className="size-3.5" />
                      </IconButton>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

function AnnouncementCreateDialog({
  open,
  onOpenChange,
  onDone,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone: (result: { sentCount: number }) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const handleSubmit = (formData: FormData) => {
    const title = String(formData.get('title') ?? '');
    const body = String(formData.get('body') ?? '');
    const type = formData.get('type') === 'event' ? 'event' : 'notice';
    const status = formData.get('status') === 'draft' ? 'draft' : 'published';

    startTransition(async () => {
      const result = await createAnnouncement({ body, status, title, type });

      if (!result.success) {
        setFeedback({
          title: '저장 실패',
          description: result.error,
          tone: 'danger',
        });
        return;
      }

      onOpenChange(false);
      onDone({ sentCount: result.sentCount ?? 0 });
    });
  };

  return (
    <>
      <ActionFeedbackDialog
        open={feedback !== null}
        title={feedback?.title ?? ''}
        description={feedback?.description}
        tone={feedback?.tone}
        onConfirm={() => setFeedback(null)}
      />
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-xl">
          <form action={handleSubmit} className="space-y-4">
            <DialogHeader>
              <DialogTitle>새 게시물</DialogTitle>
              <DialogDescription>
                게시 상태로 저장하면 모든 사용자에게 알림이 생성됩니다.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="space-y-1.5 text-sm font-medium">
                유형
                <select
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                  name="type"
                >
                  <option value="notice">공지</option>
                  <option value="event">이벤트</option>
                </select>
              </label>
              <label className="space-y-1.5 text-sm font-medium">
                상태
                <select
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                  name="status"
                >
                  <option value="published">게시 및 알림 발송</option>
                  <option value="draft">임시 저장</option>
                </select>
              </label>
            </div>

            <label className="space-y-1.5 text-sm font-medium block">
              제목
              <Input maxLength={80} name="title" required />
            </label>

            <label className="space-y-1.5 text-sm font-medium block">
              본문
              <Textarea maxLength={1000} name="body" required rows={6} />
            </label>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                취소
              </Button>
              <Button disabled={pending} type="submit">
                {pending ? <Loader2 className="size-4 animate-spin" /> : null}
                저장
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

function IconButton({
  children,
  disabled,
  label,
  onClick,
  tone,
}: {
  children: ReactNode;
  disabled?: boolean;
  label: string;
  onClick: () => void;
  tone?: 'danger';
}) {
  return (
    <button
      aria-label={label}
      className={`size-8 inline-grid place-items-center rounded-md border border-border text-xs hover:bg-secondary disabled:opacity-40 ${
        tone === 'danger' ? 'text-destructive hover:bg-destructive/10' : 'text-foreground'
      }`}
      disabled={disabled}
      onClick={onClick}
      title={label}
      type="button"
    >
      {children}
    </button>
  );
}
