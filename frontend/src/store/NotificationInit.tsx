import { useEffect, useRef } from "react";
import socket                from "../config/socket";
import api                   from "../config/api";
import { notificationStore } from "./notificationStore";
// import axios from "axios";


const NotificationInit: React.FC = () => {

  // const EC2_URL = import.meta.env.VITE_EC2_URL || "http://localhost:3000";
  const initialized = useRef(false);
  const userId      = localStorage.getItem("userId");

  useEffect(() => {
    if (!userId || initialized.current) return;
    initialized.current = true;

    const fetchNotifications = async () => {
      try {
        const res = await api.get(`/notifications/${userId}`);
        // const res = await axios.get(`${EC2_URL}/notifications/${userId}`, {
          // headers: {
          //   Authorization: `Bearer ${localStorage.getItem("token")}`,
          // },
        // });
        console.log(res.data);
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