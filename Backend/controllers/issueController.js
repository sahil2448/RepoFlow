// controllers/issueController.js
import Issue from "../model/issueModel.js";
import Repository from "../model/repoModel.js";
import logContribution from "../helpers/logContribution.js";

const createIssue = async (req, res) => {
  const { title, description, userId } = req.body;
  const { id } = req.params; // repository id — route must be /issue/create/:id

  try {
    const repository = await Repository.findById(id);
    if (!repository) {
      return res.status(404).json({ error: "Repository not found" });
    }

    const createdIssue = new Issue({
      title,
      description,
      repository: id,
    });

    await createdIssue.save(); // ❌ was: await createIssue.save() — called itself recursively

    // Push issue ref into repository
    repository.issues.push(createdIssue._id);
    await repository.save();

    if (userId) await logContribution(userId, "issue_created");

    res
      .status(201)
      .json({ message: "Issue created successfully", issue: createdIssue }); // ❌ was: issue (undefined)
  } catch (error) {
    console.error("Error during creating issue:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

async function updateIssueById(req, res) {
  const { id } = req.params;
  const { title, description, status } = req.body;
  try {
    const issue = await Issue.findById(id);
    if (!issue) return res.status(404).json({ error: "Issue not found!" });

    if (title) issue.title = title;
    if (description) issue.description = description;
    if (status) issue.status = status;

    await issue.save();
    res.status(200).json({ message: "Issue updated", issue }); // ❌ was: res.json(issue, {...}) — invalid, 2 args
  } catch (err) {
    console.error("Error during issue update:", err.message);
    res.status(500).json({ error: "Server error" });
  }
}

async function deleteIssueById(req, res) {
  const { id } = req.params;
  try {
    const issue = await Issue.findByIdAndDelete(id); // ❌ was: missing await
    if (!issue) return res.status(404).json({ error: "Issue not found!" });

    // Remove from repository's issues array
    await Repository.updateOne(
      { _id: issue.repository },
      { $pull: { issues: issue._id } },
    );

    res.status(200).json({ message: "Issue deleted" });
  } catch (err) {
    console.error("Error during issue deletion:", err.message);
    res.status(500).json({ error: "Server error" });
  }
}

async function getAllIssues(req, res) {
  const { id } = req.params; // repository id — route must be /issue/all/:id
  try {
    const issues = await Issue.find({ repository: id }); // ❌ was: missing await
    res.status(200).json({ issues });
  } catch (err) {
    console.error("Error during issue fetching:", err.message);
    res.status(500).json({ error: "Server error" });
  }
}

async function getIssueById(req, res) {
  const { id } = req.params;
  try {
    const issue = await Issue.findById(id);
    if (!issue) return res.status(404).json({ error: "Issue not found!" });
    res.status(200).json({ issue });
  } catch (err) {
    console.error("Error during issue fetch:", err.message);
    res.status(500).json({ error: "Server error" });
  }
}

export {
  createIssue,
  updateIssueById,
  deleteIssueById,
  getAllIssues,
  getIssueById,
};
