import { toast } from 'sonner';

import { useLanguageStore } from '../../stores/languageStore';

export interface NotificationOptions {
  duration?: number;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const isZh = () => useLanguageStore.getState().language === 'zh';

export const notification = {
  success: (message: string, options?: NotificationOptions) => {
    toast.success(message, {
      duration: options?.duration ?? 3000,
      description: options?.description,
      action: options?.action,
    });
  },

  error: (message: string, options?: NotificationOptions) => {
    toast.error(message, {
      duration: options?.duration ?? 4000,
      description: options?.description,
      action: options?.action,
    });
  },

  warning: (message: string, options?: NotificationOptions) => {
    toast.warning(message, {
      duration: options?.duration ?? 3500,
      description: options?.description,
      action: options?.action,
    });
  },

  info: (message: string, options?: NotificationOptions) => {
    toast.info(message, {
      duration: options?.duration ?? 3000,
      description: options?.description,
      action: options?.action,
    });
  },

  loading: (message: string) => toast.loading(message),

  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: unknown) => string);
    },
  ) => toast.promise(promise, messages),

  dismiss: (id?: string | number) => {
    toast.dismiss(id);
  },
};

export const operationNotification = {
  addSuccess: (itemName: string) => {
    notification.success(isZh() ? `${itemName}已创建` : `${itemName} created successfully`);
  },

  editSuccess: (itemName: string) => {
    notification.success(isZh() ? `${itemName}已更新` : `${itemName} updated successfully`);
  },

  deleteSuccess: (itemName: string) => {
    notification.success(isZh() ? `${itemName}已删除` : `${itemName} deleted successfully`);
  },

  batchDeleteSuccess: (count: number) => {
    notification.success(isZh() ? `已删除 ${count} 条记录` : `${count} item(s) deleted successfully`);
  },

  exportSuccess: (fileName?: string) => {
    notification.success(
      isZh()
        ? fileName
          ? `${fileName} 导出成功`
          : '数据导出成功'
        : fileName
          ? `${fileName} exported successfully`
          : 'Data exported successfully',
    );
  },

  importSuccess: (count?: number) => {
    notification.success(
      isZh()
        ? count
          ? `成功导入 ${count} 条数据`
          : '数据导入成功'
        : count
          ? `${count} row(s) imported successfully`
          : 'Data imported successfully',
    );
  },

  saveSuccess: () => {
    notification.success(isZh() ? '保存成功' : 'Saved successfully');
  },

  copySuccess: () => {
    notification.success(isZh() ? '复制成功' : 'Copied successfully');
  },

  refreshSuccess: () => {
    notification.success(isZh() ? '刷新成功' : 'Refreshed successfully');
  },

  operationFailed: (operation: string, error?: string) => {
    notification.error(isZh() ? `${operation}失败` : `${operation} failed`, { description: error });
  },

  permissionDenied: () => {
    notification.error(isZh() ? '权限不足' : 'Permission denied', {
      description: isZh()
        ? '您没有执行此操作的权限'
        : 'You do not have permission to perform this action',
    });
  },

  networkError: () => {
    notification.error(isZh() ? '网络错误' : 'Network error', {
      description: isZh() ? '请检查网络连接后重试' : 'Please check your connection and try again',
    });
  },

  validationError: (message?: string) => {
    notification.warning(message || (isZh() ? '请检查表单输入' : 'Please check the form input'), {
      description: isZh()
        ? '部分必填项缺失或格式不正确'
        : 'Some required fields are missing or invalid',
    });
  },

  confirmAction: (message: string, onConfirm: () => void) => {
    notification.info(message, {
      action: {
        label: isZh() ? '确认' : 'Confirm',
        onClick: onConfirm,
      },
    });
  },
};

export const systemNotification = {
  success: (message: string, description?: string) => {
    notification.success(message, { description });
  },

  error: (message: string, description?: string) => {
    notification.error(message, { description });
  },

  warning: (message: string, description?: string) => {
    notification.warning(message, { description });
  },

  info: (message: string, description?: string) => {
    notification.info(message, { description });
  },

  loginSuccess: (username: string) => {
    notification.success(isZh() ? `欢迎回来，${username}` : `Welcome back, ${username}`);
  },

  loginFailed: (reason?: string) => {
    notification.error(isZh() ? '登录失败' : 'Login failed', {
      description: reason || (isZh() ? '用户名或密码错误' : 'Invalid username or password'),
    });
  },

  logoutSuccess: () => {
    notification.success(isZh() ? '已安全退出登录' : 'Signed out successfully');
  },

  sessionExpired: () => {
    notification.warning(isZh() ? '登录已过期' : 'Session expired', {
      description: isZh() ? '请重新登录后继续操作' : 'Please sign in again to continue',
    });
  },

  systemMaintenance: (message?: string) => {
    notification.warning(isZh() ? '系统维护中' : 'System maintenance', {
      description: message || (isZh() ? '部分功能可能暂时不可用' : 'Some features may be temporarily unavailable'),
    });
  },

  versionUpdate: (version: string) => {
    notification.info(isZh() ? `已更新到 ${version}` : `Updated to ${version}`, {
      description: isZh() ? '请刷新页面以加载最新功能' : 'Refresh the page to load the latest features',
    });
  },
};
