import { languageResources } from '../../stores/languageStore';
import type { Translations } from './types';

const SHARED_ZH_EXTENSIONS: Translations = {
  navigation: {
    profile: '个人中心',
  },
  notification: {
    title: '通知中心',
    notifications: '通知',
    notification: '通知',
    templates: '通知模板',
    total: '总通知数',
    all: '全部',
    allNotifications: '全部通知',
    unread: '未读',
    unreadNotifications: '未读通知',
    read: '已读',
    readNotifications: '已读通知',
    sent: '已发送',
    sentToday: '今日发送',
    sentTodayNotifications: '今日发送通知',
    sentWeek: '本周发送',
    sentWeekNotifications: '本周发送通知',
    channel: '渠道',
    channelSystem: '系统消息',
    channelEmail: '邮件',
    channelSMS: '短信',
    channelInbox: '站内信',
    priorityUrgent: '紧急',
    priorityHigh: '高',
    priorityMedium: '中',
    priorityLow: '低',
    defaultTitle: '系统通知',
    notificationDetail: '通知详情',
    selectNotification: '请选择一条通知查看详情',
    content: '内容',
    sender: '发送人',
    template: '模板',
    sentAt: '发送时间',
    readAt: '阅读时间',
    createdAt: '创建时间',
    extraData: '附加数据',
    markAsRead: '标记已读',
    markAllAsRead: '全部标记已读',
    clearRead: '清理已读',
    bulkActions: '批量操作',
    noNotifications: '暂无通知',
    deleteConfirm: '确定要删除通知“{name}”吗？',
  },
};

const SHARED_EN_EXTENSIONS: Translations = {
  navigation: {
    profile: 'Profile Center',
  },
  notification: {
    title: 'Notification Center',
    notifications: 'Notifications',
    notification: 'Notification',
    templates: 'Templates',
    total: 'Total Notifications',
    all: 'All',
    allNotifications: 'All notifications',
    unread: 'Unread',
    unreadNotifications: 'Unread notifications',
    read: 'Read',
    readNotifications: 'Read notifications',
    sent: 'Sent',
    sentToday: 'Sent Today',
    sentTodayNotifications: 'Notifications sent today',
    sentWeek: 'Sent This Week',
    sentWeekNotifications: 'Notifications sent this week',
    channel: 'Channel',
    channelSystem: 'System',
    channelEmail: 'Email',
    channelSMS: 'SMS',
    channelInbox: 'Inbox',
    priorityUrgent: 'Urgent',
    priorityHigh: 'High',
    priorityMedium: 'Medium',
    priorityLow: 'Low',
    defaultTitle: 'System Notification',
    notificationDetail: 'Notification Detail',
    selectNotification: 'Select a notification to view details',
    content: 'Content',
    sender: 'Sender',
    template: 'Template',
    sentAt: 'Sent At',
    readAt: 'Read At',
    createdAt: 'Created At',
    extraData: 'Extra Data',
    markAsRead: 'Mark as Read',
    markAllAsRead: 'Mark All as Read',
    clearRead: 'Clear Read',
    bulkActions: 'Bulk Actions',
    noNotifications: 'No notifications',
    deleteConfirm: 'Are you sure you want to delete notification "{name}"?',
  },
};

function mergeTranslations(base: Translations, extension: Translations): Translations {
  const result: Record<string, any> = { ...base };

  for (const [key, value] of Object.entries(extension)) {
    const current = result[key];
    if (
      current &&
      typeof current === 'object' &&
      !Array.isArray(current) &&
      value &&
      typeof value === 'object' &&
      !Array.isArray(value)
    ) {
      result[key] = mergeTranslations(current as Translations, value as Translations);
    } else {
      result[key] = value;
    }
  }

  return result as Translations;
}

export const BUILTIN_TRANSLATIONS: Record<'zh' | 'en', Translations> = {
  zh: mergeTranslations(languageResources.zh as Translations, SHARED_ZH_EXTENSIONS),
  en: mergeTranslations(languageResources.en as Translations, SHARED_EN_EXTENSIONS),
};
