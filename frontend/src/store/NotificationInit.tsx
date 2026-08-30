import { useEffect } from "react";
import socket                from "../config/socket";
import { notificationStore } from "./notificationStore";
import { ec2Api }            from "../config/api";

const NotificationInit: React.FC = () => {
  // const initialized = useRef(false);
  const userId      = localStorage.getItem("userId");

useEffect(() => {
  if (!userId) return;

  const onNotification = (data: any) => {
    notificationStore.addOne(data);
  };

  const onConnect = () => {
    console.log("socket connected:", socket.id);
    socket.emit("join", userId);
  };

  const onConnectError = (err: any) => {
    console.error("socket connect_error:", err);
  };

  const init = async () => {
    try {
      const res = await ec2Api.get(`/notifications/${userId}`);
      notificationStore.setAll(
        res.data.notifications || [],
        res.data.unreadCount || 0
      );

      socket.off("notification", onNotification);
      socket.off("connect", onConnect);
      socket.off("connect_error", onConnectError);

      socket.on("connect", onConnect);
      socket.on("connect_error", onConnectError);
      socket.on("notification", onNotification);

      if (!socket.connected) {
        socket.connect();
      } else {
        socket.emit("join", userId);
      }
    } catch (err) {
      console.error("Notification init failed:", err);
    }
  };

  init();

  return () => {
    socket.off("notification", onNotification);
    socket.off("connect", onConnect);
    socket.off("connect_error", onConnectError);
    socket.disconnect();
  };
}, [userId]);

  return null;
};

export default NotificationInit;