import { Badge } from '../ui/badge';
import { Circle } from 'lucide-react';
import { useLanguageStore } from '../../stores/languageStore';

export type BadgeStatus = 'online' | 'offline' | 'warning' | 'healthy' | 'error' | 'success' | 'running' | 'failed' | 'scheduled' | 'completed';

interface StatusBadgeProps {
  status: BadgeStatus;
  customLabel?: string;
  showDot?: boolean;
}

const statusClassName: Record<BadgeStatus, string> = {
  online: 'bg-green-100 text-green-700 hover:bg-green-100 border-green-200',
  offline: 'bg-gray-100 text-gray-700 hover:bg-gray-100 border-gray-200',
  warning: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-yellow-200',
  healthy: 'bg-green-100 text-green-700 hover:bg-green-100 border-green-200',
  error: 'bg-red-100 text-red-700 hover:bg-red-100 border-red-200',
  success: 'bg-green-100 text-green-700 hover:bg-green-100 border-green-200',
  running: 'bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200',
  failed: 'bg-red-100 text-red-700 hover:bg-red-100 border-red-200',
  scheduled: 'bg-gray-100 text-gray-700 hover:bg-gray-100 border-gray-200',
  completed: 'bg-green-100 text-green-700 hover:bg-green-100 border-green-200',
};

const dotColors: Record<BadgeStatus, string> = {
  online: 'fill-green-600',
  offline: 'fill-gray-600',
  warning: 'fill-yellow-600',
  healthy: 'fill-green-600',
  error: 'fill-red-600',
  success: 'fill-green-600',
  running: 'fill-blue-600',
  failed: 'fill-red-600',
  scheduled: 'fill-gray-600',
  completed: 'fill-green-600',
};

const statusKeyMap: Record<BadgeStatus, keyof import('../../stores/languageStore').Translations['status']> = {
  online: 'online',
  offline: 'offline',
  warning: 'warning',
  healthy: 'healthy',
  error: 'error',
  success: 'success',
  running: 'running',
  failed: 'failed',
  scheduled: 'scheduled',
  completed: 'completed',
};

export function StatusBadge({ status, customLabel, showDot = true }: StatusBadgeProps) {
  const { t } = useLanguageStore();
  const className = statusClassName[status];
  const label = customLabel || t.status[statusKeyMap[status]];

  return (
    <Badge className={`${className} border flex items-center gap-1.5`}>
      {showDot && <Circle className={`w-2 h-2 ${dotColors[status]}`} />}
      {label}
    </Badge>
  );
}
