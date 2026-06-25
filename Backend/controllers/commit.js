import fs from "fs/promises";
import path from "path";
import { v4 } from "uuid";
import Commit from "../model/commitModel.js";
import { getIO } from "../helpers/socketInstance.js";
import { notifyUser } from "../helpers/notifyUser.js";
import Repository from "../model/repoModel.js";

export async function commitRepo(message) {
  const repoPath = path.resolve(process.cwd(), ".repoFlowGit");
  const stagingAreaPath = path.join(repoPath, "staging");
  const commitsPath = path.join(repoPath, "commits");

  try {
    const commitID = v4();
    const commitDir = path.join(commitsPath, commitID);
    await fs.mkdir(commitDir, { recursive: true });

    const files = await fs.readdir(stagingAreaPath);

    if (files.length === 0) {
      console.log("Nothing to commit — staging area is empty.");
      return;
    }

    for (const file of files) {
      await fs.copyFile(
        path.join(stagingAreaPath, file),
        path.join(commitDir, file),
      );
    }

    await fs.writeFile(
      path.join(commitDir, "commit.json"),
      JSON.stringify(
        {
          message,
          date: new Date().toISOString(),
          files: files.filter((f) => f !== "commit.json"),
        },
        null,
        2,
      ),
    );

    for (const file of files) {
      await fs.unlink(path.join(stagingAreaPath, file));
    }

    console.log(`Commit ${commitID} created with message: "${message}"`);
    console.log(`Files committed: ${files.join(", ")}`);
  } catch (error) {
    console.error("Error committing file:", error);
  }
}

export const getLatestFiles = async (req, res) => {
  const { id } = req.params;

  try {
    const latestCommit = await Commit.findOne({ repoId: id })
      .sort({ createdAt: -1 })
      .lean();

    if (!latestCommit) {
      return res.status(200).json({
        files: [],
        message: "No commits yet",
      });
    }

    if (
      latestCommit.storageType === "mongodb" &&
      latestCommit.fileContents?.length > 0
    ) {
      const files = latestCommit.fileContents.map(({ name, content }) => ({
        name,
        content: Buffer.from(content, "base64").toString("utf-8"),
        source: "mongodb",
      }));
      return res.status(200).json({
        files,
        commitId: latestCommit.commitId,
        message: latestCommit.message,
        createdAt: latestCommit.createdAt,
      });
    }

    if (latestCommit.storageType === "s3" && latestCommit.s3Synced) {
      try {
        const files = await Promise.all(
          latestCommit.files.map(async (name) => ({
            name,
            url: await s3.getSignedUrlPromise("getObject", {
              Bucket: S3_BUCKET,
              Key: `commits/${latestCommit.commitId}/${name}`,
              Expires: 300,
            }),
            source: "s3",
          })),
        );
        return res.status(200).json({
          files,
          commitId: latestCommit.commitId,
          message: latestCommit.message,
          createdAt: latestCommit.createdAt,
        });
      } catch (s3Err) {
        console.warn("S3 unavailable for file fetch:", s3Err.code);
      }
    }

    return res.status(200).json({
      files: latestCommit.files.map((name) => ({ name, content: null })),
      commitId: latestCommit.commitId,
      message: latestCommit.message,
      createdAt: latestCommit.createdAt,
    });
  } catch (err) {
    console.error("Error fetching latest files:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// POST /repo/:id/review/:commitId
export const startReviewCall = async (req, res) => {
  const { id } = req.params;
  const { roomId, roomLink } = req.body;
  const callerId = req.userId; // from authMiddleware

  try {
    const repository = await Repository.findById(id).select("owner name");
    if (!repository)
      return res.status(404).json({ error: "Repository not found" });

    if (repository.owner.toString() !== callerId) {
      await notifyUser(getIO(), {
        recipientId: repository.owner,
        senderId: callerId,
        type: "review_call_started",
        message: `started a review call on a commit in ${repository.name}`,
        link: roomLink || `/review/${roomId}`,
      });
    }

    return res.status(200).json({ message: "Notification sent", roomId });
  } catch (err) {
    console.error("Error starting review call:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};
