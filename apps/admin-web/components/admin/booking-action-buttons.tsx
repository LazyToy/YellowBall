'use client';

import { useState } from 'react';
import { Check, Loader2, X } from 'lucide-react';
import {
  updateDemoBookingStatus,
  updateServiceBookingStatus,
} from '@/lib/admin-actions';
import { ActionFeedbackDialog } from './action-dialogs';

type BookingType = 'service' | 'demo';

interface BookingActionButtonsProps {
  realId: string;
  bookingType: BookingType;
  currentStatus: string;
}

export function BookingActionButtons({
  realId,
  bookingType,
  currentStatus,
}: BookingActionButtonsProps) {
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null);
  const [done, setDone] = useState(false);
  const [feedback, setFeedback] = useState<{
    title: string;
    description?: string;
    tone?: 'success' | 'danger';
  } | null>(null);

  const handleAction = async (action: 'approve' | 'reject') => {
    setLoading(action);
    try {
      const newStatus = action === 'approve' ? 'approved' : 'rejected';
      const fn =
        bookingType === 'service'
          ? updateServiceBookingStatus
          : updateDemoBookingStatus;
      const result = await fn(realId, newStatus);

      if (result.success) {
        setFeedback({
          title: action === 'approve' ? '예약을 승인했습니다' : '예약을 거절했습니다',
        });
        setDone(true);
      } else {
        setFeedback({
          title: '처리 실패',
          description: result.error,
          tone: 'danger',
        });
      }
    } catch (err) {
      setFeedback({
        title: '오류가 발생했습니다',
        description: String(err),
        tone: 'danger',
      });
    } finally {
      setLoading(null);
    }
  };

  const feedbackDialog = (
    <ActionFeedbackDialog
      open={feedback !== null}
      title={feedback?.title ?? ''}
      description={feedback?.description}
      tone={feedback?.tone}
      onConfirm={() => setFeedback(null)}
    />
  );

  if (done) {
    return (
      <>
        {feedbackDialog}
        <span className="text-xs text-muted-foreground font-semibold px-3 py-1.5">
          처리 완료
        </span>
      </>
    );
  }

  if (!['requested', 'reschedule_requested'].includes(currentStatus)) {
    return null;
  }

  return (
    <div className="flex items-center gap-1.5 shrink-0">
      {feedbackDialog}
      <button
        onClick={() => handleAction('reject')}
        disabled={loading !== null}
        className="h-9 px-3 rounded-lg border border-destructive/40 text-destructive text-xs font-semibold inline-flex items-center gap-1 hover:bg-destructive/10 disabled:opacity-50 disabled:cursor-not-allowed transition"
        aria-label="거절"
      >
        {loading === 'reject' ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <X className="size-3.5" />
        )}
        거절
      </button>
      <button
        onClick={() => handleAction('approve')}
        disabled={loading !== null}
        className="h-9 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-semibold inline-flex items-center gap-1 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition"
        aria-label="승인"
      >
        {loading === 'approve' ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Check className="size-3.5" />
        )}
        승인
      </button>
    </div>
  );
}
