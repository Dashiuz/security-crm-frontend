import { HttpClient } from "./client";

export interface NotificationItem {
  id: string;
  tenantId: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export class NotificationsApi {
  static async getUnread(): Promise<{ data: NotificationItem[]; unreadCount: number }> {
    return HttpClient.get<{ data: NotificationItem[]; unreadCount: number }>(
      "/notifications/unread"
    );
  }

  static async getAll(
    page = 1,
    limit = 20
  ): Promise<{ data: NotificationItem[]; meta: any }> {
    return HttpClient.get<{ data: NotificationItem[]; meta: any }>(
      `/notifications?page=${page}&limit=${limit}`
    );
  }

  static async markAsRead(id: string): Promise<NotificationItem> {
    return HttpClient.patch<NotificationItem>(`/notifications/${id}/read`);
  }

  static async markAllAsRead(): Promise<{ success: boolean; count: number }> {
    return HttpClient.patch<{ success: boolean; count: number }>(
      "/notifications/read-all"
    );
  }
}
