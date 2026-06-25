import Commit from "../model/commitModel.js";
import Repository from "../model/repoModel.js";
import { s3, S3_BUCKET } from "../config/aws-config.js";

export const getCommitsByRepo = async (req, res) => {
  const { id } = req.params;

  try {
    const commits = await Commit.find({ repoId: id })
      .sort({ createdAt: -1 })
      .populate("author", "username")

      .select("-fileContents")
      .lean();

    return res.status(200).json({ commits });
  } catch (err) {
    console.error("Error fetching commits:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const revertToCommit = async (req, res) => {
  const { id, commitId } = req.params;

  try {
    const repository = await Repository.findById(id).select("visibility");
    if (!repository)
      return res.status(404).json({ error: "Repository not found" });

    // ✅ Private repos still require login — public repos allow guest review
    if (!repository.visibility && !req.userId) {
      return res.status(403).json({
        error: "This repository is private. Login required to view code.",
      });
    }

    const commit = await Commit.findOne({ commitId, repoId: id });

    if (!commit) {
      return res.status(404).json({ error: "Commit not found" });
    }

    if (commit.storageType === "s3" && commit.s3Synced) {
      try {
        const fileUrls = await Promise.all(
          commit.files.map(async (file) => {
            const url = await s3.getSignedUrlPromise("getObject", {
              Bucket: S3_BUCKET,
              Key: `commits/${commitId}/${file}`,
              Expires: 300,
            });
            return { file, url, source: "s3" };
          }),
        );
        return res.status(200).json({ commit, fileUrls });
      } catch (s3Err) {
        console.warn(
          "S3 URL generation failed, falling through to MongoDB:",
          s3Err.code,
        );
      }
    }

    if (commit.fileContents && commit.fileContents.length > 0) {
      const fileUrls = commit.fileContents.map(({ name, content }) => ({
        file: name,

        url: `data:application/octet-stream;base64,${content}`,
        source: "mongodb",
      }));
      return res.status(200).json({ commit, fileUrls });
    }

    return res.status(200).json({
      commit,
      fileUrls: [],
      message: "No file contents available — push again when S3 is restored",
    });
  } catch (err) {
    console.error("Error fetching commit files:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};
