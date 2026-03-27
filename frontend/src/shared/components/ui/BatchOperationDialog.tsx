/**
 * 批量操作对话框组件
 * 用于批量删除、批量修改等操作
 */

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { AlertTriangle, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { ScrollArea } from '../../../components/ui/scroll-area';

export interface BatchOperationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  items: any[];
  renderItem?: (item: any) => React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  loading?: boolean;
  maxHeight?: string;
}

const variantConfig = {
  danger: {
    icon: XCircle,
    iconColor: 'text-red-600',
    iconBg: 'bg-red-100',
    confirmClass: 'bg-red-600 hover:bg-red-700',
    badgeClass: 'bg-red-100 text-red-700',
  },
  warning: {
    icon: AlertTriangle,
    iconColor: 'text-orange-600',
    iconBg: 'bg-orange-100',
    confirmClass: 'bg-orange-600 hover:bg-orange-700',
    badgeClass: 'bg-orange-100 text-orange-700',
  },
  info: {
    icon: CheckCircle2,
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-100',
    confirmClass: 'bg-blue-600 hover:bg-blue-700',
    badgeClass: 'bg-blue-100 text-blue-700',
  },
};

export function BatchOperationDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  items,
  renderItem,
  confirmText = '确认',
  cancelText = '取消',
  variant = 'warning',
  loading = false,
  maxHeight = '300px',
}: BatchOperationDialogProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-full ${config.iconBg} flex-shrink-0`}>
              <Icon className={`w-6 h-6 ${config.iconColor}`} />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-lg font-semibold flex items-center gap-2">
                {title}
                <Badge className={config.badgeClass}>
                  {items.length} 项
                </Badge>
              </DialogTitle>
              {description && (
                <DialogDescription className="mt-2">
                  {description}
                </DialogDescription>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="my-4">
          <ScrollArea className="rounded-lg border" style={{ maxHeight }}>
            <div className="p-4 space-y-2">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="p-3 bg-gray-50 rounded-lg text-sm hover:bg-gray-100 transition-colors"
                >
                  {renderItem ? renderItem(item) : (
                    <span className="text-gray-700">
                      {item.name || item.title || item.label || `项目 ${index + 1}`}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading}
            className={config.confirmClass}
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {loading ? '处理中...' : confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
