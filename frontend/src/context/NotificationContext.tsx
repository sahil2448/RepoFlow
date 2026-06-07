import React, {
  createContext, useContext, useState,
  useEffect, useRef, useCallback,
  type ReactNode,
} from "react";
import socket from "../config/socket";
import api    from "../config/api";

// ─── Types ───────────────────────────────────────────────────────────────────

interface NotificationItem {
  _id:       string;
  type:      string;
  message:   string;
  link:      string;
  read:      boolean;
  createdAt: string;
  sender?:   { username: string };
}

interface NotificationContextValue {
  notifications:  NotificationItem[];
  unreadCount:    number;
  markOneRead:    (notif: NotificationItem) => Promise<void>;
  markAllRead:    () => Promise<void>;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const NotificationContext = createContext<NotificationContextValue>({
  notifications: [],
  unreadCount:   0,
  markOneRead:   async () => {},
  markAllRead:   async () => {},
});

export const useNotifications = () => useContext(NotificationContext);

// ─── Provider ────────────────────────────────────────────────────────────────

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount,   setUnreadCount]   = useState<number>(0);

  // Track if initial fetch already ran — prevents double fetch on StrictMode
  const fetchedRef = useRef<boolean>(false);

  const userId = localStorage.getItem("userId");

  // ── Initial fetch ──
  useEffect(() => {
    if (!userId || fetchedRef.current) return;
    fetchedRef.current = true;

    const fetchNotifications = async (): Promise<void> => {
      try {
        const res = await api.get(`/notifications/${userId}`);
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount     || 0);
      } catch (err) {
        console.error("Failed to fetch notifications:", err);
      }
    };

    fetchNotifications();
  }, [userId]);

  // ── Socket connection ──
  useEffect(() => {
    if (!userId) return;

    socket.connect();
    socket.emit("join", userId);

    socket.on("notification", (data: NotificationItem) => {
      setNotifications((prev) => [data, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });

    return () => {
      socket.off("notification");
      socket.disconnect();
    };
  }, [userId]);

  // ── Mark single notification as read ──
  const markOneRead = useCallback(async (notif: NotificationItem): Promise<void> => {
    if (notif.read) return;

    // ✅ Optimistic update — happens before API call and before navigation
    setUnreadCount((prev) => Math.max(0, prev - 1));
    setNotifications((prev) =>
      prev.map((n) => n._id === notif._id ? { ...n, read: true } : n)
    );

    // Persist in DB — fire and forget
    try {
      await api.patch(`/notifications/read-one/${notif._id}`);
    } catch (err) {
      console.error("Failed to mark as read:", err);
      // Revert on failure
      setUnreadCount((prev) => prev + 1);
      setNotifications((prev) =>
        prev.map((n) => n._id === notif._id ? { ...n, read: false } : n)
      );
    }
  }, []);

  // ── Mark all as read ──
  const markAllRead = useCallback(async (): Promise<void> => {
    if (!userId || unreadCount === 0) return;

    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

    try {
      await api.patch(`/notifications/read/${userId}`);
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  }, [userId, unreadCount]);

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      markOneRead,
      markAllRead,
    }}>
      {children}
    </NotificationContext.Provider>
  );
};