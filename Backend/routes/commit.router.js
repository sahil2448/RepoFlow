import express from "express";
import {
  getCommitsByRepo,
  revertToCommit,
} from "../controllers/commitHttpController.js";
import { getLatestFiles } from "../controllers/commit.js";

const commitRouter = express.Router();

commitRouter.get("/repo/:id/commits", getCommitsByRepo);
commitRouter.post("/repo/:id/revert/:commitId", revertToCommit);
commitRouter.get("/repo/:id/files", getLatestFiles);

export default commitRouter;
