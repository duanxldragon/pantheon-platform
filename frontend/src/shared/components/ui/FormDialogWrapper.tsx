import { ReactNode } from 'react';
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
  submitText?: string;
  cancelText?: string;
  onSubmit?: (e: React.FormEvent) => void;
  loading?: boolean;
  submitDisabled?: boolean;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  submitText = '保存',
  cancelText = '取消',
  onSubmit,
  loading = false,
  submitDisabled = false,
  footer,
  size = 'md',
}: FormDialogProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.(e);
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'sm:max-w-[425px]';
      case 'md':
        return 'sm:max-w-[500px]';
      case 'lg':
        return 'sm:max-w-[600px]';
      case 'xl':
        return 'sm:max-w-[800px]';
      case 'full':
        return 'sm:max-w-[95vw]';
      default:
        return 'sm:max-w-[500px]';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={getSizeClasses()}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && (
            <DialogDescription>{description}</DialogDescription>
          )}
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {children}
          
          {footer ? (
            footer
          ) : (
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                {cancelText}
              </Button>
              <Button
                type="submit"
                disabled={loading || submitDisabled}
              >
                {loading ? '保存中...' : submitText}
              </Button>
            </DialogFooter>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}