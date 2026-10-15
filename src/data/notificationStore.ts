import { create } from 'zustand';
import { NotificationItem } from '../types';
import { api } from '../services/api';
import { createTaggedLogger } from '../utils/logger';
const log = createTaggedLogger('NOTIF');

export interface NotificationState {
  notifications: NotificationItem[];
  unreadCount: number;
  isLoading: boolean;
  fetchNotifications: (branchId?: string) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: (branchId?: string) => Promise<void>;
  addNotification: (noti: NotificationItem) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetchNotifications: async (branchId?: string) => {
    try {
      set({ isLoading: true });
      const res = await api.getNotifications({ branchId });
      if (res && Array.isArray(res.notifications)) {
        set({
          notifications: res.notifications,
          unreadCount:
            typeof res.unreadCount === 'number'
              ? res.unreadCount
              : res.notifications.filter((n) => !n.isRead).length,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch (err) {
      log.warn('[notificationStore] fetchNotifications error:', err);
      set({ isLoading: false });
    }
  },

  markAsRead: async (id: string) => {
    const prev = get().notifications;
    const target = prev.find((n) => n.id === id);
    if (!target || target.isRead) return;

    set({
      notifications: prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      unreadCount: Math.max(0, get().unreadCount - 1),
    });

    try {
      await api.markNotificationAsRead(id);
    } catch (err) {
      log.warn('[notificationStore] markAsRead error:', err);
    }
  },

  markAllAsRead: async (branchId?: string) => {
    set({
      notifications: get().notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    });

    try {
      await api.markAllNotificationsAsRead(branchId);
    } catch (err) {
      log.warn('[notificationStore] markAllAsRead error:', err);
    }
  },

  addNotification: (noti: NotificationItem) => {
    const existing = get().notifications;
    if (existing.some((n) => n.id === noti.id)) return;

    set({
      notifications: [noti, ...existing],
      unreadCount: noti.isRead ? get().unreadCount : get().unreadCount + 1,
    });
  },
}));
