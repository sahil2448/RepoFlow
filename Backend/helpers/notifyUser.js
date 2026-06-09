import Notification from "../model/notificationModel.js";


export async function notifyUser(io, payload) {
  const { recipientId, senderId, type, message, link = "/" } = payload;

  try {
    const notification = await Notification.create({
      recipient: recipientId,
      sender: senderId,
      type,
      message,
      link,
    });

    io.to(recipientId.toString()).emit("notification", {
      _id: notification._id,
      type: notification.type,
      message: notification.message,
      link: notification.link,
      read: false,
      createdAt: notification.createdAt,
    });

    console.log(`  notified ${recipientId}: ${message}`);
  } catch (err) {
    console.error("notifyUser failed silently:", err.message);
  }
}
