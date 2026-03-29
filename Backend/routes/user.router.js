import express from "express";
import {
  getAllUsers,
  getUserProfile,
  updateUserProfile,
  deleteUser,
  signup,
  login,
} from "../controllers/userCcontroller.js";

const userRouter = express.Router();

userRouter.get("/", (req, res) => {
  res.send("user router");
});

userRouter.get("/allUsers", getAllUsers);
userRouter.post("/signup", signup);
userRouter.post("/login", login);
userRouter.get("/userProfile", getUserProfile);
userRouter.put("/updateProfile", updateUserProfile);
userRouter.delete("/deleteProfile", deleteUser);

export default userRouter;
