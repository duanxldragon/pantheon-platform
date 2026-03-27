export type NotificationViewStatus = 'read' | 'unread' | 'sent';

export interface NotificationViewItem {
  inboxId: string;
  notificationId: string;
  title: string;
  content: string;
  channel: 'system' | 'email' | 'sms' | 'inbox';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: NotificationViewStatus;
  sentAt?: string;
  createdAt: string;
  readAt?: string;
  templateId?: string;
  extraData?: string;
  receiverId?: string;
  senderId?: string;
  tenantId?: string;
  isSentView?: boolean;
}
