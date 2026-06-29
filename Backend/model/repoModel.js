import mongoose, { Schema } from "mongoose";
const RepositorySchema = new Schema({
  name: {
    type: String,
    required: true,
    // unique: true,
  },
  description: {
    type: String,
  },
  content: [
    {
      type: String,
    },
  ],
  visibility: {
    type: Boolean,
  },
  owner: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
  issues: [
    {
      type: Schema.Types.ObjectId,
      ref: "Issue",
    },
  ],
  stars: {
    type: Number,
    default: 0,
  },
  starredUsers: [
    {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  ],
});
RepositorySchema.index({ name: 1, owner: 1 }, { unique: true });
const Repository = mongoose.model("Repository", RepositorySchema);

export default Repository;
