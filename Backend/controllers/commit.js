import fs from "fs/promises";
import path from "path";
import { v4 } from "uuid";
import Commit from "../model/commitModel.js";

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

    // Copy staged files into the commit folder
    for (const file of files) {
      await fs.copyFile(
        path.join(stagingAreaPath, file),
        path.join(commitDir, file),
      );
    }

    // Write metadata — filter commit.json out of files[] so it
    // doesn't appear as a user file in CommitHistory
    await fs.writeFile(
      path.join(commitDir, "commit.json"),
      JSON.stringify(
        {
          message,
          date: new Date().toISOString(),
          files: files.filter((f) => f !== "commit.json"), // ✅ clean list
        },
        null,
        2,
      ),
    );

    // Clear staging after commit (like real git)
    for (const file of files) {
      await fs.unlink(path.join(stagingAreaPath, file));
    }

    // ✅ Single log — removed the duplicate
    console.log(`Commit ${commitID} created with message: "${message}"`);
    console.log(`Files committed: ${files.join(", ")}`);
  } catch (error) {
    console.error("Error committing file:", error);
  }
}

// GET /repo/:id/files
// Returns files from the latest commit with content for viewing
export const getLatestFiles = async (req, res) => {
  const { id } = req.params;

  try {
    // Get most recent commit for this repo
    const latestCommit = await Commit.findOne({ repoId: id })
      .sort({ createdAt: -1 })
      .lean();

    if (!latestCommit) {
      return res.status(200).json({
        files: [],
        message: "No commits yet",
      });
    }

    // ── MongoDB storage — return base64 decoded content ──
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

    // ── S3 storage — return presigned URLs ──
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

    // ── Fallback — just return file names, no content ──
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
