import mongoose from "mongoose";
import { Schema } from "mongoose";

const IssueSchema = new Schema({
  title: {
    type: String,
    Required: true,
  },
  description: {
    type: String,
    Required: true,
  },
  status: {
    type: String,
    enum: ["open", "closed"],
    default: "open",
  },
  repository: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "Repository",
  },
});

const Issue = mongoose.model("Issue", IssueSchema);
export default Issue;
