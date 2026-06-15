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
import { authMiddleware } from "../Middleware/authMiddleware.js";
import { authorizeUser } from "../Middleware/authorizeMiddleware.js";

const userRouter = express.Router();

userRouter.get("/", (req, res) => {
  res.send("user router");
});

userRouter.get("/allUsers", getAllUsers);
userRouter.post("/signup", signup);
userRouter.post("/login", login);
userRouter.get("/userProfile/:id", authMiddleware, getUserProfile);
userRouter.put(
  "/updateProfile/:id",
  authMiddleware,
  authorizeUser("id"),
  updateUserProfile,
);
userRouter.delete(
  "/deleteProfile/:id",
  authMiddleware,
  authorizeUser("id"),
  deleteUser,
);
userRouter.get(
  "/getStarredRepos/:id",
  authMiddleware,
  authorizeUser("id"),
  fetchStarredRepos,
);
userRouter.post("/followUser/:id", authMiddleware, followUser);

export default userRouter;
