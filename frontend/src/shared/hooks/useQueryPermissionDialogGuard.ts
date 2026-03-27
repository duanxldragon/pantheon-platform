import { useEffect, useMemo } from 'react';

import { useLanguageStore } from '../../stores/languageStore';

type DialogState = Record<string, boolean>;

interface UseQueryPermissionDialogGuardOptions<T extends DialogState> {
  canQuery: boolean;
  pageTitle: string;
  dialogs: T;
  protectedDialogs: Partial<Record<keyof T, string>>;
  closeDialogs: (keys: Array<keyof T>) => void;
}

export function useQueryPermissionDialogGuard<T extends DialogState>({
  canQuery,
  pageTitle,
  dialogs,
  protectedDialogs,
  closeDialogs,
}: UseQueryPermissionDialogGuardOptions<T>) {
  const { language } = useLanguageStore();

  const openProtectedDialogs = useMemo(() => {
    if (canQuery) {
      return [] as string[];
    }

    return Object.entries(protectedDialogs)
      .filter(([key, label]) => Boolean(label) && Boolean(dialogs[key]))
      .map(([, label]) => label as string);
  }, [canQuery, dialogs, protectedDialogs]);

  useEffect(() => {
    if (canQuery) {
      return;
    }

    const keysToClose = Object.keys(protectedDialogs).filter(
      (key) => dialogs[key],
    ) as Array<keyof T>;

    if (keysToClose.length === 0) {
      return;
    }

    closeDialogs(keysToClose);
  }, [canQuery, closeDialogs, dialogs, protectedDialogs]);

  const lossDescription = useMemo(() => {
    if (openProtectedDialogs.length === 0) {
      return undefined;
    }

    if (language === 'zh') {
      return `当前账号已失去「${pageTitle}」查询权限，系统已自动关闭${openProtectedDialogs.join('、')}弹窗，并收起页面数据区。`;
    }

    return `Query access to "${pageTitle}" was removed. The system closed the ${openProtectedDialogs.join(', ')} dialog(s) and collapsed the page data area.`;
  }, [language, openProtectedDialogs, pageTitle]);

  return {
    lossDescription,
    hasProtectedDialogsOpen: openProtectedDialogs.length > 0,
  };
}
