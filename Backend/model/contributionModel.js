
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
    type: String, 
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});


ContributionSchema.index({ userId: 1, date: 1 });

const Contribution = mongoose.model("Contribution", ContributionSchema);
export default Contribution;
