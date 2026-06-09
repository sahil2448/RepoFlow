import mongoose, { Schema } from "mongoose";

const UserSchema = new Schema(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },

    
    bio: { type: String, default: "" },
    location: { type: String, default: "" },
    website: { type: String, default: "" },
    avatar: { type: String, default: "" },

    repositories: [{ type: Schema.Types.ObjectId, ref: "Repository" }],
    followingUsers: [{ type: Schema.Types.ObjectId, ref: "User" }],
    myFollowers: [{ type: Schema.Types.ObjectId, ref: "User" }],
    starredRepositories: [{ type: Schema.Types.ObjectId, ref: "Repository" }],
  },
  { timestamps: true },
);

const User = mongoose.model("User", UserSchema);
export default User;
