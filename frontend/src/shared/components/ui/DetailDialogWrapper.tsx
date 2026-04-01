import { ReactNode } from 'react';
import { X } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
import { type DialogSize, getDialogClassName, getDialogStyle } from '../../constants/dialogSizes';

interface DetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  size?: DialogSize;
  showCloseButton?: boolean;
  footer?: ReactNode;
}

export function DetailDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  size = 'lg',
  showCloseButton = true,
  footer,
}: DetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={getDialogClassName(size, 'p-0')} style={getDialogStyle(size)}>
        <DialogHeader className="border-b border-slate-100/90 px-6 py-5 text-left">
          <DialogTitle className="flex items-center justify-between gap-4 text-xl font-semibold tracking-tight text-slate-950">
            <span>{title}</span>
            {showCloseButton ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
                className="h-9 w-9 rounded-xl border border-slate-200/80 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              >
                <X className="h-4 w-4" />
              </Button>
            ) : null}
          </DialogTitle>
          {description ? (
            <DialogDescription className="mt-1 text-sm leading-6 text-slate-500">{description}</DialogDescription>
          ) : null}
        </DialogHeader>

        <div className="custom-scrollbar max-h-[72vh] overflow-y-auto px-6 py-5">
          {children}
        </div>

        {footer ? <div className="border-t border-slate-100/90 bg-slate-50/80 px-6 py-4">{footer}</div> : null}
      </DialogContent>
    </Dialog>
  );
}
