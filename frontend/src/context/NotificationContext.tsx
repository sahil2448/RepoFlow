// import React, {
//   createContext, useContext, useState,
//   useEffect, useRef, useCallback,
//   type ReactNode,
// } from "react";
// import socket         from "../config/socket";
// import { ec2Api }    from "../config/api";


// interface NotificationItem {
//   _id:       string;
//   type:      string;
//   message:   string;
//   link:      string;
//   read:      boolean;
//   createdAt: string;
//   sender?:   { username: string };
// }

// interface NotificationContextValue {
//   notifications:  NotificationItem[];
//   unreadCount:    number;
//   markOneRead:    (notif: NotificationItem) => Promise<void>;
//   markAllRead:    () => Promise<void>;
// }


// const NotificationContext = createContext<NotificationContextValue>({
//   notifications: [],
//   unreadCount:   0,
//   markOneRead:   async () => {},
//   markAllRead:   async () => {},
// });

// export const useNotifications = () => useContext(NotificationContext);


// export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
//   const [notifications, setNotifications] = useState<NotificationItem[]>([]);
//   const [unreadCount,   setUnreadCount]   = useState<number>(0);

//   const fetchedRef = useRef<boolean>(false);

//   const userId = localStorage.getItem("userId");

//   useEffect(() => {
//     if (!userId || fetchedRef.current) return;
//     fetchedRef.current = true;

//     const fetchNotifications = async (): Promise<void> => {
//       try {
//         const res = await ec2Api.get(`/notifications/${userId}`);
//         setNotifications(res.data.notifications || []);
//         setUnreadCount(res.data.unreadCount     || 0);
//       } catch (err) {
//         console.error("Failed to fetch notifications:", err);
//       }
//     };

//     fetchNotifications();
//   }, [userId]);

//   useEffect(() => {
//     if (!userId) return;

//     socket.connect();
//     socket.emit("join", userId);

//     socket.on("notification", (data: NotificationItem) => {
//       setNotifications((prev) => [data, ...prev]);
//       setUnreadCount((prev) => prev + 1);
//     });

//     return () => {
//       socket.off("notification");
//       socket.disconnect();
//     };
//   }, [userId]);

//   const markOneRead = useCallback(async (notif: NotificationItem): Promise<void> => {
//     if (notif.read) return;

//     setUnreadCount((prev) => Math.max(0, prev - 1));
//     setNotifications((prev) =>
//       prev.map((n) => n._id === notif._id ? { ...n, read: true } : n)
//     );

//     try {
//       await ec2Api.patch(`/notifications/read-one/${notif._id}`);
//     } catch (err) {
//       console.error("Failed to mark as read:", err);
//       setUnreadCount((prev) => prev + 1);
//       setNotifications((prev) =>
//         prev.map((n) => n._id === notif._id ? { ...n, read: false } : n)
//       );
//     }
//   }, []);

//   const markAllRead = useCallback(async (): Promise<void> => {
//     if (!userId || unreadCount === 0) return;

//     setUnreadCount(0);
//     setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

//     try {
//       await ec2Api.patch(`/notifications/read/${userId}`);
//     } catch (err) {
//       console.error("Failed to mark all as read:", err);
//     }
//   }, [userId, unreadCount]);

//   return (
//     <NotificationContext.Provider value={{
//       notifications,
//       unreadCount,
//       markOneRead,
//       markAllRead,
//     }}>
//       {children}
//     </NotificationContext.Provider>
//   );
// };