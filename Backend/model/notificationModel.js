import mongoose, { Schema } from "mongoose";

const NotificationSchema = new Schema(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    type: {
      type: String,
      enum: [
        "repo_starred",
        "new_follower",
        "issue_created",
        "issue_closed",
        "review_call_started",
      ],
      required: true,
    },

    message: {
      type: String,
      required: true,
    },

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

NotificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

const Notification = mongoose.model("Notification", NotificationSchema);
export default Notification;
