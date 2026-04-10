/**
 * 通知模块 API
 */

import { http } from '../../../shared/utils/api_client';

// ==================== 类型定义 ====================

export interface Notification {
  id: string;
  tenantId: string;
  title: string;
  content: string;
  channel: 'system' | 'email' | 'sms' | 'inbox';
  status: 'draft' | 'sent' | 'failed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  receiverIds?: string;
  senderId?: string;
  templateId?: string;
  extraData?: string;
  sentAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationInbox {
  id: string;
  notificationId: string;
  tenantId: string;
  receiverId: string;
  isRead: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  readAt?: string;
  notification?: Notification;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  code: string;
  channel: 'system' | 'email' | 'sms' | 'inbox';
  subject: string;
  content: string;
  variables: string;
  isActive: boolean;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationStats {
  total: number;
  unread: number;
  read: number;
  sentToday: number;
  sentWeek: number;
}

export interface SendNotificationRequest {
  channel: 'system' | 'email' | 'sms' | 'inbox';
  receiverIds: string;
  templateId?: string;
  title?: string;
  content?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  variables?: Record<string, string>;
}

// ==================== API 接口 ====================

export const notificationApi = {
  // ========== 通知管理 ==========

  /**
   * 获取通知列表
   */
  listNotifications: async (params?: {
    page?: number;
    pageSize?: number;
    status?: string;
    channel?: string;
    priority?: string;
  }): Promise<{ items: Notification[]; total: number }> => {
    const resp = await http.getPage<Notification>('/v1/notifications', {
      page: params?.page ?? 1,
      pageSize: params?.pageSize ?? 20,
      status: params?.status,
      channel: params?.channel,
      priority: params?.priority,
    });
    return {
      items: resp.data?.items || [],
      total: resp.data?.pagination?.total || 0,
    };
  },

  /**
   * 获取通知详情
   */
  getNotification: async (id: string): Promise<Notification> => {
    const resp = await http.get<Notification>(`/v1/notifications/${id}`);
    return resp.data;
  },

  /**
   * 创建通知
   */
  createNotification: async (data: SendNotificationRequest): Promise<Notification> => {
    const resp = await http.post<Notification>('/v1/notifications', data);
    return resp.data;
  },

  /**
   * 更新通知
   */
  updateNotification: async (id: string, data: Partial<Notification>): Promise<Notification> => {
    const resp = await http.put<Notification>(`/v1/notifications/${id}`, data);
    return resp.data;
  },

  /**
   * 删除通知
   */
  deleteNotification: async (id: string): Promise<void> => {
    await http.delete(`/v1/notifications/${id}`);
  },

  // ========== 收件箱管理 ==========

  /**
   * 获取收件箱列表
   */
  listInbox: async (params?: {
    page?: number;
    pageSize?: number;
    isRead?: boolean;
  }): Promise<{ items: NotificationInbox[]; total: number }> => {
    const resp = await http.getPage<NotificationInbox>('/v1/notifications/inbox', {
      page: params?.page ?? 1,
      pageSize: params?.pageSize ?? 20,
      isRead: params?.isRead,
    });
    return {
      items: resp.data?.items || [],
      total: resp.data?.pagination?.total || 0,
    };
  },

  /**
   * 获取收件箱详情
   */
  getInboxItem: async (id: string): Promise<NotificationInbox> => {
    const resp = await http.get<NotificationInbox>(`/v1/notifications/inbox/${id}`);
    return resp.data;
  },

  /**
   * 删除收件箱项
   */
  deleteInboxItem: async (id: string): Promise<void> => {
    await http.delete(`/v1/notifications/inbox/${id}`);
  },

  /**
   * 标记为已读
   */
  markAsRead: async (ids: string[]): Promise<void> => {
    await http.post('/v1/notifications/inbox/mark-read', { ids });
  },

  /**
   * 标记所有为已读
   */
  markAllAsRead: async (): Promise<void> => {
    await http.post('/v1/notifications/inbox/mark-all-read', {});
  },

  /**
   * 获取未读数量
   */
  getUnreadCount: async (): Promise<number> => {
    const resp = await http.get<{ count: number }>('/v1/notifications/inbox/unread-count');
    return resp.data?.count || 0;
  },

  // ========== 通知模板 ==========

  /**
   * 获取模板列表
   */
  listTemplates: async (params?: {
    page?: number;
    pageSize?: number;
    channel?: string;
    isActive?: boolean;
  }): Promise<{ items: NotificationTemplate[]; total: number }> => {
    const resp = await http.getPage<NotificationTemplate>('/v1/notifications/templates', {
      page: params?.page ?? 1,
      pageSize: params?.pageSize ?? 20,
      channel: params?.channel,
      isActive: params?.isActive,
    });
    return {
      items: resp.data?.items || [],
      total: resp.data?.pagination?.total || 0,
    };
  },

  /**
   * 获取模板详情
   */
  getTemplate: async (id: string): Promise<NotificationTemplate> => {
    const resp = await http.get<NotificationTemplate>(`/v1/notifications/templates/${id}`);
    return resp.data;
  },

  /**
   * 创建模板
   */
  createTemplate: async (data: Partial<NotificationTemplate>): Promise<NotificationTemplate> => {
    const resp = await http.post<NotificationTemplate>('/v1/notifications/templates', data);
    return resp.data;
  },

  /**
   * 更新模板
   */
  updateTemplate: async (id: string, data: Partial<NotificationTemplate>): Promise<NotificationTemplate> => {
    const resp = await http.put<NotificationTemplate>(`/v1/notifications/templates/${id}`, data);
    return resp.data;
  },

  /**
   * 删除模板
   */
  deleteTemplate: async (id: string): Promise<void> => {
    await http.delete(`/v1/notifications/templates/${id}`);
  },

  // ========== 统计 ==========

  /**
   * 获取通知统计
   */
  getStats: async (): Promise<NotificationStats> => {
    const resp = await http.get<NotificationStats>('/v1/notifications/stats');
    return resp.data;
  },

  // ========== 发送通知 ==========

  /**
   * 从模板发送通知
   */
  sendFromTemplate: async (data: SendNotificationRequest): Promise<Notification> => {
    const resp = await http.post<Notification>('/v1/notifications/send/template', data);
    return resp.data;
  },

  /**
   * 直接发送通知
   */
  send: async (data: SendNotificationRequest): Promise<Notification> => {
    const resp = await http.post<Notification>('/v1/notifications/send', data);
    return resp.data;
  },
};



