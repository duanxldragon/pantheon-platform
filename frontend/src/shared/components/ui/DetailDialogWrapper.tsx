import { ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { X } from 'lucide-react';

interface DetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  footer?: ReactNode;
}

export function DetailDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  size = 'md',
  showCloseButton = true,
  footer,
}: DetailDialogProps) {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'sm:max-w-[425px]';
      case 'md':
        return 'sm:max-w-[600px]';
      case 'lg':
        return 'sm:max-w-[800px]';
      case 'xl':
        return 'sm:max-w-[1000px]';
      case 'full':
        return 'sm:max-w-[95vw]';
      default:
        return 'sm:max-w-[600px]';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={getSizeClasses()}>
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            {title}
            {showCloseButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </DialogTitle>
          {description && (
            <DialogDescription>{description}</DialogDescription>
          )}
        </DialogHeader>
        
        <div className="max-h-[70vh] overflow-y-auto">
          {children}
        </div>
        
        {footer && (
          <div className="mt-6 pt-4 border-t">
            {footer}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}