import mongoose from "mongoose";
import { Schema } from "mongoose";

const UserSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },

  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
  },

  repositories: [
    {
      type: Schema.Types.ObjectId,
      ref: "Repository",
    },
  ],
  followedUsers: [
    {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  starredRepositories: [
    {
      type: Schema.Types.ObjectId,
      ref: "Repository",
    },
  ],
});

const User = mongoose.model("User", UserSchema);

export default User;
