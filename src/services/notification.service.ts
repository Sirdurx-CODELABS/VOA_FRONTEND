import api from '@/lib/axios';

export interface Notification {
  _id: string;
  recipient: string;
  role: string | null;
  hospital: string | null;
  type: string;
  title: string;
  message: string;
  patient: string | null;
  patientName: string;
  link: string;
  metadata: Record<string, string>;
  read: boolean;
  readAt: string | null;
  priority: string;
  createdAt: string;
  updatedAt: string;
}

export const notificationService = {
  getAll: (params?: { unreadOnly?: boolean; limit?: number }) =>
    api.get<{ success: boolean; data: Notification[] }>('/clinical/notifications', { params }),
  getUnreadCount: () =>
    api.get<{ success: boolean; data: { count: number } }>('/clinical/notifications/unread-count'),
  markRead: (id: string) =>
    api.put(`/clinical/notifications/${id}/read`),
  markAllRead: () =>
    api.put('/clinical/notifications/read-all'),
};
