import { ReactNode } from 'react';

import { Button } from '../../../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
import { useLanguageStore } from '../../../stores/language_store';
import { type DialogSize, getDialogClassName, getDialogStyle } from '../../constants/dialog_sizes';

interface FormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  submitText?: string;
  submittingText?: string;
  cancelText?: string;
  onSubmit?: (e: React.FormEvent) => void;
  loading?: boolean;
  submitDisabled?: boolean;
  footer?: ReactNode;
  size?: DialogSize;
}

export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  submitText,
  submittingText,
  cancelText,
  onSubmit,
  loading = false,
  submitDisabled = false,
  footer,
  size = 'md',
}: FormDialogProps) {
  const { t, language } = useLanguageStore();
  const zh = language === 'zh';
  const resolvedSubmitText = submitText || t.common.save || (zh ? '保存' : 'Save');
  const resolvedCancelText = cancelText || t.common.cancel || (zh ? '取消' : 'Cancel');
  const loadingText = submittingText || (zh ? '保存中...' : 'Saving...');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.(e);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={getDialogClassName(size, 'overflow-hidden p-0')} style={getDialogStyle(size)}>
        <DialogHeader className="border-b border-slate-100/90 bg-gradient-to-br from-white via-white to-slate-50/85 px-6 py-5 text-left">
          <DialogTitle className="text-xl font-semibold tracking-tight text-slate-950">{title}</DialogTitle>
          {description ? (
            <DialogDescription className="mt-1 text-sm leading-6 text-slate-500">{description}</DialogDescription>
          ) : null}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex max-h-[92vh] flex-col">
          <div className="custom-scrollbar overflow-y-auto bg-gradient-to-br from-white/96 via-white/94 to-slate-50/70 px-6 py-5">
            <div className="space-y-5">{children}</div>
          </div>

          {footer ? (
            footer
          ) : (
            <DialogFooter className="border-t border-slate-100/90 bg-gradient-to-r from-slate-50/88 via-white/80 to-slate-50/88 px-6 py-4 sm:justify-between">
              <div className="text-xs text-slate-400">
                {zh ? '已统一使用平台级表单弹窗样式。' : 'Platform form dialog style is applied.'}
              </div>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={loading}
                  className="rounded-2xl border-slate-200 bg-white px-4 hover:bg-slate-50"
                >
                  {resolvedCancelText}
                </Button>
                <Button
                  type="submit"
                  disabled={loading || submitDisabled}
                  className="rounded-2xl bg-primary px-5 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-md"
                >
                  {loading ? loadingText : resolvedSubmitText}
                </Button>
              </div>
            </DialogFooter>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}




