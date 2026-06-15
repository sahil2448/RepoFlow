import express from "express";
import {
  getCommitsByRepo,
  revertToCommit,
} from "../controllers/commitHttpController.js";
import { getLatestFiles } from "../controllers/commit.js";
import { authMiddleware } from "../Middleware/authMiddleware.js";

const commitRouter = express.Router();

commitRouter.get("/repo/:id/commits", authMiddleware, getCommitsByRepo);
commitRouter.post("/repo/:id/revert/:commitId", authMiddleware, revertToCommit);
commitRouter.get("/repo/:id/files", authMiddleware, getLatestFiles);

export default commitRouter;
