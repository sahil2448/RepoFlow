import mongoose, { Schema } from "mongoose";

const CommitSchema = new Schema(
  {
    repoId: {
      type: Schema.Types.ObjectId,
      ref: "Repository",
      required: true,
    },
    commitId: {
      type: String,
      required: true,
      unique: true,
    },
    message: {
      type: String,
      required: true,
    },
    files: [
      {
        type: String,
      },
    ],
    // ✅ Fallback storage when S3 is unavailable
    // Stores [{ name: "hello.js", content: "console.log(...)" }]
    fileContents: [
      {
        name: { type: String },
        content: { type: String }, // base64 encoded
      },
    ],
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    s3Synced: {
      type: Boolean,
      default: false,
    },
    // ✅ Track which storage was used
    storageType: {
      type: String,
      enum: ["s3", "mongodb", "none"],
      default: "none",
    },
  },
  { timestamps: true },
);

CommitSchema.index({ repoId: 1, createdAt: -1 });

const Commit = mongoose.model("Commit", CommitSchema);
export default Commit;
