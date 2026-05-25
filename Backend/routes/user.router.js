import express from "express";
import {
  getAllUsers,
  getUserProfile,
  updateUserProfile,
  deleteUser,
  signup,
  login,
  fetchStarredRepos,
  followUser,
} from "../controllers/userCcontroller.js";

const userRouter = express.Router();

userRouter.get("/", (req, res) => {
  res.send("user router");
});

userRouter.get("/allUsers", getAllUsers);
userRouter.post("/signup", signup);
userRouter.post("/login", login);
userRouter.get("/userProfile/:id", getUserProfile);
userRouter.put("/updateProfile/:id", updateUserProfile);
userRouter.delete("/deleteProfile/:id", deleteUser);
userRouter.get("/getStarredRepos/:id", fetchStarredRepos);
userRouter.post("/followUser/:id", followUser);

export default userRouter;
