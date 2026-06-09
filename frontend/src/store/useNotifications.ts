import { useState, useEffect } from "react";
import { notificationStore }   from "./notificationStore";


export const useNotifications = () => {
  const [, rerender] = useState(0);

  useEffect(() => {
    
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