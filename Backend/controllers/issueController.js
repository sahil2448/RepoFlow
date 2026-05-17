import mongoose from "mongoose";
import Issue from "../model/issueModel.js";
import User from "../model/userModel.js";
import Repository from "../model/repoModel.js";

import { ObjectId } from "mongodb";

const createIssue = (req, res) => {
  const { title, description } = req.body;
  const { id } = req.params; // repository id

  try {
    const createdIssue = new Issue({
      title: title,
      description: description,
      repository: id,
    });

    await createIssue.save();

    res.status(201).json({ message: "Issue created successfully", issue });
  } catch (error) {
    console.log("Error during creating issue", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

async function updateIssueById(req, res) {
  const { id } = req.params;
  const { title, description, status } = req.body;
  try {
    const issue = await Issue.findById(id);

    if (!issue) {
      return res.status(404).json({ error: "Issue not found!" });
    }

    issue.title = title;
    issue.description = description;
    issue.status = status;

    await issue.save();

    res.json(issue, { message: "Issue updated" });
  } catch (err) {
    console.error("Error during issue updation : ", err.message);
    res.status(500).send("Server error");
  }
}

async function deleteIssueById(req, res) {
  const { id } = req.params;

  try {
    const issue = Issue.findByIdAndDelete(id);

    if (!issue) {
      return res.status(404).json({ error: "Issue not found!" });
    }
    res.json({ message: "Issue deleted" });
  } catch (err) {
    console.error("Error during issue deletion : ", err.message);
    res.status(500).send("Server error");
  }
}

async function getAllIssues(req, res) {
  const { id } = req.params;

  try {
    const issues = Issue.find({ repository: id });

    if (!issues) {
      return res.status(404).json({ error: "Issues not found!" });
    }
    res.status(200).json(issues);
  } catch (err) {
    console.error("Error during issue fetching : ", err.message);
    res.status(500).send("Server error");
  }
}

async function getIssueById(req, res) {
  const { id } = req.params;
  try {
    const issue = await Issue.findById(id);

    if (!issue) {
      return res.status(404).json({ error: "Issue not found!" });
    }

    res.json(issue);
  } catch (err) {
    console.error("Error during issue updation : ", err.message);
    res.status(500).send("Server error");
  }
}

export{
    createIssue,
    updateIssueById,
    deleteIssueById,
    getAllIssues,
    getIssueById
}