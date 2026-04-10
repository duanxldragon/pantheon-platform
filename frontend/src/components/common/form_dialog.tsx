import { ReactNode } from 'react';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { getDialogClassName, DialogSize } from '../../shared/constants/dialog_sizes';
import { useLanguageStore } from '../../stores/language_store';

interface FormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  children: ReactNode;
  onSubmit: (e: React.FormEvent) => void;
  submitLabel?: string;
  cancelLabel?: string;
  size?: DialogSize;
}

export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  onSubmit,
  submitLabel,
  cancelLabel,
  size = 'lg',
}: FormDialogProps) {
  const { t } = useLanguageStore();
  const defaultSubmitLabel = submitLabel || t.common.confirm;
  const defaultCancelLabel = cancelLabel || t.common.cancel;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={getDialogClassName(size)}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit}>
          <div className="space-y-6 py-4">{children}</div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {defaultCancelLabel}
            </Button>
            <Button type="submit">{defaultSubmitLabel}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}




