import Commit from "../model/commitModel.js";
import { s3, S3_BUCKET } from "../config/aws-config.js";

export async function getCommitsByRepo(req, res) {
  try {
    const { id } = req.params;

    const commits = await Commit.find({ repoId: id })
      .sort({ createdAt: -1 })
      .populate("author", "username")
      .lean();

    return res.status(200).json({ commits });
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function revertToCommit(req, res) {
  try {
    const { id, commitId } = req.params;

    const commit = await Commit.findOne({ repoId: id, commitId }).lean();
    if (!commit) return res.status(404).json({ error: "Commit not found" });

    const fileUrls = await Promise.all(
      commit.files.map(async (file) => ({
        file,
        url: await s3.getSignedUrlPromise("getObject", {
          Bucket: S3_BUCKET,
          Key: `commits/${commitId}/${file}`,
          Expires: 300,
        }),
      })),
    );

    return res.status(200).json({ fileUrls });
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
}
