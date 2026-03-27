import React, { useEffect, useMemo, useState } from 'react';

import {
  AlertCircle,
  Check,
  CheckCheck,
  Clock,
  FileText,
  Inbox,
  Send,
  Trash2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/shared/i18n/provider';
import { notification as toastNotification } from '@/shared/utils/notification';
import { notificationApi, type Notification } from '../api/notificationApi';
import type { NotificationViewItem } from '../types';
import { NotificationDetail } from './components/NotificationDetail';
import { NotificationList } from './components/NotificationList';

type NotificationFilter = 'all' | 'unread' | 'sent';
type ViewMode = 'inbox' | 'sent';

const defaultStats = {
  total: 0,
  unread: 0,
  read: 0,
  sentToday: 0,
  sentWeek: 0,
};

export function NotificationCenter() {
  const { t, currentLanguage } = useLanguage();
  const zh = currentLanguage === 'zh';
  const [activeTab, setActiveTab] = useState<'notifications' | 'templates'>('notifications');
  const [filter, setFilter] = useState<NotificationFilter>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('inbox');
  const [notifications, setNotifications] = useState<NotificationViewItem[]>([]);
  const [selectedNotification, setSelectedNotification] = useState<NotificationViewItem | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [templates, setTemplates] = useState<any[]>([]);
  const [stats, setStats] = useState(defaultStats);
  const [loading, setLoading] = useState(false);

  const readInboxItems = useMemo(
    () => notifications.filter((item) => item.status === 'read'),
    [notifications],
  );

  const mapInboxItem = (item: any): NotificationViewItem => {
    const base = item.notification as Notification | undefined;
    return {
      inboxId: item.id,
      notificationId: item.notificationId,
      title: base?.title || t('notification.defaultTitle', zh ? '系统通知' : 'System Notification'),
      content: base?.content || '',
      channel: (base?.channel as NotificationViewItem['channel']) || 'system',
      priority: (base?.priority as NotificationViewItem['priority']) || 'medium',
      status: item.isRead ? 'read' : 'unread',
      sentAt: base?.sentAt || item.readAt || item.createdAt,
      createdAt: item.createdAt,
      readAt: item.readAt,
      templateId: base?.templateId,
      extraData: base?.extraData,
      receiverId: item.receiverId,
      senderId: base?.senderId,
      tenantId: base?.tenantId,
    };
  };

  const mapSentNotification = (item: Notification): NotificationViewItem => ({
    inboxId: item.id,
    notificationId: item.id,
    title: item.title,
    content: item.content,
    channel: item.channel,
    priority: item.priority,
    status: 'sent',
    sentAt: item.sentAt || item.createdAt,
    createdAt: item.createdAt,
    templateId: item.templateId,
    extraData: item.extraData,
    senderId: item.senderId,
    tenantId: item.tenantId,
    isSentView: true,
  });

  const handleTabChange = (tab: 'notifications' | 'templates') => {
    setActiveTab(tab);
    if (tab === 'notifications') {
      void loadNotifications(filter);
    } else {
      void loadTemplates();
    }
  };

  const handleFilterChange = (newFilter: NotificationFilter) => {
    setFilter(newFilter);
    void loadNotifications(newFilter);
  };

  const loadUnreadCount = async () => {
    try {
      const count = await notificationApi.getUnreadCount();
      if (viewMode === 'inbox') {
        setUnreadCount(count);
      }
    } catch (error) {
      console.error('Failed to load unread count:', error);
    }
  };

  const loadNotifications = async (currentFilter: NotificationFilter = filter) => {
    try {
      if (currentFilter === 'sent') {
        setViewMode('sent');
        const { items } = await notificationApi.listNotifications({ status: 'sent', pageSize: 20 });
        setNotifications(items.map(mapSentNotification));
        setSelectedNotification(null);
        return;
      }

      setViewMode('inbox');
      const { items } = await notificationApi.listInbox({
        isRead: currentFilter === 'unread' ? false : undefined,
        pageSize: 20,
      });
      const mapped = items.map(mapInboxItem);
      setNotifications(mapped);
      setUnreadCount(mapped.filter((item) => item.status === 'unread').length);
      setSelectedNotification((current) =>
        current ? mapped.find((item) => item.inboxId === current.inboxId) ?? null : null,
      );
    } catch (error) {
      console.error('Failed to load notifications:', error);
      toastNotification.error(zh ? '加载通知失败' : 'Failed to load notifications');
    }
  };

  const loadTemplates = async () => {
    try {
      const { items } = await notificationApi.listTemplates();
      setTemplates(items);
    } catch (error) {
      console.error('Failed to load templates:', error);
      toastNotification.error(zh ? '加载通知模板失败' : 'Failed to load templates');
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await notificationApi.getStats();
      setStats({
        total: statsData.total,
        unread: statsData.unread,
        read: statsData.read,
        sentToday: statsData.sentToday,
        sentWeek: statsData.sentWeek,
      });
      if (viewMode === 'inbox') {
        setUnreadCount(statsData.unread);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleMarkAsRead = async (ids: string[]) => {
    if (viewMode !== 'inbox' || ids.length === 0) {
      return;
    }

    try {
      await notificationApi.markAsRead(ids);
      setNotifications((prev) =>
        prev.map((item) => (ids.includes(item.inboxId) ? { ...item, status: 'read' } : item)),
      );
      setUnreadCount((prev) => Math.max(0, prev - ids.length));
      void loadStats();
    } catch (error) {
      console.error('Failed to mark as read:', error);
      toastNotification.error(zh ? '标记已读失败' : 'Failed to mark notifications as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    if (viewMode !== 'inbox') {
      return;
    }

    try {
      await notificationApi.markAllAsRead();
      setNotifications((prev) => prev.map((item) => ({ ...item, status: 'read' })));
      setUnreadCount(0);
      void loadStats();
      toastNotification.success(zh ? '已全部标记为已读' : 'All notifications marked as read');
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      toastNotification.error(zh ? '全部标记已读失败' : 'Failed to mark all as read');
    }
  };

  const handleClearRead = async () => {
    if (viewMode !== 'inbox' || readInboxItems.length === 0) {
      return;
    }

    try {
      const results = await Promise.allSettled(
        readInboxItems.map((item) => notificationApi.deleteInboxItem(item.inboxId)),
      );

      const successCount = results.filter((result) => result.status === 'fulfilled').length;
      if (successCount === 0) {
        toastNotification.error(zh ? '清理已读通知失败' : 'Failed to clear read notifications');
        return;
      }

      const deletedIds = new Set(
        readInboxItems
          .filter((_, index) => results[index]?.status === 'fulfilled')
          .map((item) => item.inboxId),
      );

      setNotifications((prev) => prev.filter((item) => !deletedIds.has(item.inboxId)));
      setSelectedNotification((current) =>
        current && deletedIds.has(current.inboxId) ? null : current,
      );
      void loadStats();

      toastNotification.success(
        zh ? `已清理 ${successCount} 条已读通知` : `${successCount} read notifications cleared`,
      );
    } catch (error) {
      console.error('Failed to clear read notifications:', error);
      toastNotification.error(zh ? '清理已读通知失败' : 'Failed to clear read notifications');
    }
  };

  const handleDelete = async (id: string) => {
    if (viewMode !== 'inbox') {
      return;
    }

    try {
      await notificationApi.deleteInboxItem(id);
      setNotifications((prev) => prev.filter((item) => item.inboxId !== id));
      setSelectedNotification((current) => (current?.inboxId === id ? null : current));
      void loadStats();
    } catch (error) {
      console.error('Failed to delete notification:', error);
      toastNotification.error(zh ? '删除通知失败' : 'Failed to delete notification');
    }
  };

  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      try {
        await Promise.all([loadNotifications(), loadStats(), loadUnreadCount()]);
      } catch (error) {
        console.error('Failed to load initial data:', error);
      } finally {
        setLoading(false);
      }
    };

    void initData();
  }, []);

  const channelLabel = (channel: string) => {
    switch (channel) {
      case 'system':
        return t('notification.channelSystem');
      case 'email':
        return t('notification.channelEmail');
      case 'sms':
        return t('notification.channelSMS');
      case 'inbox':
        return t('notification.channelInbox');
      default:
        return channel;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {t('notification.title', zh ? '通知中心' : 'Notification Center')}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('navigation.profile')} - {t('notification.notifications')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => void loadNotifications(filter)}>
            <Clock className="mr-2 h-4 w-4" />
            {t('common.refresh')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              <Inbox className="mr-2 h-4 w-4 text-blue-600" />
              {t('notification.total')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
            <CardDescription className="text-xs text-muted-foreground">
              {t('notification.allNotifications')}
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              <Inbox className="mr-2 h-4 w-4 text-blue-600" />
              {t('notification.unread')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats.unread}</div>
            <CardDescription className="text-xs text-muted-foreground">
              {t('notification.unreadNotifications')}
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              <CheckCheck className="mr-2 h-4 w-4 text-green-600" />
              {t('notification.read')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.read}</div>
            <CardDescription className="text-xs text-muted-foreground">
              {t('notification.readNotifications')}
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              <Send className="mr-2 h-4 w-4 text-purple-600" />
              {t('notification.sentToday')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{stats.sentToday}</div>
            <CardDescription className="text-xs text-muted-foreground">
              {t('notification.sentTodayNotifications')}
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              <Send className="mr-2 h-4 w-4 text-orange-600" />
              {t('notification.sentWeek')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{stats.sentWeek}</div>
            <CardDescription className="text-xs text-muted-foreground">
              {t('notification.sentWeekNotifications')}
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="mt-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="notifications">
            <Inbox className="mr-2 h-4 w-4" />
            {t('notification.notifications')}
          </TabsTrigger>
          <TabsTrigger value="templates">
            <FileText className="mr-2 h-4 w-4" />
            {t('notification.templates')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="space-y-4">
          <div className="mb-4 flex flex-wrap gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleFilterChange('all')}
            >
              {t('notification.all')}
            </Button>
            <Button
              variant={filter === 'unread' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleFilterChange('unread')}
              disabled={viewMode === 'sent'}
            >
              {t('notification.unread')}
            </Button>
            <Button
              variant={filter === 'sent' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleFilterChange('sent')}
            >
              {t('notification.sent')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void handleMarkAllAsRead()}
              disabled={viewMode !== 'inbox' || unreadCount === 0}
            >
              <Check className="mr-2 h-4 w-4" />
              {t('notification.markAllAsRead')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void handleClearRead()}
              disabled={viewMode !== 'inbox' || readInboxItems.length === 0}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {t('notification.clearRead')}
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <NotificationList
                notifications={notifications}
                loading={loading}
                viewMode={viewMode}
                onMarkAsRead={handleMarkAsRead}
                onDelete={handleDelete}
                onNotificationClick={(item) => setSelectedNotification(item)}
              />
            </div>

            <div className="flex-1">
              <NotificationDetail
                notification={selectedNotification}
                onClose={() => setSelectedNotification(null)}
                onMarkAsRead={(id) => void handleMarkAsRead([id])}
                onDelete={(id) => void handleDelete(id)}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          {templates.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <AlertCircle className="mb-4 h-10 w-10 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {zh ? '暂无通知模板' : 'No notification templates'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {templates.map((template) => (
                <Card key={template.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-blue-600" />
                      {template.name}
                    </CardTitle>
                    <CardDescription>{template.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="text-xs uppercase text-muted-foreground">
                      {t('notification.channel')}
                    </div>
                    <div className="text-sm font-medium">{channelLabel(template.channel)}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
