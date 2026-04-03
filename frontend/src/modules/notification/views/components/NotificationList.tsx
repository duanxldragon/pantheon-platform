import React from 'react';

import {
  AlertCircle,
  Bell,
  Check,
  CheckCircle,
  Clock,
  Inbox,
  Trash2,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLanguageStore } from '@/stores/languageStore';
import type { AppTranslations } from '@/stores/languageStore';
import type { NotificationViewItem, NotificationViewStatus } from '../../types';

interface NotificationListProps {
  notifications: NotificationViewItem[];
  viewMode: 'inbox' | 'sent';
  loading?: boolean;
  onMarkAsRead: (ids: string[]) => void;
  onDelete: (id: string) => void;
  onNotificationClick: (notification: NotificationViewItem) => void;
}

const statusLabel = (status: NotificationViewStatus, t: AppTranslations) => {
  if (status === 'sent') {
    return t.notification.sent;
  }
  return status === 'read' ? t.notification.read : t.notification.unread;
};

const channelLabel = (channel: NotificationViewItem['channel'], t: AppTranslations) => {
  switch (channel) {
    case 'system':
      return t.notification.channelSystem;
    case 'email':
      return t.notification.channelEmail;
    case 'sms':
      return t.notification.channelSMS;
    case 'inbox':
      return t.notification.channelInbox;
    default:
      return channel;
  }
};

export function NotificationList({
  notifications,
  viewMode,
  loading = false,
  onMarkAsRead,
  onDelete,
  onNotificationClick,
}: NotificationListProps) {
  const { t } = useLanguageStore();
  const [filter, setFilter] = React.useState<'all' | 'unread'>('all');

  const filteredNotifications = React.useMemo(() => {
    if (viewMode === 'sent') {
      return notifications;
    }
    if (filter === 'unread') {
      return notifications.filter((item) => item.status === 'unread');
    }
    return notifications;
  }, [notifications, filter, viewMode]);

  const unreadCount = notifications.filter((item) => item.status === 'unread').length;
  const allowInboxActions = viewMode === 'inbox';

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'high':
        return <Bell className="h-4 w-4 text-red-500" />;
      case 'medium':
        return <Bell className="h-4 w-4 text-yellow-500" />;
      case 'low':
        return <Bell className="h-4 w-4 text-blue-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge variant="destructive">{t.notification.priorityUrgent}</Badge>;
      case 'high':
        return <Badge variant="destructive">{t.notification.priorityHigh}</Badge>;
      case 'medium':
        return <Badge>{t.notification.priorityMedium}</Badge>;
      case 'low':
        return <Badge>{t.notification.priorityLow}</Badge>;
      default:
        return <Badge>{t.notification.priorityMedium}</Badge>;
    }
  };

  return (
    <Card className="w-full">
      <div className="flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold">{t.notification.notifications}</h2>
          {allowInboxActions && (
            <Select value={filter} onValueChange={(value: 'all' | 'unread') => setFilter(value)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.notification.all}</SelectItem>
                <SelectItem value="unread">
                  {t.notification.unread}
                  {unreadCount > 0 && <Badge className="ml-2">{unreadCount}</Badge>}
                </SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
        {allowInboxActions && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const unreadIds = notifications
                .filter((item) => item.status === 'unread')
                .map((item) => item.inboxId);
              onMarkAsRead(unreadIds);
            }}
            disabled={unreadCount === 0}
          >
            <Check className="mr-2 h-4 w-4" />
            {t.notification.markAllAsRead}
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-transparent border-primary-foreground" />
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Inbox className="mb-4 h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">{t.notification.noNotifications}</p>
        </div>
      ) : (
        <div className="divide-y">
          {filteredNotifications.map((notification) => (
            <div
              key={notification.inboxId}
              className="cursor-pointer border-l-2 p-4 transition-colors hover:bg-accent"
              onClick={() => onNotificationClick(notification)}
            >
              <div className="flex items-start gap-3">
                <div className="mt-1">{getPriorityIcon(notification.priority)}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className={`font-medium ${notification.status === 'unread' ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {notification.title}
                      </h3>
                      {getPriorityBadge(notification.priority)}
                    </div>
                    <span className={`rounded px-2 py-0.5 text-xs ${notification.status === 'read' ? 'bg-green-100 text-green-800' : notification.status === 'unread' ? 'bg-gray-100 text-gray-800' : 'bg-blue-100 text-blue-800'}`}>
                      {statusLabel(notification.status, t)}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{notification.sentAt}</span>
                    <span className="rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-800">
                      {channelLabel(notification.channel, t)}
                    </span>
                  </div>

                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{notification.content}</p>
                </div>
              </div>

              {allowInboxActions && (
                <div className="mt-2 flex gap-2">
                  {notification.status === 'unread' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(event) => {
                        event.stopPropagation();
                        onMarkAsRead([notification.inboxId]);
                      }}
                      aria-label={t.notification.markAsRead}
                      title={t.notification.markAsRead}
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(event) => {
                      event.stopPropagation();
                      onDelete(notification.inboxId);
                    }}
                    aria-label={t.common.delete}
                    title={t.common.delete}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
