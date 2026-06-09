import express from "express";
import {
  createIssue,
  getAllIssues,
  getIssueById,
  updateIssueById,
  deleteIssueById,
} from "../controllers/issueController.js";
import { checkDuplicateIssue } from "../controllers/issueAIController.js";

const issueRouter = express.Router();

issueRouter.get("/", (req, res) => {
  res.send("issue router");
});

issueRouter.post("/issue/create/:id", createIssue); 
issueRouter.get("/issue/all/:id", getAllIssues); 
issueRouter.get("/issue/:id", getIssueById);
issueRouter.put("/issue/update/:id", updateIssueById);
issueRouter.delete("/issue/delete/:id", deleteIssueById);
issueRouter.post("/issue/check-duplicate/:repoId", checkDuplicateIssue);
issueRouter.post("/issue/reindex/:repoId", async (req, res) => {
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
