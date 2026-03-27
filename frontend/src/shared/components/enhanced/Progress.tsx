/**
 * Progress 组件 - 进度条
 * 用于显示任务进度、加载状态等
 */

import { ReactNode } from 'react';
import { useThemeStore } from '../../../stores/themeStore';
import { colorTokens } from '../../design/tokens';

interface ProgressProps {
  percent: number;
  showInfo?: boolean;
  status?: 'normal' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
  strokeColor?: string;
  trailColor?: string;
  className?: string;
}

const statusColors = {
  normal: colorTokens.gradients.primary,
  success: colorTokens.gradients.success,
  warning: colorTokens.gradients.warning,
  error: colorTokens.gradients.error,
};

const sizeStyles = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
};

export function Progress({
  percent,
  showInfo = true,
  status = 'normal',
  size = 'md',
  strokeColor,
  trailColor,
  className = '',
}: ProgressProps) {
  const { theme } = useThemeStore();
  const safePercent = Math.min(Math.max(percent, 0), 100);

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div
        className={`flex-1 rounded-full overflow-hidden ${sizeStyles[size]}`}
        style={{
          backgroundColor: trailColor || theme.colors.border,
        }}
      >
        <div
          className={`h-full transition-all duration-300 ease-out rounded-full`}
          style={{
            width: `${safePercent}%`,
            background: strokeColor || statusColors[status],
          }}
        />
      </div>
      
      {showInfo && (
        <span
          className="text-sm font-medium flex-shrink-0 min-w-12 text-right"
          style={{ color: theme.colors.text }}
        >
          {safePercent}%
        </span>
      )}
    </div>
  );
}

/**
 * 圆形进度条
 */
export function CircleProgress({
  percent,
  size = 120,
  strokeWidth = 8,
  status = 'normal',
  children,
  className = '',
}: {
  percent: number;
  size?: number;
  strokeWidth?: number;
  status?: 'normal' | 'success' | 'warning' | 'error';
  children?: ReactNode;
  className?: string;
}) {
  const { theme } = useThemeStore();
  const safePercent = Math.min(Math.max(percent, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (safePercent / 100) * circumference;

  const gradientId = `gradient-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={`relative inline-flex ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colorTokens.status[status === 'normal' ? 'info' : status].light} />
            <stop offset="100%" stopColor={colorTokens.status[status === 'normal' ? 'info' : status].dark} />
          </linearGradient>
        </defs>
        
        {/* 背景圆 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={theme.colors.border}
          strokeWidth={strokeWidth}
        />
        
        {/* 进度圆 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-300 ease-out"
        />
      </svg>
      
      {/* 中心内容 */}
      <div className="absolute inset-0 flex items-center justify-center">
        {children || (
          <span className="text-2xl font-semibold" style={{ color: theme.colors.text }}>
            {safePercent}%
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * 步骤进度条
 */
export function StepsProgress({
  steps,
  current,
  className = '',
}: {
  steps: { title: string; description?: string }[];
  current: number;
  className?: string;
}) {
  const { theme } = useThemeStore();

  return (
    <div className={`flex items-start ${className}`}>
      {steps.map((step, index) => {
        const isActive = index === current;
        const isCompleted = index < current;

        return (
          <div key={index} className="flex-1 flex items-start gap-2">
            <div className="flex flex-col items-center">
              {/* 步骤圆圈 */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-medium text-sm transition-all ${
                  isCompleted || isActive ? 'text-white' : ''
                }`}
                style={{
                  background: isCompleted || isActive ? colorTokens.gradients.primary : theme.colors.border,
                  color: isCompleted || isActive ? '#ffffff' : theme.colors.textSecondary,
                }}
              >
                {index + 1}
              </div>

              {/* 连接线 */}
              {index < steps.length - 1 && (
                <div
                  className="h-0.5 w-full mt-4"
                  style={{
                    backgroundColor: isCompleted ? theme.colors.primary : theme.colors.border,
                  }}
                />
              )}
            </div>

            {/* 步骤信息 */}
            <div className="ml-3 flex-1">
              <h4
                className="font-medium text-sm"
                style={{
                  color: isActive ? theme.colors.primary : theme.colors.text,
                }}
              >
                {step.title}
              </h4>
              {step.description && (
                <p className="text-xs mt-1" style={{ color: theme.colors.textSecondary }}>
                  {step.description}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
