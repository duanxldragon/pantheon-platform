import { useEffect } from 'react';

import { useLanguageStore } from '../../stores/languageStore';
import { systemNotification } from '../utils/notification';

interface GuardMeta {
  allowed: boolean;
  label: string;
}

interface UsePermissionConfirmGuardOptions<T extends string> {
  open: boolean;
  guard?: T | null;
  pageTitle: string;
  guards: Record<T, GuardMeta>;
  closeConfirm: () => void;
}

export function usePermissionConfirmGuard<T extends string>({
  open,
  guard,
  pageTitle,
  guards,
  closeConfirm,
}: UsePermissionConfirmGuardOptions<T>) {
  const { language } = useLanguageStore();

  useEffect(() => {
    if (!open || !guard) {
      return;
    }

    const meta = guards[guard];
    if (!meta || meta.allowed) {
      return;
    }

    closeConfirm();
    systemNotification.warning(
      language === 'zh' ? '操作权限已失效' : 'Action permission removed',
      language === 'zh'
        ? `当前账号已失去「${pageTitle}」的${meta.label}权限，确认弹窗已自动关闭。`
        : `The ${meta.label} permission for "${pageTitle}" was removed. The confirmation dialog has been closed.`,
    );
  }, [closeConfirm, guard, guards, language, open, pageTitle]);

  const ensureConfirmPermission = (nextGuard?: T | null) => {
    if (!nextGuard) {
      return true;
    }

    const meta = guards[nextGuard];
    if (!meta || meta.allowed) {
      return true;
    }

    systemNotification.warning(
      language === 'zh' ? '操作权限已失效' : 'Action permission removed',
      language === 'zh'
        ? `当前账号已失去「${pageTitle}」的${meta.label}权限，请刷新权限后重试。`
        : `The ${meta.label} permission for "${pageTitle}" is no longer available. Refresh permissions and try again.`,
    );
    return false;
  };

  return {
    ensureConfirmPermission,
  };
}
