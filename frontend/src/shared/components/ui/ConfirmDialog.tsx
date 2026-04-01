import React from 'react';
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../../components/ui/alert-dialog';
import { useLanguageStore } from '../../../stores/languageStore';

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'danger' | 'warning' | 'info' | 'success';
  loading?: boolean;
}

const variantConfig = {
  default: {
    icon: Info,
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-100',
    confirmClass: 'bg-blue-600 hover:bg-blue-700',
  },
  danger: {
    icon: XCircle,
    iconColor: 'text-red-600',
    iconBg: 'bg-red-100',
    confirmClass: 'bg-red-600 hover:bg-red-700',
  },
  warning: {
    icon: AlertTriangle,
    iconColor: 'text-orange-600',
    iconBg: 'bg-orange-100',
    confirmClass: 'bg-orange-600 hover:bg-orange-700',
  },
  info: {
    icon: Info,
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-100',
    confirmClass: 'bg-blue-600 hover:bg-blue-700',
  },
  success: {
    icon: CheckCircle2,
    iconColor: 'text-green-600',
    iconBg: 'bg-green-100',
    confirmClass: 'bg-green-600 hover:bg-green-700',
  },
} as const;

export function ConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmText,
  cancelText,
  variant = 'default',
  loading = false,
}: ConfirmDialogProps) {
  const { language, t } = useLanguageStore();
  const zh = language === 'zh';
  const config = variantConfig[variant];
  const Icon = config.icon;

  const resolvedTitle = title || (zh ? '确认操作' : 'Confirm action');
  const resolvedDescription = description || (zh ? '请确认是否继续执行当前操作。' : 'Please confirm whether to continue.');
  const resolvedConfirmText = confirmText || t?.common?.confirm || (zh ? '确认' : 'Confirm');
  const resolvedCancelText = cancelText || t?.common?.cancel || (zh ? '取消' : 'Cancel');
  const loadingText = zh ? '处理中...' : 'Processing...';

  const handleConfirm = () => {
    onConfirm();
    if (!loading) {
      onOpenChange(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="overflow-hidden border-none bg-white/98 p-0 shadow-[0_32px_80px_-40px_rgba(15,23,42,0.45)]">
        <AlertDialogHeader className="px-6 py-6 text-left">
          <div className="flex items-start gap-4">
            <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl ${config.iconBg}`}>
              <Icon className={`h-6 w-6 ${config.iconColor}`} />
            </div>
            <div className="min-w-0 flex-1">
              <AlertDialogTitle className="text-xl font-semibold tracking-tight text-slate-950">
                {resolvedTitle}
              </AlertDialogTitle>
              <AlertDialogDescription className="mt-2 text-sm leading-6 text-slate-500">
                {resolvedDescription}
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter className="border-t border-slate-100/90 bg-slate-50/80 px-6 py-4 sm:justify-between">
          <div className="text-xs text-slate-400">
            {zh ? '已统一使用平台级确认弹窗样式。' : 'Platform confirmation style is applied.'}
          </div>
          <div className="flex items-center gap-3">
            <AlertDialogCancel
              disabled={loading}
              className="rounded-2xl border-slate-200 bg-white px-4 hover:bg-slate-50"
            >
              {resolvedCancelText}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              disabled={loading}
              className={`rounded-2xl px-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${config.confirmClass}`}
            >
              {loading ? loadingText : resolvedConfirmText}
            </AlertDialogAction>
          </div>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
