import { useEffect, useMemo } from 'react';

import { useLanguageStore } from '../../stores/languageStore';
import { systemNotification } from '../utils/notification';

type DialogState = Record<string, boolean>;

interface GuardedDialogConfig {
  label: string;
  allowed: boolean;
}

interface UseActionPermissionDialogGuardOptions<T extends DialogState> {
  pageTitle: string;
  dialogs: T;
  guardedDialogs: Partial<Record<keyof T, GuardedDialogConfig>>;
  closeDialogs: (keys: Array<keyof T>) => void;
}

export function useActionPermissionDialogGuard<T extends DialogState>({
  pageTitle,
  dialogs,
  guardedDialogs,
  closeDialogs,
}: UseActionPermissionDialogGuardOptions<T>) {
  const { language } = useLanguageStore();

  const unauthorizedDialogs = useMemo(() => {
    return (Object.entries(guardedDialogs) as Array<[keyof T, GuardedDialogConfig | undefined]>)
      .filter(([key, config]) => Boolean(config) && dialogs[key] && !config?.allowed)
      .map(([key, config]) => ({
        key,
        label: config?.label || String(key),
      }));
  }, [dialogs, guardedDialogs]);

  useEffect(() => {
    if (unauthorizedDialogs.length === 0) {
      return;
    }

    closeDialogs(unauthorizedDialogs.map((item) => item.key));

    const dialogNames = unauthorizedDialogs.map((item) => item.label).join(language === 'zh' ? '、' : ', ');
    systemNotification.warning(
      language === 'zh' ? '操作权限已失效' : 'Action permission removed',
      language === 'zh'
        ? `当前账号已失去「${pageTitle}」的相关操作权限，系统已自动关闭${dialogNames}弹窗。`
        : `Action permission for "${pageTitle}" was removed. The ${dialogNames} dialog(s) were closed automatically.`,
    );
  }, [closeDialogs, language, pageTitle, unauthorizedDialogs]);

  const ensureActionPermission = (allowed: boolean, actionLabel: string) => {
    if (allowed) {
      return true;
    }

    systemNotification.warning(
      language === 'zh' ? '操作权限已失效' : 'Action permission removed',
      language === 'zh'
        ? `当前账号已失去「${pageTitle}」的${actionLabel}权限，请刷新权限后重试。`
        : `The ${actionLabel} permission for "${pageTitle}" is no longer available. Refresh permissions and try again.`,
    );
    return false;
  };

  return {
    ensureActionPermission,
  };
}
