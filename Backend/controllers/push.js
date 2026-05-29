import fs from "fs/promises";
import path from "path";
import { s3, S3_BUCKET } from "../config/aws-config.js";
import mongoose from "mongoose";
import Commit from "../model/commitModel.js";
import dotenv from "dotenv";

dotenv.config();

export async function pushRepo() {
  const repoPath = path.resolve(process.cwd(), ".repoFlowGit");
  const commitsPath = path.join(repoPath, "commits");
  const configPath = path.join(repoPath, "config.json");

  // ── Read config for repoId + userId ──
  let config = {};
  try {
    const raw = await fs.readFile(configPath, "utf-8");
    config = JSON.parse(raw);
  } catch {
    console.error(
      "No config.json found. Run `node index.js init --repoId <id>` first.",
    );
    return;
  }

  const { repoId, userId } = config;

  if (!repoId) {
    console.error(
      "config.json is missing repoId. Re-run init with --repoId <mongoId>",
    );
    return;
  }

  // ── Connect to MongoDB if not already connected ──
  if (mongoose.connection.readyState === 0) {
    try {
      await mongoose.connect(process.env.MONGO_URI);
      console.log("MongoDB connected for push");
    } catch (err) {
      console.error("MongoDB connection failed:", err.message);
      return;
    }
  }

  try {
    const commitDirs = await fs.readdir(commitsPath);

    if (commitDirs.length === 0) {
      console.log("Nothing to push. Make a commit first.");
      return;
    }

    for (const commitDir of commitDirs) {
      const commitDirPath = path.join(commitsPath, commitDir);

      // ── Skip if not a directory ──
      const stat = await fs.stat(commitDirPath);
      if (!stat.isDirectory()) continue;

      // ── Skip if already pushed to DB ──
      const alreadyPushed = await Commit.findOne({
        commitId: commitDir,
        s3Synced: true,
      });
      if (alreadyPushed) {
        console.log(
          `  ✓ ${commitDir.slice(0, 7)}... already pushed — skipping`,
        );
        continue;
      }

      // ── Read commit.json for metadata ──
      let message = "no message";
      let fileNames = [];
      try {
        const meta = JSON.parse(
          await fs.readFile(path.join(commitDirPath, "commit.json"), "utf-8"),
        );
        message = meta.message || "no message";
        fileNames = meta.files || [];
      } catch {
        // commit.json missing — still push what's there
      }

      // ── Upload each file to S3 (skip commit.json itself) ──
      const allFiles = await fs.readdir(commitDirPath);
      const filesToUpload = allFiles.filter((f) => f !== "commit.json");

      for (const file of filesToUpload) {
        const filePath = path.join(commitDirPath, file);
        const fileContent = await fs.readFile(filePath);

        const params = {
          Bucket: S3_BUCKET,
          Key: `commits/${commitDir}/${file}`,
          Body: fileContent,
        };

        await s3.upload(params).promise();
        console.log(
          `  ↑ uploaded: commits/${commitDir.slice(0, 7)}.../${file}`,
        );
      }

      // ── Save commit to MongoDB ──
      await Commit.findOneAndUpdate(
        { commitId: commitDir },
        {
          commitId: commitDir,
          repoId,
          message,
          files: filesToUpload,
          author: userId || null,
          s3Synced: true,
        },
        { upsert: true, new: true },
      );

      console.log(
        `  ✓ commit saved to DB: "${message}" (${commitDir.slice(0, 7)}...)`,
      );
    }

    console.log("\nPush complete.");
  } catch (error) {
    console.error("Error pushing to S3:", error);
  }
}
