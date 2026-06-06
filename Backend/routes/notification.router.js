import express from "express";
import {
  getNotifications,
  markAllRead,
  markOneRead,
} from "../controllers/notificationController.js";

const notificationRouter = express.Router();

notificationRouter.get("/notifications/:userId", getNotifications);
notificationRouter.patch("/notifications/read/:userId", markAllRead);
notificationRouter.patch("/notifications/read-one/:id", markOneRead);

export default notificationRouter;
