/**
 * Alert 组件 - 警告提示
 * 用于显示重要的提示信息
 */

import { ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Info, XCircle, X } from 'lucide-react';
import { colorTokens } from '../../design/tokens';

interface AlertProps {
  type?: 'success' | 'warning' | 'error' | 'info';
  title?: string;
  message: string;
  icon?: ReactNode;
  closable?: boolean;
  onClose?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

const defaultIcons = {
  success: CheckCircle2,
  warning: AlertCircle,
  error: XCircle,
  info: Info,
};

const colorConfig = {
  success: {
    bg: colorTokens.status.success.bg,
    border: colorTokens.status.success.light,
    text: colorTokens.status.success.text,
    icon: colorTokens.status.success.light,
  },
  warning: {
    bg: colorTokens.status.warning.bg,
    border: colorTokens.status.warning.light,
    text: colorTokens.status.warning.text,
    icon: colorTokens.status.warning.light,
  },
  error: {
    bg: colorTokens.status.error.bg,
    border: colorTokens.status.error.light,
    text: colorTokens.status.error.text,
    icon: colorTokens.status.error.light,
  },
  info: {
    bg: colorTokens.status.info.bg,
    border: colorTokens.status.info.light,
    text: colorTokens.status.info.text,
    icon: colorTokens.status.info.light,
  },
};

export function Alert({
  type = 'info',
  title,
  message,
  icon,
  closable = false,
  onClose,
  action,
  className = '',
}: AlertProps) {
  const DefaultIcon = defaultIcons[type];
  const colors = colorConfig[type];

  return (
    <div
      className={`rounded-lg border-l-4 p-4 ${className}`}
      style={{
        backgroundColor: colors.bg,
        borderLeftColor: colors.border,
      }}
    >
      <div className="flex items-start gap-3">
        {/* 图标 */}
        <div className="flex-shrink-0 mt-0.5">
          {icon || <DefaultIcon className="w-5 h-5" style={{ color: colors.icon }} />}
        </div>

        {/* 内容 */}
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className="font-medium mb-1" style={{ color: colors.text }}>
              {title}
            </h4>
          )}
          <p className="text-sm" style={{ color: colors.text }}>
            {message}
          </p>

          {/* 操作按钮 */}
          {action && (
            <button
              onClick={action.onClick}
              className="mt-3 text-sm font-medium underline hover:no-underline transition-all"
              style={{ color: colors.border }}
            >
              {action.label}
            </button>
          )}
        </div>

        {/* 关闭按钮 */}
        {closable && (
          <button
            onClick={onClose}
            className="flex-shrink-0 p-1 rounded hover:bg-black/5 transition-colors"
            style={{ color: colors.text }}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * 内联警告
 */
export function InlineAlert({
  type = 'info',
  message,
  className = '',
}: {
  type?: 'success' | 'warning' | 'error' | 'info';
  message: string;
  className?: string;
}) {
  const DefaultIcon = defaultIcons[type];
  const colors = colorConfig[type];

  return (
    <div className={`flex items-center gap-2 text-sm ${className}`}>
      <DefaultIcon className="w-4 h-4 flex-shrink-0" style={{ color: colors.icon }} />
      <span style={{ color: colors.text }}>{message}</span>
    </div>
  );
}
