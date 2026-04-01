import { ReactNode } from 'react';
import { ScrollArea } from '../../../components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';

interface DetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
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

  return width;
}

export function DetailDialog({
  open,
  onOpenChange,
  title,
  children,
  width = '1040px',
}: DetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[92vh] overflow-hidden border-none bg-white p-0 shadow-[0_32px_80px_-40px_rgba(15,23,42,0.45)]"
        style={{ width: '100%', maxWidth: resolveDialogMaxWidth(width), maxHeight: '92vh' }}
        aria-describedby={undefined}
      >
        <DialogHeader className="border-b border-slate-100/90 px-6 py-5 text-left">
          <DialogTitle className="text-xl font-semibold tracking-tight text-slate-950">{title}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(92vh-88px)]">
          <div className="px-6 py-5">{children}</div>
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
    <div className={`${span ? 'md:col-span-2' : ''} rounded-2xl border border-slate-100 bg-slate-50/70 p-4`}>
      <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">{label}</div>
      <div className="text-sm font-medium leading-6 text-slate-900">{value || '-'}</div>
    </div>
  );
}

export function DetailSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-200" />
        <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-500">{title}</h3>
        <div className="h-px flex-1 bg-slate-200" />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{children}</div>
    </div>
  );
}
