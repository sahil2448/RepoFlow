import express from "express";
import { rateLimit } from "express-rate-limit";
import {
  createIssue,
  getAllIssues,
  getIssueById,
  updateIssueById,
  deleteIssueById,
} from "../controllers/issueController.js";
import { checkDuplicateIssue } from "../controllers/issueAIController.js";
import { authMiddleware } from "../Middleware/authMiddleware.js";

const issueRouter = express.Router();

// The duplicate check now runs a generative Gemini call on valid candidates,
// so it gets a dedicated per-IP limiter on top of JWT auth. The frontend
// debounce (600ms) stays well under this.
const duplicateCheckLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: 30, // max 30 checks per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many duplicate checks — try again in a minute." },
});

issueRouter.get("/", (req, res) => {
  res.send("issue router");
});

issueRouter.post("/issue/create/:id", authMiddleware, createIssue);
issueRouter.get("/issue/all/:id", authMiddleware, getAllIssues);
issueRouter.get("/issue/:id", authMiddleware, getIssueById);
issueRouter.put("/issue/update/:id", authMiddleware, updateIssueById);
issueRouter.delete("/issue/delete/:id", authMiddleware, deleteIssueById);
issueRouter.post(
  "/issue/check-duplicate/:repoId",
  authMiddleware,
  duplicateCheckLimiter,
  checkDuplicateIssue,
);
issueRouter.post("/issue/reindex/:repoId", authMiddleware, async (req, res) => {
  const Issue = (await import("../model/issueModel.js")).default;
  const { embedAndIndexIssue } =
    await import("../controllers/issueAIController.js");

  const issues = await Issue.find({ repository: req.params.repoId });
  console.log(`Re-indexing ${issues.length} issues...`);

  for (const issue of issues) {
    await embedAndIndexIssue(
      issue._id,
      issue.repository,
      issue.title,
      issue.description,
    );
    await new Promise((r) => setTimeout(r, 1100));
  }

  res.json({ message: `Re-indexed ${issues.length} issues` });
});

export default issueRouter;
