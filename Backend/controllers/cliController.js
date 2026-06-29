import Repository from "../model/repoModel.js";
import Commit from "../model/commitModel.js";
import { s3, S3_BUCKET } from "../config/aws-config.js";
import logContribution from "../helpers/logContribution.js";
import { v4 as uuidv4 } from "uuid";

// POST /cli/repo/init — body: { repoName, visibility }
export const findOrCreateRepoByName = async (req, res) => {
  const { repoName, visibility = true } = req.body;
  const ownerId = req.userId;

  if (!repoName?.trim()) {
    return res.status(400).json({ error: "repoName is required" });
  }

  try {
    let repository = await Repository.findOne({
      name: repoName.trim(),
      owner: ownerId,
    });

    if (!repository) {
      repository = await Repository.create({
        name: repoName.trim(),
        description: "Initialized via RepoFlow CLI",
        visibility,
        owner: ownerId,
        content: [],
      });
      await logContribution(ownerId, "repo_created");
    }

    return res.status(200).json({
      repoId: repository._id,
      repoName: repository.name,
      visibility: repository.visibility,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res
        .status(409)
        .json({ error: "You already have a repository with this name." });
    }
    console.error("CLI init error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// POST /cli/repo/:repoId/push — body: { commitId, message, files: [{name, content(base64)}] }
export const pushCliCommit = async (req, res) => {
  const { repoId } = req.params;
  const { commitId: providedCommitId, message, files } = req.body;
  const userId = req.userId;

  if (!Array.isArray(files) || files.length === 0) {
    return res.status(400).json({ error: "files array is required" });
  }

  try {
    const repository = await Repository.findById(repoId);
    if (!repository)
      return res.status(404).json({ error: "Repository not found" });
    if (repository.owner.toString() !== userId) {
      return res.status(403).json({ error: "You do not own this repository" });
    }

    const commitId = providedCommitId || uuidv4();

    const existing = await Commit.findOne({ commitId });
    if (existing) {
      return res.status(200).json({
        message: "Already pushed — skipped",
        commitId,
        storageType: existing.storageType,
      });
    }

    const fileNames = files.map((f) => f.name);
    let s3Success = true;
    let storageType = "s3";

    try {
      await s3.headBucket({ Bucket: S3_BUCKET }).promise();
      for (const file of files) {
        await s3
          .upload({
            Bucket: S3_BUCKET,
            Key: `commits/${commitId}/${file.name}`,
            Body: Buffer.from(file.content, "base64"),
          })
          .promise();
      }
    } catch (s3Err) {
      s3Success = false;
      storageType = "mongodb";
      console.warn(
        `CLI push: S3 unavailable (${s3Err.code}) — using MongoDB fallback`,
      );
    }

    await Commit.create({
      commitId,
      repoId,
      message: message || "no message",
      files: fileNames,
      fileContents: s3Success
        ? []
        : files.map((f) => ({ name: f.name, content: f.content })),
      author: userId,
      s3Synced: s3Success,
      storageType,
    });

    repository.content = fileNames;
    await repository.save();
    await logContribution(userId, "repo_updated");

    return res.status(200).json({ message: "Pushed", commitId, storageType });
  } catch (err) {
    console.error("CLI push error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};
