import express from "express";
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
