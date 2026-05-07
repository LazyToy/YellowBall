'use client';

import { useState } from 'react';
import {
  Loader2,
  MoreVertical,
  Package,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { toggleProductActive, updateProductStock } from '@/lib/admin-actions';
import type { AdminProductItem } from '@/lib/admin-data';
import { ActionFeedbackDialog } from './action-dialogs';

type Feedback = {
  title: string;
  description?: string;
  tone?: 'success' | 'danger';
};

interface ProductStockEditorProps {
  productId: string;
  initialStock: number;
}

export function ProductStockEditor({
  productId,
  initialStock,
}: ProductStockEditorProps) {
  const [stock, setStock] = useState(initialStock);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(initialStock));
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const save = async () => {
    const newStock = parseInt(draft, 10);
    if (isNaN(newStock) || newStock < 0) {
      setFeedback({
        title: '재고 수량을 확인해주세요',
        description: '재고는 0 이상의 숫자로 입력해야 합니다.',
        tone: 'danger',
      });
      setDraft(String(stock));
      setEditing(false);
      return;
    }
    if (newStock === stock) {
      setEditing(false);
      return;
    }
    setLoading(true);
    try {
      const result = await updateProductStock(productId, newStock);
      if (result.success) {
        setStock(newStock);
        setFeedback({ title: '재고 수량이 변경되었습니다' });
      } else {
        setFeedback({
          title: '재고 업데이트 실패',
          description: result.error,
          tone: 'danger',
        });
        setDraft(String(stock));
      }
    } catch (err) {
      setFeedback({
        title: '오류가 발생했습니다',
        description: String(err),
        tone: 'danger',
      });
    } finally {
      setLoading(false);
      setEditing(false);
    }
  };

  if (loading) {
    return <Loader2 className="size-4 animate-spin text-muted-foreground" />;
  }

  return (
    <>
      <ActionFeedbackDialog
        open={feedback !== null}
        title={feedback?.title ?? ''}
        description={feedback?.description}
        tone={feedback?.tone}
        onConfirm={() => setFeedback(null)}
      />
      {editing ? (
        <input
          type="number"
          value={draft}
          min={0}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => {
            if (e.key === 'Enter') save();
            if (e.key === 'Escape') {
              setDraft(String(stock));
              setEditing(false);
            }
          }}
          className="w-16 text-right bg-secondary border border-primary rounded px-1 py-0.5 text-sm font-semibold focus:outline-none"
          autoFocus
        />
      ) : (
        <button
          onClick={() => {
            setDraft(String(stock));
            setEditing(true);
          }}
          title="클릭하여 재고 수정"
          className={`font-semibold hover:underline cursor-pointer ${
            stock === 0
              ? 'text-destructive'
              : stock < 10
                ? 'text-chart-4'
                : 'text-foreground'
          }`}
        >
          {stock}
        </button>
      )}
    </>
  );
}

interface ProductActiveToggleProps {
  productId: string;
  initialActive: boolean;
}

export function ProductActiveToggle({
  productId,
  initialActive,
}: ProductActiveToggleProps) {
  const [isActive, setIsActive] = useState(initialActive);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const handle = async () => {
    setLoading(true);
    try {
      const nextActive = !isActive;
      const result = await toggleProductActive(productId, nextActive);
      if (result.success) {
        setIsActive(nextActive);
        setFeedback({
          title: nextActive ? '상품이 활성화되었습니다' : '상품이 비활성화되었습니다',
        });
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
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader2 className="size-4 animate-spin text-muted-foreground" />;
  }

  return (
    <>
      <ActionFeedbackDialog
        open={feedback !== null}
        title={feedback?.title ?? ''}
        description={feedback?.description}
        tone={feedback?.tone}
        onConfirm={() => setFeedback(null)}
      />
      <button
        onClick={handle}
        title={isActive ? '비활성화' : '활성화'}
        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full transition ${
          isActive
            ? 'bg-chart-4/15 text-chart-4 hover:bg-chart-4/25'
            : 'bg-muted text-muted-foreground hover:bg-secondary'
        }`}
      >
        {isActive ? (
          <>
            <ToggleRight className="size-3" />
            판매 중
          </>
        ) : (
          <>
            <ToggleLeft className="size-3" />
            비활성
          </>
        )}
      </button>
    </>
  );
}

interface ProductRowMenuProps {
  product: AdminProductItem;
}

export function ProductRowMenu({ product }: ProductRowMenuProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const handleToggle = async () => {
    setOpen(false);
    setLoading(true);
    try {
      const nextActive = !product.isActive;
      const result = await toggleProductActive(product.id, nextActive);
      if (!result.success) {
        setFeedback({
          title: '처리 실패',
          description: result.error,
          tone: 'danger',
        });
        return;
      }
      setFeedback({
        title: nextActive ? '상품이 활성화되었습니다' : '상품이 비활성화되었습니다',
      });
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
    <div className="relative">
      <ActionFeedbackDialog
        open={feedback !== null}
        title={feedback?.title ?? ''}
        description={feedback?.description}
        tone={feedback?.tone}
        onConfirm={() => {
          const wasSuccess = feedback?.tone !== 'danger';
          setFeedback(null);
          if (wasSuccess) {
            window.location.reload();
          }
        }}
      />
      <button
        onClick={() => setOpen((v) => !v)}
        className="size-7 grid place-items-center rounded-md hover:bg-secondary"
      >
        <MoreVertical className="size-4 text-muted-foreground" />
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-50 w-36 rounded-xl border border-border bg-card shadow-xl py-1 text-sm">
          <button
            onClick={handleToggle}
            className="w-full text-left px-3 py-2 hover:bg-secondary transition flex items-center gap-2"
          >
            <Package className="size-3.5" />
            {product.isActive ? '비활성화' : '활성화'}
          </button>
        </div>
      )}
    </div>
  );
}
