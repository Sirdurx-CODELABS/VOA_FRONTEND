import { create } from 'zustand';
import { notificationService, Notification } from '@/services/notification.service';
import { getSocket } from '@/services/socket.service';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  initialized: boolean;
  fetch: (unreadOnly?: boolean) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  initSocketListener: () => void;
  destroySocketListener: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,
  initialized: false,

  fetch: async (unreadOnly = false) => {
    set({ loading: true });
    try {
      const res = await notificationService.getAll({ unreadOnly, limit: 50 });
      set({ notifications: res.data?.data || [], loading: false, initialized: true });
    } catch {
      set({ loading: false, initialized: true });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const res = await notificationService.getUnreadCount();
      set({ unreadCount: res.data?.data?.count || 0 });
    } catch { /* ignore */ }
  },

  markRead: async (id: string) => {
    try {
      await notificationService.markRead(id);
      set((s) => ({
        notifications: s.notifications.map((n) =>
          n._id === id ? { ...n, read: true, readAt: new Date().toISOString() } : n
        ),
        unreadCount: Math.max(0, s.unreadCount - 1),
      }));
    } catch { /* ignore */ }
  },

  markAllRead: async () => {
    try {
      await notificationService.markAllRead();
      set((s) => ({
        notifications: s.notifications.map((n) => ({ ...n, read: true })),
        unreadCount: 0,
      }));
    } catch { /* ignore */ }
  },

  initSocketListener: () => {
    const socket = getSocket();
    if (!socket) return;
    socket.off('notification:new');
    socket.on('notification:new', (notification: Notification) => {
      set((s) => {
        const exists = s.notifications.some((n) => n._id === notification._id);
        if (exists) return s;
        return {
          notifications: [notification, ...s.notifications].slice(0, 100),
          unreadCount: s.unreadCount + 1,
        };
      });
    });
  },

  destroySocketListener: () => {
    const socket = getSocket();
    socket?.off('notification:new');
  },
}));
