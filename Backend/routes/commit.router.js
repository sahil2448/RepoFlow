import express from "express";
import { getCommitsByRepo, revertToCommit } from "../controllers/commit.js";

const commitRouter = express.Router();

commitRouter.get("/repo/:id/commits", getCommitsByRepo);
commitRouter.post("/repo/:id/revert/:commitId", revertToCommit);

export default commitRouter;
