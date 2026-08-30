import Notification from "../model/notificationModel.js";

export const getNotifications = async (req, res) => {
  const { userId } = req.params;
  try {
    const [notifications, unreadCount] = await Promise.all([
      Notification.find({ recipient: userId })
        .sort({ createdAt: -1 })
        .limit(20)
        .populate("sender", "username")
        .lean(),
      Notification.countDocuments({ recipient: userId, read: false }),
    ]);

    return res.status(200).json({ notifications, unreadCount });
  } catch (err) {
    console.error("Error fetching notifications:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const markAllRead = async (req, res) => {
  const { userId } = req.params;
  try {
    await Notification.updateMany(
      { recipient: userId, read: false },
      { $set: { read: true } },
    );
    return res.status(200).json({ message: "All marked as read" });
  } catch (err) {
    console.error("Error marking notifications:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};



export const markOneRead = async (req, res) => {
  const { id } = req.params;
  try {
    await Notification.findByIdAndUpdate(id, { $set: { read: true } });
    return res.status(200).json({ message: "Marked as read" });
  } catch (err) {
    console.error("Error marking notification:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};
