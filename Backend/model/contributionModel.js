// models/Contribution.js
import mongoose, { Schema } from "mongoose";

const ContributionSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  type: {
    type: String,
    enum: [
      "repo_created",
      "repo_starred",
      "issue_created",
      "issue_closed",
      "repo_updated",
    ],
    required: true,
  },
  date: {
    type: String, // stored as "YYYY-MM-DD" for easy grouping
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for fast per-user date-range queries
ContributionSchema.index({ userId: 1, date: 1 });

const Contribution = mongoose.model("Contribution", ContributionSchema);
export default Contribution;
