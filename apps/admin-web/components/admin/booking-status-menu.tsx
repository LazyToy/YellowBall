'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Loader2, MoreVertical } from 'lucide-react';
import {
  updateDemoBookingStatus,
  updateServiceBookingStatus,
} from '@/lib/admin-actions';
import { isBookingStatusLockedAfterCompletion } from '@/lib/admin-status-lock';
import { ActionFeedbackDialog } from './action-dialogs';

const MENU_WIDTH = 160;
const MENU_MARGIN = 8;
const MENU_HEADER_HEIGHT = 32;
const MENU_ITEM_HEIGHT = 36;

const SERVICE_STATUS_OPTIONS = [
  { value: 'requested', label: '접수' },
  { value: 'approved', label: '승인' },
  { value: 'in_progress', label: '작업중' },
  { value: 'completed', label: '완료' },
  { value: 'cancelled_admin', label: '관리자 취소' },
  { value: 'no_show', label: '노쇼' },
];

const DEMO_STATUS_OPTIONS = [
  { value: 'approved', label: '확정' },
  { value: 'in_use', label: '대여 중' },
  { value: 'returned', label: '반납 완료' },
  { value: 'cancelled_admin', label: '관리자 취소' },
  { value: 'rejected', label: '거절' },
  { value: 'no_show', label: '노쇼' },
  { value: 'overdue', label: '반납 지연' },
];

const SERVICE_MENU_STATUS_VALUES = new Set(
  SERVICE_STATUS_OPTIONS.map((option) => option.value),
);

interface BookingStatusMenuProps {
  realId: string;
  bookingType: 'service' | 'demo';
  currentStatus: string;
}

const toServiceMenuStatus = (status: string) => {
  if (SERVICE_MENU_STATUS_VALUES.has(status)) {
    return status;
  }

  if (
    [
      'completed',
      'pickup_ready',
      'delivered',
      'done',
      'refund_pending',
      'refund_done',
    ].includes(status)
  ) {
    return 'completed';
  }

  if (['racket_received', 'in_progress'].includes(status)) {
    return 'in_progress';
  }

  if (['approved', 'visit_pending'].includes(status)) {
    return 'approved';
  }

  return 'requested';
};

export function BookingStatusMenu({
  realId,
  bookingType,
  currentStatus,
}: BookingStatusMenuProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{
    title: string;
    description?: string;
    tone?: 'success' | 'danger';
  } | null>(null);
  const [menuPosition, setMenuPosition] = useState<{
    left: number;
    top: number;
    maxHeight: number;
  } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const updateMenuPosition = useCallback(() => {
    const rect = buttonRef.current?.getBoundingClientRect();

    if (!rect || typeof window === 'undefined') {
      return;
    }

    const optionCount =
      bookingType === 'service'
        ? SERVICE_STATUS_OPTIONS.length
        : DEMO_STATUS_OPTIONS.length;
    const desiredHeight = MENU_HEADER_HEIGHT + optionCount * MENU_ITEM_HEIGHT;
    const spaceBelow = window.innerHeight - rect.bottom - MENU_MARGIN;
    const spaceAbove = rect.top - MENU_MARGIN;
    const opensUp = spaceBelow < desiredHeight && spaceAbove > spaceBelow;
    const availableHeight = Math.max(
      MENU_ITEM_HEIGHT * 3,
      opensUp ? spaceAbove : spaceBelow,
    );
    const menuHeight = Math.min(desiredHeight, availableHeight);

    setMenuPosition({
      left: Math.min(
        Math.max(MENU_MARGIN, rect.right - MENU_WIDTH),
        window.innerWidth - MENU_WIDTH - MENU_MARGIN,
      ),
      top: opensUp
        ? Math.max(MENU_MARGIN, rect.top - menuHeight - 4)
        : Math.min(rect.bottom + 4, window.innerHeight - menuHeight - MENU_MARGIN),
      maxHeight: availableHeight,
    });
  }, [bookingType]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handler = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        !buttonRef.current?.contains(target) &&
        !menuRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handler);

    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    updateMenuPosition();
    window.addEventListener('resize', updateMenuPosition);
    window.addEventListener('scroll', updateMenuPosition, true);

    return () => {
      window.removeEventListener('resize', updateMenuPosition);
      window.removeEventListener('scroll', updateMenuPosition, true);
    };
  }, [open, updateMenuPosition]);

  const options =
    bookingType === 'service' ? SERVICE_STATUS_OPTIONS : DEMO_STATUS_OPTIONS;
  const selectedStatus =
    bookingType === 'service'
      ? toServiceMenuStatus(currentStatus)
      : currentStatus;
  const locked = isBookingStatusLockedAfterCompletion(bookingType, currentStatus);

  const handleSelect = async (newStatus: string) => {
    if (locked) {
      setOpen(false);
      return;
    }

    if (newStatus === selectedStatus) {
      setOpen(false);
      return;
    }

    setLoading(true);
    setOpen(false);

    try {
      const fn =
        bookingType === 'service'
          ? updateServiceBookingStatus
          : updateDemoBookingStatus;
      const result = await fn(realId, newStatus);

      if (!result.success) {
        setFeedback({
          title: '상태 변경 실패',
          description: result.error,
          tone: 'danger',
        });
      } else {
        setFeedback({ title: '예약 상태가 변경되었습니다' });
      }
    } catch (err) {
      setFeedback({
        title: '오류가 발생했습니다',
        description: String(err),
        tone: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  const menu =
    open && menuPosition && typeof document !== 'undefined'
      ? createPortal(
          <div
            ref={menuRef}
            className="fixed z-[1000] w-40 rounded-xl border border-border bg-card shadow-xl py-1 text-sm overflow-y-auto"
            style={{
              left: menuPosition.left,
              top: menuPosition.top,
              maxHeight: menuPosition.maxHeight,
            }}
          >
            <p className="px-3 py-1.5 text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
              상태 변경
            </p>
            {options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleSelect(opt.value)}
                className={`w-full text-left px-3 py-2 hover:bg-secondary transition text-sm ${
                  opt.value === selectedStatus
                    ? 'text-primary font-semibold'
                    : 'text-foreground'
                }`}
              >
                {opt.value === selectedStatus && '✓ '}
                {opt.label}
              </button>
            ))}
          </div>,
          document.body,
        )
      : null;

  return (
    <div>
      <ActionFeedbackDialog
        open={feedback !== null}
        title={feedback?.title ?? ''}
        description={feedback?.description}
        tone={feedback?.tone}
        onConfirm={() => setFeedback(null)}
      />
      <button
        ref={buttonRef}
        onClick={(event) => {
          event.stopPropagation();
          if (locked) {
            return;
          }
          if (!open) {
            updateMenuPosition();
          }
          setOpen((value) => !value);
        }}
        disabled={loading || locked}
        title={locked ? '완료된 상태는 변경할 수 없습니다.' : undefined}
        className="size-7 inline-grid place-items-center rounded-md hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="상태 변경"
      >
        {loading ? (
          <Loader2 className="size-4 text-muted-foreground animate-spin" />
        ) : (
          <MoreVertical className="size-4 text-muted-foreground" />
        )}
      </button>
      {menu}
    </div>
  );
}
