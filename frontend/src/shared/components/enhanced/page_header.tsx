/**
 * PageHeader 组件 - 页面头部
 * 统一的页面标题、描述和操作按钮区域
 */

import { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';
import { useThemeStore } from '../../../stores/theme_store';

interface Breadcrumb {
  label: string;
  onClick?: () => void;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  breadcrumbs?: Breadcrumb[];
  actions?: ReactNode;
  extra?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  icon,
  breadcrumbs,
  actions,
  extra,
  className = '',
}: PageHeaderProps) {
  const { theme } = useThemeStore();

  return (
    <div
      className={`border-b pb-6 mb-6 ${className}`}
      style={{ borderColor: theme.colors.border }}
    >
      {/* 面包屑导航 */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <div className="flex items-center gap-2 mb-4 text-sm">
          {breadcrumbs.map((crumb, index) => (
            <div key={index} className="flex items-center gap-2">
              {index > 0 && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
              {crumb.onClick ? (
                <button
                  onClick={crumb.onClick}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {crumb.label}
                </button>
              ) : (
                <span className="text-foreground">{crumb.label}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 标题区域 */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1">
          {icon && (
            <div
              className="p-3 rounded-xl shadow-sm"
              style={{
                background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.primaryDark})`,
              }}
            >
              {icon}
            </div>
          )}
          
          <div className="flex-1">
            <h1
              className="text-2xl font-semibold mb-2"
              style={{ color: theme.colors.text }}
            >
              {title}
            </h1>
            
            {description && (
              <p
                className="text-sm max-w-2xl"
                style={{ color: theme.colors.textSecondary }}
              >
                {description}
              </p>
            )}
            
            {extra && <div className="mt-4">{extra}</div>}
          </div>
        </div>

        {/* 操作按钮区域 */}
        {actions && (
          <div className="flex items-center gap-3 flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
