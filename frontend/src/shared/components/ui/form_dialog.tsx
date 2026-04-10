import type { ReactNode } from 'react';

import type { DialogSize } from '../../constants/dialog_sizes';
import { FormDialog as FormDialogWrapper } from './form_dialog_wrapper';

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
  size?: DialogSize;
  submitDisabled?: boolean;
}

function resolveLegacyDialogSize(width: string): DialogSize {
  if (width.includes('max-w-2xl') || width.includes('1040')) return '2xl';
  if (width.includes('max-w-xl') || width.includes('880')) return 'xl';
  if (width.includes('max-w-lg') || width.includes('720')) return 'lg';
  if (width.includes('max-w-md') || width.includes('560')) return 'md';
  if (width.includes('520') || width.includes('460')) return 'sm';
  return 'lg';
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
  size,
  submitDisabled = false,
}: FormDialogProps) {
  return (
    <FormDialogWrapper
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onCancel?.();
        }
        onOpenChange(nextOpen);
      }}
      title={title}
      description={description}
      onSubmit={() => onSubmit?.()}
      submitText={submitText}
      submittingText={submittingText}
      cancelText={cancelText}
      loading={loading}
      submitDisabled={submitDisabled}
      size={size ?? resolveLegacyDialogSize(width)}
    >
      {children}
    </FormDialogWrapper>
  );
}

