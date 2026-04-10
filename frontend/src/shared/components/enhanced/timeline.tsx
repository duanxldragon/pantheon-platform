/**
 * Timeline 组件 - 时间轴
 * 用于显示操作历史、流程步骤等
 */

import { ReactNode } from 'react';
import { CheckCircle2, Circle, Clock, XCircle } from 'lucide-react';
import { useThemeStore } from '../../../stores/theme_store';
import { colorTokens } from '../../design/tokens';

export interface TimelineItem {
  id: string;
  title: string;
  description?: string;
  time?: string;
  status?: 'pending' | 'processing' | 'success' | 'error';
  icon?: ReactNode;
  content?: ReactNode;
}

interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

const statusIcons = {
  pending: Circle,
  processing: Clock,
  success: CheckCircle2,
  error: XCircle,
};

const statusColors = {
  pending: '#9ca3af',
  processing: colorTokens.status.info.light,
  success: colorTokens.status.success.light,
  error: colorTokens.status.error.light,
};

export function Timeline({ items, className = '' }: TimelineProps) {
  const { theme } = useThemeStore();

  return (
    <div className={`space-y-4 ${className}`}>
      {items.map((item, index) => {
        const Icon = item.icon || statusIcons[item.status || 'pending'];
        const isLast = index === items.length - 1;

        return (
          <div key={item.id} className="flex gap-4">
            {/* 时间轴线 */}
            <div className="flex flex-col items-center">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  backgroundColor: statusColors[item.status || 'pending'] + '20',
                }}
              >
                {typeof Icon === 'function' ? (
                  <Icon
                    className="w-4 h-4"
                    style={{ color: statusColors[item.status || 'pending'] }}
                  />
                ) : (
                  Icon
                )}
              </div>
              {!isLast && (
                <div
                  className="w-0.5 flex-1 mt-2"
                  style={{
                    backgroundColor: theme.colors.border,
                    minHeight: '24px',
                  }}
                />
              )}
            </div>

            {/* 内容区 */}
            <div className="flex-1 pb-8">
              <div className="flex items-start justify-between gap-4 mb-1">
                <h4
                  className="font-medium"
                  style={{ color: theme.colors.text }}
                >
                  {item.title}
                </h4>
                {item.time && (
                  <span
                    className="text-sm flex-shrink-0"
                    style={{ color: theme.colors.textSecondary }}
                  >
                    {item.time}
                  </span>
                )}
              </div>

              {item.description && (
                <p
                  className="text-sm mb-2"
                  style={{ color: theme.colors.textSecondary }}
                >
                  {item.description}
                </p>
              )}

              {item.content && <div className="mt-3">{item.content}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * 水平时间轴
 */
export function HorizontalTimeline({ items, className = '' }: TimelineProps) {
  const { theme } = useThemeStore();

  return (
    <div className={`flex items-start justify-between ${className}`}>
      {items.map((item, index) => {
        const Icon = item.icon || statusIcons[item.status || 'pending'];
        const isLast = index === items.length - 1;

        return (
          <div key={item.id} className="flex items-start gap-2 flex-1">
            <div className="flex flex-col items-center w-full">
              {/* 图标 */}
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center mb-2"
                style={{
                  backgroundColor: statusColors[item.status || 'pending'] + '20',
                }}
              >
                {typeof Icon === 'function' ? (
                  <Icon
                    className="w-5 h-5"
                    style={{ color: statusColors[item.status || 'pending'] }}
                  />
                ) : (
                  Icon
                )}
              </div>

              {/* 连接线 */}
              {!isLast && (
                <div
                  className="h-0.5 w-full absolute left-1/2 top-5"
                  style={{
                    backgroundColor: theme.colors.border,
                  }}
                />
              )}

              {/* 标题 */}
              <h4
                className="text-sm font-medium text-center mb-1"
                style={{ color: theme.colors.text }}
              >
                {item.title}
              </h4>

              {/* 描述 */}
              {item.description && (
                <p
                  className="text-xs text-center"
                  style={{ color: theme.colors.textSecondary }}
                >
                  {item.description}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
