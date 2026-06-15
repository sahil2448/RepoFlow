import express from "express";
import {
  getNotifications,
  markAllRead,
  markOneRead,
} from "../controllers/notificationController.js";
import { authMiddleware } from "../Middleware/authMiddleware.js";
import {
  authorizeUser,
  authorizeNotificationOwner,
} from "../Middleware/authorizeMiddleware.js";

const notificationRouter = express.Router();

notificationRouter.get(
  "/notifications/:userId",
  authMiddleware,
  authorizeUser("userId"),
  getNotifications,
);
notificationRouter.patch(
  "/notifications/read/:userId",
  authMiddleware,
  authorizeUser("userId"),
  markAllRead,
);
notificationRouter.patch(
  "/notifications/read-one/:id",
  authMiddleware,
  authorizeNotificationOwner,
  markOneRead,
);

export default notificationRouter;
