import express from "express";
import {
  getCommitsByRepo,
  revertToCommit,
} from "../controllers/commitHttpController.js";
import { getLatestFiles } from "../controllers/commit.js";
import { startReviewCall } from "../controllers/commit.js";
import { authMiddleware } from "../Middleware/authMiddleware.js";
import { optionalAuth } from "../Middleware/optionalAuthMiddleware.js";

const commitRouter = express.Router();

commitRouter.get("/repo/:id/commits", authMiddleware, getCommitsByRepo);
// commitRouter.post("/repo/:id/revert/:commitId", authMiddleware, revertToCommit);
commitRouter.post("/repo/:id/revert/:commitId", optionalAuth, revertToCommit);
commitRouter.get("/repo/:id/files", authMiddleware, getLatestFiles);
commitRouter.post("/repo/:id/review/:commitId", startReviewCall);

export default commitRouter;
