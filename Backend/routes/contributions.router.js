import { getUserContributions } from "../controllers/contributionController.js";
import express from "express";
import { authMiddleware } from "../Middleware/authMiddleware.js";
import { authorizeUser } from "../Middleware/authorizeMiddleware.js";

const contributionRouter = express.Router();

contributionRouter.get(
  "/contributions/:userId",
  authMiddleware,
  authorizeUser("userId"),
  getUserContributions,
);

export default contributionRouter;
