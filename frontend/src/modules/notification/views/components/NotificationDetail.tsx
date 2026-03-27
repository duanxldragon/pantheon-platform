import React from 'react';

import {
  Bell,
  CheckCircle,
  Clock,
  Copy,
  ExternalLink,
  FileText,
  User,
  X,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { useLanguage } from '@/shared/i18n/provider';
import { notification as toastNotification } from '@/shared/utils/notification';
import type { NotificationViewItem } from '../../types';

interface NotificationDetailProps {
  notification: NotificationViewItem | null;
  onClose: () => void;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}

export function NotificationDetail({ notification, onClose, onMarkAsRead, onDelete }: NotificationDetailProps) {
  const { t, currentLanguage } = useLanguage();
  const zh = currentLanguage === 'zh';

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge variant="destructive">{t('notification.priorityUrgent')}</Badge>;
      case 'high':
        return <Badge variant="destructive">{t('notification.priorityHigh')}</Badge>;
      case 'medium':
        return <Badge>{t('notification.priorityMedium')}</Badge>;
      case 'low':
        return <Badge>{t('notification.priorityLow')}</Badge>;
      default:
        return <Badge>{t('notification.priorityMedium')}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'sent') {
      return <Badge variant="outline">{t('notification.sent')}</Badge>;
    }
    if (status === 'read') {
      return <Badge variant="outline">{t('notification.read')}</Badge>;
    }
    return <Badge variant="default">{t('notification.unread')}</Badge>;
  };

  const getChannelBadge = (channel: string) => {
    switch (channel) {
      case 'system':
        return <Badge variant="outline">{t('notification.channelSystem')}</Badge>;
      case 'email':
        return <Badge variant="outline">{t('notification.channelEmail')}</Badge>;
      case 'sms':
        return <Badge variant="outline">{t('notification.channelSMS')}</Badge>;
      case 'inbox':
        return <Badge variant="outline">{t('notification.channelInbox')}</Badge>;
      default:
        return <Badge>{channel}</Badge>;
    }
  };

  if (!notification) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-lg border p-4 text-muted-foreground">
        {t('notification.selectNotification')}
      </div>
    );
  }

  return (
    <Dialog open={!!notification} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-blue-600" />
                {t('notification.notificationDetail')}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                {notification.notificationId && `ID: ${notification.notificationId}`}
              </DialogDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} aria-label={t('common.close')}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex items-center gap-4">
            {getPriorityBadge(notification.priority)}
            {getStatusBadge(notification.status)}
            {getChannelBadge(notification.channel)}
          </div>

          <Separator />

          <div className="space-y-2">
            <label className="mb-1 text-sm font-medium text-muted-foreground">
              {t('notification.title')}
            </label>
            <div className="text-xl font-semibold">{notification.title}</div>
          </div>

          <Separator />

          <div className="space-y-2">
            <label className="mb-1 text-sm font-medium text-muted-foreground">
              {t('notification.content')}
            </label>
            <div className="rounded-lg bg-muted p-4">
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{notification.content}</p>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <DetailRow icon={<Clock className="mr-2 h-4 w-4" />} label={t('notification.sentAt')} value={notification.sentAt || '-'} />
            <DetailRow icon={<Clock className="mr-2 h-4 w-4" />} label={t('notification.readAt')} value={notification.readAt || '-'} />
            <DetailRow icon={<User className="mr-2 h-4 w-4" />} label={t('notification.sender')} value={notification.senderId || '-'} />
            <DetailRow icon={<FileText className="mr-2 h-4 w-4" />} label={t('notification.template')} value={notification.templateId || '-'} />
            <DetailRow icon={<Clock className="mr-2 h-4 w-4" />} label={t('notification.createdAt')} value={notification.createdAt} />
          </div>

          {notification.extraData && (
            <>
              <Separator />
              <div className="space-y-2">
                <label className="mb-1 text-sm font-medium text-muted-foreground">
                  <ExternalLink className="mr-2 inline h-4 w-4" />
                  {t('notification.extraData')}
                </label>
                <ExtraDataBlock data={notification.extraData} />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(notification.extraData!);
                    toastNotification.success(zh ? '附加数据已复制' : 'Extra data copied');
                  }}
                  className="mt-2"
                >
                  <Copy className="mr-2 h-4 w-4" />
                  {t('common.copy', zh ? '复制' : 'Copy')}
                </Button>
              </div>
            </>
          )}

          {!notification.isSentView && (
            <div className="flex justify-end gap-3 border-t pt-4">
              {notification.status === 'unread' && (
                <Button onClick={() => onMarkAsRead(notification.inboxId)}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  {t('notification.markAsRead')}
                </Button>
              )}
              <Button
                variant="destructive"
                onClick={() => {
                  if (confirm(t('notification.deleteConfirm', { name: notification.title }))) {
                    onDelete(notification.inboxId);
                  }
                }}
              >
                {t('common.delete')}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div>
      <label className="mb-2 flex items-center text-sm font-medium text-muted-foreground">
        {icon}
        {label}
      </label>
      <div className="break-words text-sm">{value}</div>
    </div>
  );
}

function ExtraDataBlock({ data }: { data: string }) {
  try {
    const parsed = JSON.parse(data);
    return (
      <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-xs">
        {JSON.stringify(parsed, null, 2)}
      </pre>
    );
  } catch {
    return (
      <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-xs">
        {data}
      </pre>
    );
  }
}
