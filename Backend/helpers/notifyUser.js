import Notification from "../model/notificationModel.js";

/**
 * Creates a notification in DB and emits it via socket in real time.
 * Call this from any controller — star, follow, issue etc.
 *
 * @param {object} io         - Socket.IO server instance
 * @param {object} payload    - { recipientId, senderId, type, message, link }
 */
export async function notifyUser(io, payload) {
  const { recipientId, senderId, type, message, link = "/" } = payload;

  try {
    // 1. Save to DB so user sees it even if they were offline
    const notification = await Notification.create({
      recipient: recipientId,
      sender: senderId,
      type,
      message,
      link,
    });

    // 2. Emit in real time to the recipient's socket room
    // Each user joins a room named after their userId on connect
    io.to(recipientId.toString()).emit("notification", {
      _id: notification._id,
      type: notification.type,
      message: notification.message,
      link: notification.link,
      read: false,
      createdAt: notification.createdAt,
    });

    console.log(`  🔔 notified ${recipientId}: ${message}`);
  } catch (err) {
    // Never let notification failure break the main action
    console.error("notifyUser failed silently:", err.message);
  }
}
