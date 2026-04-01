import type { ReactNode } from 'react';
import React from 'react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../../components/ui/alert-dialog';
import { useLanguageStore } from '../../../stores/languageStore';

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title?: string;
  description?: string | ReactNode;
  itemName?: string;
  loading?: boolean;
  cancelText?: string;
  confirmText?: string;
  confirmingText?: string;
}

const AlertCircle = ({ className, ...props }: React.ComponentProps<'svg'>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" x2="12" y1="8" y2="12" />
    <line x1="12" x2="12.01" y1="16" y2="16" />
  </svg>
);

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  itemName,
  loading = false,
  cancelText,
  confirmText,
  confirmingText,
}: DeleteConfirmDialogProps) {
  const { language, t } = useLanguageStore();
  const zh = language === 'zh';
  const resolvedTitle = title || (zh ? '确认删除' : 'Confirm delete');
  const resolvedCancelText = cancelText || t?.common?.cancel || (zh ? '取消' : 'Cancel');
  const resolvedConfirmText = confirmText || t?.common?.delete || (zh ? '删除' : 'Delete');
  const resolvedConfirmingText = confirmingText || (zh ? '删除中...' : 'Deleting...');
  const defaultDescription = description || (
    itemName
      ? zh
        ? `确认删除“${itemName}”吗？删除后将无法恢复。`
        : `Delete "${itemName}"? This action cannot be undone.`
      : zh
        ? '确认删除当前内容吗？删除后将无法恢复。'
        : 'Delete the current item? This action cannot be undone.'
  );

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="overflow-hidden border-none bg-white/98 p-0 shadow-[0_32px_80px_-40px_rgba(15,23,42,0.45)]">
        <AlertDialogHeader className="px-6 py-6 text-left">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-rose-100">
              <AlertCircle className="h-6 w-6 text-rose-600" />
            </div>
            <div className="min-w-0 flex-1">
              <AlertDialogTitle className="text-xl font-semibold tracking-tight text-slate-950">
                {resolvedTitle}
              </AlertDialogTitle>
              <AlertDialogDescription className="mt-2 text-sm leading-6 text-slate-500">
                {defaultDescription}
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter className="border-t border-slate-100/90 bg-slate-50/80 px-6 py-4 sm:justify-between">
          <div className="text-xs text-slate-400">
            {zh ? '删除操作会保持明确且谨慎的提示。' : 'Deletion remains intentionally explicit.'}
          </div>
          <div className="flex items-center gap-3">
            <AlertDialogCancel
              disabled={loading}
              className="rounded-2xl border-slate-200 bg-white px-4 hover:bg-slate-50"
            >
              {resolvedCancelText}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                onConfirm();
              }}
              disabled={loading}
              className="rounded-2xl bg-rose-600 px-5 text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-rose-700 hover:shadow-md"
            >
              {loading ? resolvedConfirmingText : resolvedConfirmText}
            </AlertDialogAction>
          </div>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
