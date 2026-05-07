'use client';

import { CheckCircle2, TriangleAlert } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type DialogTone = 'success' | 'danger';

interface ActionFeedbackDialogProps {
  open: boolean;
  title: string;
  description?: string;
  tone?: DialogTone;
  onConfirm: () => void;
}

interface ActionConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  tone?: DialogTone;
  onCancel: () => void;
  onConfirm: () => void;
}

function ToneIcon({ tone = 'success' }: { tone?: DialogTone }) {
  const className =
    tone === 'danger'
      ? 'bg-destructive/10 text-destructive'
      : 'bg-chart-4/15 text-chart-4';

  return (
    <span className={`size-10 rounded-full grid place-items-center ${className}`}>
      {tone === 'danger' ? (
        <TriangleAlert className="size-5" />
      ) : (
        <CheckCircle2 className="size-5" />
      )}
    </span>
  );
}

export function ActionFeedbackDialog({
  open,
  title,
  description,
  tone = 'success',
  onConfirm,
}: ActionFeedbackDialogProps) {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="max-w-sm rounded-2xl">
        <AlertDialogHeader className="items-center text-center">
          <ToneIcon tone={tone} />
          <AlertDialogTitle className="text-base">{title}</AlertDialogTitle>
          {description ? (
            <AlertDialogDescription className="leading-relaxed">
              {description}
            </AlertDialogDescription>
          ) : null}
        </AlertDialogHeader>
        <AlertDialogFooter className="sm:justify-center">
          <AlertDialogAction onClick={onConfirm} className="min-w-24">
            확인
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function ActionConfirmDialog({
  open,
  title,
  description,
  confirmLabel = '확인',
  tone = 'danger',
  onCancel,
  onConfirm,
}: ActionConfirmDialogProps) {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="max-w-sm rounded-2xl">
        <AlertDialogHeader className="items-center text-center">
          <ToneIcon tone={tone} />
          <AlertDialogTitle className="text-base">{title}</AlertDialogTitle>
          {description ? (
            <AlertDialogDescription className="leading-relaxed">
              {description}
            </AlertDialogDescription>
          ) : null}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>취소</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>{confirmLabel}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
