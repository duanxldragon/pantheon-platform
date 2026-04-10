import { ReactNode } from 'react';
import type { DialogSize } from '../../constants/dialog_sizes';
import { DetailDialog as DetailDialogWrapper } from './detail_dialog_wrapper';

interface DetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
  width?: string;
}

function resolveLegacyDetailSize(width: string): DialogSize {
  if (width.includes('max-w-2xl') || width.includes('1040')) return '2xl';
  if (width.includes('max-w-xl') || width.includes('880')) return 'xl';
  if (width.includes('720')) return 'lg';
  return 'xl';
}

export function DetailDialog({
  open,
  onOpenChange,
  title,
  children,
  width = '1040px',
}: DetailDialogProps) {
  return (
    <DetailDialogWrapper
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      size={resolveLegacyDetailSize(width)}
    >
      {children}
    </DetailDialogWrapper>
  );
}
