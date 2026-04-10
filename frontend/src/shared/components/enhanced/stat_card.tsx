/**
 * StatCard 组件 - 数据统计卡片
 * 用于展示关键指标和统计数据
 */

import { ReactNode } from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { ThemedCard } from '../ui/themed_card';
import { useThemeStore } from '../../../stores/theme_store';
import { colorTokens } from '../../design/tokens';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  iconColor?: 'primary' | 'success' | 'warning' | 'error' | 'info';
  trend?: {
    value: string;
    direction: 'up' | 'down';
    label?: string;
  };
  description?: string;
  extra?: ReactNode;
  onClick?: () => void;
  loading?: boolean;
  className?: string;
}

const iconColorMap = {
  primary: colorTokens.gradients.primary,
  success: colorTokens.gradients.success,
  warning: colorTokens.gradients.warning,
  error: colorTokens.gradients.error,
  info: colorTokens.gradients.info,
};

export function StatCard({
  title,
  value,
  icon: Icon,
  iconColor = 'primary',
  trend,
  description,
  extra,
  onClick,
  loading = false,
  className = '',
}: StatCardProps) {
  const { theme } = useThemeStore();

  if (loading) {
    return (
      <ThemedCard className={`p-6 ${className}`}>
        <div className="space-y-3">
          <div className="h-4 w-24 bg-muted rounded animate-pulse" />
          <div className="h-8 w-32 bg-muted rounded animate-pulse" />
          <div className="h-3 w-20 bg-muted rounded animate-pulse" />
        </div>
      </ThemedCard>
    );
  }

  return (
    <ThemedCard
      className={`p-6 transition-all duration-300 ${onClick ? 'cursor-pointer hover:shadow-lg hover:scale-105' : ''} ${className}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* 标题 */}
          <p
            className="text-sm mb-2"
            style={{ color: theme.colors.textSecondary }}
          >
            {title}
          </p>

          {/* 数值 */}
          <p
            className="text-3xl font-semibold mb-2"
            style={{ color: theme.colors.text }}
          >
            {value}
          </p>

          {/* 趋势 */}
          {trend && (
            <div className="flex items-center gap-1 text-sm">
              {trend.direction === 'up' ? (
                <TrendingUp className="w-4 h-4 text-green-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500" />
              )}
              <span className={trend.direction === 'up' ? 'text-green-500' : 'text-red-500'}>
                {trend.value}
              </span>
              {trend.label && (
                <span style={{ color: theme.colors.textSecondary }}>
                  {trend.label}
                </span>
              )}
            </div>
          )}

          {/* 描述 */}
          {description && (
            <p
              className="text-sm mt-2"
              style={{ color: theme.colors.textSecondary }}
            >
              {description}
            </p>
          )}

          {/* 额外内容 */}
          {extra && <div className="mt-4">{extra}</div>}
        </div>

        {/* 图标 */}
        {Icon && (
          <div
            className="p-3 rounded-xl shadow-sm flex-shrink-0"
            style={{ background: iconColorMap[iconColor] }}
          >
            <Icon className="w-6 h-6 text-white" />
          </div>
        )}
      </div>
    </ThemedCard>
  );
}

/**
 * 简化版统计卡片
 */
export function SimpleStatCard({
  label,
  value,
  className = '',
}: {
  label: string;
  value: string | number;
  className?: string;
}) {
  const { theme } = useThemeStore();

  return (
    <div
      className={`p-4 rounded-lg border ${className}`}
      style={{
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border,
      }}
    >
      <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
        {label}
      </p>
      <p className="text-2xl font-semibold mt-1" style={{ color: theme.colors.text }}>
        {value}
      </p>
    </div>
  );
}
