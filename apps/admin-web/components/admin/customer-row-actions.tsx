'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Ban, CheckCircle, Loader2, MoreVertical } from 'lucide-react';
import { updateProfileStatus } from '@/lib/admin-actions';
import { ActionConfirmDialog, ActionFeedbackDialog } from './action-dialogs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface CustomerRowActionsProps {
  profileId: string;
  currentStatus: string;
  role: string;
  name: string;
}

export function CustomerRowActions({
  profileId,
  currentStatus,
  role,
  name,
}: CustomerRowActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [feedback, setFeedback] = useState<{
    title: string;
    description?: string;
    tone?: 'success' | 'danger';
  } | null>(null);
  const isSuspended = currentStatus === 'suspended';
  const nextStatus = isSuspended ? 'active' : 'suspended';
  const disabled = loading || role === 'super_admin';

  const handleStatusChange = async () => {
    setConfirmOpen(false);
    setLoading(true);
    try {
      const result = await updateProfileStatus(profileId, nextStatus);

      if (!result.success) {
        setFeedback({
          title: '처리 실패',
          description: result.error,
          tone: 'danger',
        });
        return;
      }

      setFeedback({
        title: isSuspended ? '사용자 제재가 해제되었습니다' : '사용자가 제재되었습니다',
        description: isSuspended
          ? '확인을 누르면 고객 목록을 새로고침합니다.'
          : '해당 계정은 로그인 및 예약 이용이 차단됩니다.',
      });
    } catch (error) {
      setFeedback({
        title: '오류가 발생했습니다',
        description: String(error),
        tone: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <ActionConfirmDialog
        open={confirmOpen}
        title={`${name} 사용자를 ${isSuspended ? '제재 해제' : '제재'}할까요?`}
        description={
          isSuspended
            ? '제재를 해제하면 사용자가 다시 앱을 이용할 수 있습니다.'
            : '제재된 사용자는 앱 로그인 및 예약 이용이 차단됩니다.'
        }
        confirmLabel={isSuspended ? '제재 해제' : '사용자 제재'}
        tone={isSuspended ? 'success' : 'danger'}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleStatusChange}
      />
      <ActionFeedbackDialog
        open={feedback !== null}
        title={feedback?.title ?? ''}
        description={feedback?.description}
        tone={feedback?.tone}
        onConfirm={() => {
          const wasSuccess = feedback?.tone !== 'danger';
          setFeedback(null);
          if (wasSuccess) {
            router.refresh();
          }
        }}
      />
      <DropdownMenuTrigger asChild>
        <button
          className="size-7 grid place-items-center rounded-md hover:bg-secondary disabled:opacity-50"
          disabled={loading}
          aria-label="고객 작업"
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          ) : (
            <MoreVertical className="size-4 text-muted-foreground" />
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem
          disabled={disabled}
          variant={isSuspended ? 'default' : 'destructive'}
          onSelect={(event) => {
            event.preventDefault();
            setConfirmOpen(true);
          }}
        >
          {isSuspended ? (
            <CheckCircle className="size-4" />
          ) : (
            <Ban className="size-4" />
          )}
          {isSuspended ? '제재 해제' : '사용자 제재'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
