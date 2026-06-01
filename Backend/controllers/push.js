import fs from "fs/promises";
import path from "path";
import { s3, S3_BUCKET } from "../config/aws-config.js";
import mongoose from "mongoose";
import Commit from "../model/commitModel.js";
import dotenv from "dotenv";
import Repository from "../model/repoModel.js";

dotenv.config();

export async function pushRepo() {
  const repoPath = path.resolve(process.cwd(), ".repoFlowGit");
  const commitsPath = path.join(repoPath, "commits");
  const configPath = path.join(repoPath, "config.json");

  // ── Read config ──
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
      "config.json is missing repoId. Re-run: node index.js init --repoId <id>",
    );
    return;
  }

  // ── Connect MongoDB ──
  // ── Connect MongoDB ──
  if (mongoose.connection.readyState === 0) {
    try {
      // ✅ Add dbName to match what the server uses
      await mongoose.connect(process.env.MONGO_URI, {
        dbName: process.env.DB_NAME,
      });
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

      // Skip if not a directory
      const stat = await fs.stat(commitDirPath);
      if (!stat.isDirectory()) continue;

      // ✅ Skip if already saved by either storage method
      const alreadyPushed = await Commit.findOne({
        commitId: commitDir,
        $or: [{ s3Synced: true }, { storageType: "mongodb" }],
      });
      if (alreadyPushed) {
        console.log(
          `  ✓ ${commitDir.slice(0, 7)}... already saved [${alreadyPushed.storageType}] — skipping`,
        );
        continue;
      }

      // Read commit.json metadata
      let message = "no message";
      let fileNames = [];
      try {
        const meta = JSON.parse(
          await fs.readFile(path.join(commitDirPath, "commit.json"), "utf-8"),
        );
        message = meta.message || "no message";
        fileNames = meta.files || [];
      } catch {
        // commit.json missing — scan directory
      }

      const allFiles = await fs.readdir(commitDirPath);
      const filesToUpload = allFiles.filter((f) => f !== "commit.json");

      // ── Try S3 first ──
      let s3Success = true;
      let storageType = "s3";

      try {
        // Quick check if S3 is reachable before looping all files
        await s3.headBucket({ Bucket: S3_BUCKET }).promise();

        for (const file of filesToUpload) {
          const fileContent = await fs.readFile(path.join(commitDirPath, file));
          await s3
            .upload({
              Bucket: S3_BUCKET,
              Key: `commits/${commitDir}/${file}`,
              Body: fileContent,
            })
            .promise();
          console.log(`  ↑ S3 uploaded: ${file}`);
        }
      } catch (s3Err) {
        // ── S3 failed — fall back to MongoDB ──
        s3Success = false;
        storageType = "mongodb";
        console.warn(
          `  ⚠ S3 unavailable (${s3Err.code}) — storing files in MongoDB instead`,
        );
      }

      // ── Read file contents for MongoDB fallback ──
      let fileContents = [];
      if (!s3Success) {
        for (const file of filesToUpload) {
          const rawContent = await fs.readFile(path.join(commitDirPath, file));
          fileContents.push({
            name: file,
            content: rawContent.toString("base64"), // base64 so binary files are safe
          });
        }
        console.log(`  ✓ ${filesToUpload.length} file(s) stored in MongoDB`);
      }

      // ── Save commit to MongoDB ──
      await Commit.findOneAndUpdate(
        { commitId: commitDir },
        {
          commitId: commitDir,
          repoId,
          message,
          files: filesToUpload,
          fileContents: fileContents, // empty array when S3 worked
          author: userId || null,
          s3Synced: s3Success,
          storageType,
        },
        { upsert: true, new: true },
      );

      const short = commitDir.slice(0, 7);
      console.log(
        `  ✓ commit saved [${storageType}]: "${message}" (${short}...)`,
      );

      console.log("\nPush complete.");

      // ✅ Update repo.content with latest file snapshot
      await Repository.findByIdAndUpdate(repoId, {
        $set: { content: filesToUpload },
      });
      console.log(`  ✓ repo.content updated with: ${filesToUpload.join(", ")}`);
    }
  } catch (error) {
    console.error("Error during push:", error);
  }
}
