/**
 * Badge 组件 - 徽章标签
 * 用于状态标记、计数等场景
 */

import { ReactNode } from 'react';
import { X } from 'lucide-react';
import { colorTokens } from '../../design/tokens';

interface BadgeProps {
  children: ReactNode;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'default' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
  closable?: boolean;
  onClose?: () => void;
  className?: string;
}

const variantStyles = {
  success: {
    bg: colorTokens.status.success.bg,
    text: colorTokens.status.success.text,
    border: colorTokens.status.success.light,
  },
  warning: {
    bg: colorTokens.status.warning.bg,
    text: colorTokens.status.warning.text,
    border: colorTokens.status.warning.light,
  },
  error: {
    bg: colorTokens.status.error.bg,
    text: colorTokens.status.error.text,
    border: colorTokens.status.error.light,
  },
  info: {
    bg: colorTokens.status.info.bg,
    text: colorTokens.status.info.text,
    border: colorTokens.status.info.light,
  },
  default: {
    bg: '#f3f4f6',
    text: '#374151',
    border: '#d1d5db',
  },
  outline: {
    bg: 'transparent',
    text: '#374151',
    border: '#d1d5db',
  },
};

const sizeStyles = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base',
};

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  closable = false,
  onClose,
  className = '',
}: BadgeProps) {
  const styles = variantStyles[variant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium transition-all ${sizeStyles[size]} ${className}`}
      style={{
        backgroundColor: styles.bg,
        color: styles.text,
        border: variant === 'outline' ? `1px solid ${styles.border}` : 'none',
      }}
    >
      {dot && (
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: styles.border }}
        />
      )}
      {children}
      {closable && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose?.();
          }}
          className="ml-1 hover:bg-black/10 rounded-full p-0.5 transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  );
}

/**
 * 计数徽章
 */
export function CountBadge({
  count,
  max = 99,
  variant = 'error',
  className = '',
}: {
  count: number;
  max?: number;
  variant?: 'success' | 'warning' | 'error' | 'info';
  className?: string;
}) {
  const styles = variantStyles[variant];
  const displayCount = count > max ? `${max}+` : count;

  if (count === 0) return null;

  return (
    <span
      className={`inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full text-xs font-medium ${className}`}
      style={{
        backgroundColor: styles.border,
        color: '#ffffff',
      }}
    >
      {displayCount}
    </span>
  );
}

/**
 * 点状徽章（用于头像等）
 */
export function DotBadge({
  status = 'success',
  position = 'top-right',
  className = '',
}: {
  status?: 'success' | 'warning' | 'error' | 'info';
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  className?: string;
}) {
  const styles = variantStyles[status];

  const positionStyles = {
    'top-right': 'top-0 right-0',
    'top-left': 'top-0 left-0',
    'bottom-right': 'bottom-0 right-0',
    'bottom-left': 'bottom-0 left-0',
  };

  return (
    <span
      className={`absolute w-3 h-3 rounded-full border-2 border-white ${positionStyles[position]} ${className}`}
      style={{ backgroundColor: styles.border }}
    />
  );
}
