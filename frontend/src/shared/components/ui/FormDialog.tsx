import type { ReactNode } from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';

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

export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  onSubmit,
  onCancel,
  submitText = 'Submit',
  cancelText = 'Cancel',
  submittingText = 'Submitting...',
  loading = false,
  width = 'max-w-md',
}: FormDialogProps) {
  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${width} max-h-[90vh] overflow-y-auto`}>
        <DialogHeader>
          <DialogTitle className="text-gray-900">{title}</DialogTitle>
          <DialogDescription className="text-gray-500">{description || ' '}</DialogDescription>
        </DialogHeader>

        <div className="py-4">{children}</div>

        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={handleCancel} disabled={loading} className="hover:bg-gray-50">
            {cancelText}
          </Button>
          <Button type="button" onClick={onSubmit} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
            {loading ? submittingText : submitText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

