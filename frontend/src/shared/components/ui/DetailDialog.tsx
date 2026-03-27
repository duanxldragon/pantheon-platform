import { ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
import { ScrollArea } from '../../../components/ui/scroll-area';

interface DetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
  width?: string;
}

export function DetailDialog({
  open,
  onOpenChange,
  title,
  children,
  width = 'max-w-3xl',
}: DetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${width} max-h-[90vh]`} aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="text-gray-900">{title}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(90vh-120px)] pr-4">
          <div className="py-4">{children}</div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

interface DetailItemProps {
  label: string;
  value: ReactNode;
  span?: boolean;
}

export function DetailItem({ label, value, span = false }: DetailItemProps) {
  return (
    <div className={`${span ? 'col-span-2' : ''}`}>
      <div className="text-sm text-gray-500 mb-1">{label}</div>
      <div className="text-gray-900">{value || '-'}</div>
    </div>
  );
}

export function DetailSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-4">
      <h3 className="text-gray-900 border-b border-gray-200 pb-2">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {children}
      </div>
    </div>
  );
}