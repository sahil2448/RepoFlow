import { useState, useEffect } from "react";
import { notificationStore }   from "./notificationStore";

// Any component that calls this hook re-renders when store changes
export const useNotifications = () => {
  const [, rerender] = useState(0);

  useEffect(() => {
    // Subscribe — when store emits, force a re-render
    const unsubscribe = notificationStore.subscribe(() => {
      rerender((n) => n + 1);
    });
    return unsubscribe;
  }, []);

  return {
    notifications: notificationStore.getNotifications(),
    unreadCount:   notificationStore.getUnreadCount(),
  };
};