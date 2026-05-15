'use client';

/**
 * 주문 상태 변경 드롭다운
 */
import { useState, useRef, useEffect } from 'react';
import { MoreVertical, Loader2 } from 'lucide-react';
import { updateOrderStatus } from '@/lib/admin-actions';
import { isOrderStatusLockedAfterCompletion } from '@/lib/admin-status-lock';
import { ActionFeedbackDialog } from './action-dialogs';

const ORDER_STATUS_OPTIONS = [
  { value: 'pending', label: '결제 대기' },
  { value: 'paid', label: '결제 완료' },
  { value: 'preparing', label: '준비 중' },
  { value: 'shipping', label: '배송 중' },
  { value: 'delivered', label: '전달 완료' },
  { value: 'cancelled', label: '취소' },
  { value: 'refunded', label: '환불' },
];

interface OrderStatusMenuProps {
  orderId: string;
  currentStatus: string;
}

export function OrderStatusMenu({ orderId, currentStatus }: OrderStatusMenuProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(currentStatus);
  const [feedback, setFeedback] = useState<{
    title: string;
    description?: string;
    tone?: 'success' | 'danger';
  } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const locked = isOrderStatusLockedAfterCompletion(status);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = async (newStatus: string) => {
    if (locked) {
      setOpen(false);
      return;
    }

    if (newStatus === status) {
      setOpen(false);
      return;
    }
    setLoading(true);
    setOpen(false);
    try {
      const result = await updateOrderStatus(orderId, newStatus);
      if (result.success) {
        setStatus(newStatus);
        setFeedback({ title: '주문 상태가 변경되었습니다' });
      } else {
        setFeedback({
          title: '상태 변경 실패',
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
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader2 className="size-4 animate-spin text-muted-foreground" />;
  }

  return (
    <div ref={ref} className="relative">
      <ActionFeedbackDialog
        open={feedback !== null}
        title={feedback?.title ?? ''}
        description={feedback?.description}
        tone={feedback?.tone}
        onConfirm={() => setFeedback(null)}
      />
      <button
        onClick={() => {
          if (!locked) {
            setOpen((v) => !v);
          }
        }}
        disabled={locked}
        title={locked ? '완료된 상태는 변경할 수 없습니다.' : undefined}
        className="size-7 inline-grid place-items-center rounded-md hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="주문 상태 변경"
      >
        <MoreVertical className="size-4 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute right-0 top-8 z-50 w-40 rounded-xl border border-border bg-card shadow-xl py-1 text-sm">
          <p className="px-3 py-1.5 text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
            상태 변경
          </p>
          {ORDER_STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleSelect(opt.value)}
              className={`w-full text-left px-3 py-2 hover:bg-secondary transition text-sm ${
                opt.value === status ? 'text-primary font-semibold' : 'text-foreground'
              }`}
            >
              {opt.value === status && '✓ '}
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
