// Lives completely outside React — navigation, remounts, re-renders
// cannot touch this

interface NotificationItem {
  _id:       string;
  type:      string;
  message:   string;
  link:      string;
  read:      boolean;
  createdAt: string;
  sender?:   { username: string };
}

// ── Module level state ──
let notifications: NotificationItem[] = [];
let unreadCount   = 0;
let listeners:    (() => void)[]      = [];

// ── Notify all subscribers when state changes ──
const emit = () => listeners.forEach((fn) => fn());

export const notificationStore = {

  // Read
  getNotifications: () => notifications,
  getUnreadCount:   () => unreadCount,

  // Write
  setAll: (data: NotificationItem[], count: number) => {
    notifications = data;
    unreadCount   = count;
    emit();
  },

  addOne: (notif: NotificationItem) => {
    notifications = [notif, ...notifications];
    unreadCount   = unreadCount + 1;
    emit();
  },

  markOneRead: (id: string) => {
    notifications = notifications.map((n) =>
      n._id === id ? { ...n, read: true } : n
    );
    unreadCount = Math.max(0, unreadCount - 1);
    emit();   // ← subscribers re-render immediately
  },

  // Subscribe / unsubscribe
  subscribe: (fn: () => void) => {
    listeners.push(fn);
    return () => {
      listeners = listeners.filter((l) => l !== fn);
    };
  },
};