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
import { Power } from 'lucide-react';
import { useLanguageStore } from '../../../stores/language_store';

interface StatusToggleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  currentStatus: 'active' | 'inactive';
  itemName?: string;
  loading?: boolean;
}

export function StatusToggleDialog({
  open,
  onOpenChange,
  onConfirm,
  currentStatus,
  itemName,
  loading = false,
}: StatusToggleDialogProps) {
  const { language } = useLanguageStore();
  const zh = language === 'zh';
  const isActivating = currentStatus === 'inactive';
  const action = zh ? (isActivating ? '启用' : '禁用') : (isActivating ? 'Enable' : 'Disable');

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="overflow-hidden border-none bg-gradient-to-br from-white via-white to-slate-50/85 p-0 shadow-[0_32px_80px_-40px_rgba(15,23,42,0.45)]">
        <AlertDialogHeader className="px-6 py-6 text-left">
          <div className="flex items-start gap-4">
            <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl shadow-sm ${isActivating ? 'bg-green-100' : 'bg-orange-100'}`}>
              <Power className={`w-6 h-6 ${isActivating ? 'text-green-600' : 'text-orange-600'}`} />
            </div>
            <div className="min-w-0 flex-1">
              <AlertDialogTitle className="text-xl font-semibold tracking-tight text-slate-950">
                {zh ? `确认${action}` : `Confirm ${action}`}
              </AlertDialogTitle>
              <AlertDialogDescription className="mt-2 text-sm leading-6 text-slate-500">
                {itemName
                  ? zh
                    ? `确定要${action}“${itemName}”吗？状态变化会影响相关访问与业务流转。`
                    : `Are you sure you want to ${action.toLowerCase()} "${itemName}"? This status change may affect related access and workflows.`
                  : zh
                    ? `确定要${action}该项吗？状态变化会影响相关访问与业务流转。`
                    : `Are you sure you want to ${action.toLowerCase()} this item? This status change may affect related access and workflows.`}
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter className="border-t border-slate-100/90 bg-gradient-to-r from-slate-50/88 via-white/80 to-slate-50/88 px-6 py-4 sm:justify-between">
          <div className="text-xs text-slate-400">
            {zh ? '启停切换会保持明确的影响提示。' : 'State changes remain explicit about their impact.'}
          </div>
          <div className="flex items-center gap-3">
          <AlertDialogCancel disabled={loading} className="rounded-2xl border-slate-200 bg-white px-4 hover:bg-slate-50">
            {zh ? '取消' : 'Cancel'}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={loading}
            className={`rounded-2xl px-5 text-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${isActivating 
              ? 'bg-green-600 hover:bg-green-700' 
              : 'bg-orange-600 hover:bg-orange-700'}`}
          >
            {loading ? (zh ? `${action}中...` : `${action}...`) : (zh ? `确认${action}` : action)}
          </AlertDialogAction>
          </div>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
