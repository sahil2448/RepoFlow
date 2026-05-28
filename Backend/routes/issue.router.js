import express from "express";
import {
  createIssue,
  getAllIssues,
  getIssueById,
  updateIssueById,
  deleteIssueById,
} from "../controllers/issueController.js";

const issueRouter = express.Router();

issueRouter.get("/", (req, res) => {
  res.send("issue router");
});

// issueRouter.js
issueRouter.post("/issue/create/:id", createIssue); // ← add :id
issueRouter.get("/issue/all/:id", getAllIssues); // ← add :id (repo id)
issueRouter.get("/issue/:id", getIssueById);
issueRouter.put("/issue/update/:id", updateIssueById);
issueRouter.delete("/issue/delete/:id", deleteIssueById);

export default issueRouter;
