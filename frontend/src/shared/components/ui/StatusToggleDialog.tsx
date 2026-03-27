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
  const isActivating = currentStatus === 'inactive';
  const action = isActivating ? '启用' : '禁用';

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-full ${isActivating ? 'bg-green-50' : 'bg-orange-50'}`}>
              <Power className={`w-6 h-6 ${isActivating ? 'text-green-600' : 'text-orange-600'}`} />
            </div>
            <AlertDialogTitle className="text-gray-900">
              确认{action}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-gray-600">
            {itemName
              ? `确定要${action} "${itemName}" 吗？`
              : `确定要${action}该项吗？`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading} className="hover:bg-gray-50">
            取消
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={loading}
            className={isActivating 
              ? 'bg-green-600 hover:bg-green-700 text-white' 
              : 'bg-orange-600 hover:bg-orange-700 text-white'}
          >
            {loading ? `${action}中...` : `确认${action}`}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
