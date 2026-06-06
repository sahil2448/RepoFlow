import mongoose, { Schema } from "mongoose";

const NotificationSchema = new Schema(
  {
    // who receives the notification
    recipient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // who triggered it
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    type: {
      type: String,
      enum: ["repo_starred", "new_follower", "issue_created", "issue_closed"],
      required: true,
    },
    // human readable message
    message: {
      type: String,
      required: true,
    },
    // where clicking it should take the user
    link: {
      type: String,
      default: "/",
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

// Fast query: unread notifications for a user
NotificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

const Notification = mongoose.model("Notification", NotificationSchema);
export default Notification;
