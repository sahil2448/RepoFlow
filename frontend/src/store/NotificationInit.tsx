import { useEffect, useRef } from "react";
import socket                from "../config/socket";
import api                   from "../config/api";
import { notificationStore } from "./notificationStore";

const NotificationInit: React.FC = () => {
  const initialized = useRef(false);
  const userId      = localStorage.getItem("userId");

  useEffect(() => {
    if (!userId || initialized.current) return;
    initialized.current = true;

    const fetchNotifications = async () => {
      try {
        const res = await api.get(`/notifications/${userId}`);
        notificationStore.setAll(
          res.data.notifications || [],
          res.data.unreadCount   || 0
        );
      } catch (err) {
        console.error("Notification fetch failed:", err);
      }
    };

    fetchNotifications();

    socket.connect();
    socket.emit("join", userId);

    socket.on("notification", (data: any) => {
      notificationStore.addOne(data);
    });

    return () => {
      socket.off("notification");
      socket.disconnect();
    };
  }, [userId]);

  return null;
};

export default NotificationInit;