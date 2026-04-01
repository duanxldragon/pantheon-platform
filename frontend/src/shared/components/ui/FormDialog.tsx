import type { ReactNode } from 'react';

import { Button } from '../../../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
import { useLanguageStore } from '../../../stores/languageStore';

interface FormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  onSubmit: () => void;
  onCancel?: () => void;
  submitText?: string;
  cancelText?: string;
  submittingText?: string;
  loading?: boolean;
  width?: string;
}

function resolveDialogMaxWidth(width: string) {
  const bracketMatch = width.match(/\[([^\]]+)\]/);
  if (bracketMatch) {
    return bracketMatch[1];
  }

  if (width.includes('max-w-2xl')) {
    return '42rem';
  }

  if (width.includes('max-w-xl')) {
    return '36rem';
  }

  if (width.includes('max-w-lg')) {
    return '32rem';
  }

  if (width.includes('max-w-md')) {
    return '28rem';
  }

  return width;
}

export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  onSubmit,
  onCancel,
  submitText,
  cancelText,
  submittingText,
  loading = false,
  width = '720px',
}: FormDialogProps) {
  const { t, language } = useLanguageStore();
  const zh = language === 'zh';
  const resolvedSubmitText = submitText || t.common.save || (zh ? '保存' : 'Save');
  const resolvedCancelText = cancelText || t.common.cancel || (zh ? '取消' : 'Cancel');
  const resolvedSubmittingText = submittingText || (zh ? '保存中...' : 'Saving...');

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[92vh] overflow-hidden border-none bg-white p-0 shadow-[0_32px_80px_-40px_rgba(15,23,42,0.45)]"
        style={{ width: '100%', maxWidth: resolveDialogMaxWidth(width), maxHeight: '92vh' }}
      >
        <DialogHeader className="border-b border-slate-100/90 px-6 py-5 text-left">
          <DialogTitle className="text-xl font-semibold tracking-tight text-slate-950">{title}</DialogTitle>
          {description ? (
            <DialogDescription className="mt-1 text-sm leading-6 text-slate-500">{description}</DialogDescription>
          ) : null}
        </DialogHeader>

        <div className="custom-scrollbar overflow-y-auto px-6 py-5">
          <div className="space-y-6">{children}</div>
        </div>

        <DialogFooter className="border-t border-slate-100/90 bg-slate-50/80 px-6 py-4 sm:justify-between">
          <div className="text-xs text-slate-400">{zh ? '请确认表单信息后再提交。' : 'Review the form before submitting.'}</div>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={loading}
              className="rounded-2xl border-slate-200 bg-white px-4 hover:bg-slate-50"
            >
              {resolvedCancelText}
            </Button>
            <Button
              type="button"
              onClick={onSubmit}
              disabled={loading}
              className="rounded-2xl bg-primary px-5 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-md"
            >
              {loading ? resolvedSubmittingText : resolvedSubmitText}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
