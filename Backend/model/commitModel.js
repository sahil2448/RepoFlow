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
    
    
    fileContents: [
      {
        name: { type: String },
        content: { type: String }, 
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
