/**
 * EmptyState 组件 - 空状态展示
 * 用于显示列表为空、搜索无结果等场景
 */

import { ReactNode } from 'react';
import { ThemedButton } from '../ui/ThemedButton';
import { FileQuestion, Search, Database, Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: ReactNode;
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  type?: 'default' | 'search' | 'data' | 'inbox';
  className?: string;
}

const defaultIcons = {
  default: FileQuestion,
  search: Search,
  data: Database,
  inbox: Inbox,
};

const defaultMessages = {
  default: {
    title: '暂无数据',
    description: '当前没有可显示的内容',
  },
  search: {
    title: '未找到结果',
    description: '请尝试调整搜索条件',
  },
  data: {
    title: '暂无数据',
    description: '开始添加数据以查看内容',
  },
  inbox: {
    title: '全部处理完成',
    description: '您已处理所有项目',
  },
};

export function EmptyState({
  icon,
  title,
  description,
  action,
  type = 'default',
  className = '',
}: EmptyStateProps) {
  const DefaultIcon = defaultIcons[type];
  const defaultMessage = defaultMessages[type];

  return (
    <div className={`flex flex-col items-center justify-center py-16 px-4 ${className}`}>
      <div className="w-24 h-24 rounded-full bg-muted/50 flex items-center justify-center mb-6 animate-pulse">
        {icon || <DefaultIcon className="w-12 h-12 text-muted-foreground" />}
      </div>
      
      <h3 className="text-lg font-medium text-foreground mb-2">
        {title || defaultMessage.title}
      </h3>
      
      <p className="text-sm text-muted-foreground mb-6 text-center max-w-md">
        {description || defaultMessage.description}
      </p>

      {action && (
        <ThemedButton onClick={action.onClick}>
          {action.label}
        </ThemedButton>
      )}
    </div>
  );
}
